package event

import (
	"time"
)

type Event struct {
	EventType string      `json:"event_type"`
	UserID    string      `json:"user_id"`
	Timestamp time.Time   `json:"timestamp"`
	Payload   interface{} `json:"payload,omitempty"`
}

const (
	TypeUserRegistered          = "UserRegistered"
	TypeUserProfileCreated      = "UserProfileCreated"
	TypeUserProfileUpdated      = "UserProfileUpdated"
	TypeUserAddressCreated      = "UserAddressCreated"
	TypeUserAddressUpdated      = "UserAddressUpdated"
	TypeUserAddressDeleted      = "UserAddressDeleted"
	TypeUserPreferencesUpdated  = "UserPreferencesUpdated"
)
