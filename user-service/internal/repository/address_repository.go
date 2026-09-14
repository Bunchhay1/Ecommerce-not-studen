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
	ErrAddressNotFound = errors.New("address not found")
)

type AddressRepository interface {
	ListByUserID(ctx context.Context, userID string) ([]model.Address, error)
	GetByID(ctx context.Context, userID, addressID string) (*model.Address, error)
	Create(ctx context.Context, address *model.Address) (*model.Address, error)
	Update(ctx context.Context, address *model.Address) (*model.Address, error)
	Delete(ctx context.Context, userID, addressID string) error
	SetDefault(ctx context.Context, userID, addressID string) (*model.Address, error)
}

type PostgresAddressRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresAddressRepository(pool *pgxpool.Pool) *PostgresAddressRepository {
	return &PostgresAddressRepository{pool: pool}
}

func (r *PostgresAddressRepository) ListByUserID(ctx context.Context, userID string) ([]model.Address, error) {
	query := `
		SELECT id, user_id, label, recipient_name, phone, address_line1, address_line2, 
		       city, province, country, postal_code, is_default, created_at, updated_at
		FROM addresses
		WHERE user_id = $1
		ORDER BY is_default DESC, created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var addresses []model.Address
	for rows.Next() {
		var a model.Address
		var a2 *string
		if err := rows.Scan(
			&a.ID,
			&a.UserID,
			&a.Label,
			&a.RecipientName,
			&a.Phone,
			&a.AddressLine1,
			&a2,
			&a.City,
			&a.Province,
			&a.Country,
			&a.PostalCode,
			&a.IsDefault,
			&a.CreatedAt,
			&a.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if a2 != nil {
			a.AddressLine2 = *a2
		}
		addresses = append(addresses, a)
	}

	if addresses == nil {
		addresses = []model.Address{}
	}
	return addresses, nil
}

func (r *PostgresAddressRepository) GetByID(ctx context.Context, userID, addressID string) (*model.Address, error) {
	query := `
		SELECT id, user_id, label, recipient_name, phone, address_line1, address_line2, 
		       city, province, country, postal_code, is_default, created_at, updated_at
		FROM addresses
		WHERE id = $1 AND user_id = $2
	`
	var a model.Address
	var a2 *string
	err := r.pool.QueryRow(ctx, query, addressID, userID).Scan(
		&a.ID,
		&a.UserID,
		&a.Label,
		&a.RecipientName,
		&a.Phone,
		&a.AddressLine1,
		&a2,
		&a.City,
		&a.Province,
		&a.Country,
		&a.PostalCode,
		&a.IsDefault,
		&a.CreatedAt,
		&a.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAddressNotFound
		}
		return nil, err
	}
	if a2 != nil {
		a.AddressLine2 = *a2
	}
	return &a, nil
}

func (r *PostgresAddressRepository) Create(ctx context.Context, address *model.Address) (*model.Address, error) {
	if address.ID == "" {
		address.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	address.CreatedAt = now
	address.UpdatedAt = now

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// If this is default address or the user's very first address, unset previous defaults
	if address.IsDefault {
		_, err = tx.Exec(ctx, "UPDATE addresses SET is_default = FALSE, updated_at = $1 WHERE user_id = $2", now, address.UserID)
		if err != nil {
			return nil, err
		}
	} else {
		// Check if user has any existing addresses. If none, make this first one default automatically.
		var count int
		err = tx.QueryRow(ctx, "SELECT COUNT(*) FROM addresses WHERE user_id = $1", address.UserID).Scan(&count)
		if err == nil && count == 0 {
			address.IsDefault = true
		}
	}

	query := `
		INSERT INTO addresses (id, user_id, label, recipient_name, phone, address_line1, address_line2, 
		                      city, province, country, postal_code, is_default, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id, user_id, label, recipient_name, phone, address_line1, address_line2, 
		          city, province, country, postal_code, is_default, created_at, updated_at
	`
	var a2 *string
	err = tx.QueryRow(ctx, query,
		address.ID,
		address.UserID,
		address.Label,
		address.RecipientName,
		address.Phone,
		address.AddressLine1,
		address.AddressLine2,
		address.City,
		address.Province,
		address.Country,
		address.PostalCode,
		address.IsDefault,
		address.CreatedAt,
		address.UpdatedAt,
	).Scan(
		&address.ID,
		&address.UserID,
		&address.Label,
		&address.RecipientName,
		&address.Phone,
		&address.AddressLine1,
		&a2,
		&address.City,
		&address.Province,
		&address.Country,
		&address.PostalCode,
		&address.IsDefault,
		&address.CreatedAt,
		&address.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if a2 != nil {
		address.AddressLine2 = *a2
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return address, nil
}

func (r *PostgresAddressRepository) Update(ctx context.Context, address *model.Address) (*model.Address, error) {
	now := time.Now().UTC()
	address.UpdatedAt = now

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	if address.IsDefault {
		_, err = tx.Exec(ctx, "UPDATE addresses SET is_default = FALSE, updated_at = $1 WHERE user_id = $2 AND id != $3", now, address.UserID, address.ID)
		if err != nil {
			return nil, err
		}
	}

	query := `
		UPDATE addresses
		SET label = $1, recipient_name = $2, phone = $3, address_line1 = $4, address_line2 = $5,
		    city = $6, province = $7, country = $8, postal_code = $9, is_default = $10, updated_at = $11
		WHERE id = $12 AND user_id = $13
		RETURNING id, user_id, label, recipient_name, phone, address_line1, address_line2, 
		          city, province, country, postal_code, is_default, created_at, updated_at
	`
	var a2 *string
	err = tx.QueryRow(ctx, query,
		address.Label,
		address.RecipientName,
		address.Phone,
		address.AddressLine1,
		address.AddressLine2,
		address.City,
		address.Province,
		address.Country,
		address.PostalCode,
		address.IsDefault,
		address.UpdatedAt,
		address.ID,
		address.UserID,
	).Scan(
		&address.ID,
		&address.UserID,
		&address.Label,
		&address.RecipientName,
		&address.Phone,
		&address.AddressLine1,
		&a2,
		&address.City,
		&address.Province,
		&address.Country,
		&address.PostalCode,
		&address.IsDefault,
		&address.CreatedAt,
		&address.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAddressNotFound
		}
		return nil, err
	}
	if a2 != nil {
		address.AddressLine2 = *a2
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return address, nil
}

func (r *PostgresAddressRepository) Delete(ctx context.Context, userID, addressID string) error {
	query := "DELETE FROM addresses WHERE id = $1 AND user_id = $2"
	res, err := r.pool.Exec(ctx, query, addressID, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrAddressNotFound
	}
	return nil
}

func (r *PostgresAddressRepository) SetDefault(ctx context.Context, userID, addressID string) (*model.Address, error) {
	now := time.Now().UTC()
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Unset all defaults for this user
	_, err = tx.Exec(ctx, "UPDATE addresses SET is_default = FALSE, updated_at = $1 WHERE user_id = $2", now, userID)
	if err != nil {
		return nil, err
	}

	// Set target address as default
	query := `
		UPDATE addresses
		SET is_default = TRUE, updated_at = $1
		WHERE id = $2 AND user_id = $3
		RETURNING id, user_id, label, recipient_name, phone, address_line1, address_line2, 
		          city, province, country, postal_code, is_default, created_at, updated_at
	`
	var a model.Address
	var a2 *string
	err = tx.QueryRow(ctx, query, now, addressID, userID).Scan(
		&a.ID,
		&a.UserID,
		&a.Label,
		&a.RecipientName,
		&a.Phone,
		&a.AddressLine1,
		&a2,
		&a.City,
		&a.Province,
		&a.Country,
		&a.PostalCode,
		&a.IsDefault,
		&a.CreatedAt,
		&a.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAddressNotFound
		}
		return nil, err
	}
	if a2 != nil {
		a.AddressLine2 = *a2
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &a, nil
}
