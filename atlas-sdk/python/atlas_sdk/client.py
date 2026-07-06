from typing import Optional, List, Callable, Any, Dict
import asyncio
import json
import os
import time
from .entity import Entity
from .event import Event
from .config import Config


class AtlasClient:
    """Main client for interacting with the Atlas platform.

    Supports two modes:
    - Local: in-process event system (default)
    - Remote: connects to Atlas Runtime via WebSocket
    """

    def __init__(self, config: Optional[Config] = None, ws_url: Optional[str] = None):
        self.config: Config = config or Config()
        self.entities: Dict[str, Entity] = {}
        self.event_handlers: Dict[str, List[Callable[[Event], None]]] = {}
        self._ws_url = ws_url or os.environ.get("ATLAS_WS_URL")
        self._ws = None
        self._loop = None

    def connect(self, url: Optional[str] = None) -> None:
        """Connect to a remote Atlas Runtime via WebSocket (blocking)."""
        import asyncio
        import websockets

        url = url or self._ws_url
        if not url:
            raise ValueError("WebSocket URL required. Set ATLAS_WS_URL or pass ws_url.")

        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._ws = self._loop.run_until_complete(websockets.connect(url))
        self._loop.run_until_complete(self._send_remote({"type": "get_snapshot"}))

    async def connect_async(self, url: Optional[str] = None) -> None:
        """Connect to a remote Atlas Runtime via WebSocket (async)."""
        import websockets

        url = url or self._ws_url
        if not url:
            raise ValueError("WebSocket URL required. Set ATLAS_WS_URL or pass ws_url.")

        self._ws = await websockets.connect(url)

    async def _send_remote(self, msg: dict) -> dict:
        if not self._ws:
            raise ConnectionError("Not connected")
        await self._ws.send(json.dumps(msg))
        resp = await self._ws.recv()
        return json.loads(resp) if isinstance(resp, str) else resp

    async def emit_remote(self, event_type: str, payload: Any = None,
                          source: str = "python-sdk") -> None:
        """Emit an event to the remote runtime."""
        msg = {
            "type": "emit_event",
            "payload": {
                "type": event_type,
                "source": source,
                "timestamp": int(time.time() * 1000),
                "payload": payload or {},
            },
        }
        await self._send_remote(msg)

    async def get_snapshot(self) -> dict:
        """Get the current runtime snapshot (remote)."""
        return await self._send_remote({"type": "get_snapshot"})

    async def start_runtime(self) -> dict:
        """Start the remote runtime."""
        return await self._send_remote({"type": "start_runtime"})

    async def stop_runtime(self) -> dict:
        """Stop the remote runtime."""
        return await self._send_remote({"type": "stop_runtime"})

    def register_entity(self, entity: Entity) -> None:
        self.entities[entity.id] = entity
        self.emit_event("entity:registered", {"entity": entity.to_dict()})

    def unregister_entity(self, entity_id: str) -> None:
        if entity_id in self.entities:
            del self.entities[entity_id]
            self.emit_event("entity:unregistered", {"entity_id": entity_id})

    def get_entity(self, entity_id: str) -> Optional[Entity]:
        return self.entities.get(entity_id)

    def get_all_entities(self) -> List[Entity]:
        return list(self.entities.values())

    def emit_event(self, event_type: str, payload: Any = None,
                   source: str = "sdk", priority: str = "medium") -> Event:
        event = Event(
            type=event_type,
            source=source,
            payload=payload,
            timestamp=time.time(),
            priority=priority,
        )

        for handler in self.event_handlers.get(event_type, []):
            try:
                handler(event)
            except Exception as e:
                print(f"Error in event handler: {e}")

        for handler in self.event_handlers.get("*", []):
            try:
                handler(event)
            except Exception as e:
                print(f"Error in wildcard event handler: {e}")

        return event

    def on(self, event_type: str, handler: Callable[[Event], None]) -> None:
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)

    def off(self, event_type: str, handler: Optional[Callable[[Event], None]] = None) -> None:
        if handler is None:
            if event_type in self.event_handlers:
                del self.event_handlers[event_type]
        else:
            if event_type in self.event_handlers:
                self.event_handlers[event_type] = [
                    h for h in self.event_handlers[event_type] if h != handler
                ]

    def close(self) -> None:
        if self._ws and self._loop:
            self._loop.run_until_complete(self._ws.close())
