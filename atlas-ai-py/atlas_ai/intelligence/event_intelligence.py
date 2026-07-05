from atlas_ai.types import Event, EventPriority


class EventIntelligence:
    def process(self, event: Event) -> Event:
        category = self.classify(event)
        importance = self.score(event)
        priority = self.map_to_priority(importance)

        md = dict(event.metadata) if event.metadata else {}
        md["category"] = category
        md["importance"] = importance

        return Event(
            type=event.type,
            timestamp=event.timestamp,
            source=event.source,
            payload=event.payload,
            priority=priority,
            metadata=md,
        )

    def classify(self, event: Event) -> str:
        if event.type.startswith("RUNTIME_") or event.type == "TICK":
            return "system"
        if "TASK_" in event.type:
            return "operation"
        if any(kw in event.type for kw in ("SENSOR_", "IMAGE_", "GPS_", "OBJECT_")):
            return "perception"
        return "general"

    def score(self, event: Event) -> float:
        scores = {
            "TICK": 0.1,
            "RUNTIME_HEALTH": 0.5,
            "TASK_REQUEST": 0.8,
            "TASK_FAILURE": 1.0,
        }
        return scores.get(event.type, 0.3)

    def map_to_priority(self, importance: float) -> EventPriority:
        if importance >= 0.9:
            return EventPriority.CRITICAL
        if importance >= 0.7:
            return EventPriority.HIGH
        if importance >= 0.4:
            return EventPriority.MEDIUM
        return EventPriority.LOW
