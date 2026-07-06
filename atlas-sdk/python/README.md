# Atlas Python SDK

Python client for the Atlas intelligent machine platform.

## Installation

```bash
cd atlas-sdk/python
pip install -e .
```

## Quick Start

```python
import asyncio
from atlas_sdk import AtlasClient, Robot, Drone, Fleet


async def main():
    client = AtlasClient(ws_url="ws://localhost:8080/api/ws")
    await client.connect_async()

    # Robot
    robot = Robot(client, "rover-1", "Surveyor")
    await robot.navigate_to({"x": 37.775, "y": -122.418, "z": 0})
    await robot.scan()
    await robot.explore()

    # Drone
    drone = Drone(client, "quad-1", "SkyEye")
    await drone.takeoff(20)
    await drone.fly_to(37.7749, -122.4194, 25)
    await drone.capture_image()
    await drone.return_home()

    # Fleet
    fleet = Fleet(client)
    fleet.register("rover-1", "robot")
    fleet.register("quad-1", "drone")
    fleet.register("pigeon-1", "drone")
    await fleet.deploy(MissionDefinition(
        name="Perimeter Sweep",
        goals=[MissionGoal("Patrol north edge", 1)],
    ))
    await fleet.broadcast("FORMATION_KEEP")
    status = fleet.monitor()
    print(f"Fleet health: {status.healthy}/{status.total}")

    # Snapshot
    snapshot = await client.get_snapshot()
    print("Runtime:", snapshot)

asyncio.run(main())
```

## API

- `AtlasClient(ws_url)` — WebSocket client with `connect()`, `connect_async()`, `emit_remote()`, `get_snapshot()`, `start_runtime()`, `stop_runtime()`, entity registry
- `Robot(client, id, name)` — `navigate_to()`, `scan()`, `explore()`
- `Drone(client, id, name)` — `takeoff()`, `fly_to()`, `capture_image()`, `return_home()`, `land()`
- `Fleet(client)` — `register()`, `unregister()`, `deploy()`, `broadcast()`, `monitor()`
- `Entity(id, name, type)` — Base entity with metadata
- `Event(type, source, payload)` — Event with serialization
- `Config(path)` — JSON config file management
