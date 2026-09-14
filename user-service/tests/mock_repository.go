package tests

import (
	"context"
	"sync"
	"time"

	"github.com/ecommerce-microservice/user-service/internal/model"
	"github.com/ecommerce-microservice/user-service/internal/repository"
	"github.com/google/uuid"
)

type MockProfileRepository struct {
	mu       sync.RWMutex
	profiles map[string]*model.Profile // key: user_id
}

func NewMockProfileRepository() *MockProfileRepository {
	return &MockProfileRepository{
		profiles: make(map[string]*model.Profile),
	}
}

func (m *MockProfileRepository) GetByUserID(ctx context.Context, userID string) (*model.Profile, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	p, ok := m.profiles[userID]
	if !ok {
		return nil, repository.ErrProfileNotFound
	}
	cp := *p
	return &cp, nil
}

func (m *MockProfileRepository) Create(ctx context.Context, profile *model.Profile) (*model.Profile, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if profile.ID == "" {
		profile.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	profile.CreatedAt = now
	profile.UpdatedAt = now
	cp := *profile
	m.profiles[profile.UserID] = &cp
	return profile, nil
}

func (m *MockProfileRepository) Update(ctx context.Context, profile *model.Profile) (*model.Profile, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	profile.UpdatedAt = time.Now().UTC()
	cp := *profile
	m.profiles[profile.UserID] = &cp
	return profile, nil
}

func (m *MockProfileRepository) GetOrCreate(ctx context.Context, userID string) (*model.Profile, error) {
	p, err := m.GetByUserID(ctx, userID)
	if err == nil {
		return p, nil
	}
	newP := &model.Profile{
		UserID: userID,
	}
	return m.Create(ctx, newP)
}

type MockAddressRepository struct {
	mu        sync.RWMutex
	addresses map[string]*model.Address // key: address_id
}

func NewMockAddressRepository() *MockAddressRepository {
	return &MockAddressRepository{
		addresses: make(map[string]*model.Address),
	}
}

func (m *MockAddressRepository) ListByUserID(ctx context.Context, userID string) ([]model.Address, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var list []model.Address
	for _, a := range m.addresses {
		if a.UserID == userID {
			list = append(list, *a)
		}
	}
	return list, nil
}

func (m *MockAddressRepository) GetByID(ctx context.Context, userID, addressID string) (*model.Address, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	a, ok := m.addresses[addressID]
	if !ok || a.UserID != userID {
		return nil, repository.ErrAddressNotFound
	}
	cp := *a
	return &cp, nil
}

func (m *MockAddressRepository) Create(ctx context.Context, address *model.Address) (*model.Address, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if address.ID == "" {
		address.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	address.CreatedAt = now
	address.UpdatedAt = now

	// If default or first address, unset other defaults
	userCount := 0
	for _, a := range m.addresses {
		if a.UserID == address.UserID {
			userCount++
			if address.IsDefault {
				a.IsDefault = false
			}
		}
	}
	if userCount == 0 {
		address.IsDefault = true
	}

	cp := *address
	m.addresses[address.ID] = &cp
	return address, nil
}

func (m *MockAddressRepository) Update(ctx context.Context, address *model.Address) (*model.Address, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	a, ok := m.addresses[address.ID]
	if !ok || a.UserID != address.UserID {
		return nil, repository.ErrAddressNotFound
	}
	if address.IsDefault {
		for _, other := range m.addresses {
			if other.UserID == address.UserID && other.ID != address.ID {
				other.IsDefault = false
			}
		}
	}
	address.UpdatedAt = time.Now().UTC()
	cp := *address
	m.addresses[address.ID] = &cp
	return address, nil
}

func (m *MockAddressRepository) Delete(ctx context.Context, userID, addressID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	a, ok := m.addresses[addressID]
	if !ok || a.UserID != userID {
		return repository.ErrAddressNotFound
	}
	delete(m.addresses, addressID)
	return nil
}

func (m *MockAddressRepository) SetDefault(ctx context.Context, userID, addressID string) (*model.Address, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	target, ok := m.addresses[addressID]
	if !ok || target.UserID != userID {
		return nil, repository.ErrAddressNotFound
	}
	for _, a := range m.addresses {
		if a.UserID == userID {
			a.IsDefault = (a.ID == addressID)
		}
	}
	cp := *target
	return &cp, nil
}

type MockPreferenceRepository struct {
	mu          sync.RWMutex
	preferences map[string]*model.UserPreference // key: user_id
	settings    map[string]*model.UserSetting    // key: user_id
}

func NewMockPreferenceRepository() *MockPreferenceRepository {
	return &MockPreferenceRepository{
		preferences: make(map[string]*model.UserPreference),
		settings:    make(map[string]*model.UserSetting),
	}
}

func (m *MockPreferenceRepository) GetPreferences(ctx context.Context, userID string) (*model.UserPreference, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	p, ok := m.preferences[userID]
	if !ok {
		return nil, repository.ErrProfileNotFound
	}
	cp := *p
	return &cp, nil
}

func (m *MockPreferenceRepository) GetOrCreatePreferences(ctx context.Context, userID string) (*model.UserPreference, error) {
	p, err := m.GetPreferences(ctx, userID)
	if err == nil {
		return p, nil
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	newPref := &model.UserPreference{
		ID:                 uuid.NewString(),
		UserID:             userID,
		Language:           "en",
		Currency:           "USD",
		EmailNotifications: true,
		SMSNotifications:   false,
		PushNotifications:  true,
		CreatedAt:          time.Now().UTC(),
		UpdatedAt:          time.Now().UTC(),
	}
	cp := *newPref
	m.preferences[userID] = &cp
	return newPref, nil
}

func (m *MockPreferenceRepository) UpdatePreferences(ctx context.Context, pref *model.UserPreference) (*model.UserPreference, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	pref.UpdatedAt = time.Now().UTC()
	cp := *pref
	m.preferences[pref.UserID] = &cp
	return pref, nil
}

func (m *MockPreferenceRepository) GetSettings(ctx context.Context, userID string) (*model.UserSetting, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	s, ok := m.settings[userID]
	if !ok {
		return nil, repository.ErrProfileNotFound
	}
	cp := *s
	return &cp, nil
}

func (m *MockPreferenceRepository) GetOrCreateSettings(ctx context.Context, userID string) (*model.UserSetting, error) {
	s, err := m.GetSettings(ctx, userID)
	if err == nil {
		return s, nil
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	newSetting := &model.UserSetting{
		ID:               uuid.NewString(),
		UserID:           userID,
		Theme:            "system",
		TwoFactorEnabled: false,
		MarketingOptIn:   false,
		CreatedAt:        time.Now().UTC(),
		UpdatedAt:        time.Now().UTC(),
	}
	cp := *newSetting
	m.settings[userID] = &cp
	return newSetting, nil
}

func (m *MockPreferenceRepository) UpdateSettings(ctx context.Context, s *model.UserSetting) (*model.UserSetting, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s.UpdatedAt = time.Now().UTC()
	cp := *s
	m.settings[s.UserID] = &cp
	return s, nil
}
