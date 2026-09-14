import asyncio
import json
import logging
from datetime import datetime, timezone
from sqlalchemy import select, update
from app.db.database import AsyncSessionLocal
from app.models.outbox_event import OutboxEvent
from app.kafka.producer import kafka_producer
from app.core.config import settings

logger = logging.getLogger(__name__)

class OutboxPublisher:
    def __init__(self):
        self.is_running = False
        self.task: asyncio.Task = None

    def start(self):
        self.is_running = True
        self.task = asyncio.create_task(self._run_loop())
        logger.info("Outbox publisher background loop started")

    async def stop(self):
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

    async def _run_loop(self):
        while self.is_running:
            try:
                await self.process_pending_events()
            except Exception as e:
                logger.debug(f"Outbox publisher loop exception: {e}")
            await asyncio.sleep(settings.OUTBOX_POLL_INTERVAL_SECONDS)

    async def process_pending_events(self):
        async with AsyncSessionLocal() as session:
            stmt = (
                select(OutboxEvent)
                .where(OutboxEvent.status == "PENDING")
                .order_by(OutboxEvent.created_at.asc())
                .limit(50)
            )
            result = await session.execute(stmt)
            events = result.scalars().all()

            for event in events:
                try:
                    payload_dict = json.loads(event.payload) if isinstance(event.payload, str) else event.payload
                    await kafka_producer.publish(
                        topic=settings.KAFKA_PROMOTION_TOPIC,
                        key=event.aggregate_id,
                        payload=payload_dict,
                    )
                    event.status = "PUBLISHED"
                    event.published_at = datetime.now(timezone.utc)
                except Exception as ex:
                    logger.error(f"Failed to publish outbox event {event.id}: {ex}")
                    event.retry_count += 1
                    event.error_message = str(ex)
                    if event.retry_count >= 5:
                        event.status = "FAILED"
            await session.commit()

outbox_publisher = OutboxPublisher()
