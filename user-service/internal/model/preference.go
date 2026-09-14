package model

import (
	"time"
)

type UserPreference struct {
	ID                 string    `json:"id" db:"id"`
	UserID             string    `json:"user_id" db:"user_id"`
	Language           string    `json:"language" db:"language"`
	Currency           string    `json:"currency" db:"currency"`
	EmailNotifications bool      `json:"email_notifications" db:"email_notifications"`
	SMSNotifications   bool      `json:"sms_notifications" db:"sms_notifications"`
	PushNotifications  bool      `json:"push_notifications" db:"push_notifications"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

type UserSetting struct {
	ID               string    `json:"id" db:"id"`
	UserID           string    `json:"user_id" db:"user_id"`
	Theme            string    `json:"theme" db:"theme"`
	TwoFactorEnabled bool      `json:"two_factor_enabled" db:"two_factor_enabled"`
	MarketingOptIn   bool      `json:"marketing_opt_in" db:"marketing_opt_in"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}
