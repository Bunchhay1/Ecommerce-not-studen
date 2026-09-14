package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/example/api-gateway/internal/config"
	"github.com/example/api-gateway/internal/metrics"
	"github.com/example/api-gateway/internal/ratelimit"
	"github.com/example/api-gateway/pkg/response"
	"github.com/gin-gonic/gin"
)

func RateLimitMiddleware(limiter *ratelimit.Limiter, cfg config.RateLimitConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cfg.Enabled || limiter == nil {
			c.Next()
			return
		}

		path := c.Request.URL.Path
		policyName := "default"

		if strings.Contains(path, "/auth/login") || strings.Contains(path, "/auth/register") {
			policyName = "login"
		} else if strings.HasPrefix(path, "/api/v1/search") {
			policyName = "search"
		} else if strings.HasPrefix(path, "/api/v1/admin") {
			policyName = "admin"
		}

		policy, exists := cfg.Policies[policyName]
		if !exists {
			policy = cfg.Policies["default"]
			if policy.Requests == 0 {
				policy.Requests = 300
				policy.WindowSeconds = 60
			}
		}

		// Resolve rate limit key
		var clientKey string
		userIDVal, hasUser := c.Get("UserID")
		if hasUser && userIDVal.(string) != "" {
			clientKey = fmt.Sprintf("%s:user:%s", policyName, userIDVal.(string))
		} else {
			clientKey = fmt.Sprintf("%s:ip:%s", policyName, c.ClientIP())
		}

		window := time.Duration(policy.WindowSeconds) * time.Second
		allowed, remaining, resetAfter, err := limiter.Allow(c.Request.Context(), clientKey, policy.Requests, window)
		if err != nil {
			// On unexpected limiter error, fail open to avoid service outage
			c.Next()
			return
		}

		c.Writer.Header().Set("X-RateLimit-Limit", strconv.Itoa(policy.Requests))
		c.Writer.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Writer.Header().Set("X-RateLimit-Reset", strconv.Itoa(int(resetAfter.Seconds())))

		if !allowed {
			metrics.RecordRateLimitBlocked(policyName)
			c.Writer.Header().Set("Retry-After", strconv.Itoa(int(resetAfter.Seconds())))

			response.WriteError(
				c,
				http.StatusTooManyRequests,
				response.ErrRateLimitExceeded,
				fmt.Sprintf("Rate limit exceeded. Try again in %d seconds", int(resetAfter.Seconds())),
			)
			return
		}

		c.Next()
	}
}
