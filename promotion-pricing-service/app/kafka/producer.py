import json
import logging
from typing import Optional, Dict, Any
from aiokafka import AIOKafkaProducer
from app.core.config import settings

logger = logging.getLogger(__name__)

class KafkaProducerService:
    def __init__(self):
        self.producer: Optional[AIOKafkaProducer] = None

    async def start(self):
        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            )
            await self.producer.start()
            logger.info(f"Connected to Kafka at {settings.KAFKA_BOOTSTRAP_SERVERS}")
        except Exception as e:
            logger.warning(f"Kafka connection skipped/failed: {e}")
            self.producer = None

    async def stop(self):
        if self.producer:
            await self.producer.stop()

    async def publish(self, topic: str, key: str, payload: Dict[str, Any]):
        if not self.producer:
            logger.debug(f"[Mock Kafka] Publish to {topic} key={key}: {payload.get('eventType')}")
            return
        try:
            await self.producer.send_and_wait(
                topic=topic,
                key=key.encode("utf-8") if key else None,
                value=payload,
            )
        except Exception as e:
            logger.error(f"Failed to publish Kafka message: {e}")
            raise e

kafka_producer = KafkaProducerService()
