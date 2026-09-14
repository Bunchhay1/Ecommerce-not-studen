package middleware

import (
	"github.com/gin-gonic/gin"
)

func SecurityMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Sanitize incoming request: Strip untrusted client headers to prevent spoofing
		c.Request.Header.Del("X-User-ID")
		c.Request.Header.Del("X-User-Roles")
		c.Request.Header.Del("X-User-Email")

		// 2. Add response security headers
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")
		c.Writer.Header().Set("X-Frame-Options", "DENY")
		c.Writer.Header().Set("X-XSS-Protection", "1; mode=block")
		c.Writer.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Writer.Header().Set("Content-Security-Policy", "default-src 'self'")

		c.Next()
	}
}
