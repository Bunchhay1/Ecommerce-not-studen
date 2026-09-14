# Core Service 01 — Identity / Auth Service

A production-ready, asynchronous Identity and Authentication microservice built with **Python 3.12+**, **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.0 (Async)**, **Alembic**, **JWT**, **Argon2/Bcrypt**, **Docker**, and **Pytest**.

---

## 🏗 System Architecture

```
                   Flutter / Web / Mobile App
                              │
                              ▼
                        API Gateway
                              │
                              ▼
               ┌─────────────────────────────┐
               │        AUTH SERVICE         │
               │   FastAPI (Python 3.12+)    │
               └──────────────┬──────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
      PostgreSQL            Redis            Message Bus
     (auth_db)          (Sessions/Cache)       (Kafka)
```

---

## ✨ Features

- **User Authentication**: Secure registration and login with Argon2 / Bcrypt password hashing.
- **JWT Dual-Token Security**: Short-lived Access Tokens (`15 min`) and long-lived Refresh Tokens (`30 days`).
- **Refresh Token Rotation & Compromise Detection**: Automatic rotation on every refresh; replay attacks trigger immediate session revocation across all devices.
- **Role-Based Access Control (RBAC)**: Support for `CUSTOMER`, `SELLER`, and `ADMIN` roles and extensible fine-grained permissions.
- **Password Management & Recovery**: Cryptographic password reset tokens and email verification endpoints.
- **Asynchronous Architecture**: Full async execution pipeline using `FastAPI`, `SQLAlchemy 2.0 Async`, and `asyncpg`.
- **Database Migrations**: Managed schema evolution via `Alembic`.
- **Kubernetes & Cloud Ready**: Multi-stage `Dockerfile`, `docker-compose.yml`, `/health`, `/health/ready`, and `/health/live` probes.
- **Automated Testing**: Comprehensive async test suite powered by `pytest` and `httpx`.

---

## 📁 Project Structure

```
auth-service/
├── app/
│   ├── main.py                     # FastAPI application entrypoint & lifecycle
│   │
│   ├── api/
│   │   ├── deps.py                 # Security dependencies (get_current_user, require_roles)
│   │   └── v1/
│   │       ├── auth.py             # Auth endpoints (/register, /login, /refresh, /me, /logout)
│   │       └── users.py            # User management endpoints
│   │
│   ├── core/
│   │   ├── config.py               # Settings & Environment variables
│   │   ├── database.py             # Async SQLAlchemy engine & session maker
│   │   └── security.py             # Argon2/Bcrypt hashing & JWT generation
│   │
│   ├── models/
│   │   ├── base.py                 # UUID and Timestamp mixins
│   │   ├── user.py                 # User model
│   │   ├── role.py                 # Role, Permission, and association tables
│   │   └── token.py                # Refresh, Reset, and Verification tokens
│   │
│   ├── schemas/
│   │   ├── auth.py                 # Pydantic v2 schemas for authentication
│   │   └── user.py                 # User & role schemas
│   │
│   ├── services/
│   │   ├── auth_service.py         # Registration, login, password reset logic
│   │   └── token_service.py        # Token issuance, rotation, and revocation
│   │
│   └── repositories/
│       └── user_repository.py      # Async database queries
│
├── migrations/                     # Alembic async migration scripts
│   └── versions/
│       └── 0001_initial_auth_tables.py
│
├── tests/                          # Automated Pytest suite
│   ├── conftest.py
│   ├── test_auth.py
│   └── test_users.py
│
├── Dockerfile                      # Production multi-stage Docker container
├── docker-compose.yml              # PostgreSQL + FastAPI microservice stack
├── requirements.txt                # Python dependencies
├── alembic.ini                     # Alembic configuration
├── .env.example                    # Sample environment variables
└── README.md
```

---

## 🚀 Quick Start (Docker Compose)

The quickest way to start the Auth Service and its dedicated PostgreSQL database:

```bash
cd auth-service
docker-compose up --build
```

The service will start on `http://localhost:8000`.

- **Interactive API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🛠 Local Development Setup

### 1. Prerequisites
- Python 3.12+ (or `uv` / `pyenv`)
- PostgreSQL 15+ running locally (or via Docker)

### 2. Install Dependencies

Using `uv` (recommended) or standard `pip`:

```bash
cd auth-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment Configuration

```bash
cp .env.example .env
# Adjust POSTGRES_SERVER, POSTGRES_PASSWORD, SECRET_KEY if needed
```

### 4. Run Migrations

```bash
alembic upgrade head
```

### 5. Run the Server

```bash
uvicorn app.main:app --reload --port 8000
```

---

## 🧪 Running Automated Tests

Run the full async test suite using `pytest`:

```bash
pytest -v
```

---

## 📡 API Reference

### Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new user | No |
| `POST` | `/api/v1/auth/login` | Authenticate & obtain JWT tokens | No |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh token for new access token | No |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token and logout | Yes |
| `GET` | `/api/v1/auth/me` | Retrieve profile of authenticated user | Yes |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset token | No |
| `POST` | `/api/v1/auth/reset-password` | Reset password using valid token | No |
| `POST` | `/api/v1/auth/verify-email` | Verify email address | No |

### User Management Endpoints (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/` | List all users | Yes (`ADMIN` role) |
| `GET` | `/api/v1/users/{user_id}` | Get user by ID | Yes (Self / `ADMIN`) |
| `PATCH` | `/api/v1/users/{user_id}` | Update profile | Yes (Self / `ADMIN`) |
| `PUT` | `/api/v1/users/{user_id}/roles` | Assign role to user | Yes (`ADMIN` role) |

### Health Check Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Basic application health status |
| `GET` | `/health/live` | Kubernetes Liveness Probe |
| `GET` | `/health/ready` | Kubernetes Readiness Probe (tests DB connectivity) |
