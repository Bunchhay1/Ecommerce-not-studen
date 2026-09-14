package circuitbreaker

import (
	"errors"
	"sync"
	"time"

	"github.com/sony/gobreaker"
)

var ErrCircuitOpen = errors.New("circuit breaker is open: upstream service is temporarily unavailable")

type BreakerRegistry struct {
	breakers map[string]*gobreaker.CircuitBreaker
	mu       sync.RWMutex
}

func NewBreakerRegistry() *BreakerRegistry {
	return &BreakerRegistry{
		breakers: make(map[string]*gobreaker.CircuitBreaker),
	}
}

func (r *BreakerRegistry) Get(serviceName string) *gobreaker.CircuitBreaker {
	r.mu.RLock()
	cb, exists := r.breakers[serviceName]
	r.mu.RUnlock()

	if exists {
		return cb
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	// Double-check under write lock
	if cb, exists = r.breakers[serviceName]; exists {
		return cb
	}

	settings := gobreaker.Settings{
		Name:        serviceName,
		MaxRequests: 3,
		Interval:    10 * time.Second,
		Timeout:     5 * time.Second,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			// Trip if 5 consecutive failures or failure ratio > 50% on at least 5 requests
			failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
			return counts.ConsecutiveFailures >= 5 || (counts.Requests >= 5 && failureRatio >= 0.5)
		},
	}

	cb = gobreaker.NewCircuitBreaker(settings)
	r.breakers[serviceName] = cb
	return cb
}

func (r *BreakerRegistry) Execute(serviceName string, reqFunc func() (any, error)) (any, error) {
	cb := r.Get(serviceName)
	result, err := cb.Execute(reqFunc)
	if errors.Is(err, gobreaker.ErrOpenState) || errors.Is(err, gobreaker.ErrTooManyRequests) {
		return nil, ErrCircuitOpen
	}
	return result, err
}

func (r *BreakerRegistry) State(serviceName string) string {
	cb := r.Get(serviceName)
	switch cb.State() {
	case gobreaker.StateClosed:
		return "CLOSED"
	case gobreaker.StateHalfOpen:
		return "HALF_OPEN"
	case gobreaker.StateOpen:
		return "OPEN"
	default:
		return "UNKNOWN"
	}
}
