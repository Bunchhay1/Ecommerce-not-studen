package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

type ServerConfig struct {
	Port               int      `yaml:"port"`
	ReadTimeout        int      `yaml:"read_timeout_seconds"`
	WriteTimeout       int      `yaml:"write_timeout_seconds"`
	IdleTimeout        int      `yaml:"idle_timeout_seconds"`
	CorsAllowedOrigins []string `yaml:"cors_allowed_origins"`
	CorsAllowedMethods []string `yaml:"cors_allowed_methods"`
	CorsAllowedHeaders []string `yaml:"cors_allowed_headers"`
}

type AuthConfig struct {
	JWTSecret   string `yaml:"jwt_secret"`
	TokenHeader string `yaml:"token_header"`
}

type RedisConfig struct {
	Address  string `yaml:"address"`
	Password string `yaml:"password"`
	DB       int    `yaml:"db"`
	PoolSize int    `yaml:"pool_size"`
}

type RateLimitPolicy struct {
	Requests      int `yaml:"requests"`
	WindowSeconds int `yaml:"window_seconds"`
}

type RateLimitConfig struct {
	Enabled  bool                       `yaml:"enabled"`
	Policies map[string]RateLimitPolicy `yaml:"policies"`
}

type ServiceRoute struct {
	Name           string `yaml:"name"`
	Prefix         string `yaml:"prefix"`
	Target         string `yaml:"target"`
	TimeoutSeconds int    `yaml:"timeout_seconds"`
	RequireAuth    bool   `yaml:"require_auth"`
}

type Config struct {
	Server    ServerConfig            `yaml:"server"`
	Auth      AuthConfig              `yaml:"auth"`
	Redis     RedisConfig             `yaml:"redis"`
	RateLimit RateLimitConfig         `yaml:"rate_limit"`
	Services  map[string]ServiceRoute `yaml:"services"`
}

func LoadConfig(configPath string) (*Config, error) {
	cfg := &Config{
		Server: ServerConfig{
			Port:               8000,
			ReadTimeout:        15,
			WriteTimeout:       15,
			IdleTimeout:        60,
			CorsAllowedOrigins: []string{"*"},
			CorsAllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
			CorsAllowedHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Request-ID", "Idempotency-Key"},
		},
		Auth: AuthConfig{
			JWTSecret:   "supersecretkeysharedacrossmicroservices2026",
			TokenHeader: "Authorization",
		},
		Redis: RedisConfig{
			Address:  "localhost:6379",
			PoolSize: 20,
		},
		RateLimit: RateLimitConfig{
			Enabled: true,
			Policies: map[string]RateLimitPolicy{
				"default": {Requests: 300, WindowSeconds: 60},
				"login":   {Requests: 5, WindowSeconds: 60},
				"search":  {Requests: 100, WindowSeconds: 60},
				"admin":   {Requests: 100, WindowSeconds: 60},
			},
		},
		Services: make(map[string]ServiceRoute),
	}

	// Try reading file if exists
	if configPath != "" {
		data, err := os.ReadFile(configPath)
		if err == nil {
			if err := yaml.Unmarshal(data, cfg); err != nil {
				return nil, fmt.Errorf("failed to parse yaml config: %w", err)
			}
		}
	}

	// Override from Environment Variables
	if portStr := os.Getenv("PORT"); portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil {
			cfg.Server.Port = p
		}
	}

	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		cfg.Auth.JWTSecret = secret
	}

	if redisAddr := os.Getenv("REDIS_ADDR"); redisAddr != "" {
		cfg.Redis.Address = redisAddr
	} else if redisURL := os.Getenv("REDIS_URL"); redisURL != "" {
		// handle redis://localhost:6379
		trimmed := strings.TrimPrefix(redisURL, "redis://")
		cfg.Redis.Address = trimmed
	}

	// Dynamic override of service targets from environment (e.g. AUTH_SERVICE_URL)
	envServiceMap := map[string]string{
		"auth":           "AUTH_SERVICE_URL",
		"user":           "USER_SERVICE_URL",
		"catalog":        "CATALOG_SERVICE_URL",
		"categories":     "CATALOG_SERVICE_URL",
		"search":         "SEARCH_SERVICE_URL",
		"cart":           "CART_SERVICE_URL",
		"inventory":      "INVENTORY_SERVICE_URL",
		"order":          "ORDER_SERVICE_URL",
		"payment":        "PAYMENT_SERVICE_URL",
		"shipping":       "SHIPPING_SERVICE_URL",
		"promotion":      "PROMOTION_SERVICE_URL",
		"pricing":        "PRICING_SERVICE_URL",
		"review":         "REVIEW_SERVICE_URL",
		"notification":   "NOTIFICATION_SERVICE_URL",
		"recommendation": "RECOMMENDATION_SERVICE_URL",
		"seller":         "SELLER_SERVICE_URL",
		"seller_alias":   "SELLER_SERVICE_URL",
		"admin":          "ADMIN_SERVICE_URL",
	}

	for svcKey, envVar := range envServiceMap {
		url := os.Getenv(envVar)
		if url == "" && (svcKey == "pricing" || svcKey == "promotion") {
			url = os.Getenv("PROMOTION_SERVICE_URL")
			if url == "" {
				url = os.Getenv("PRICING_SERVICE_URL")
			}
		}
		if url != "" {
			if s, exists := cfg.Services[svcKey]; exists {
				s.Target = url
				cfg.Services[svcKey] = s
			}
		}
	}

	return cfg, nil
}
