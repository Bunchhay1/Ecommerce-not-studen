import json
import asyncio
import logging
from typing import Optional
from aiokafka import AIOKafkaConsumer
from app.core.config import settings
from app.db.database import AsyncSessionLocal
from app.kafka.handlers import EventHandler

logger = logging.getLogger("recommendation_service.kafka_consumer")


class KafkaConsumerService:
    def __init__(self):
        self.consumer: Optional[AIOKafkaConsumer] = None
        self._task: Optional[asyncio.Task] = None
        self._running: bool = False

    async def start(self) -> None:
        self._running = True
        self._task = asyncio.create_task(self._consume_loop())

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        if self.consumer:
            await self.consumer.stop()

    async def _consume_loop(self) -> None:
        topics = [
            settings.KAFKA_TOPIC_CATALOG,
            settings.KAFKA_TOPIC_ORDERS,
            settings.KAFKA_TOPIC_REVIEWS,
            settings.KAFKA_TOPIC_INTERACTIONS,
        ]
        try:
            self.consumer = AIOKafkaConsumer(
                *topics,
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                group_id=settings.KAFKA_GROUP_ID,
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                auto_offset_reset="earliest",
                enable_auto_commit=True,
            )
            await self.consumer.start()
            logger.info(f"Kafka consumer started and subscribed to: {topics}")

            while self._running:
                try:
                    msg = await asyncio.wait_for(self.consumer.getone(), timeout=2.0)
                    topic = msg.topic
                    payload = msg.value

                    async with AsyncSessionLocal() as session:
                        handler = EventHandler(session)
                        if topic == settings.KAFKA_TOPIC_CATALOG:
                            event_type = payload.get("event_type", "ProductUpdated")
                            await handler.handle_catalog_event(event_type, payload.get("data", payload))
                        elif topic == settings.KAFKA_TOPIC_ORDERS:
                            await handler.handle_order_placed_event(payload.get("data", payload))
                        elif topic == settings.KAFKA_TOPIC_REVIEWS:
                            await handler.handle_review_created_event(payload.get("data", payload))
                        elif topic == settings.KAFKA_TOPIC_INTERACTIONS:
                            await handler.handle_interaction_event(payload.get("data", payload))
                        await session.commit()
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    logger.error(f"Error handling Kafka message: {e}", exc_info=True)
        except Exception as e:
            logger.warning(f"Kafka consumer could not connect to {settings.KAFKA_BOOTSTRAP_SERVERS} ({e}). Running in offline mode.")


consumer_service = KafkaConsumerService()
