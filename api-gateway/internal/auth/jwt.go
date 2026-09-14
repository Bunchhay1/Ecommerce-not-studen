package auth

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type UserClaims struct {
	UserID string   `json:"user_id"`
	Email  string   `json:"email"`
	Roles  []string `json:"roles"`
}

type CustomClaims struct {
	UserID string `json:"user_id,omitempty"`
	Email  string `json:"email,omitempty"`
	Roles  any    `json:"roles,omitempty"`
	jwt.RegisteredClaims
}

var (
	ErrTokenExpired = errors.New("token has expired")
	ErrTokenInvalid = errors.New("token signature or claims invalid")
)

func ValidateToken(tokenString, secret string) (*UserClaims, error) {
	if tokenString == "" {
		return nil, errors.New("empty token")
	}

	// Strip "Bearer " prefix if present
	tokenString = strings.TrimPrefix(tokenString, "Bearer ")
	tokenString = strings.TrimSpace(tokenString)

	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, fmt.Errorf("%w: %v", ErrTokenInvalid, err)
	}

	claims, ok := token.Claims.(*CustomClaims)
	if !ok || !token.Valid {
		return nil, ErrTokenInvalid
	}

	// Verify expiration
	if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, ErrTokenExpired
	}

	// Resolve UserID from user_id claim or Subject
	userID := claims.UserID
	if userID == "" {
		userID = claims.Subject
	}

	// Resolve Roles
	var roles []string
	switch r := claims.Roles.(type) {
	case []any:
		for _, item := range r {
			if s, ok := item.(string); ok {
				roles = append(roles, s)
			}
		}
	case []string:
		roles = r
	case string:
		if r != "" {
			parts := strings.Split(r, ",")
			for _, p := range parts {
				roles = append(roles, strings.TrimSpace(p))
			}
		}
	}

	return &UserClaims{
		UserID: userID,
		Email:  claims.Email,
		Roles:  roles,
	}, nil
}
