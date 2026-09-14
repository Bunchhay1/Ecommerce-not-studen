package service

import (
	"context"
	"time"

	"github.com/ecommerce-microservice/user-service/internal/cache"
	"github.com/ecommerce-microservice/user-service/internal/dto"
	"github.com/ecommerce-microservice/user-service/internal/event"
	"github.com/ecommerce-microservice/user-service/internal/model"
	"github.com/ecommerce-microservice/user-service/internal/repository"
)

type PreferenceService interface {
	GetPreferences(ctx context.Context, userID string) (*dto.PreferencesResponse, error)
	UpdatePreferences(ctx context.Context, userID string, req *dto.UpdatePreferencesRequest) (*dto.PreferencesResponse, error)
	GetSettings(ctx context.Context, userID string) (*dto.SettingsResponse, error)
	UpdateSettings(ctx context.Context, userID string, req *dto.UpdateSettingsRequest) (*dto.SettingsResponse, error)
}

type preferenceService struct {
	repo     repository.PreferenceRepository
	cache    cache.Cache
	producer event.Producer
	cacheTTL time.Duration
}

func NewPreferenceService(repo repository.PreferenceRepository, c cache.Cache, p event.Producer, cacheTTL time.Duration) PreferenceService {
	return &preferenceService{
		repo:     repo,
		cache:    c,
		producer: p,
		cacheTTL: cacheTTL,
	}
}

func (s *preferenceService) GetPreferences(ctx context.Context, userID string) (*dto.PreferencesResponse, error) {
	if cached, err := s.cache.GetPreferences(ctx, userID); err == nil && cached != nil {
		return toPreferencesResponse(cached), nil
	}

	pref, err := s.repo.GetOrCreatePreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	_ = s.cache.SetPreferences(ctx, pref, s.cacheTTL)

	return toPreferencesResponse(pref), nil
}

func (s *preferenceService) UpdatePreferences(ctx context.Context, userID string, req *dto.UpdatePreferencesRequest) (*dto.PreferencesResponse, error) {
	pref, err := s.repo.GetOrCreatePreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	if req.Language != nil {
		pref.Language = *req.Language
	}
	if req.Currency != nil {
		pref.Currency = *req.Currency
	}
	if req.EmailNotifications != nil {
		pref.EmailNotifications = *req.EmailNotifications
	}
	if req.SMSNotifications != nil {
		pref.SMSNotifications = *req.SMSNotifications
	}
	if req.PushNotifications != nil {
		pref.PushNotifications = *req.PushNotifications
	}

	updated, err := s.repo.UpdatePreferences(ctx, pref)
	if err != nil {
		return nil, err
	}

	_ = s.cache.DeletePreferences(ctx, userID)
	_ = s.producer.Publish(ctx, event.TypeUserPreferencesUpdated, userID, updated)

	return toPreferencesResponse(updated), nil
}

func (s *preferenceService) GetSettings(ctx context.Context, userID string) (*dto.SettingsResponse, error) {
	settings, err := s.repo.GetOrCreateSettings(ctx, userID)
	if err != nil {
		return nil, err
	}
	return toSettingsResponse(settings), nil
}

func (s *preferenceService) UpdateSettings(ctx context.Context, userID string, req *dto.UpdateSettingsRequest) (*dto.SettingsResponse, error) {
	settings, err := s.repo.GetOrCreateSettings(ctx, userID)
	if err != nil {
		return nil, err
	}

	if req.Theme != nil {
		settings.Theme = *req.Theme
	}
	if req.TwoFactorEnabled != nil {
		settings.TwoFactorEnabled = *req.TwoFactorEnabled
	}
	if req.MarketingOptIn != nil {
		settings.MarketingOptIn = *req.MarketingOptIn
	}

	updated, err := s.repo.UpdateSettings(ctx, settings)
	if err != nil {
		return nil, err
	}

	return toSettingsResponse(updated), nil
}

func toPreferencesResponse(p *model.UserPreference) *dto.PreferencesResponse {
	return &dto.PreferencesResponse{
		UserID:             p.UserID,
		Language:           p.Language,
		Currency:           p.Currency,
		EmailNotifications: p.EmailNotifications,
		SMSNotifications:   p.SMSNotifications,
		PushNotifications:  p.PushNotifications,
	}
}

func toSettingsResponse(s *model.UserSetting) *dto.SettingsResponse {
	return &dto.SettingsResponse{
		UserID:           s.UserID,
		Theme:            s.Theme,
		TwoFactorEnabled: s.TwoFactorEnabled,
		MarketingOptIn:   s.MarketingOptIn,
	}
}
