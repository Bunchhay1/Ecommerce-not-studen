package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/ecommerce-microservice/user-service/internal/cache"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HealthHandler struct {
	pool  *pgxpool.Pool
	cache cache.Cache
}

func NewHealthHandler(pool *pgxpool.Pool, c cache.Cache) *HealthHandler {
	return &HealthHandler{pool: pool, cache: c}
}

func (h *HealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
	})
}

func (h *HealthHandler) Liveness(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "alive",
	})
}

func (h *HealthHandler) Readiness(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	// Check Database
	if err := h.pool.Ping(ctx); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":   "unready",
			"database": "disconnected",
			"error":    err.Error(),
		})
		return
	}

	// Check Redis (optional check)
	redisStatus := "connected"
	if err := h.cache.Ping(ctx); err != nil {
		redisStatus = "degraded/disconnected"
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   "ready",
		"database": "connected",
		"redis":    redisStatus,
	})
}
