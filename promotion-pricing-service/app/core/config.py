from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    PROJECT_NAME: str = "promotion-pricing-service"
    ENVIRONMENT: str = "development"
    PORT: int = 8090
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://pricing_user:pricing_password@localhost:5441/pricing_db"

    # Redis Cache
    REDIS_URL: str = "redis://localhost:6388/0"
    CACHE_TTL_PRICES: int = 300
    CACHE_TTL_PROMOTIONS: int = 180

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9101"
    KAFKA_PROMOTION_TOPIC: str = "promotion.events"
    KAFKA_CATALOG_TOPIC: str = "catalog.events"

    # Security
    JWT_SECRET: str = "supersecretjwtkeyforpromotionandpricingservice2026"
    JWT_ALGORITHM: str = "HS256"

    # Outbox
    OUTBOX_POLL_INTERVAL_SECONDS: int = 2

settings = Settings()
