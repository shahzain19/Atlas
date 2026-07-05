from typing import Optional, List, Callable, Any, Dict
import time
from .entity import Entity
from .event import Event
from .config import Config


class AtlasClient:
    """Main client for interacting with the Atlas platform."""

    def __init__(self, config: Optional[Config] = None):
        self.config: Config = config or Config()
        self.entities: Dict[str, Entity] = {}
        self.event_handlers: Dict[str, List[Callable[[Event], None]]] = {}

    def register_entity(self, entity: Entity) -> None:
        """Register a new entity with the system."""
        self.entities[entity.id] = entity
        self.emit_event("entity:registered", {"entity": entity.to_dict()})

    def unregister_entity(self, entity_id: str) -> None:
        """Unregister an entity from the system."""
        if entity_id in self.entities:
            del self.entities[entity_id]
            self.emit_event("entity:unregistered", {"entity_id": entity_id})

    def get_entity(self, entity_id: str) -> Optional[Entity]:
        """Get an entity by ID."""
        return self.entities.get(entity_id)

    def get_all_entities(self) -> List[Entity]:
        """Get all registered entities."""
        return list(self.entities.values())

    def emit_event(self, event_type: str, payload: Any = None, source: str = "sdk", priority: str = "medium") -> Event:
        """Emit an event to the system."""
        event = Event(
            type=event_type,
            source=source,
            payload=payload,
            timestamp=time.time(),
            priority=priority,
        )

        # Call handlers for this event type
        handlers = self.event_handlers.get(event_type, [])
        for handler in handlers:
            try:
                handler(event)
            except Exception as e:
                print(f"Error in event handler: {e}")

        # Also call wildcard handlers
        wildcard_handlers = self.event_handlers.get("*", [])
        for handler in wildcard_handlers:
            try:
                handler(event)
            except Exception as e:
                print(f"Error in wildcard event handler: {e}")

        return event

    def on(self, event_type: str, handler: Callable[[Event], None]) -> None:
        """Register an event handler."""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)

    def off(self, event_type: str, handler: Optional[Callable[[Event], None]] = None) -> None:
        """Unregister an event handler (or all handlers for a type)."""
        if handler is None:
            if event_type in self.event_handlers:
                del self.event_handlers[event_type]
        else:
            if event_type in self.event_handlers:
                self.event_handlers[event_type] = [
                    h for h in self.event_handlers[event_type] if h != handler
                ]
