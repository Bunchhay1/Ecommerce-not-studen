from typing import Any, Dict, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CatalogDomainEvent(BaseModel):
    event_id: Optional[str] = None
    event_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    payload: Optional[Any] = None
    timestamp: Optional[datetime] = None
    data: Optional[Any] = None

    def get_data(self) -> Any:
        return self.payload if self.payload is not None else self.data
