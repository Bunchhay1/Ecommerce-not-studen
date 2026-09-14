package tests

import (
	"errors"
	"testing"

	"github.com/example/api-gateway/internal/circuitbreaker"
)

func TestCircuitBreaker_TripsOnFailures(t *testing.T) {
	registry := circuitbreaker.NewBreakerRegistry()
	serviceName := "payment-service"

	if state := registry.State(serviceName); state != "CLOSED" {
		t.Fatalf("expected initial state CLOSED, got %s", state)
	}

	// 5 consecutive errors should trip the breaker
	failErr := errors.New("upstream connection reset")
	for i := 0; i < 5; i++ {
		_, _ = registry.Execute(serviceName, func() (any, error) {
			return nil, failErr
		})
	}

	// State should now be OPEN
	if state := registry.State(serviceName); state != "OPEN" {
		t.Fatalf("expected state OPEN after 5 failures, got %s", state)
	}

	// Next call should fail immediately with ErrCircuitOpen without executing the func
	called := false
	_, err := registry.Execute(serviceName, func() (any, error) {
		called = true
		return "ok", nil
	})

	if called {
		t.Fatalf("expected function NOT to be called when breaker is OPEN")
	}
	if !errors.Is(err, circuitbreaker.ErrCircuitOpen) {
		t.Fatalf("expected ErrCircuitOpen, got: %v", err)
	}
}
