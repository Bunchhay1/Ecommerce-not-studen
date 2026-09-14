package event

import (
	"context"
	"encoding/json"
	"log"

	"github.com/ecommerce-microservice/user-service/internal/model"
)

type UserRegisteredPayload struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type ProfileProvisioner interface {
	CreateProfile(ctx context.Context, profile *model.Profile) (*model.Profile, error)
}

type EventConsumer struct {
	provisioner ProfileProvisioner
}

func NewEventConsumer(provisioner ProfileProvisioner) *EventConsumer {
	return &EventConsumer{provisioner: provisioner}
}

func (c *EventConsumer) HandleUserRegisteredEvent(ctx context.Context, data []byte) error {
	var evt Event
	if err := json.Unmarshal(data, &evt); err != nil {
		return err
	}

	payloadBytes, err := json.Marshal(evt.Payload)
	if err != nil {
		return err
	}

	var payload UserRegisteredPayload
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return err
	}

	log.Printf("[EVENT RECEIVED] Auto-provisioning profile for UserID=%s\n", payload.UserID)
	profile := &model.Profile{
		UserID:    payload.UserID,
		FirstName: payload.FirstName,
		LastName:  payload.LastName,
	}

	_, err = c.provisioner.CreateProfile(ctx, profile)
	return err
}
