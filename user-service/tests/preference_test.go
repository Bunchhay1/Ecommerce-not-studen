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

func setupPreferenceApp() (*gin.Engine, *MockPreferenceRepository) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	repo := NewMockPreferenceRepository()
	cacheClient := cache.NewNoopCache()
	producer := event.NewLoggingProducer()

	svc := service.NewPreferenceService(repo, cacheClient, producer, 30*time.Minute)
	h := handler.NewPreferenceHandler(svc)

	v1 := r.Group("/api/v1")
	{
		users := v1.Group("/users")
		users.Use(middleware.AuthMiddleware(testSecret))
		{
			users.GET("/me/preferences", h.GetPreferences)
			users.PUT("/me/preferences", h.UpdatePreferences)
			users.GET("/me/settings", h.GetSettings)
			users.PUT("/me/settings", h.UpdateSettings)
		}
	}

	return r, repo
}

func TestPreferences_GetAndUpdate(t *testing.T) {
	router, _ := setupPreferenceApp()
	token := generateTestJWT("user-pref-1", "access", []string{"CUSTOMER"}, 1*time.Hour)

	// 1. Get default preferences
	req1, _ := http.NewRequest(http.MethodGet, "/api/v1/users/me/preferences", nil)
	req1.Header.Set("Authorization", "Bearer "+token)
	resp1 := httptest.NewRecorder()
	router.ServeHTTP(resp1, req1)

	assert.Equal(t, http.StatusOK, resp1.Code)
	var pref1 dto.PreferencesResponse
	_ = json.Unmarshal(resp1.Body.Bytes(), &pref1)
	assert.Equal(t, "en", pref1.Language)
	assert.Equal(t, "USD", pref1.Currency)

	// 2. Update preferences
	lang := "km"
	curr := "KHR"
	updatePayload := dto.UpdatePreferencesRequest{
		Language: &lang,
		Currency: &curr,
	}
	body, _ := json.Marshal(updatePayload)

	req2, _ := http.NewRequest(http.MethodPut, "/api/v1/users/me/preferences", bytes.NewBuffer(body))
	req2.Header.Set("Authorization", "Bearer "+token)
	req2.Header.Set("Content-Type", "application/json")
	resp2 := httptest.NewRecorder()
	router.ServeHTTP(resp2, req2)

	assert.Equal(t, http.StatusOK, resp2.Code)
	var pref2 dto.PreferencesResponse
	_ = json.Unmarshal(resp2.Body.Bytes(), &pref2)
	assert.Equal(t, "km", pref2.Language)
	assert.Equal(t, "KHR", pref2.Currency)
}

func TestSettings_GetAndUpdate(t *testing.T) {
	router, _ := setupPreferenceApp()
	token := generateTestJWT("user-settings-1", "access", []string{"CUSTOMER"}, 1*time.Hour)

	// 1. Get default settings
	req1, _ := http.NewRequest(http.MethodGet, "/api/v1/users/me/settings", nil)
	req1.Header.Set("Authorization", "Bearer "+token)
	resp1 := httptest.NewRecorder()
	router.ServeHTTP(resp1, req1)

	assert.Equal(t, http.StatusOK, resp1.Code)
	var s1 dto.SettingsResponse
	_ = json.Unmarshal(resp1.Body.Bytes(), &s1)
	assert.Equal(t, "system", s1.Theme)
	assert.False(t, s1.TwoFactorEnabled)

	// 2. Update settings
	theme := "dark"
	twoFa := true
	updatePayload := dto.UpdateSettingsRequest{
		Theme:            &theme,
		TwoFactorEnabled: &twoFa,
	}
	body, _ := json.Marshal(updatePayload)

	req2, _ := http.NewRequest(http.MethodPut, "/api/v1/users/me/settings", bytes.NewBuffer(body))
	req2.Header.Set("Authorization", "Bearer "+token)
	req2.Header.Set("Content-Type", "application/json")
	resp2 := httptest.NewRecorder()
	router.ServeHTTP(resp2, req2)

	assert.Equal(t, http.StatusOK, resp2.Code)
	var s2 dto.SettingsResponse
	_ = json.Unmarshal(resp2.Body.Bytes(), &s2)
	assert.Equal(t, "dark", s2.Theme)
	assert.True(t, s2.TwoFactorEnabled)
}
