# Atlas — Universal Platform for Intelligent Machines

Build, simulate, and deploy autonomous systems — drones, rovers, robots, anything — with one consistent API.

```ts
import { Atlas } from "./atlas-api";

const atlas = new Atlas();
const drone = atlas.drone();

await drone.takeoff(20);
await drone.flyTo({ latitude: 37.7749, longitude: -122.4194 });
await drone.captureImage();
await drone.returnHome();
```

No driver setup. No sensor init. No networking boilerplate. Just describe the mission.

---

## Quick Start

```bash
git clone <repo> && cd atlas
npm install
npm start        # Full robot + drone + fleet demo in your terminal
```

That's it. The runtime starts, a robot explores, a drone flies, and a fleet mission deploys — all against the unified `Atlas` API.

**Other entry points:**

```bash
npm run studio       # Visual IDE at http://localhost:3000
npm run sim          # 3D simulation at http://localhost:5174
npm run demo         # Runtime + Sim + Studio all at once
npm run cli -- run   # CLI mode
npm test             # 332+ integration tests
```

---

## Demos

Every demo is a standalone script you can run immediately:

| Command | Scenario | Location |
|---|---|---|
| `npm run demo:robot` | Terrain survey & mineral scanning | Mojave Desert (35.01°N, 115.47°W) |
| `npm run demo:drone` | Aerial bridge inspection | Golden Gate Bridge (37.82°N, 122.48°W) |
| `npm run demo:fleet` | Multi-robot perimeter sweep with formation control | — |
| `npm run demo:pigeon` | Covert surveillance loiter mission | Washington DC Mall (38.89°N, 77.04°W) |
| `npm run demo:rover` | Mars planetary exploration & sample collection | Jezero Crater (18.44°N, 77.45°E) |
| `npm run demo:rocket` | Heavy-lift rocket launch, orbit insertion & reentry | Cape Canaveral (28.56°N, 80.58°W) |
| `npm run demo:agent` | Full Observe→Remember→Reason→Plan→Act→Learn cycle | — |
| `npm run demo:simulation` | Runtime + WebSocket bridge for 3D sim connect | — |
| `npm run demo:quickstart` | 4-line minimal example | — |

Each demo uses real-world GPS coordinates, phased mission profiles, and event-driven telemetry.

---

## Full Stack

```bash
npm run demo
```

Starts three services concurrently:

| Service | Port | Description |
|---|---|---|
| Runtime | `:8080` | Core Atlas engine + WebSocket API |
| Simulation | `:5174` | 3D Three.js environment with physics |
| Studio | `:3000` | React-based visual IDE (World, Agents, Planning, Memory tabs) |

Also via Docker:

```bash
docker compose up    # runtime + sim + studio + perception-py
docker compose run --profile test test   # run tests
```

---

## The `Atlas` API

### Atlas (factory / orchestrator)

```ts
import { Atlas } from "./atlas-api";

const atlas = new Atlas({ agents: true, autoStart: true });

atlas.start();
atlas.stop();
atlas.active;              // boolean
atlas.status;              // { running, agents, tasks, robots, drones }
```

### Robot

```ts
const robot = atlas.robot("rover-1", { name: "Surveyor" });

await robot.explore();                        // autonomous survey
await robot.scan();                           // camera → object detection
await robot.navigateTo({ x, y, z });          // local waypoint
await robot.navigateTo({ latitude, longitude }); // GPS waypoint
robot.getStatus();                            // { position, battery, speed, mode, taskCount }
```

### Drone

```ts
const drone = atlas.drone("quad-1", { name: "SkyEye" });

await drone.takeoff(20);                      // ascend to 20m
await drone.flyTo({ latitude, longitude, altitude }); // GPS waypoint
const img = await drone.captureImage();       // { width, height, timestamp }
await drone.returnHome();                     // fly back + land
await drone.land();                           // land at current position
drone.getStatus();                            // { position, battery, altitude, mode, speed }
```

### Fleet

```ts
const fleet = atlas.fleet();

fleet.register("rover-1", "robot");
fleet.register("quad-1", "drone");
fleet.unregister("rover-1");

await fleet.deploy({ name: "Survey", goals: [...] });
await fleet.broadcast("FORMATION_KEEP", { formation: "line" });
fleet.monitor();                              // { members, healthy, total, missionActive }
```

### Events

```ts
atlas.on("OBJECT_DETECTED", (e) => console.log(e.payload));
atlas.on("GPS_UPDATE", (e) => console.log(e.payload));
atlas.on("DRONE_TAKEOFF", (e) => console.log(e.payload));

await atlas.emit({ type: "CUSTOM_EVENT", payload: { ... } });
```

**All event types:** `TICK`, `GPS_UPDATE`, `OBJECT_DETECTED`, `IMAGE_CAPTURED`, `TASK_REQUEST`,
`TASK_FAILURE`, `DRONE_TAKEOFF`, `DRONE_LAND`, `DRONE_FLY_TO`, `ROBOT_NAVIGATE`, `ROBOT_SCAN`,
`MISSION_COMPLETED`, `MISSION_RECEIVED`, `BATTERY_LOW`, `WAYPOINT_REACHED`, `ERROR`,
`RUNTIME_HEALTH`, `DRONE_RETURN`, `NAVIGATION_ARRIVED`.

### Missions

```ts
await atlas.submitMission({
  name: "Perimeter Sweep",
  goals: [
    { description: "Patrol north edge", priority: 1 },
    { description: "Report obstacles", priority: 2 },
  ],
});
```

Missions are decomposed into tasks by the `TaskPlanner`, executed sequentially,
and tracked by the `MissionManager` with automatic error recovery.

---

## SDKs — Multi-Language Support

All SDKs connect to the Atlas Runtime via WebSocket (`ws://host:8080/api/ws`)
and expose the same `Robot`, `Drone`, `Fleet`, `Entity`, and `Event` types.

### Python

```bash
cd atlas-sdk/python && pip install -e .
```

```python
from atlas_sdk import AtlasClient, Robot, Drone, Fleet

client = AtlasClient(ws_url="ws://localhost:8080/api/ws")
client.connect()

robot = Robot(client, "rover-1", "Surveyor")
drone = Drone(client, "quad-1", "SkyEye")
fleet = Fleet(client)
fleet.register("rover-1", "robot")
```

### JavaScript (Node.js)

```bash
cd atlas-sdk/JavaScript && npm install
```

```js
const { AtlasClient, Robot, Drone } = require("./index");

const client = new AtlasClient("ws://localhost:8080/api/ws");
await client.connect();

const drone = new Drone(client, "quad-1", "SkyEye");
await drone.takeoff(20);
await drone.flyTo(37.7749, -122.4194, 25);
await drone.captureImage();
```

### Go

```bash
cd atlas-sdk/Go && go mod tidy
```

```go
import atlas "github.com/atlas-platform/atlas-sdk-go"

client := atlas.NewClient(nil, "ws://localhost:8080/api/ws")
client.Connect("")

robot := atlas.NewRobot(client, "rover-1", "Surveyor")
robot.NavigateTo(atlas.NavigateTarget{X: 37.775, Y: -122.418, Z: 0})
robot.Scan()
```

### Rust

```bash
cd atlas-sdk/Rust && cargo build
```

```rust
use atlas_sdk::*;

let mut client = AtlasClient::new("ws://localhost:8080/api/ws");
client.connect().await?;

let drone = Drone::new(client.clone(), "quad-1", "SkyEye");
drone.takeoff(20.0).await?;
drone.fly_to(37.7749, -122.4194, 25.0).await?;
drone.capture_image().await?;
```

---

## Architecture

```
USER LAYER          Mission Scripts · SDK · Studio · CLI · REST API
                          │
APPLICATION LAYER    Mission Engine · Behaviors · Automation · Fleet · AI Apps
                          │
ATLAS RUNTIME        Scheduler · EventBus · TaskManager · Lifecycle · Plugins
                    ┌──────┼──────┬──────┬──────┐
                    │      │      │      │      │
                  Perception Planning Comm.  Memory Hardware
                    │      │      │      │      │
                  Navigation Local.   HAL   World Model
                    │
               Hardware Drivers (C++ daemon / Python / Mock)
                    │
               Physical Machine
```

### Module Map

| Directory | What it does |
|---|---|
| `atlas-api/` | High-level API — `Atlas`, `Robot`, `Drone`, `Fleet` |
| `atlas-runtime/` | Core orchestrator — lifecycle, scheduler, event bus, task manager, memory, perception, mission manager, recovery, telemetry, studio server |
| `atlas-kernel/` | Foundational types — `Event`, `Task`, `Mission`, `Goal`, `Agent`, `Capability`, `Entity`, communication protocol |
| `atlas-agents/` | 11 agent types — `SystemAgent`, `TaskAgent`, `VisionAgent`, `NavigationAgent`, `MissionAgent`, `PlanningAgent`, `SafetyAgent`, `BatteryAgent`, `LocalizationAgent`, `DiagnosticsAgent`, `SpeechAgent` |
| `atlas-ai/` | Intelligence layer — `DecisionEngine`, `EventIntelligence`, `DeepReasoningEngine`, `NeuralNetwork`, `PredictiveModel`, `LanguageModel`, `Optimizer`, `PolicyEngine`, `VisionProcessor` |
| `atlas-hardware/` | TypeScript HAL — `HAL`, `HardwareBridge`, sensors, actuators, drivers (Mock + Real), CAN, GPIO, Serial, USB, Ethernet |
| `atlas-hardware-cpp/` | C++20 hardware daemon — HAL headers, driver bridge, JSON IPC with TS/Python |
| `atlas-perception/` | TypeScript perception — `CameraSensor`, `LidarSensor`, `ObjectDetector`, `PerceptionPipeline`, depth, radar, thermal, IMU, GPS, fusion, tracking |
| `atlas-perception-py/` | Python perception daemon — GPS, camera, LiDAR, IMU, object detection, WebSocket bridge to runtime |
| `atlas-navigation/` | Navigation stack — SLAM, route planning, obstacle avoidance, geofencing, terrain, waypoint, localization |
| `atlas-navigation-cpp/` | C++ navigation — SLAM engine, feature extraction, graph optimization, localization |
| `atlas-memory/` | World modeling — `WorldModel`, `KnowledgeGraph`, `EventHistory`, `GridMap`, `ObjectDatabase`, `ObstacleTracker`, `HumanTracker`, `RobotState`, `SceneGraph`, `SemanticMap` |
| `atlas-fleet/` | Swarm management — `FleetCoordinator`, `FleetTelemetry`, `Swarm`, node discovery, health, mission sync, OTA updates |
| `atlas-network/` | Communication — `MessageBroker` (PUB/SUB, Request/Reply, Work Queue), WebSocket/NATS transport, node discovery, gRPC stubs |
| `atlas-security/` | Access control — `Authenticator` (users, tokens), `Authorizer` (roles, permissions) |
| `atlas-planning/` | Planning — `BehaviorTree`, `DecisionEngine`, `MissionPlanner`, `PathPlanner`, `TaskPlanner`, `Recovery`, `Optimization` |
| `atlas-simulation/` | 3D simulation — Three.js + Vite, physics engine, environment, robots, sensors, HUD, scenario playback, synthetic data, RuntimeBridge |
| `atlas-studio/` | Visual IDE — React + Vite, dark theme, World/Agents/Planning/Memory tabs, real-time WebSocket monitoring |
| `atlas-supabase/` | Supabase persistence — STM/LTM/Semantic memory, world model, knowledge graph, event store |
| `atlas-cli/` | CLI — `run`, `status`, `config`, `telemetry`, `simulate`, `doctor`, `robot`, `drone` commands |
| `atlas-cli/` | CLI — `run`, `status`, `config`, `telemetry`, `simulate`, `doctor`, `robot`, `drone` commands |
| `atlas-examples/` | Example task implementations |
| `atlas-tests/` | 332+ Jest integration tests across all modules |
| `atlas-sdk/` | Multi-language SDKs — Python (complete), JavaScript, Go, Rust |

---

## CLI

```bash
npx tsx atlas-cli/src/index.ts --help

# Commands:
atlas run              # Start runtime + optional Studio server
atlas status           # System status, log level, config path
atlas config           # Get/set/list configuration values
atlas telemetry        # View fleet nodes and health
atlas simulate         # Run simulation with configurable parameters
atlas doctor           # Check system dependencies
atlas robot <cmd>      # Control a robot (explore/scan/navigate/status)
atlas drone <cmd>      # Control a drone (takeoff/fly/status)
```

```bash
npm run cli -- run -p 8080 --verbose
npm run cli -- robot explore
npm run cli -- robot navigate 37.775 -122.418
npm run cli -- config set runtime.tickRate 100
npm run cli -- doctor
```

---

## Event System

Everything in Atlas communicates through events. The `EventBus` decouples all modules:

```
Camera  ──→  ImageCaptured  ──→  VisionAgent  ──→  ObjectDetected
                                                            │
                                                     Planner / Navigation
                                                            │
                                              MissionTaskCreated / WaypointReached
                                                            │
                                                      MissionComplete
```

No module directly calls another. Events flow through the bus with automatic
classification, scoring, and priority mapping via `EventIntelligence`.

---

## Memory System

Atlas has three memory tiers that integrate seamlessly:

| Tier | Storage | Purpose |
|---|---|---|
| **STM** (Short-Term) | In-memory FIFO (100 events) | Recent context, immediate recall |
| **LTM** (Long-Term) | JSON file (`storage/memory.json`) | Persistent event logging, task history |
| **Semantic** | Vector embeddings + cosine similarity | Meaning-based search, pattern matching |

The `AtlasRuntime` automatically routes events through all three tiers based on
importance scoring — transparent to your mission code.

---

## Running Tests

```bash
# Full TypeScript suite (332+ tests)
npm test

# Specific module
npx jest atlas-tests/kernel
npx jest atlas-tests/runtime

# Python perception tests
cd atlas-perception-py && python -m pytest

# C++ tests
cd atlas-hardware-cpp && ./build/atlas_hardware_tests
cd atlas-navigation-cpp && ./build/atlas_navigation_tests

# Watch mode
npm run test:watch
```

---

## Python Perception Pipeline

```bash
cd atlas-perception-py
pip install -e .
python perception_daemon.py
```

This starts a Python daemon that connects to the runtime via WebSocket
and streams GPS, camera, LiDAR, IMU, and object detection events.
Supports GPU-accelerated detection via the `atlas_perception` package.

---

## C++ Hardware Integration

```bash
cd atlas-hardware-cpp
cmake -S . -B build && cmake --build build
./build/atlas_hardware_tests

# Run the hardware daemon
./build/atlas_hardware_daemon
```

The C++ daemon communicates with the TypeScript runtime via JSON IPC
(stdin/stdout), providing real hardware access (serial, CAN, V4L2, GPIO)
bridged through `atlas-hardware/Bridge/`.

---

## Project Status

- **332+ TypeScript integration tests** — all passing
- **62 Python tests** — all passing
- **C++ test suites** — hardware and navigation
- **14 TS modules**, **2 Python packages**, **2 C++ projects**
- **4 language SDKs** — Python, JavaScript, Go, Rust
- **9 demo scripts** — real-world scenarios
- **Docker Compose** — 5 services (runtime, sim, studio, perception-py, test)

---

## Architecture Decisions

- **Event-driven** — All communication through `EventBus`, zero tight coupling
- **Simulation-first** — Every capability works in 3D sim before hardware
- **Language-per-layer** — TypeScript (orchestration), Python (AI/perception), C++ (hardware/nav)
- **Hardware-agnostic** — `HAL` abstracts all sensors and actuators behind capabilities
- **Local-first** — Cloud (Supabase) is optional; everything works offline
- **Plugin system** — Everything beyond the kernel is a loadable plugin

---

## License

MIT

See [VISION.md](./VISION.md) for the long-term roadmap.
