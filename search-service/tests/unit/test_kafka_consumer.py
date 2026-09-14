import pytest
from unittest.mock import AsyncMock, MagicMock
from app.kafka.consumer import _process_message
from app.services.index_service import IndexService


class FakeKafkaMessage:
    def __init__(self, topic: str, value: dict):
        self.topic = topic
        self.value = value


@pytest.mark.asyncio
async def test_process_product_created_event(sample_catalog_product):
    mock_index_service = AsyncMock(spec=IndexService)

    event_payload = {
        "event_id": "evt-1",
        "event_type": "ProductCreated",
        "entity_type": "Product",
        "entity_id": "prod-100",
        "payload": sample_catalog_product
    }
    msg = FakeKafkaMessage("catalog-events", event_payload)

    await _process_message(msg, mock_index_service)
    mock_index_service.sync_product.assert_called_once_with(sample_catalog_product)


@pytest.mark.asyncio
async def test_process_product_deleted_event():
    mock_index_service = AsyncMock(spec=IndexService)

    event_payload = {
        "event_id": "evt-2",
        "event_type": "ProductDeleted",
        "entity_type": "Product",
        "entity_id": "prod-100",
        "payload": None
    }
    msg = FakeKafkaMessage("catalog-events", event_payload)

    await _process_message(msg, mock_index_service)
    mock_index_service.delete_product.assert_called_once_with("prod-100")


@pytest.mark.asyncio
async def test_process_product_status_changed_event():
    mock_index_service = AsyncMock(spec=IndexService)

    event_payload = {
        "event_id": "evt-3",
        "event_type": "ProductStatusChanged",
        "entity_type": "Product",
        "entity_id": "prod-100",
        "payload": {"status": "ARCHIVED"}
    }
    msg = FakeKafkaMessage("catalog-events", event_payload)

    await _process_message(msg, mock_index_service)
    mock_index_service.update_product_status.assert_called_once_with("prod-100", "ARCHIVED")
