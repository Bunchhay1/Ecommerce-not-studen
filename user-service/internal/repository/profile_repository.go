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

var (
	ErrProfileNotFound = errors.New("profile not found")
)

type ProfileRepository interface {
	GetByUserID(ctx context.Context, userID string) (*model.Profile, error)
	Create(ctx context.Context, profile *model.Profile) (*model.Profile, error)
	Update(ctx context.Context, profile *model.Profile) (*model.Profile, error)
	GetOrCreate(ctx context.Context, userID string) (*model.Profile, error)
}

type PostgresProfileRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresProfileRepository(pool *pgxpool.Pool) *PostgresProfileRepository {
	return &PostgresProfileRepository{pool: pool}
}

func (r *PostgresProfileRepository) GetByUserID(ctx context.Context, userID string) (*model.Profile, error) {
	query := `
		SELECT id, user_id, first_name, last_name, phone, avatar_url, created_at, updated_at
		FROM profiles
		WHERE user_id = $1
	`
	var p model.Profile
	var fn, ln, ph, av *string
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&p.ID,
		&p.UserID,
		&fn,
		&ln,
		&ph,
		&av,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProfileNotFound
		}
		return nil, err
	}
	if fn != nil {
		p.FirstName = *fn
	}
	if ln != nil {
		p.LastName = *ln
	}
	if ph != nil {
		p.Phone = *ph
	}
	if av != nil {
		p.AvatarURL = *av
	}
	return &p, nil
}

func (r *PostgresProfileRepository) Create(ctx context.Context, profile *model.Profile) (*model.Profile, error) {
	if profile.ID == "" {
		profile.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	profile.CreatedAt = now
	profile.UpdatedAt = now

	query := `
		INSERT INTO profiles (id, user_id, first_name, last_name, phone, avatar_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, user_id, first_name, last_name, phone, avatar_url, created_at, updated_at
	`
	var fn, ln, ph, av *string
	err := r.pool.QueryRow(ctx, query,
		profile.ID,
		profile.UserID,
		profile.FirstName,
		profile.LastName,
		profile.Phone,
		profile.AvatarURL,
		profile.CreatedAt,
		profile.UpdatedAt,
	).Scan(
		&profile.ID,
		&profile.UserID,
		&fn,
		&ln,
		&ph,
		&av,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if fn != nil {
		profile.FirstName = *fn
	}
	if ln != nil {
		profile.LastName = *ln
	}
	if ph != nil {
		profile.Phone = *ph
	}
	if av != nil {
		profile.AvatarURL = *av
	}
	return profile, nil
}

func (r *PostgresProfileRepository) Update(ctx context.Context, profile *model.Profile) (*model.Profile, error) {
	profile.UpdatedAt = time.Now().UTC()
	query := `
		UPDATE profiles
		SET first_name = $1, last_name = $2, phone = $3, avatar_url = $4, updated_at = $5
		WHERE user_id = $6
		RETURNING id, user_id, first_name, last_name, phone, avatar_url, created_at, updated_at
	`
	var fn, ln, ph, av *string
	err := r.pool.QueryRow(ctx, query,
		profile.FirstName,
		profile.LastName,
		profile.Phone,
		profile.AvatarURL,
		profile.UpdatedAt,
		profile.UserID,
	).Scan(
		&profile.ID,
		&profile.UserID,
		&fn,
		&ln,
		&ph,
		&av,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProfileNotFound
		}
		return nil, err
	}
	if fn != nil {
		profile.FirstName = *fn
	}
	if ln != nil {
		profile.LastName = *ln
	}
	if ph != nil {
		profile.Phone = *ph
	}
	if av != nil {
		profile.AvatarURL = *av
	}
	return profile, nil
}

func (r *PostgresProfileRepository) GetOrCreate(ctx context.Context, userID string) (*model.Profile, error) {
	p, err := r.GetByUserID(ctx, userID)
	if err == nil {
		return p, nil
	}
	if errors.Is(err, ErrProfileNotFound) {
		newProfile := &model.Profile{
			UserID: userID,
		}
		return r.Create(ctx, newProfile)
	}
	return nil, err
}
