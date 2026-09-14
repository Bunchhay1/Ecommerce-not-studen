package repository

import (
	"context"
	"errors"
	"time"

	"github.com/ecommerce-microservice/user-service/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PreferenceRepository interface {
	GetPreferences(ctx context.Context, userID string) (*model.UserPreference, error)
	GetOrCreatePreferences(ctx context.Context, userID string) (*model.UserPreference, error)
	UpdatePreferences(ctx context.Context, pref *model.UserPreference) (*model.UserPreference, error)

	GetSettings(ctx context.Context, userID string) (*model.UserSetting, error)
	GetOrCreateSettings(ctx context.Context, userID string) (*model.UserSetting, error)
	UpdateSettings(ctx context.Context, settings *model.UserSetting) (*model.UserSetting, error)
}

type PostgresPreferenceRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresPreferenceRepository(pool *pgxpool.Pool) *PostgresPreferenceRepository {
	return &PostgresPreferenceRepository{pool: pool}
}

func (r *PostgresPreferenceRepository) GetPreferences(ctx context.Context, userID string) (*model.UserPreference, error) {
	query := `
		SELECT id, user_id, language, currency, email_notifications, sms_notifications, push_notifications, created_at, updated_at
		FROM user_preferences
		WHERE user_id = $1
	`
	var p model.UserPreference
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&p.ID,
		&p.UserID,
		&p.Language,
		&p.Currency,
		&p.EmailNotifications,
		&p.SMSNotifications,
		&p.PushNotifications,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PostgresPreferenceRepository) GetOrCreatePreferences(ctx context.Context, userID string) (*model.UserPreference, error) {
	p, err := r.GetPreferences(ctx, userID)
	if err == nil {
		return p, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
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
		query := `
			INSERT INTO user_preferences (id, user_id, language, currency, email_notifications, sms_notifications, push_notifications, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			ON CONFLICT (user_id) DO UPDATE SET updated_at = EXCLUDED.updated_at
			RETURNING id, user_id, language, currency, email_notifications, sms_notifications, push_notifications, created_at, updated_at
		`
		err = r.pool.QueryRow(ctx, query,
			newPref.ID,
			newPref.UserID,
			newPref.Language,
			newPref.Currency,
			newPref.EmailNotifications,
			newPref.SMSNotifications,
			newPref.PushNotifications,
			newPref.CreatedAt,
			newPref.UpdatedAt,
		).Scan(
			&newPref.ID,
			&newPref.UserID,
			&newPref.Language,
			&newPref.Currency,
			&newPref.EmailNotifications,
			&newPref.SMSNotifications,
			&newPref.PushNotifications,
			&newPref.CreatedAt,
			&newPref.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		return newPref, nil
	}
	return nil, err
}

func (r *PostgresPreferenceRepository) UpdatePreferences(ctx context.Context, pref *model.UserPreference) (*model.UserPreference, error) {
	pref.UpdatedAt = time.Now().UTC()
	query := `
		INSERT INTO user_preferences (id, user_id, language, currency, email_notifications, sms_notifications, push_notifications, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (user_id) DO UPDATE 
		SET language = EXCLUDED.language,
		    currency = EXCLUDED.currency,
		    email_notifications = EXCLUDED.email_notifications,
		    sms_notifications = EXCLUDED.sms_notifications,
		    push_notifications = EXCLUDED.push_notifications,
		    updated_at = EXCLUDED.updated_at
		RETURNING id, user_id, language, currency, email_notifications, sms_notifications, push_notifications, created_at, updated_at
	`
	if pref.ID == "" {
		pref.ID = uuid.NewString()
	}
	if pref.CreatedAt.IsZero() {
		pref.CreatedAt = pref.UpdatedAt
	}

	err := r.pool.QueryRow(ctx, query,
		pref.ID,
		pref.UserID,
		pref.Language,
		pref.Currency,
		pref.EmailNotifications,
		pref.SMSNotifications,
		pref.PushNotifications,
		pref.CreatedAt,
		pref.UpdatedAt,
	).Scan(
		&pref.ID,
		&pref.UserID,
		&pref.Language,
		&pref.Currency,
		&pref.EmailNotifications,
		&pref.SMSNotifications,
		&pref.PushNotifications,
		&pref.CreatedAt,
		&pref.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return pref, nil
}

func (r *PostgresPreferenceRepository) GetSettings(ctx context.Context, userID string) (*model.UserSetting, error) {
	query := `
		SELECT id, user_id, theme, two_factor_enabled, marketing_opt_in, created_at, updated_at
		FROM user_settings
		WHERE user_id = $1
	`
	var s model.UserSetting
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&s.ID,
		&s.UserID,
		&s.Theme,
		&s.TwoFactorEnabled,
		&s.MarketingOptIn,
		&s.CreatedAt,
		&s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *PostgresPreferenceRepository) GetOrCreateSettings(ctx context.Context, userID string) (*model.UserSetting, error) {
	s, err := r.GetSettings(ctx, userID)
	if err == nil {
		return s, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		newSetting := &model.UserSetting{
			ID:               uuid.NewString(),
			UserID:           userID,
			Theme:            "system",
			TwoFactorEnabled: false,
			MarketingOptIn:   false,
			CreatedAt:        time.Now().UTC(),
			UpdatedAt:        time.Now().UTC(),
		}
		query := `
			INSERT INTO user_settings (id, user_id, theme, two_factor_enabled, marketing_opt_in, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (user_id) DO UPDATE SET updated_at = EXCLUDED.updated_at
			RETURNING id, user_id, theme, two_factor_enabled, marketing_opt_in, created_at, updated_at
		`
		err = r.pool.QueryRow(ctx, query,
			newSetting.ID,
			newSetting.UserID,
			newSetting.Theme,
			newSetting.TwoFactorEnabled,
			newSetting.MarketingOptIn,
			newSetting.CreatedAt,
			newSetting.UpdatedAt,
		).Scan(
			&newSetting.ID,
			&newSetting.UserID,
			&newSetting.Theme,
			&newSetting.TwoFactorEnabled,
			&newSetting.MarketingOptIn,
			&newSetting.CreatedAt,
			&newSetting.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		return newSetting, nil
	}
	return nil, err
}

func (r *PostgresPreferenceRepository) UpdateSettings(ctx context.Context, s *model.UserSetting) (*model.UserSetting, error) {
	s.UpdatedAt = time.Now().UTC()
	query := `
		INSERT INTO user_settings (id, user_id, theme, two_factor_enabled, marketing_opt_in, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id) DO UPDATE 
		SET theme = EXCLUDED.theme,
		    two_factor_enabled = EXCLUDED.two_factor_enabled,
		    marketing_opt_in = EXCLUDED.marketing_opt_in,
		    updated_at = EXCLUDED.updated_at
		RETURNING id, user_id, theme, two_factor_enabled, marketing_opt_in, created_at, updated_at
	`
	if s.ID == "" {
		s.ID = uuid.NewString()
	}
	if s.CreatedAt.IsZero() {
		s.CreatedAt = s.UpdatedAt
	}

	err := r.pool.QueryRow(ctx, query,
		s.ID,
		s.UserID,
		s.Theme,
		s.TwoFactorEnabled,
		s.MarketingOptIn,
		s.CreatedAt,
		s.UpdatedAt,
	).Scan(
		&s.ID,
		&s.UserID,
		&s.Theme,
		&s.TwoFactorEnabled,
		&s.MarketingOptIn,
		&s.CreatedAt,
		&s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return s, nil
}
