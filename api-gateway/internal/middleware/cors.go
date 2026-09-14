package middleware

import (
	"net/http"
	"strings"

	"github.com/example/api-gateway/internal/config"
	"github.com/gin-gonic/gin"
)

func CORSMiddleware(cfg config.ServerConfig) gin.HandlerFunc {
	allowedOrigins := cfg.CorsAllowedOrigins
	allowedMethods := strings.Join(cfg.CorsAllowedMethods, ", ")
	allowedHeaders := strings.Join(cfg.CorsAllowedHeaders, ", ")

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		isAllowed := false
		for _, o := range allowedOrigins {
			if o == "*" || o == origin {
				isAllowed = true
				break
			}
		}

		if isAllowed {
			if origin != "" {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
			}
			c.Writer.Header().Set("Access-Control-Allow-Methods", allowedMethods)
			c.Writer.Header().Set("Access-Control-Allow-Headers", allowedHeaders)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Max-Age", "86400")
		}

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
