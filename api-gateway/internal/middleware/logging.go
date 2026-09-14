package middleware

import (
	"log/slog"
	"time"

	"github.com/example/api-gateway/internal/metrics"
	"github.com/gin-gonic/gin"
)

func LoggingMiddleware(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		rawQuery := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()
		clientIP := c.ClientIP()
		method := c.Request.Method
		userAgent := c.Request.UserAgent()
		reqID, _ := c.Get("RequestID")
		serviceName, _ := c.Get("ServiceName")
		serviceNameStr, _ := serviceName.(string)
		if serviceNameStr == "" {
			serviceNameStr = "gateway"
		}

		if rawQuery != "" {
			path = path + "?" + rawQuery
		}

		// Record Prometheus metric
		metrics.RecordRequest(method, serviceNameStr, status, latency)

		logger.Info("HTTP Request",
			slog.String("requestId", reqID.(string)),
			slog.String("method", method),
			slog.String("path", path),
			slog.Int("status", status),
			slog.Duration("latency", latency),
			slog.String("clientIP", clientIP),
			slog.String("service", serviceNameStr),
			slog.String("userAgent", userAgent),
		)
	}
}
