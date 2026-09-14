package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ecommerce-microservice/user-service/internal/model"
	"github.com/redis/go-redis/v9"
)

type Cache interface {
	GetProfile(ctx context.Context, userID string) (*model.Profile, error)
	SetProfile(ctx context.Context, profile *model.Profile, ttl time.Duration) error
	DeleteProfile(ctx context.Context, userID string) error

	GetAddresses(ctx context.Context, userID string) ([]model.Address, error)
	SetAddresses(ctx context.Context, userID string, addresses []model.Address, ttl time.Duration) error
	DeleteAddresses(ctx context.Context, userID string) error

	GetPreferences(ctx context.Context, userID string) (*model.UserPreference, error)
	SetPreferences(ctx context.Context, pref *model.UserPreference, ttl time.Duration) error
	DeletePreferences(ctx context.Context, userID string) error

	Ping(ctx context.Context) error
	Close() error
}

type RedisCache struct {
	client *redis.Client
}

func NewRedisCache(addr, password string, db int) (*RedisCache, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis connection failed: %w", err)
	}

	return &RedisCache{client: rdb}, nil
}

func (r *RedisCache) profileKey(userID string) string {
	return fmt.Sprintf("user:profile:%s", userID)
}

func (r *RedisCache) addressKey(userID string) string {
	return fmt.Sprintf("user:addresses:%s", userID)
}

func (r *RedisCache) prefKey(userID string) string {
	return fmt.Sprintf("user:preferences:%s", userID)
}

func (r *RedisCache) GetProfile(ctx context.Context, userID string) (*model.Profile, error) {
	val, err := r.client.Get(ctx, r.profileKey(userID)).Result()
	if err != nil {
		return nil, err
	}
	var p model.Profile
	if err := json.Unmarshal([]byte(val), &p); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *RedisCache) SetProfile(ctx context.Context, profile *model.Profile, ttl time.Duration) error {
	data, err := json.Marshal(profile)
	if err != nil {
		return err
	}
	return r.client.Set(ctx, r.profileKey(profile.UserID), data, ttl).Err()
}

func (r *RedisCache) DeleteProfile(ctx context.Context, userID string) error {
	return r.client.Del(ctx, r.profileKey(userID)).Err()
}

func (r *RedisCache) GetAddresses(ctx context.Context, userID string) ([]model.Address, error) {
	val, err := r.client.Get(ctx, r.addressKey(userID)).Result()
	if err != nil {
		return nil, err
	}
	var addresses []model.Address
	if err := json.Unmarshal([]byte(val), &addresses); err != nil {
		return nil, err
	}
	return addresses, nil
}

func (r *RedisCache) SetAddresses(ctx context.Context, userID string, addresses []model.Address, ttl time.Duration) error {
	data, err := json.Marshal(addresses)
	if err != nil {
		return err
	}
	return r.client.Set(ctx, r.addressKey(userID), data, ttl).Err()
}

func (r *RedisCache) DeleteAddresses(ctx context.Context, userID string) error {
	return r.client.Del(ctx, r.addressKey(userID)).Err()
}

func (r *RedisCache) GetPreferences(ctx context.Context, userID string) (*model.UserPreference, error) {
	val, err := r.client.Get(ctx, r.prefKey(userID)).Result()
	if err != nil {
		return nil, err
	}
	var pref model.UserPreference
	if err := json.Unmarshal([]byte(val), &pref); err != nil {
		return nil, err
	}
	return &pref, nil
}

func (r *RedisCache) SetPreferences(ctx context.Context, pref *model.UserPreference, ttl time.Duration) error {
	data, err := json.Marshal(pref)
	if err != nil {
		return err
	}
	return r.client.Set(ctx, r.prefKey(pref.UserID), data, ttl).Err()
}

func (r *RedisCache) DeletePreferences(ctx context.Context, userID string) error {
	return r.client.Del(ctx, r.prefKey(userID)).Err()
}

func (r *RedisCache) Ping(ctx context.Context) error {
	return r.client.Ping(ctx).Err()
}

func (r *RedisCache) Close() error {
	return r.client.Close()
}

// NoopCache provides a safe fallback when Redis is not running or disabled
type NoopCache struct{}

func NewNoopCache() *NoopCache {
	return &NoopCache{}
}

func (n *NoopCache) GetProfile(ctx context.Context, userID string) (*model.Profile, error) {
	return nil, redis.Nil
}

func (n *NoopCache) SetProfile(ctx context.Context, profile *model.Profile, ttl time.Duration) error {
	return nil
}

func (n *NoopCache) DeleteProfile(ctx context.Context, userID string) error {
	return nil
}

func (n *NoopCache) GetAddresses(ctx context.Context, userID string) ([]model.Address, error) {
	return nil, redis.Nil
}

func (n *NoopCache) SetAddresses(ctx context.Context, userID string, addresses []model.Address, ttl time.Duration) error {
	return nil
}

func (n *NoopCache) DeleteAddresses(ctx context.Context, userID string) error {
	return nil
}

func (n *NoopCache) GetPreferences(ctx context.Context, userID string) (*model.UserPreference, error) {
	return nil, redis.Nil
}

func (n *NoopCache) SetPreferences(ctx context.Context, pref *model.UserPreference, ttl time.Duration) error {
	return nil
}

func (n *NoopCache) DeletePreferences(ctx context.Context, userID string) error {
	return nil
}

func (n *NoopCache) Ping(ctx context.Context) error {
	return nil
}

func (n *NoopCache) Close() error {
	return nil
}
