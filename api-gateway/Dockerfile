# Build Stage
FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --no-cache git
ENV GOTOOLCHAIN=auto

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 go build -ldflags="-w -s" -o /app/api-gateway cmd/server/main.go

# Production Stage
FROM alpine:3.20

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/api-gateway /app/api-gateway
COPY --from=builder /app/configs /app/configs

EXPOSE 8000

ENV PORT=8000 \
    CONFIG_PATH=configs/config.yaml

ENTRYPOINT ["/app/api-gateway"]
