import asyncio
import json
from typing import Optional
from aiokafka import AIOKafkaConsumer
from app.core.config import settings
from app.core.logging import logger
from app.kafka.events import CatalogDomainEvent
from app.kafka.producer import send_to_dead_letter_topic
from app.services.index_service import IndexService

_consumer_task: Optional[asyncio.Task] = None
_kafka_consumer: Optional[AIOKafkaConsumer] = None
_is_running = False


async def start_kafka_consumer(index_service: Optional[IndexService] = None):
    global _kafka_consumer, _consumer_task, _is_running
    svc = index_service or IndexService()

    topics = [
        settings.KAFKA_PRODUCT_EVENTS_TOPIC,
        settings.KAFKA_CATEGORY_EVENTS_TOPIC,
        settings.KAFKA_BRAND_EVENTS_TOPIC,
        settings.KAFKA_CATALOG_EVENTS_TOPIC
    ]

    _kafka_consumer = AIOKafkaConsumer(
        *topics,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id=settings.KAFKA_GROUP_ID,
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda m: json.loads(m.decode("utf-8"))
    )

    try:
        await _kafka_consumer.start()
        _is_running = True
        logger.info(f"Kafka consumer started listening on topics: {topics}")
        _consumer_task = asyncio.create_task(_consume_loop(svc))
    except Exception as e:
        logger.warning(f"Failed to start Kafka consumer (will retry in background): {str(e)}")


async def stop_kafka_consumer():
    global _kafka_consumer, _consumer_task, _is_running
    _is_running = False
    if _consumer_task:
        _consumer_task.cancel()
        try:
            await _consumer_task
        except asyncio.CancelledError:
            pass
        _consumer_task = None

    if _kafka_consumer:
        try:
            await _kafka_consumer.stop()
            logger.info("Kafka consumer stopped.")
        except Exception as e:
            logger.warning(f"Error stopping Kafka consumer: {str(e)}")
        _kafka_consumer = None


async def _consume_loop(index_service: IndexService):
    global _is_running
    while _is_running:
        try:
            async for msg in _kafka_consumer:
                if not _is_running:
                    break
                await _process_message(msg, index_service)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in Kafka consumer loop: {str(e)}")
            await asyncio.sleep(2)


async def _process_message(msg, index_service: IndexService):
    try:
        topic = msg.topic
        raw_val = msg.value
        event = CatalogDomainEvent(**raw_val) if isinstance(raw_val, dict) else None

        if not event:
            return

        event_type = event.event_type
        payload = event.get_data()

        logger.info(f"Received Kafka event: topic={topic}, event_type={event_type}, entity_id={event.entity_id}")

        if event_type in ("ProductCreated", "ProductUpdated"):
            if isinstance(payload, dict):
                await index_service.sync_product(payload)
            elif event.entity_id:
                # Fetch product details if payload is not complete
                logger.info(f"Syncing product {event.entity_id} on event {event_type}")

        elif event_type == "ProductDeleted":
            product_id = event.entity_id or (payload.get("id") if isinstance(payload, dict) else None)
            if product_id:
                await index_service.delete_product(product_id)

        elif event_type in ("ProductStatusChanged", "ProductActivated", "ProductArchived"):
            product_id = event.entity_id
            status = payload.get("status") if isinstance(payload, dict) else "INACTIVE"
            if product_id:
                await index_service.update_product_status(product_id, status)

    except Exception as e:
        logger.error(f"Failed to process Kafka message on topic '{msg.topic}': {str(e)}")
        await send_to_dead_letter_topic(msg.topic, msg.value, str(e))
