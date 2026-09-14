package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ecommerce-microservice/user-service/internal/cache"
	"github.com/ecommerce-microservice/user-service/internal/config"
	"github.com/ecommerce-microservice/user-service/internal/event"
	"github.com/ecommerce-microservice/user-service/internal/handler"
	"github.com/ecommerce-microservice/user-service/internal/middleware"
	"github.com/ecommerce-microservice/user-service/internal/repository"
	"github.com/ecommerce-microservice/user-service/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.LoadConfig()

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	log.Printf("Starting User Service on port %s in %s mode...\n", cfg.Port, cfg.Environment)

	// 1. PostgreSQL Connection Pool with Retry Loop
	var dbPool *pgxpool.Pool
	maxRetries := 10
	for attempt := 1; attempt <= maxRetries; attempt++ {
		pingCtx, pingCancel := context.WithTimeout(context.Background(), 5*time.Second)
		var poolErr error
		dbPool, poolErr = pgxpool.New(pingCtx, cfg.DatabaseDSN())
		if poolErr == nil {
			if pingErr := dbPool.Ping(pingCtx); pingErr == nil {
				pingCancel()
				log.Println("Successfully connected to PostgreSQL (user_db)")
				initTables(context.Background(), dbPool)
				break
			}
			dbPool.Close()
		}
		pingCancel()
		log.Printf("[INFO] Waiting for PostgreSQL (user_db) to be ready (attempt %d/%d)...\n", attempt, maxRetries)
		time.Sleep(2 * time.Second)
	}

	if dbPool == nil {
		log.Fatalf("Fatal: Unable to connect to database after %d attempts\n", maxRetries)
	}
	defer dbPool.Close()

	// 2. Redis Cache Initialization (with fallback)
	var cacheClient cache.Cache
	redisCache, err := cache.NewRedisCache(cfg.RedisAddress(), cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		log.Printf("[INFO] Redis not available: %v. Running in cache-fallback mode.\n", err)
		cacheClient = cache.NewNoopCache()
	} else {
		log.Println("Successfully connected to Redis Cache")
		cacheClient = redisCache
		defer cacheClient.Close()
	}

	// 3. Event Producer
	producer := event.NewLoggingProducer()
	defer producer.Close()

	// 4. Repositories & Services
	profileRepo := repository.NewPostgresProfileRepository(dbPool)
	addressRepo := repository.NewPostgresAddressRepository(dbPool)
	prefRepo := repository.NewPostgresPreferenceRepository(dbPool)

	profileSvc := service.NewProfileService(profileRepo, cacheClient, producer, cfg.RedisCacheTTL)
	addressSvc := service.NewAddressService(addressRepo, cacheClient, producer, cfg.RedisCacheTTL)
	prefSvc := service.NewPreferenceService(prefRepo, cacheClient, producer, cfg.RedisCacheTTL)

	// 5. Handlers
	healthHandler := handler.NewHealthHandler(dbPool, cacheClient)
	profileHandler := handler.NewProfileHandler(profileSvc)
	addressHandler := handler.NewAddressHandler(addressSvc)
	prefHandler := handler.NewPreferenceHandler(prefSvc)

	// 6. Router Setup
	r := gin.Default()
	r.Use(middleware.CORSMiddleware())

	// General & Health Routes
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "User Service",
			"version": "1.0.0",
			"status":  "running",
			"health":  "/health",
		})
	})

	r.GET("/health", healthHandler.Health)
	r.GET("/health/live", healthHandler.Liveness)
	r.GET("/health/ready", healthHandler.Readiness)

	// API v1 Routes
	v1 := r.Group(cfg.APIV1Prefix)
	{
		users := v1.Group("/users")
		users.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// Profile
			users.GET("/me", profileHandler.GetMyProfile)
			users.PUT("/me", profileHandler.UpdateMyProfile)

			// Addresses
			users.GET("/me/addresses", addressHandler.GetMyAddresses)
			users.POST("/me/addresses", addressHandler.CreateAddress)
			users.GET("/me/addresses/:address_id", addressHandler.GetAddressByID)
			users.PUT("/me/addresses/:address_id", addressHandler.UpdateAddress)
			users.DELETE("/me/addresses/:address_id", addressHandler.DeleteAddress)
			users.PATCH("/me/addresses/:address_id/default", addressHandler.SetDefaultAddress)

			// Preferences & Settings
			users.GET("/me/preferences", prefHandler.GetPreferences)
			users.PUT("/me/preferences", prefHandler.UpdatePreferences)
			users.GET("/me/settings", prefHandler.GetSettings)
			users.PUT("/me/settings", prefHandler.UpdateSettings)

			// Admin or Microservice internal lookup by ID
			users.GET("/:id", profileHandler.GetUserProfileByID)
		}
	}

	// 7. Graceful Server Shutdown
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Server listening on http://localhost:%s\n", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down User Service gracefully...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v\n", err)
	}

	log.Println("User Service exited successfully")
}

func initTables(ctx context.Context, pool *pgxpool.Pool) {
	schema := `
	CREATE TABLE IF NOT EXISTS profiles (
		id VARCHAR(36) PRIMARY KEY,
		user_id VARCHAR(36) UNIQUE NOT NULL,
		first_name VARCHAR(100),
		last_name VARCHAR(100),
		phone VARCHAR(30),
		avatar_url TEXT,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

	CREATE TABLE IF NOT EXISTS addresses (
		id VARCHAR(36) PRIMARY KEY,
		user_id VARCHAR(36) NOT NULL,
		label VARCHAR(50) NOT NULL DEFAULT 'Home',
		recipient_name VARCHAR(100) NOT NULL,
		phone VARCHAR(30) NOT NULL,
		address_line1 VARCHAR(255) NOT NULL,
		address_line2 VARCHAR(255),
		city VARCHAR(100) NOT NULL,
		province VARCHAR(100) NOT NULL,
		country VARCHAR(100) NOT NULL,
		postal_code VARCHAR(20) NOT NULL,
		is_default BOOLEAN NOT NULL DEFAULT FALSE,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

	CREATE TABLE IF NOT EXISTS user_preferences (
		id VARCHAR(36) PRIMARY KEY,
		user_id VARCHAR(36) UNIQUE NOT NULL,
		language VARCHAR(10) NOT NULL DEFAULT 'en',
		currency VARCHAR(10) NOT NULL DEFAULT 'USD',
		email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
		sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
		push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

	CREATE TABLE IF NOT EXISTS user_settings (
		id VARCHAR(36) PRIMARY KEY,
		user_id VARCHAR(36) UNIQUE NOT NULL,
		theme VARCHAR(20) NOT NULL DEFAULT 'system',
		two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
		marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
	`
	if _, err := pool.Exec(ctx, schema); err != nil {
		log.Printf("[WARNING] Auto-migration warning: %v\n", err)
	}
}
