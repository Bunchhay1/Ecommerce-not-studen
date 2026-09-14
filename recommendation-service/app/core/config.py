import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    PROJECT_NAME: str = "Recommendation Service"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8093
    LOG_LEVEL: str = "INFO"

    # Security & Auth
    SECRET_KEY: str = "recommendation-secret-key-change-in-production-never-commit-real-secrets"
    ALGORITHM: str = "HS256"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # PostgreSQL Database
    DATABASE_URL: str = "postgresql+asyncpg://recommendation_user:recommendation_password@localhost:5444/recommendation_db"

    # Redis Cache
    REDIS_URL: str = "redis://localhost:6391/0"
    CACHE_TTL_RECOMMENDATIONS: int = 3600       # 1 hour
    CACHE_TTL_SIMILAR_PRODUCTS: int = 21600     # 6 hours
    CACHE_TTL_TRENDING: int = 1800              # 30 mins
    CACHE_TTL_RECENTLY_VIEWED: int = 86400      # 24 hours

    # Kafka Configuration
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_GROUP_ID: str = "recommendation-service-group"
    KAFKA_RECOMMENDATION_EVENTS_TOPIC: str = "recommendation.events"
    KAFKA_CATALOG_EVENTS_TOPIC: str = "catalog.product.events"
    KAFKA_ORDER_EVENTS_TOPIC: str = "order.events"
    KAFKA_REVIEW_EVENTS_TOPIC: str = "review.events"
    KAFKA_INTERACTION_EVENTS_TOPIC: str = "user.interaction.events"

    # ML & Algorithm Parameters
    DEFAULT_RECOMMENDATION_LIMIT: int = 10
    MAX_RECOMMENDATION_LIMIT: int = 50
    TRENDING_DECAY_RATE: float = 0.15           # Daily exponential decay lambda
    TRENDING_WINDOW_DAYS: int = 14              # Recent activity window
    MIN_INTERACTIONS_FOR_CF: int = 3            # Threshold for collaborative filtering

    @property
    def async_database_url(self) -> str:
        return self.DATABASE_URL

    @property
    def redis_url(self) -> str:
        return self.REDIS_URL

    @property
    def cors_origins_list(self) -> List[str]:
        return self.BACKEND_CORS_ORIGINS

    @property
    def KAFKA_TOPIC_CATALOG(self) -> str:
        return self.KAFKA_CATALOG_EVENTS_TOPIC

    @property
    def KAFKA_TOPIC_ORDERS(self) -> str:
        return self.KAFKA_ORDER_EVENTS_TOPIC

    @property
    def KAFKA_TOPIC_REVIEWS(self) -> str:
        return self.KAFKA_REVIEW_EVENTS_TOPIC

    @property
    def KAFKA_TOPIC_INTERACTIONS(self) -> str:
        return self.KAFKA_INTERACTION_EVENTS_TOPIC


settings = Settings()
