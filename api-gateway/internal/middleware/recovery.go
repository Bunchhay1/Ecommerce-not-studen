package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/example/api-gateway/pkg/response"
	"github.com/gin-gonic/gin"
)

func RecoveryMiddleware(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				reqID, _ := c.Get("RequestID")
				logger.Error("Gateway recovered from panic",
					slog.Any("error", r),
					slog.Any("requestId", reqID),
					slog.String("stack", string(debug.Stack())),
				)

				response.WriteError(
					c,
					http.StatusInternalServerError,
					response.ErrInternalServerError,
					"An unexpected internal error occurred on the gateway",
				)
			}
		}()

		c.Next()
	}
}
