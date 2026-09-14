package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/example/api-gateway/internal/auth"
	"github.com/example/api-gateway/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "test-secret-key-32-bytes-minimum-length!!"

func generateTestToken(secret string, userID, email string, roles any, exp time.Duration) string {
	claims := auth.CustomClaims{
		UserID: userID,
		Email:  email,
		Roles:  roles,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(exp)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte(secret))
	return tokenStr
}

func TestValidateToken_Success(t *testing.T) {
	tokenStr := generateTestToken(testSecret, "user-123", "alice@example.com", []string{"CUSTOMER", "SELLER"}, 1*time.Hour)

	claims, err := auth.ValidateToken(tokenStr, testSecret)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if claims.UserID != "user-123" {
		t.Errorf("expected userID user-123, got: %s", claims.UserID)
	}
	if claims.Email != "alice@example.com" {
		t.Errorf("expected email alice@example.com, got: %s", claims.Email)
	}
	if len(claims.Roles) != 2 || claims.Roles[0] != "CUSTOMER" || claims.Roles[1] != "SELLER" {
		t.Errorf("expected roles [CUSTOMER, SELLER], got: %v", claims.Roles)
	}
}

func TestValidateToken_Expired(t *testing.T) {
	tokenStr := generateTestToken(testSecret, "user-123", "alice@example.com", []string{"CUSTOMER"}, -1*time.Hour)

	_, err := auth.ValidateToken(tokenStr, testSecret)
	if err == nil {
		t.Fatal("expected error for expired token, got nil")
	}
}

func TestValidateToken_InvalidSignature(t *testing.T) {
	tokenStr := generateTestToken("wrong-secret", "user-123", "alice@example.com", []string{"CUSTOMER"}, 1*time.Hour)

	_, err := auth.ValidateToken(tokenStr, testSecret)
	if err == nil {
		t.Fatal("expected error for invalid signature, got nil")
	}
}

func TestAuthMiddleware_Protected_Unauthorized(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.RequestIDMiddleware())
	r.Use(middleware.AuthMiddleware(testSecret, true))
	r.GET("/api/v1/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/protected", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got: %d", w.Code)
	}
}

func TestAuthMiddleware_Protected_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.RequestIDMiddleware())
	r.Use(middleware.SecurityMiddleware())
	r.Use(middleware.AuthMiddleware(testSecret, true))

	var forwardedUserID, forwardedRoles, forwardedEmail string
	r.GET("/api/v1/orders", func(c *gin.Context) {
		forwardedUserID = c.Request.Header.Get("X-User-ID")
		forwardedRoles = c.Request.Header.Get("X-User-Roles")
		forwardedEmail = c.Request.Header.Get("X-User-Email")
		c.JSON(http.StatusOK, gin.H{"orders": []string{}})
	})

	tokenStr := generateTestToken(testSecret, "usr-999", "bob@market.com", []string{"ADMIN", "USER"}, 1*time.Hour)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)

	// Attempt client header spoofing
	req.Header.Set("X-User-ID", "spoofed-hacker-id")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got: %d", w.Code)
	}
	if forwardedUserID != "usr-999" {
		t.Errorf("expected sanitized X-User-ID to be usr-999, got: %s", forwardedUserID)
	}
	if forwardedRoles != "ADMIN,USER" {
		t.Errorf("expected X-User-Roles ADMIN,USER, got: %s", forwardedRoles)
	}
	if forwardedEmail != "bob@market.com" {
		t.Errorf("expected X-User-Email bob@market.com, got: %s", forwardedEmail)
	}
}

func TestAuthMiddleware_Public_AllowsAnonymous(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(middleware.RequestIDMiddleware())
	r.Use(middleware.AuthMiddleware(testSecret, false))
	r.GET("/api/v1/products", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"products": []string{"iPhone 17"}})
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/products", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200 for public route, got: %d", w.Code)
	}
}
