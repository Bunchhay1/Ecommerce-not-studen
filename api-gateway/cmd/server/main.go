package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/example/api-gateway/internal/circuitbreaker"
	"github.com/example/api-gateway/internal/config"
	"github.com/example/api-gateway/internal/ratelimit"
	"github.com/example/api-gateway/internal/router"
)

func main() {
	// 1. Initialize structured logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	logger.Info("Starting API Gateway (Core #16)...")

	// 2. Load configuration
	configPath := "configs/config.yaml"
	if customPath := os.Getenv("CONFIG_PATH"); customPath != "" {
		configPath = customPath
	}

	cfg, err := config.LoadConfig(configPath)
	if err != nil {
		logger.Error("Failed to load configuration", slog.String("error", err.Error()))
		os.Exit(1)
	}

	// 3. Initialize Rate Limiter
	limiter := ratelimit.NewLimiter(cfg.Redis.Address, cfg.Redis.Password, cfg.Redis.DB)
	defer limiter.Close()

	// 4. Initialize Circuit Breaker Registry
	breakers := circuitbreaker.NewBreakerRegistry()

	// 5. Initialize Router
	engine, err := router.NewRouter(cfg, limiter, breakers, logger)
	if err != nil {
		logger.Error("Failed to initialize router", slog.String("error", err.Error()))
		os.Exit(1)
	}

	// 6. Setup HTTP Server
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      engine,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(cfg.Server.IdleTimeout) * time.Second,
	}

	// 7. Run server in background goroutine
	go func() {
		logger.Info("API Gateway listening and serving",
			slog.String("address", addr),
			slog.Int("port", cfg.Server.Port),
			slog.Int("servicesRegistered", len(cfg.Services)),
		)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("Server error", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}()

	// 8. Graceful Shutdown listener
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down API Gateway gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("Server forced to shutdown", slog.String("error", err.Error()))
	}

	logger.Info("API Gateway exited cleanly.")
}
