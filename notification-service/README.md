# Notification Service — Core Service #12

## 1. Purpose & Domain Ownership

The **Notification Service** handles multi-channel communication (Email, SMS, Push, In-App) to customers and system users across the e-commerce marketplace.

### Architectural Boundary:
- **Other Core Services** (Order, Payment, Shipping, Promotion, Review) publish domain events to Kafka (`order.events`, `payment.events`, `shipping.events`, etc.).
- **Notification Service** consumes Kafka events, evaluates customer channel preferences, renders dynamic templates, and dispatches background delivery jobs through **Oban**.
- **Source of Truth**: PostgreSQL (`notification_db` on port `5443`). Redis (`6390`) is used for caching, rate limiting, and temporary state.

> **Zero Direct Cross-Database Queries**: Notification Service never queries `order_db` or `payment_db`. All order numbers, customer IDs, and tracking details arrive as trusted payloads inside Kafka events.

---

## 2. Technology Stack

- **Language**: Elixir 1.20+
- **Runtime**: Erlang/OTP 29
- **Framework**: Phoenix 1.7 (REST API Mode)
- **Database**: PostgreSQL (`notification_db` on port `5443`) via Ecto
- **Background Jobs**: Oban (queues: `default`, `email`, `push`, `sms`)
- **Cache**: Redis (`port 6390`) via Redix
- **Email Delivery**: Swoosh Mailer
- **Testing**: ExUnit
- **Container**: Docker & Docker Compose

---

## 3. Database Schema

- `notifications`: `id`, `user_id`, `type`, `title`, `body`, `data`, `status`, `priority`, `read_at`, `expires_at`
- `notification_deliveries`: `id`, `notification_id`, `channel` (`EMAIL`, `SMS`, `PUSH`, `IN_APP`), `provider`, `status`, `provider_message_id`, `attempt_count`, `last_error`, `sent_at`, `delivered_at`
- `notification_templates`: `id`, `code`, `channel`, `subject`, `body`, `language`, `version`, `status`
- `notification_preferences`: `id`, `user_id`, `notification_type`, `email_enabled`, `sms_enabled`, `push_enabled`, `in_app_enabled`
- `notification_devices`: `id`, `user_id`, `device_id`, `platform`, `push_token`, `status`, `last_seen_at`
- `processed_events`: `event_id`, `event_type`, `processed_at` (Deduplication / Idempotency)
- `notification_outbox`: `id`, `aggregate_type`, `aggregate_id`, `event_type`, `payload`, `status`

---

## 4. Asynchronous Oban Workers & Exponential Backoff

To prevent slow external providers from blocking HTTP requests or Kafka consumers:
1. `EmailWorker`: Processes email jobs via Swoosh/SES with max 5 retries.
2. `PushWorker`: Dispatches APNs / FCM push notifications.
3. `SmsWorker`: Sends SMS messages via Twilio/SNS.
4. If a provider fails temporarily, Oban retries with exponential backoff (1m, 5m, 15m, 30m, 1h).

---

## 5. Event Idempotency & Deduplication

Kafka messages can be redelivered. To prevent customers from receiving duplicate emails:
```elixir
case Repo.get(ProcessedEvent, event_id) do
  %ProcessedEvent{} -> {:ok, :already_processed} # Ignored
  nil -> # Process and record event
end
```

---

## 6. API Reference

### Customer APIs
- `GET /api/v1/notifications` (List notifications for current user)
- `GET /api/v1/notifications/:id` (Get notification details)
- `POST /api/v1/notifications/:id/read` (Mark single notification as read)
- `POST /api/v1/notifications/read-all` (Mark all notifications as read)
- `DELETE /api/v1/notifications/:id` (Soft-delete / cancel notification)
- `GET /api/v1/notification-preferences` (Get channel toggles per notification type)
- `PUT /api/v1/notification-preferences` (Update channel toggles)
- `POST /api/v1/devices` (Register push token: `{ deviceId, platform, pushToken }`)
- `DELETE /api/v1/devices/:device_id` (Deregister push token)

### Admin APIs
- `GET /api/v1/admin/templates` (List templates)
- `POST /api/v1/admin/templates` (Create template with `{{mustache}}` tokens)
- `GET /api/v1/admin/deliveries` (Monitor delivery attempts)

### Health
- `GET /health`
- `GET /health/live`
- `GET /health/ready`

---

## 7. Running Locally & Testing

```bash
cd notification-service

# Install dependencies
mix deps.get

# Run tests
mix test

# Start server
mix phx.server

# Or with Docker Compose
docker-compose up -d
```
