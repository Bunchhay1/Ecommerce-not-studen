package model

import (
	"time"
)

type Address struct {
	ID            string    `json:"id" db:"id"`
	UserID        string    `json:"user_id" db:"user_id"`
	Label         string    `json:"label" db:"label"`
	RecipientName string    `json:"recipient_name" db:"recipient_name"`
	Phone         string    `json:"phone" db:"phone"`
	AddressLine1  string    `json:"address_line1" db:"address_line1"`
	AddressLine2  string    `json:"address_line2" db:"address_line2"`
	City          string    `json:"city" db:"city"`
	Province      string    `json:"province" db:"province"`
	Country       string    `json:"country" db:"country"`
	PostalCode    string    `json:"postal_code" db:"postal_code"`
	IsDefault     bool      `json:"is_default" db:"is_default"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}
