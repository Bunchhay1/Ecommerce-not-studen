package event

import (
	"context"
	"encoding/json"
	"log"
	"time"
)

type Producer interface {
	Publish(ctx context.Context, eventType string, userID string, payload interface{}) error
	Close() error
}

type LoggingProducer struct{}

func NewLoggingProducer() *LoggingProducer {
	return &LoggingProducer{}
}

func (p *LoggingProducer) Publish(ctx context.Context, eventType string, userID string, payload interface{}) error {
	evt := Event{
		EventType: eventType,
		UserID:    userID,
		Timestamp: time.Now().UTC(),
		Payload:   payload,
	}
	data, _ := json.Marshal(evt)
	log.Printf("[EVENT PUBLISHED] Topic=user.events Event=%s UserID=%s Payload=%s\n", eventType, userID, string(data))
	return nil
}

func (p *LoggingProducer) Close() error {
	return nil
}
