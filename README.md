# Atlas — Universal Platform for Intelligent Machines

Build, simulate, and deploy autonomous systems — drones, rovers, robots, anything — with one consistent API.

```ts
const atlas = new Atlas();
const drone = atlas.drone();

await drone.takeoff();
await drone.flyTo({ latitude: 37.7749, longitude: -122.4194 });
await drone.captureImage();
await drone.returnHome();
```

No driver setup. No sensor init. No networking boilerplate. Just describe the mission.

---

## Quick Start (30 seconds)

```bash
git clone <repo> && cd atlas
npm install
npm start
```

That's it. The runtime starts, a robot explores the environment, a drone takes off and flies, and a fleet mission deploys — all against the unified `Atlas` API.

### Demos

```bash
npm run demo:robot       # Robot explore → scan → navigate
npm run demo:drone       # Drone takeoff → flyTo → captureImage → returnHome → land
npm run demo:fleet       # Fleet deploy → broadcast → monitor
npm run demo:quickstart  # 4-line quickstart
```

### Full Stack (Runtime + 3D Sim + Studio UI)

```bash
npm run demo
```

Then open `http://localhost:5174` (3D simulation) and `http://localhost:3000` (Atlas Studio).

### Python Perception

```bash
cd atlas-perception-py
pip install -e .
python perception_daemon.py    # Feeds GPS, camera, LiDAR, IMU data into runtime
```

---

## API

```ts
import { Atlas } from "./atlas-api";

const atlas = new Atlas();

// Robots
const robot = atlas.robot();
await robot.explore();                    // Autonomous survey
await robot.scan();                       // Camera → object detection
await robot.navigateTo({ x, y, z });      // Waypoint navigation

// Drones
const drone = atlas.drone();
await drone.takeoff(20);                  // Takeoff to 20m
await drone.flyTo({ latitude, longitude }); // GPS waypoint
await drone.captureImage();               // Aerial image
await drone.returnHome();                 // Return + land

// Fleets
const fleet = atlas.fleet();
fleet.register("rover-1", "robot");
await fleet.deploy({ name: "Survey", goals: [...] });
await fleet.broadcast("FORMATION_KEEP");
fleet.monitor();                          // { healthy, total, members }

// Events
atlas.on("OBJECT_DETECTED", (e) => console.log(e.payload));
```

---

## Architecture

```
atlas-api/          ← High-level API (Atlas, Robot, Drone, Fleet)
atlas-runtime/      ← EventBus, Scheduler, TaskManager, Memory, StudioServer
atlas-kernel/       ← Core types (Event, Task, Mission, Capability)
atlas-agents/       ← System, Task, Vision, Navigation, Mission, etc.
atlas-ai/           ← Decision engine, reasoning, neural networks
atlas-hardware/     ← HAL, drivers, C++ bridge
atlas-perception/   ← TS perception stubs
atlas-perception-py/ ← Python perception (Camera, LiDAR, GPS, Detection)
atlas-navigation/   ← SLAM, route planning, obstacle avoidance
atlas-fleet/        ← Swarm coordination, telemetry
atlas-network/      ← WebSocket, NATS, node discovery
atlas-memory/       ← World model, knowledge graph
atlas-security/     ← Auth, permissions
atlas-studio/       ← Visual IDE (React + Vite)
atlas-simulation/   ← 3D simulation (Three.js)
atlas-sdk/          ← Python SDK
atlas-cli/          ← CLI (run, status, config, simulate, doctor)
```

---

## Project Status

**All phases complete — 332+ integration tests, 62 Python tests passing.**

The platform handles:
- Event-driven runtime with tick-based scheduler
- Multi-agent architecture (11 agents)
- Sensor fusion + SLAM + state estimation
- Mission planning, task decomposition, error recovery
- Hardware abstraction (CAN, GPIO, Serial, GPS, Camera)
- Fleet coordination with inter-agent messaging
- Python perception pipeline with GPU-accelerated detection
- 3D simulation with physics, collision, sensor visualization
- Studio IDE with real-time WebSocket monitoring
- CLI with run, config, telemetry, doctor, simulate commands
- WebSocket/NATS transport with node discovery
- Auth (tokens, permissions, roles)

See [VISION.md](VISION.md) for the long-term goal.

---

## License

MIT
