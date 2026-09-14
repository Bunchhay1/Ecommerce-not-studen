package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ecommerce-microservice/user-service/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
)

const testSecret = "test-jwt-secret-key-12345"

func generateTestJWT(userID string, tokenType string, roles []string, expireDuration time.Duration) string {
	claims := middleware.Claims{
		UserID: userID,
		Type:   tokenType,
		Roles:  roles,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expireDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(testSecret))
	return tokenString
}

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	protected := r.Group("/api/v1/test")
	protected.Use(middleware.AuthMiddleware(testSecret))
	{
		protected.GET("/me", func(c *gin.Context) {
			userID, _ := middleware.GetUserID(c)
			c.JSON(http.StatusOK, gin.H{"user_id": userID})
		})

		protected.GET("/admin", middleware.RequireRole("ADMIN"), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "admin_access_granted"})
		})
	}

	return r
}

func TestAuthMiddleware_MissingHeader(t *testing.T) {
	router := setupTestRouter()

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/test/me", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	router := setupTestRouter()

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/test/me", nil)
	req.Header.Set("Authorization", "Bearer invalid.token.string")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

func TestAuthMiddleware_ExpiredToken(t *testing.T) {
	router := setupTestRouter()

	expiredToken := generateTestJWT("user-123", "access", []string{"CUSTOMER"}, -1*time.Hour)
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/test/me", nil)
	req.Header.Set("Authorization", "Bearer "+expiredToken)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	router := setupTestRouter()

	validToken := generateTestJWT("user-123", "access", []string{"CUSTOMER"}, 1*time.Hour)
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/test/me", nil)
	req.Header.Set("Authorization", "Bearer "+validToken)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusOK, resp.Code)
	assert.Contains(t, resp.Body.String(), "user-123")
}

func TestAuthMiddleware_RoleAuthorization(t *testing.T) {
	router := setupTestRouter()

	// 1. Customer cannot access admin endpoint (403 Forbidden)
	customerToken := generateTestJWT("cust-1", "access", []string{"CUSTOMER"}, 1*time.Hour)
	req1, _ := http.NewRequest(http.MethodGet, "/api/v1/test/admin", nil)
	req1.Header.Set("Authorization", "Bearer "+customerToken)
	resp1 := httptest.NewRecorder()
	router.ServeHTTP(resp1, req1)
	assert.Equal(t, http.StatusForbidden, resp1.Code)

	// 2. Admin can access admin endpoint (200 OK)
	adminToken := generateTestJWT("admin-1", "access", []string{"ADMIN"}, 1*time.Hour)
	req2, _ := http.NewRequest(http.MethodGet, "/api/v1/test/admin", nil)
	req2.Header.Set("Authorization", "Bearer "+adminToken)
	resp2 := httptest.NewRecorder()
	router.ServeHTTP(resp2, req2)
	assert.Equal(t, http.StatusOK, resp2.Code)
}
