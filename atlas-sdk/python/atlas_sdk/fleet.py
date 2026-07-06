from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List


@dataclass
class FleetMember:
    id: str
    type: str
    status: Dict[str, Any]
    last_seen: float


@dataclass
class FleetStatus:
    members: List[FleetMember]
    healthy: int
    total: int
    mission_active: bool


@dataclass
class MissionGoal:
    description: str
    priority: int = 1


@dataclass
class MissionDefinition:
    name: str
    goals: List[MissionGoal]
    description: Optional[str] = None


class Fleet:
    """Represents a fleet of robots/drones in the Atlas system."""

    def __init__(self, client):
        self.client = client
        self.members: Dict[str, FleetMember] = {}

    def register(self, member_id: str, member_type: str) -> None:
        """Register a member in the fleet."""
        self.members[member_id] = FleetMember(
            id=member_id,
            type=member_type,
            status={"mode": "idle", "battery": 100},
            last_seen=0,
        )
        self.client.emit_event("entity:registered", "fleet", {
            "member_id": member_id,
            "type": member_type,
        })

    def unregister(self, member_id: str) -> None:
        """Remove a member from the fleet."""
        self.members.pop(member_id, None)

    async def deploy(self, mission: MissionDefinition) -> None:
        """Deploy a fleet mission."""
        await self.client.emit_remote("MISSION_RECEIVED", {
            "missionName": mission.name,
            "goalCount": len(mission.goals),
            "memberCount": len(self.members),
        })

    async def broadcast(self, signal: str, data: Optional[Dict] = None) -> None:
        """Broadcast a signal to all fleet members."""
        await self.client.emit_remote("TASK_REQUEST", {
            "name": signal,
            "data": data or {},
            "broadcast": True,
        })

    def monitor(self) -> FleetStatus:
        """Get the current fleet status."""
        healthy = sum(
            1 for m in self.members.values()
            if m.status.get("mode") != "error"
        )
        return FleetStatus(
            members=list(self.members.values()),
            healthy=healthy,
            total=len(self.members),
            mission_active=True,
        )
