package dto

import "time"

type CreateAddressRequest struct {
	Label         string `json:"label" binding:"required,max=50"`
	RecipientName string `json:"recipient_name" binding:"required,max=100"`
	Phone         string `json:"phone" binding:"required,max=30"`
	AddressLine1  string `json:"address_line1" binding:"required,max=255"`
	AddressLine2  string `json:"address_line2" binding:"max=255"`
	City          string `json:"city" binding:"required,max=100"`
	Province      string `json:"province" binding:"required,max=100"`
	Country       string `json:"country" binding:"required,max=100"`
	PostalCode    string `json:"postal_code" binding:"required,max=20"`
	IsDefault     bool   `json:"is_default"`
}

type UpdateAddressRequest struct {
	Label         *string `json:"label,omitempty" binding:"omitempty,max=50"`
	RecipientName *string `json:"recipient_name,omitempty" binding:"omitempty,max=100"`
	Phone         *string `json:"phone,omitempty" binding:"omitempty,max=30"`
	AddressLine1  *string `json:"address_line1,omitempty" binding:"omitempty,max=255"`
	AddressLine2  *string `json:"address_line2,omitempty" binding:"omitempty,max=255"`
	City          *string `json:"city,omitempty" binding:"omitempty,max=100"`
	Province      *string `json:"province,omitempty" binding:"omitempty,max=100"`
	Country       *string `json:"country,omitempty" binding:"omitempty,max=100"`
	PostalCode    *string `json:"postal_code,omitempty" binding:"omitempty,max=20"`
	IsDefault     *bool   `json:"is_default,omitempty"`
}

type AddressResponse struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	Label         string    `json:"label"`
	RecipientName string    `json:"recipient_name"`
	Phone         string    `json:"phone"`
	AddressLine1  string    `json:"address_line1"`
	AddressLine2  string    `json:"address_line2"`
	City          string    `json:"city"`
	Province      string    `json:"province"`
	Country       string    `json:"country"`
	PostalCode    string    `json:"postal_code"`
	IsDefault     bool      `json:"is_default"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
