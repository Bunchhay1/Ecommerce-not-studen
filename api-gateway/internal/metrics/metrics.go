package metrics

import (
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	HttpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gateway_http_requests_total",
			Help: "Total number of HTTP requests processed by the API Gateway",
		},
		[]string{"method", "service", "status"},
	)

	HttpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "gateway_http_request_duration_seconds",
			Help:    "Histogram of response latency for HTTP requests forwarded through the gateway",
			Buckets: []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
		},
		[]string{"method", "service"},
	)

	RateLimitBlockedTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gateway_rate_limit_blocked_total",
			Help: "Total number of requests rejected due to rate limiting",
		},
		[]string{"policy"},
	)

	CircuitBreakerTrips = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gateway_circuit_breaker_trips_total",
			Help: "Total number of times a circuit breaker tripped open for a downstream service",
		},
		[]string{"service"},
	)
)

func RecordRequest(method, service string, statusCode int, duration time.Duration) {
	statusStr := strconv.Itoa(statusCode)
	HttpRequestsTotal.WithLabelValues(method, service, statusStr).Inc()
	HttpRequestDuration.WithLabelValues(method, service).Observe(duration.Seconds())
}

func RecordRateLimitBlocked(policy string) {
	RateLimitBlockedTotal.WithLabelValues(policy).Inc()
}

func RecordCircuitBreakerTrip(service string) {
	CircuitBreakerTrips.WithLabelValues(service).Inc()
}
