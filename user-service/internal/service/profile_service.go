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

type ProfileService interface {
	GetProfile(ctx context.Context, userID string) (*dto.ProfileResponse, error)
	UpdateProfile(ctx context.Context, userID string, req *dto.UpdateProfileRequest) (*dto.ProfileResponse, error)
	CreateProfile(ctx context.Context, profile *model.Profile) (*model.Profile, error)
}

type profileService struct {
	repo     repository.ProfileRepository
	cache    cache.Cache
	producer event.Producer
	cacheTTL time.Duration
}

func NewProfileService(repo repository.ProfileRepository, c cache.Cache, p event.Producer, cacheTTL time.Duration) ProfileService {
	return &profileService{
		repo:     repo,
		cache:    c,
		producer: p,
		cacheTTL: cacheTTL,
	}
}

func (s *profileService) GetProfile(ctx context.Context, userID string) (*dto.ProfileResponse, error) {
	// 1. Try Cache
	if cached, err := s.cache.GetProfile(ctx, userID); err == nil && cached != nil {
		return toProfileResponse(cached), nil
	}

	// 2. Query Database (Get or Create initial blank profile)
	profile, err := s.repo.GetOrCreate(ctx, userID)
	if err != nil {
		return nil, err
	}

	// 3. Populate Cache
	_ = s.cache.SetProfile(ctx, profile, s.cacheTTL)

	return toProfileResponse(profile), nil
}

func (s *profileService) UpdateProfile(ctx context.Context, userID string, req *dto.UpdateProfileRequest) (*dto.ProfileResponse, error) {
	profile, err := s.repo.GetOrCreate(ctx, userID)
	if err != nil {
		return nil, err
	}

	if req.FirstName != "" {
		profile.FirstName = req.FirstName
	}
	if req.LastName != "" {
		profile.LastName = req.LastName
	}
	if req.Phone != "" {
		profile.Phone = req.Phone
	}
	if req.AvatarURL != "" {
		profile.AvatarURL = req.AvatarURL
	}

	updated, err := s.repo.Update(ctx, profile)
	if err != nil {
		return nil, err
	}

	// Invalidate cache
	_ = s.cache.DeleteProfile(ctx, userID)

	// Publish domain event
	_ = s.producer.Publish(ctx, event.TypeUserProfileUpdated, userID, map[string]interface{}{
		"first_name": updated.FirstName,
		"last_name":  updated.LastName,
		"phone":      updated.Phone,
		"avatar_url": updated.AvatarURL,
	})

	return toProfileResponse(updated), nil
}

func (s *profileService) CreateProfile(ctx context.Context, profile *model.Profile) (*model.Profile, error) {
	created, err := s.repo.Create(ctx, profile)
	if err != nil {
		return nil, err
	}
	_ = s.producer.Publish(ctx, event.TypeUserProfileCreated, created.UserID, created)
	return created, nil
}

func toProfileResponse(p *model.Profile) *dto.ProfileResponse {
	return &dto.ProfileResponse{
		UserID:    p.UserID,
		FirstName: p.FirstName,
		LastName:  p.LastName,
		Phone:     p.Phone,
		AvatarURL: p.AvatarURL,
		CreatedAt: p.CreatedAt,
		UpdatedAt: p.UpdatedAt,
	}
}
