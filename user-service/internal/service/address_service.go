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

type AddressService interface {
	GetAddresses(ctx context.Context, userID string) ([]dto.AddressResponse, error)
	GetAddressByID(ctx context.Context, userID, addressID string) (*dto.AddressResponse, error)
	CreateAddress(ctx context.Context, userID string, req *dto.CreateAddressRequest) (*dto.AddressResponse, error)
	UpdateAddress(ctx context.Context, userID, addressID string, req *dto.UpdateAddressRequest) (*dto.AddressResponse, error)
	DeleteAddress(ctx context.Context, userID, addressID string) error
	SetDefaultAddress(ctx context.Context, userID, addressID string) (*dto.AddressResponse, error)
}

type addressService struct {
	repo     repository.AddressRepository
	cache    cache.Cache
	producer event.Producer
	cacheTTL time.Duration
}

func NewAddressService(repo repository.AddressRepository, c cache.Cache, p event.Producer, cacheTTL time.Duration) AddressService {
	return &addressService{
		repo:     repo,
		cache:    c,
		producer: p,
		cacheTTL: cacheTTL,
	}
}

func (s *addressService) GetAddresses(ctx context.Context, userID string) ([]dto.AddressResponse, error) {
	// Try Cache
	if cached, err := s.cache.GetAddresses(ctx, userID); err == nil && len(cached) > 0 {
		return toAddressResponseList(cached), nil
	}

	addresses, err := s.repo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if len(addresses) > 0 {
		_ = s.cache.SetAddresses(ctx, userID, addresses, s.cacheTTL)
	}

	return toAddressResponseList(addresses), nil
}

func (s *addressService) GetAddressByID(ctx context.Context, userID, addressID string) (*dto.AddressResponse, error) {
	addr, err := s.repo.GetByID(ctx, userID, addressID)
	if err != nil {
		return nil, err
	}
	return toAddressResponse(addr), nil
}

func (s *addressService) CreateAddress(ctx context.Context, userID string, req *dto.CreateAddressRequest) (*dto.AddressResponse, error) {
	addr := &model.Address{
		UserID:        userID,
		Label:         req.Label,
		RecipientName: req.RecipientName,
		Phone:         req.Phone,
		AddressLine1:  req.AddressLine1,
		AddressLine2:  req.AddressLine2,
		City:          req.City,
		Province:      req.Province,
		Country:       req.Country,
		PostalCode:    req.PostalCode,
		IsDefault:     req.IsDefault,
	}

	created, err := s.repo.Create(ctx, addr)
	if err != nil {
		return nil, err
	}

	_ = s.cache.DeleteAddresses(ctx, userID)
	_ = s.producer.Publish(ctx, event.TypeUserAddressCreated, userID, created)

	return toAddressResponse(created), nil
}

func (s *addressService) UpdateAddress(ctx context.Context, userID, addressID string, req *dto.UpdateAddressRequest) (*dto.AddressResponse, error) {
	addr, err := s.repo.GetByID(ctx, userID, addressID)
	if err != nil {
		return nil, err
	}

	if req.Label != nil {
		addr.Label = *req.Label
	}
	if req.RecipientName != nil {
		addr.RecipientName = *req.RecipientName
	}
	if req.Phone != nil {
		addr.Phone = *req.Phone
	}
	if req.AddressLine1 != nil {
		addr.AddressLine1 = *req.AddressLine1
	}
	if req.AddressLine2 != nil {
		addr.AddressLine2 = *req.AddressLine2
	}
	if req.City != nil {
		addr.City = *req.City
	}
	if req.Province != nil {
		addr.Province = *req.Province
	}
	if req.Country != nil {
		addr.Country = *req.Country
	}
	if req.PostalCode != nil {
		addr.PostalCode = *req.PostalCode
	}
	if req.IsDefault != nil {
		addr.IsDefault = *req.IsDefault
	}

	updated, err := s.repo.Update(ctx, addr)
	if err != nil {
		return nil, err
	}

	_ = s.cache.DeleteAddresses(ctx, userID)
	_ = s.producer.Publish(ctx, event.TypeUserAddressUpdated, userID, updated)

	return toAddressResponse(updated), nil
}

func (s *addressService) DeleteAddress(ctx context.Context, userID, addressID string) error {
	err := s.repo.Delete(ctx, userID, addressID)
	if err != nil {
		return err
	}

	_ = s.cache.DeleteAddresses(ctx, userID)
	_ = s.producer.Publish(ctx, event.TypeUserAddressDeleted, userID, map[string]string{"address_id": addressID})

	return nil
}

func (s *addressService) SetDefaultAddress(ctx context.Context, userID, addressID string) (*dto.AddressResponse, error) {
	addr, err := s.repo.SetDefault(ctx, userID, addressID)
	if err != nil {
		return nil, err
	}

	_ = s.cache.DeleteAddresses(ctx, userID)
	_ = s.producer.Publish(ctx, event.TypeUserAddressUpdated, userID, addr)

	return toAddressResponse(addr), nil
}

func toAddressResponse(a *model.Address) *dto.AddressResponse {
	return &dto.AddressResponse{
		ID:            a.ID,
		UserID:        a.UserID,
		Label:         a.Label,
		RecipientName: a.RecipientName,
		Phone:         a.Phone,
		AddressLine1:  a.AddressLine1,
		AddressLine2:  a.AddressLine2,
		City:          a.City,
		Province:      a.Province,
		Country:       a.Country,
		PostalCode:    a.PostalCode,
		IsDefault:     a.IsDefault,
		CreatedAt:     a.CreatedAt,
		UpdatedAt:     a.UpdatedAt,
	}
}

func toAddressResponseList(list []model.Address) []dto.AddressResponse {
	res := make([]dto.AddressResponse, len(list))
	for i, a := range list {
		res[i] = *toAddressResponse(&a)
	}
	return res
}
