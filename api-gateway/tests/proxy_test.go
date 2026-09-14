package tests

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/example/api-gateway/internal/circuitbreaker"
	"github.com/example/api-gateway/internal/middleware"
	"github.com/example/api-gateway/internal/proxy"
	"github.com/gin-gonic/gin"
)

func TestReverseProxy_Forwarding(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Mock downstream service
	var receivedMethod, receivedPath, receivedQuery, receivedHeaderReqID string
	var receivedBody map[string]any

	downstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedMethod = r.Method
		receivedPath = r.URL.Path
		receivedQuery = r.URL.RawQuery
		receivedHeaderReqID = r.Header.Get("X-Request-ID")

		bodyBytes, _ := io.ReadAll(r.Body)
		if len(bodyBytes) > 0 {
			_ = json.Unmarshal(bodyBytes, &receivedBody)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"success","downstream":true}`))
	}))
	defer downstream.Close()

	logger := slog.Default()
	breakers := circuitbreaker.NewBreakerRegistry()
	handler, err := proxy.NewReverseProxyHandler(
		"catalog-service",
		downstream.URL,
		5*time.Second,
		breakers,
		logger,
	)
	if err != nil {
		t.Fatalf("failed to create proxy handler: %v", err)
	}

	r := gin.New()
	r.Use(middleware.RequestIDMiddleware())
	r.Any("/api/v1/products/*proxyPath", handler.Handle())

	postPayload := `{"title":"iPhone 17 Pro","price":1199.00}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/products/item-123?sort=desc", strings.NewReader(postPayload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Request-ID", "custom-req-id-777")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got: %d", w.Code)
	}

	if receivedMethod != http.MethodPost {
		t.Errorf("expected POST method, got: %s", receivedMethod)
	}
	if receivedPath != "/api/v1/products/item-123" {
		t.Errorf("expected path /api/v1/products/item-123, got: %s", receivedPath)
	}
	if receivedQuery != "sort=desc" {
		t.Errorf("expected query sort=desc, got: %s", receivedQuery)
	}
	if receivedHeaderReqID != "custom-req-id-777" {
		t.Errorf("expected X-Request-ID custom-req-id-777, got: %s", receivedHeaderReqID)
	}
	if receivedBody["title"] != "iPhone 17 Pro" {
		t.Errorf("expected payload title iPhone 17 Pro, got: %v", receivedBody["title"])
	}
}

func TestReverseProxy_DownstreamOffline_Returns502(t *testing.T) {
	gin.SetMode(gin.TestMode)

	logger := slog.Default()
	breakers := circuitbreaker.NewBreakerRegistry()
	// An unreachable local port
	handler, err := proxy.NewReverseProxyHandler(
		"dead-service",
		"http://127.0.0.1:59999",
		1*time.Second,
		breakers,
		logger,
	)
	if err != nil {
		t.Fatalf("failed to create proxy: %v", err)
	}

	r := gin.New()
	r.Use(middleware.RequestIDMiddleware())
	r.Any("/api/v1/dead/*path", handler.Handle())

	req := httptest.NewRequest(http.MethodGet, "/api/v1/dead/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadGateway {
		t.Errorf("expected 502 Bad Gateway for offline downstream, got: %d", w.Code)
	}
}
