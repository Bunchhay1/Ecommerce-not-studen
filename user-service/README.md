# Core Service 02 — User Service

A high-performance, asynchronous Customer Profile and Address Management microservice built with **Go 1.24+**, **Gin Framework**, **PostgreSQL (pgx/v5)**, **Redis Cache**, **Kafka Event Scaffolding**, **JWT Validation Middleware**, **Docker**, and **Testify**.

---

## 🏗 Architecture Overview

```
                         Flutter / Web
                              │
                              ▼
                        API Gateway
                              │
                         JWT Token
                              │
                              ▼
                    ┌──────────────────┐
                    │   USER SERVICE   │
                    │      (Go/Gin)    │
                    └────────┬─────────┘
                             │
                 ┌───────────┼───────────┐
                 ▼           ▼           ▼
            PostgreSQL     Redis       Kafka
             user_db       Cache       Events
```

### Responsibility Separation

| Core Service #01: Auth Service | Core Service #02: User Service |
| :--- | :--- |
| Email & Password Hashing | Customer Profile (Name, Phone, Avatar) |
| Login & Token Generation | Addresses & Multi-address management |
| JWT Issuance & Token Rotation | Single Default Address Switching |
| Roles & Permissions | User Preferences (Language, Currency, Alerts) |
| Account Activation & Password Reset | User Settings (Theme, 2FA toggle) |

---

## 📁 Project Structure

```
user-service/
├── cmd/
│   └── server/
│       └── main.go                 # Application entrypoint, DB pool & graceful shutdown
│
├── internal/
│   ├── config/
│   │   └── config.go               # Environment configuration loader
│   ├── model/
│   │   ├── profile.go              # User profile entity
│   │   ├── address.go              # Address entity
│   │   └── preference.go           # Preferences & Settings entities
│   ├── dto/
│   │   ├── common.go               # Error & Message responses
│   │   ├── profile.go              # Profile request & response DTOs
│   │   ├── address.go              # Address request & response DTOs
│   │   └── preference.go           # Preferences request & response DTOs
│   ├── middleware/
│   │   ├── auth.go                 # JWT validation & Role-based access middleware
│   │   └── cors.go                 # CORS configuration
│   ├── cache/
│   │   └── redis.go                # Redis cache wrapper with Noop fallback
│   ├── event/
│   │   ├── event.go                # Domain event types
│   │   ├── producer.go             # Event publisher interface
│   │   └── consumer.go             # UserRegistered event consumer
│   ├── repository/
│   │   ├── profile_repository.go   # PostgreSQL queries for profiles (pgx/v5)
│   │   ├── address_repository.go   # Transactional address queries with default toggle
│   │   └── preference_repository.go# Preferences & settings queries
│   ├── service/
│   │   ├── profile_service.go      # Profile business logic & cache-aside
│   │   ├── address_service.go      # Address logic, cache invalidation, and events
│   │   └── preference_service.go   # Preferences logic
│   └── handler/
│       ├── profile_handler.go      # Profile HTTP routes
│       ├── address_handler.go      # Address HTTP routes
│       ├── preference_handler.go   # Preferences HTTP routes
│       └── health_handler.go       # /health, /health/live, /health/ready
│
├── migrations/
│   ├── 000001_init_user_tables.up.sql
│   └── 000001_init_user_tables.down.sql
│
├── tests/
│   ├── mock_repository.go          # In-memory mock repositories
│   ├── auth_middleware_test.go     # JWT security & RBAC tests
│   ├── profile_test.go             # Profile endpoints tests
│   └── address_test.go             # Address CRUD & default address switching tests
│
├── Dockerfile                      # Multi-stage lightweight Alpine container
├── docker-compose.yml              # PostgreSQL (user_db) + Redis + User Service
├── go.mod
├── .env.example
├── .env
└── README.md
```

---

## 🚀 Quick Start (Docker Compose)

Start the User Service, PostgreSQL (`user_db`), and Redis cache in isolated containers:

```bash
cd user-service
docker-compose up --build
```

The service will run on `http://localhost:8001`.

- Health Check: `http://localhost:8001/health`
- Readiness Probe: `http://localhost:8001/health/ready`
- Liveness Probe: `http://localhost:8001/health/live`

---

## 🛠 Local Development Setup

### 1. Prerequisites
- Go 1.24+ installed
- PostgreSQL 15+ (port 5433 or configured in `.env`)
- Redis 7+ (optional; service runs in graceful fallback if Redis is offline)

### 2. Download Dependencies
```bash
cd user-service
go mod tidy
```

### 3. Run the Service
```bash
go run ./cmd/server
```

---

## 🧪 Running Automated Tests

Run all unit and integration tests:

```bash
cd user-service
go test -v ./...
```

---

## 📡 API Reference

All profile and address endpoints require a valid JWT Access Token passed in the `Authorization: Bearer <token>` header.

### Profile Endpoints (`/api/v1/users`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/users/me` | Get current user's profile |
| `PUT` | `/api/v1/users/me` | Update current user's profile |
| `GET` | `/api/v1/users/:id` | Get user profile by ID (Admin / Internal) |

#### Example: `GET /api/v1/users/me`
**Response (200 OK)**:
```json
{
  "user_id": "8f1c8a14-35bb-4e33-b91c-99d8d6411f92",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+85512345678",
  "avatar_url": "https://example.com/avatar.jpg",
  "created_at": "2026-09-13T12:00:00Z",
  "updated_at": "2026-09-13T12:00:00Z"
}
```

---

### Address Endpoints (`/api/v1/users/me/addresses`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/users/me/addresses` | List all addresses for user |
| `POST` | `/api/v1/users/me/addresses` | Create a new address |
| `GET` | `/api/v1/users/me/addresses/:address_id` | Get specific address |
| `PUT` | `/api/v1/users/me/addresses/:address_id` | Update address details |
| `DELETE` | `/api/v1/users/me/addresses/:address_id` | Delete address |
| `PATCH` | `/api/v1/users/me/addresses/:address_id/default` | Set address as default |

#### Example: `POST /api/v1/users/me/addresses`
**Request**:
```json
{
  "label": "Home",
  "recipient_name": "John Doe",
  "phone": "+85512345678",
  "address_line1": "Street 123, House #45",
  "address_line2": "Apartment 4B",
  "city": "Phnom Penh",
  "province": "Phnom Penh",
  "country": "Cambodia",
  "postal_code": "12000",
  "is_default": true
}
```

---

### Preferences & Settings Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/users/me/preferences` | Get user preferences |
| `PUT` | `/api/v1/users/me/preferences` | Update language, currency, notification preferences |
| `GET` | `/api/v1/users/me/settings` | Get user settings |
| `PUT` | `/api/v1/users/me/settings` | Update theme, 2FA, marketing preferences |

---

### Health Checks

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Basic application health status |
| `GET` | `/health/live` | Kubernetes Liveness probe |
| `GET` | `/health/ready` | Kubernetes Readiness probe (checks DB & Redis) |
