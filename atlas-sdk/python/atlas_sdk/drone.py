from dataclasses import dataclass, field
from typing import Optional, Dict, Any


@dataclass
class DroneStatus:
    position: Dict[str, float]
    battery: float
    altitude: float
    mode: str
    speed: float


class Drone:
    """Represents a drone entity in the Atlas system."""

    def __init__(self, client, drone_id: str, name: Optional[str] = None):
        self.client = client
        self.id = drone_id
        self.name = name or f"Drone-{drone_id}"

    async def takeoff(self, altitude: float = 10) -> None:
        """Take off to a given altitude."""
        await self.client.emit_remote("DRONE_TAKEOFF", {
            "targetAltitude": altitude,
            "droneId": self.id,
        })

    async def fly_to(self, latitude: float, longitude: float,
                     altitude: Optional[float] = None) -> None:
        """Fly to a GPS coordinate."""
        await self.client.emit_remote("DRONE_FLY_TO", {
            "latitude": latitude,
            "longitude": longitude,
            "altitude": altitude or 0,
            "droneId": self.id,
        })

    async def capture_image(self) -> None:
        """Capture an aerial image."""
        await self.client.emit_remote("IMAGE_CAPTURED", {
            "camera": "downward",
            "droneId": self.id,
        })

    async def return_home(self) -> None:
        """Return to home position and land."""
        await self.client.emit_remote("DRONE_RETURN", {
            "droneId": self.id,
        })

    async def land(self) -> None:
        """Land at current position."""
        await self.client.emit_remote("DRONE_LAND", {
            "droneId": self.id,
        })
