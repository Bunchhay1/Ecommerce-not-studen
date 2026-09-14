package health

import (
	"net/http"
	"time"

	"github.com/example/api-gateway/internal/circuitbreaker"
	"github.com/gin-gonic/gin"
)

type HealthResponse struct {
	Status    string            `json:"status"`
	Service   string            `json:"service"`
	Port      int               `json:"port"`
	Timestamp string            `json:"timestamp"`
	Breakers  map[string]string `json:"circuitBreakers,omitempty"`
}

func RegisterHealthRoutes(r *gin.Engine, port int, breakers *circuitbreaker.BreakerRegistry, serviceKeys []string) {
	healthHandler := func(c *gin.Context) {
		breakerStates := make(map[string]string)
		if breakers != nil {
			for _, key := range serviceKeys {
				breakerStates[key] = breakers.State(key)
			}
		}

		c.JSON(http.StatusOK, HealthResponse{
			Status:    "UP",
			Service:   "api-gateway",
			Port:      port,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Breakers:  breakerStates,
		})
	}

	r.GET("/health", healthHandler)

	r.GET("/health/live", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP"})
	})

	r.GET("/health/ready", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "READY"})
	})

	// Legacy / K8s standard paths
	r.GET("/liveness", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP"})
	})

	r.GET("/readiness", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "READY"})
	})
}
