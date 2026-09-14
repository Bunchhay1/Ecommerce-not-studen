package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	Environment         string
	APIV1Prefix         string
	JWTSecret           string
	DBHost              string
	DBPort              string
	DBUser              string
	DBPassword          string
	DBName              string
	DBSSLMode           string
	RedisHost           string
	RedisPort           string
	RedisPassword       string
	RedisDB             int
	RedisCacheTTL       time.Duration
	KafkaBrokers        string
	KafkaTopicUserEvents string
	KafkaEnabled        bool
}

func LoadConfig() *Config {
	_ = godotenv.Load()

	redisDB, _ := strconv.Atoi(getEnv("REDIS_DB", "0"))
	cacheTTLMinutes, _ := strconv.Atoi(getEnv("REDIS_CACHE_TTL_MINUTES", "30"))
	kafkaEnabled, _ := strconv.ParseBool(getEnv("KAFKA_ENABLED", "false"))

	return &Config{
		Port:                 getEnv("PORT", "8001"),
		Environment:          getEnv("ENVIRONMENT", "development"),
		APIV1Prefix:          getEnv("API_V1_PREFIX", "/api/v1"),
		JWTSecret:            getEnv("JWT_SECRET", "development-secret-key-change-in-production-never-commit-real-secrets"),
		DBHost:               getEnv("DB_HOST", "localhost"),
		DBPort:               getEnv("DB_PORT", "5433"),
		DBUser:               getEnv("DB_USER", "postgres"),
		DBPassword:           getEnv("DB_PASSWORD", "password"),
		DBName:               getEnv("DB_NAME", "user_db"),
		DBSSLMode:            getEnv("DB_SSLMODE", "disable"),
		RedisHost:            getEnv("REDIS_HOST", "localhost"),
		RedisPort:            getEnv("REDIS_PORT", "6379"),
		RedisPassword:        getEnv("REDIS_PASSWORD", ""),
		RedisDB:              redisDB,
		RedisCacheTTL:        time.Duration(cacheTTLMinutes) * time.Minute,
		KafkaBrokers:         getEnv("KAFKA_BROKERS", "localhost:9092"),
		KafkaTopicUserEvents: getEnv("KAFKA_TOPIC_USER_EVENTS", "user.events"),
		KafkaEnabled:         kafkaEnabled,
	}
}

func (c *Config) DatabaseDSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName, c.DBSSLMode)
}

func (c *Config) RedisAddress() string {
	return fmt.Sprintf("%s:%s", c.RedisHost, c.RedisPort)
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
