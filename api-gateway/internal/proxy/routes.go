package proxy

import (
	"log/slog"
	"time"

	"github.com/example/api-gateway/internal/circuitbreaker"
	"github.com/example/api-gateway/internal/config"
	"github.com/example/api-gateway/internal/middleware"
	"github.com/gin-gonic/gin"
)

func RegisterServiceRoutes(
	r *gin.Engine,
	cfg *config.Config,
	breakers *circuitbreaker.BreakerRegistry,
	logger *slog.Logger,
) error {
	for key, svc := range cfg.Services {
		timeout := time.Duration(svc.TimeoutSeconds) * time.Second
		if timeout <= 0 {
			timeout = 5 * time.Second
		}

		proxyHandler, err := NewReverseProxyHandler(
			svc.Name,
			svc.Target,
			timeout,
			breakers,
			logger,
		)
		if err != nil {
			return err
		}

		// Create route group for prefix
		group := r.Group(svc.Prefix)

		// Apply route-specific auth middleware
		group.Use(middleware.AuthMiddleware(cfg.Auth.JWTSecret, svc.RequireAuth))

		// Route all HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD)
		handleFunc := proxyHandler.Handle()
		group.Any("", handleFunc)
		group.Any("/*proxyPath", handleFunc)

		logger.Info("Registered upstream proxy route",
			slog.String("serviceKey", key),
			slog.String("serviceName", svc.Name),
			slog.String("prefix", svc.Prefix),
			slog.String("target", svc.Target),
			slog.Bool("requireAuth", svc.RequireAuth),
			slog.Duration("timeout", timeout),
		)
	}

	return nil
}
