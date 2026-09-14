package ratelimit

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type Limiter struct {
	redisClient *redis.Client
	useMemory   bool
	mu          sync.Mutex
	memStore    map[string]*memEntry
}

type memEntry struct {
	count     int
	expiresAt time.Time
}

func NewLimiter(redisAddr, password string, db int) *Limiter {
	l := &Limiter{
		memStore: make(map[string]*memEntry),
	}

	if redisAddr != "" {
		client := redis.NewClient(&redis.Options{
			Addr:        redisAddr,
			Password:    password,
			DB:          db,
			DialTimeout: 1 * time.Second,
			ReadTimeout: 1 * time.Second,
		})

		ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
		defer cancel()

		if err := client.Ping(ctx).Err(); err != nil {
			// Redis unavailable, fallback to memory
			l.useMemory = true
		} else {
			l.redisClient = client
			l.useMemory = false
		}
	} else {
		l.useMemory = true
	}

	// Periodic cleanup goroutine for in-memory store
	go l.cleanupMemoryStore()

	return l
}

func (l *Limiter) Allow(ctx context.Context, key string, limit int, window time.Duration) (bool, int, time.Duration, error) {
	if !l.useMemory && l.redisClient != nil {
		allowed, remaining, reset, err := l.allowRedis(ctx, key, limit, window)
		if err == nil {
			return allowed, remaining, reset, nil
		}
		// On Redis failure, seamlessly fall back to memory
		l.useMemory = true
	}

	return l.allowMemory(key, limit, window)
}

func (l *Limiter) allowRedis(ctx context.Context, key string, limit int, window time.Duration) (bool, int, time.Duration, error) {
	redisKey := fmt.Sprintf("gateway:ratelimit:%s", key)

	pipe := l.redisClient.Pipeline()
	incrCmd := pipe.Incr(ctx, redisKey)
	ttlCmd := pipe.TTL(ctx, redisKey)

	_, err := pipe.Exec(ctx)
	if err != nil {
		return false, 0, 0, err
	}

	count := int(incrCmd.Val())
	ttl := ttlCmd.Val()

	if count == 1 || ttl < 0 {
		l.redisClient.Expire(ctx, redisKey, window)
		ttl = window
	}

	if count > limit {
		return false, 0, ttl, nil
	}

	remaining := limit - count
	if remaining < 0 {
		remaining = 0
	}

	return true, remaining, ttl, nil
}

func (l *Limiter) allowMemory(key string, limit int, window time.Duration) (bool, int, time.Duration, error) {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	entry, exists := l.memStore[key]

	if !exists || now.After(entry.expiresAt) {
		l.memStore[key] = &memEntry{
			count:     1,
			expiresAt: now.Add(window),
		}
		return true, limit - 1, window, nil
	}

	entry.count++
	remainingTTL := entry.expiresAt.Sub(now)

	if entry.count > limit {
		return false, 0, remainingTTL, nil
	}

	remaining := limit - entry.count
	if remaining < 0 {
		remaining = 0
	}

	return true, remaining, remainingTTL, nil
}

func (l *Limiter) cleanupMemoryStore() {
	ticker := time.NewTicker(30 * time.Second)
	for range ticker.C {
		l.mu.Lock()
		now := time.Now()
		for k, v := range l.memStore {
			if now.After(v.expiresAt) {
				delete(l.memStore, k)
			}
		}
		l.mu.Unlock()
	}
}

func (l *Limiter) Close() error {
	if l.redisClient != nil {
		return l.redisClient.Close()
	}
	return nil
}
