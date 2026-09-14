# Build Stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum* ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/user-service ./cmd/server

# Final Production Stage
FROM alpine:3.20

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/user-service /app/user-service
COPY --from=builder /app/migrations /app/migrations
COPY --from=builder /app/.env.example /app/.env

EXPOSE 8001

USER nobody:nobody

CMD ["/app/user-service"]
