package tests

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/example/api-gateway/internal/config"
	"github.com/example/api-gateway/internal/middleware"
	"github.com/example/api-gateway/internal/ratelimit"
	"github.com/gin-gonic/gin"
)

func TestLimiter_MemoryFallback(t *testing.T) {
	limiter := ratelimit.NewLimiter("", "", 0)
	defer limiter.Close()

	ctx := context.Background()
	key := "test-client"
	limit := 3
	window := 1 * time.Second

	// 1st request
	allowed, remaining, _, err := limiter.Allow(ctx, key, limit, window)
	if err != nil || !allowed || remaining != 2 {
		t.Fatalf("req 1: expected allowed=true remaining=2, got allowed=%v remaining=%d err=%v", allowed, remaining, err)
	}

	// 2nd request
	allowed, remaining, _, _ = limiter.Allow(ctx, key, limit, window)
	if !allowed || remaining != 1 {
		t.Fatalf("req 2: expected allowed=true remaining=1, got allowed=%v remaining=%d", allowed, remaining)
	}

	// 3rd request
	allowed, remaining, _, _ = limiter.Allow(ctx, key, limit, window)
	if !allowed || remaining != 0 {
		t.Fatalf("req 3: expected allowed=true remaining=0, got allowed=%v remaining=%d", allowed, remaining)
	}

	// 4th request (should be blocked)
	allowed, remaining, _, _ = limiter.Allow(ctx, key, limit, window)
	if allowed {
		t.Fatalf("req 4: expected allowed=false, got allowed=true")
	}

	// Wait for window to expire
	time.Sleep(1100 * time.Millisecond)

	// 5th request (should be allowed again)
	allowed, remaining, _, _ = limiter.Allow(ctx, key, limit, window)
	if !allowed || remaining != 2 {
		t.Fatalf("req 5 after reset: expected allowed=true remaining=2, got allowed=%v remaining=%d", allowed, remaining)
	}
}

func TestRateLimitMiddleware_ExceededReturns429(t *testing.T) {
	gin.SetMode(gin.TestMode)
	limiter := ratelimit.NewLimiter("", "", 0)
	defer limiter.Close()

	rateCfg := config.RateLimitConfig{
		Enabled: true,
		Policies: map[string]config.RateLimitPolicy{
			"login": {Requests: 2, WindowSeconds: 10},
		},
	}

	r := gin.New()
	r.Use(middleware.RequestIDMiddleware())
	r.Use(middleware.RateLimitMiddleware(limiter, rateCfg))
	r.POST("/api/v1/auth/login", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Req 1 - 200
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Errorf("req 1: expected 200, got %d", w1.Code)
	}

	// Req 2 - 200
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Errorf("req 2: expected 200, got %d", w2.Code)
	}

	// Req 3 - 429 Too Many Requests
	req3 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusTooManyRequests {
		t.Errorf("req 3: expected 429, got %d", w3.Code)
	}
	if w3.Header().Get("Retry-After") == "" {
		t.Errorf("expected Retry-After header on 429 response")
	}
}
