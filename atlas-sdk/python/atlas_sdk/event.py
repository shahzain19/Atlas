from dataclasses import dataclass, field
from typing import Optional, Any, Dict
import time
import uuid


@dataclass
class Event:
    """Represents an event in the Atlas system."""

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    source: str = "sdk"
    payload: Any = None
    timestamp: float = field(default_factory=time.time)
    priority: str = "medium"

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to a dictionary."""
        return {
            "id": self.id,
            "type": self.type,
            "source": self.source,
            "payload": self.payload,
            "timestamp": self.timestamp,
            "priority": self.priority,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Event":
        """Create an event from a dictionary."""
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            type=data["type"],
            source=data.get("source", "sdk"),
            payload=data.get("payload"),
            timestamp=data.get("timestamp", time.time()),
            priority=data.get("priority", "medium"),
        )
