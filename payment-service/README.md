# Payment Service — Core Service #08

## 1. Overview
The **Payment Service** manages all payment transactions, provider gateway communications (Stripe, PayPal, Mock), refunds, webhooks, payment idempotency, and transactional outbox event publishing for the e-commerce platform.

## 2. Technology Stack
- **Language**: C# (.NET 10 / ASP.NET Core)
- **Database**: PostgreSQL (`payment_db`) via Entity Framework Core (Npgsql)
- **Cache**: Redis (`payment:{id}`, `payment:order:{orderId}`, `idempotency:{key}`)
- **Message Broker**: Apache Kafka (`payment.events`) via `Confluent.Kafka`
- **Pattern**: Transactional Outbox Pattern (`outbox_events` + background publisher)
- **Security**: JWT Bearer Authentication (`ROLE_CUSTOMER`, `ROLE_ADMIN`)
- **Testing**: xUnit + Moq + FluentAssertions
- **Documentation**: Swagger / OpenAPI 3

## 3. Main API Endpoints

### Customer Endpoints
- `POST /api/v1/payments`: Initiate / create a payment for an order (supports `Idempotency-Key` header)
- `GET /api/v1/payments/{id}`: Get payment by payment ID
- `GET /api/v1/payments/order/{orderId}`: Get payment by order ID
- `POST /api/v1/payments/{id}/cancel`: Cancel a pending payment
- `POST /api/v1/payments/{id}/refund`: Request a refund for a completed payment

### Webhooks
- `POST /api/v1/payments/webhooks/stripe`: Stripe webhook handler with HMAC SHA256 signature verification
- `POST /api/v1/payments/webhooks/paypal`: PayPal webhook handler

### Admin Endpoints
- `GET /api/v1/admin/payments`: List payments with pagination and status filters
- `GET /api/v1/admin/payments/{id}`: View payment details
- `GET /api/v1/admin/refunds`: List refund records
- `POST /api/v1/admin/payments/{id}/refund`: Execute admin refund

### Health Checks
- `GET /health`, `GET /health/live`, `GET /health/ready`, `GET /api/v1/health`

## 4. Running & Testing Locally
```bash
# Build solution
dotnet build PaymentService.sln

# Run test suite
dotnet test PaymentService.sln

# Run payment service
dotnet run --project src/PaymentService/PaymentService.csproj
```
