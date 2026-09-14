import json
from typing import Any, Optional
from aiokafka import AIOKafkaProducer
from app.core.config import settings
from app.core.logging import logger

_kafka_producer: Optional[AIOKafkaProducer] = None


async def get_kafka_producer() -> AIOKafkaProducer:
    global _kafka_producer
    if _kafka_producer is None:
        _kafka_producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8")
        )
        try:
            await _kafka_producer.start()
            logger.info("Kafka producer started.")
        except Exception as e:
            logger.warning(f"Failed to start Kafka producer (will retry when needed): {str(e)}")
    return _kafka_producer


async def close_kafka_producer():
    global _kafka_producer
    if _kafka_producer is not None:
        try:
            await _kafka_producer.stop()
            logger.info("Kafka producer stopped.")
        except Exception as e:
            logger.warning(f"Error stopping Kafka producer: {str(e)}")
        _kafka_producer = None


async def send_to_dead_letter_topic(topic: str, message: Any, error: str):
    try:
        producer = await get_kafka_producer()
        dlt_topic = f"{topic}.dlt"
        payload = {
            "original_topic": topic,
            "original_message": message,
            "error": error
        }
        await producer.send_and_wait(dlt_topic, value=payload)
        logger.warning(f"Sent message to DLT topic '{dlt_topic}' due to error: {error}")
    except Exception as e:
        logger.error(f"Failed to send to DLT topic: {str(e)}")
