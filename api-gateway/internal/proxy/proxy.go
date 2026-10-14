package proxy

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/example/api-gateway/internal/circuitbreaker"
	"github.com/example/api-gateway/internal/metrics"
	"github.com/example/api-gateway/pkg/response"
	"github.com/gin-gonic/gin"
)

type ReverseProxyHandler struct {
	serviceName     string
	targetURL       *url.URL
	timeout         time.Duration
	breakerRegistry *circuitbreaker.BreakerRegistry
	logger          *slog.Logger
	proxy           *httputil.ReverseProxy
}

func NewReverseProxyHandler(
	serviceName string,
	targetStr string,
	timeout time.Duration,
	breakers *circuitbreaker.BreakerRegistry,
	logger *slog.Logger,
) (*ReverseProxyHandler, error) {
	target, err := url.Parse(targetStr)
	if err != nil {
		return nil, fmt.Errorf("invalid target url %s: %w", targetStr, err)
	}

	handler := &ReverseProxyHandler{
		serviceName:     serviceName,
		targetURL:       target,
		timeout:         timeout,
		breakerRegistry: breakers,
		logger:          logger,
	}

	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.Transport = DefaultTransport

	proxy.ModifyResponse = func(resp *http.Response) error {
		// Strip downstream CORS and security headers to prevent browser duplication errors
		resp.Header.Del("Access-Control-Allow-Origin")
		resp.Header.Del("Access-Control-Allow-Credentials")
		resp.Header.Del("Access-Control-Allow-Methods")
		resp.Header.Del("Access-Control-Allow-Headers")
		resp.Header.Del("Access-Control-Expose-Headers")
		resp.Header.Del("Access-Control-Max-Age")
		resp.Header.Del("X-Content-Type-Options")
		resp.Header.Del("X-Frame-Options")
		return nil
	}

	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Host = target.Host
		req.URL.Host = target.Host
		req.URL.Scheme = target.Scheme

		// Ensure client IP forwarding headers
		if clientIP, _, err := net.SplitHostPort(req.RemoteAddr); err == nil {
			if prior := req.Header.Get("X-Forwarded-For"); prior != "" {
				clientIP = prior + ", " + clientIP
			}
			req.Header.Set("X-Forwarded-For", clientIP)
		}
		req.Header.Set("X-Forwarded-Host", req.Host)
		req.Header.Set("X-Forwarded-Proto", target.Scheme)
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		reqID := r.Header.Get("X-Request-ID")
		logger.Warn("Downstream proxy error",
			slog.String("service", serviceName),
			slog.String("target", targetStr),
			slog.String("requestId", reqID),
			slog.String("error", err.Error()),
		)

		var netErr net.Error
		if errors.As(err, &netErr) && netErr.Timeout() {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusGatewayTimeout)
			_ = response.WriteJSONDirect(w, http.StatusGatewayTimeout, response.ErrGatewayTimeout, "Downstream service request timed out", reqID)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		_ = response.WriteJSONDirect(w, http.StatusBadGateway, response.ErrBadGateway, "Unable to reach downstream service", reqID)
	}

	handler.proxy = proxy
	return handler, nil
}

func (h *ReverseProxyHandler) Handle() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("ServiceName", h.serviceName)

		// 1. Check circuit breaker state
		state := h.breakerRegistry.State(h.serviceName)
		if state == "OPEN" {
			metrics.RecordCircuitBreakerTrip(h.serviceName)
			response.WriteError(
				c,
				http.StatusServiceUnavailable,
				response.ErrServiceUnavailable,
				fmt.Sprintf("Service '%s' is temporarily unavailable due to upstream errors", h.serviceName),
			)
			return
		}

		// 2. Wrap request context with timeout
		timeoutCtx, cancel := context.WithTimeout(c.Request.Context(), h.timeout)
		defer cancel()

		req := c.Request.WithContext(timeoutCtx)

		// 3. Execute via circuit breaker
		_, err := h.breakerRegistry.Execute(h.serviceName, func() (any, error) {
			h.proxy.ServeHTTP(c.Writer, req)
			// If response was 5xx, report failure to breaker
			if c.Writer.Status() >= 500 {
				return nil, fmt.Errorf("downstream returned status %d", c.Writer.Status())
			}
			return nil, nil
		})

		if err != nil {
			if errors.Is(err, circuitbreaker.ErrCircuitOpen) {
				metrics.RecordCircuitBreakerTrip(h.serviceName)
				if !c.Writer.Written() {
					response.WriteError(
						c,
						http.StatusServiceUnavailable,
						response.ErrServiceUnavailable,
						fmt.Sprintf("Circuit breaker opened for service '%s'", h.serviceName),
					)
				}
			}
		}
	}
}

func TrimPrefixPath(prefix, fullPath string) string {
	if strings.HasPrefix(fullPath, prefix) {
		return strings.TrimPrefix(fullPath, prefix)
	}
	return fullPath
}
