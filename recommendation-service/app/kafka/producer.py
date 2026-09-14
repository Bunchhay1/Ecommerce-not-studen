import json
import logging
from typing import Any, Dict, Optional
from aiokafka import AIOKafkaProducer
from app.core.config import settings

logger = logging.getLogger("recommendation_service.kafka_producer")


class KafkaProducerClient:
    def __init__(self):
        self.producer: Optional[AIOKafkaProducer] = None
        self._is_started: bool = False

    async def start(self) -> None:
        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
                request_timeout_ms=3000,
            )
            await self.producer.start()
            self._is_started = True
            logger.info(f"Kafka producer connected to {settings.KAFKA_BOOTSTRAP_SERVERS}.")
        except Exception as e:
            self._is_started = False
            logger.warning(f"Kafka producer failed to connect ({e}). Continuing with offline mode.")

    async def stop(self) -> None:
        if self._is_started and self.producer:
            await self.producer.stop()
            self._is_started = False

    async def send_event(self, topic: str, event: Dict[str, Any], key: Optional[str] = None) -> bool:
        if not self._is_started or not self.producer:
            return False
        try:
            encoded_key = key.encode("utf-8") if key else None
            await self.producer.send_and_wait(topic, value=event, key=encoded_key)
            return True
        except Exception as e:
            logger.warning(f"Failed to publish Kafka message to {topic}: {e}")
            return False


producer = KafkaProducerClient()
