package router

import (
	"log/slog"

	"github.com/example/api-gateway/internal/circuitbreaker"
	"github.com/example/api-gateway/internal/config"
	"github.com/example/api-gateway/internal/health"
	"github.com/example/api-gateway/internal/middleware"
	"github.com/example/api-gateway/internal/proxy"
	"github.com/example/api-gateway/internal/ratelimit"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func NewRouter(
	cfg *config.Config,
	limiter *ratelimit.Limiter,
	breakers *circuitbreaker.BreakerRegistry,
	logger *slog.Logger,
) (*gin.Engine, error) {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()

	// 1. Global Middlewares
	r.Use(middleware.RecoveryMiddleware(logger))
	r.Use(middleware.RequestIDMiddleware())
	r.Use(middleware.SecurityMiddleware())
	r.Use(middleware.CORSMiddleware(cfg.Server))
	r.Use(middleware.LoggingMiddleware(logger))
	r.Use(middleware.RateLimitMiddleware(limiter, cfg.RateLimit))

	// 2. Metrics endpoint for Prometheus scraper
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// 3. Health check endpoints
	var serviceKeys []string
	for _, svc := range cfg.Services {
		serviceKeys = append(serviceKeys, svc.Name)
	}
	health.RegisterHealthRoutes(r, cfg.Server.Port, breakers, serviceKeys)

	// 4. Register Downstream Reverse Proxy Routes
	if err := proxy.RegisterServiceRoutes(r, cfg, breakers, logger); err != nil {
		return nil, err
	}

	return r, nil
}
