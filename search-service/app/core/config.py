from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Service Configuration
    APP_NAME: str = "search-service"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8084
    HOST: str = "0.0.0.0"

    # OpenSearch
    OPENSEARCH_HOST: str = "localhost"
    OPENSEARCH_PORT: int = 9200
    OPENSEARCH_USER: str = "admin"
    OPENSEARCH_PASSWORD: str = "admin"
    OPENSEARCH_USE_SSL: bool = False
    OPENSEARCH_VERIFY_CERTS: bool = False
    OPENSEARCH_INDEX_NAME: str = "products_v1"
    OPENSEARCH_INDEX_ALIAS: str = "products"

    # Redis Cache
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6382
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    CACHE_TTL_SEARCH_SECONDS: int = 300
    CACHE_TTL_AUTOCOMPLETE_SECONDS: int = 600

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9095"
    KAFKA_GROUP_ID: str = "search-service-group"
    KAFKA_PRODUCT_EVENTS_TOPIC: str = "catalog.product.events"
    KAFKA_CATEGORY_EVENTS_TOPIC: str = "catalog.category.events"
    KAFKA_BRAND_EVENTS_TOPIC: str = "catalog.brand.events"
    KAFKA_CATALOG_EVENTS_TOPIC: str = "catalog-events"

    # PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5435/search_db"
    DB_ECHO: bool = False

    # Security & JWT
    JWT_SECRET_KEY: str = "development-secret-key-change-in-production-never-commit-real-secrets"
    JWT_ALGORITHM: str = "HS256"

    # Catalog Service Integration
    CATALOG_SERVICE_URL: str = "http://localhost:8083"


settings = Settings()
