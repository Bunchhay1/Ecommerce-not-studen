from datetime import datetime, timezone
import uuid
from typing import Dict, Any, Optional

def create_event_payload(
    event_type: str,
    aggregate_id: str,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    return {
        "eventId": str(uuid.uuid4()),
        "eventType": event_type,
        "aggregateId": aggregate_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }
