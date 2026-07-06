from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List


@dataclass
class DetectedObject:
    label: str
    confidence: float
    position: Dict[str, float]


@dataclass
class RobotStatus:
    position: Dict[str, float]
    battery: float
    speed: float
    mode: str
    task_count: int


class Robot:
    """Represents a robot entity in the Atlas system."""

    def __init__(self, client, robot_id: str, name: Optional[str] = None):
        self.client = client
        self.id = robot_id
        self.name = name or f"Robot-{robot_id}"

    async def navigate_to(self, target: Dict[str, float]) -> None:
        """Navigate to a position or GPS coordinate."""
        if "latitude" in target:
            pos = {
                "x": target["latitude"],
                "y": target["longitude"],
                "z": target.get("altitude", 0),
            }
        else:
            pos = {
                "x": target.get("x", 0),
                "y": target.get("y", 0),
                "z": target.get("z", 0),
            }
        await self.client.emit_remote("ROBOT_NAVIGATE", {
            "target": pos,
            "robotId": self.id,
        })

    async def scan(self) -> None:
        """Scan the environment for objects."""
        await self.client.emit_remote("IMAGE_CAPTURED", {
            "camera": "front",
            "robotId": self.id,
        })

    async def explore(self) -> None:
        """Start autonomous exploration."""
        await self.client.emit_remote("TASK_REQUEST", {
            "name": "Autonomous Survey",
            "robotId": self.id,
        })
