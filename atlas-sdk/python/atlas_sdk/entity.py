from dataclasses import dataclass, field
from typing import Optional, Dict, Any
import time


@dataclass
class Entity:
    """Represents an entity in the Atlas system."""

    id: str
    name: str
    type: str = "default"
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        """Convert entity to a dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "metadata": self.metadata,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Entity":
        """Create an entity from a dictionary."""
        return cls(
            id=data["id"],
            name=data["name"],
            type=data.get("type", "default"),
            metadata=data.get("metadata", {}),
            created_at=data.get("created_at", time.time()),
        )
