package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ecommerce-microservice/user-service/internal/cache"
	"github.com/ecommerce-microservice/user-service/internal/dto"
	"github.com/ecommerce-microservice/user-service/internal/event"
	"github.com/ecommerce-microservice/user-service/internal/handler"
	"github.com/ecommerce-microservice/user-service/internal/middleware"
	"github.com/ecommerce-microservice/user-service/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupProfileApp() (*gin.Engine, *MockProfileRepository) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	repo := NewMockProfileRepository()
	cacheClient := cache.NewNoopCache()
	producer := event.NewLoggingProducer()

	svc := service.NewProfileService(repo, cacheClient, producer, 30*time.Minute)
	h := handler.NewProfileHandler(svc)

	v1 := r.Group("/api/v1")
	{
		users := v1.Group("/users")
		users.Use(middleware.AuthMiddleware(testSecret))
		{
			users.GET("/me", h.GetMyProfile)
			users.PUT("/me", h.UpdateMyProfile)
			users.GET("/:id", h.GetUserProfileByID)
		}
	}

	return r, repo
}

func TestProfile_GetAndAutoCreate(t *testing.T) {
	router, _ := setupProfileApp()
	token := generateTestJWT("user-456", "access", []string{"CUSTOMER"}, 1*time.Hour)

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/users/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusOK, resp.Code)

	var p dto.ProfileResponse
	err := json.Unmarshal(resp.Body.Bytes(), &p)
	assert.NoError(t, err)
	assert.Equal(t, "user-456", p.UserID)
}

func TestProfile_UpdateProfile(t *testing.T) {
	router, _ := setupProfileApp()
	token := generateTestJWT("user-789", "access", []string{"CUSTOMER"}, 1*time.Hour)

	updatePayload := dto.UpdateProfileRequest{
		FirstName: "John",
		LastName:  "Doe",
		Phone:     "+85512345678",
	}
	body, _ := json.Marshal(updatePayload)

	req, _ := http.NewRequest(http.MethodPut, "/api/v1/users/me", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusOK, resp.Code)

	var p dto.ProfileResponse
	err := json.Unmarshal(resp.Body.Bytes(), &p)
	assert.NoError(t, err)
	assert.Equal(t, "John", p.FirstName)
	assert.Equal(t, "Doe", p.LastName)
	assert.Equal(t, "+85512345678", p.Phone)
}
