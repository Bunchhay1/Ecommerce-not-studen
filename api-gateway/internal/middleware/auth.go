package middleware

import (
	"net/http"
	"strings"

	"github.com/example/api-gateway/internal/auth"
	"github.com/example/api-gateway/pkg/response"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(jwtSecret string, requireAuth bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

		if authHeader == "" {
			if requireAuth {
				response.WriteError(
					c,
					http.StatusUnauthorized,
					response.ErrUnauthorized,
					"Missing authorization token",
				)
				return
			}
			c.Next()
			return
		}

		claims, err := auth.ValidateToken(authHeader, jwtSecret)
		if err != nil {
			if requireAuth {
				response.WriteError(
					c,
					http.StatusUnauthorized,
					response.ErrUnauthorized,
					"Invalid or expired authorization token",
				)
				return
			}
			// If optional auth failed, proceed unauthenticated
			c.Next()
			return
		}

		// Inject trusted claims into context and downstream headers
		c.Set("UserID", claims.UserID)
		c.Set("UserRoles", claims.Roles)
		c.Set("UserEmail", claims.Email)

		c.Request.Header.Set("X-User-ID", claims.UserID)
		c.Request.Header.Set("X-User-Roles", strings.Join(claims.Roles, ","))
		if claims.Email != "" {
			c.Request.Header.Set("X-User-Email", claims.Email)
		}

		c.Next()
	}
}
