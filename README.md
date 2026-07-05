# Atlas — Universal Platform for Intelligent Machines

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Atlas is a polyglot software platform for building, simulating, and deploying intelligent autonomous systems — from single drones to multi-robot fleets.

## Architecture

```
           Mission Scripts · SDK · Studio · CLI · REST API
                        │
                   Application Layer
     (Mission Engine · Behaviors · Fleet · AI Apps)
                        │
                    Atlas Runtime
  (Scheduler · EventBus · Tasks · Lifecycle · Plugins)
                        │
     ┌─────────┬─────────┼──────────┬──────────┐
     │         │         │          │          │
  Perception  Planning  Hardware  Memory   Communication
  (Python)   (TS/C++)  (C++/TS)   (TS/DB)    (WS/NATS)
```

## Repository Structure

| Module | Language | Purpose |
|--------|----------|---------|
| `atlas-kernel/` | TypeScript | Core data types — Entity, Event, Task, Mission, Capability |
| `atlas-runtime/` | TypeScript | Scheduler, EventBus, TaskManager, Memory, Plugin system |
| `atlas-hardware/` | TypeScript | HAL interfaces, driver stubs, C++ bridge |
| `atlas-hardware-cpp/` | C++20 | Real hardware drivers — Serial, CAN, V4L2 camera, GPS |
| `atlas-agents/` | TypeScript | Agent framework — Mission, Vision, Navigation, Speech agents |
| `atlas-ai/` | TypeScript | Reasoning, planning, neural networks, language models |
| `atlas-ai-py/` | Python | AI inference, ML models (PyTorch, ONNX) |
| `atlas-perception/` | TypeScript | Perception pipeline stubs — camera, lidar, radar, IMU, GPS |
| `atlas-perception-py/` | Python | Real perception sensors — camera capture, object detection |
| `atlas-navigation/` | TypeScript | SLAM, waypoints, obstacle avoidance, route planning |
| `atlas-navigation-cpp/` | C++20 | High-performance navigation kernels |
| `atlas-fleet/` | TypeScript | Swarm coordination, telemetry, health monitoring |
| `atlas-network/` | TypeScript | Transport layer — WebSocket, NATS, node discovery |
| `atlas-memory/` | TypeScript | World model, knowledge graph |
| `atlas-supabase/` | TypeScript | Supabase-backed persistence (PostgreSQL + real-time) |
| `atlas-sdk/` | TS / Python | Multi-language SDK for building Atlas applications |
| `atlas-cli/` | TypeScript | Command-line interface (atlas run, simulate, doctor) |
| `atlas-studio/` | TypeScript | Visual IDE (React + Vite) |
| `atlas-simulation/` | TypeScript | 3D simulation (Three.js) |
| `atlas-cloud/` | TypeScript | Cloud API and deployment |
| `atlas-security/` | TypeScript | Auth, permissions, tokens |
| `atlas-examples/` | TypeScript | Demo scripts and examples |
| `atlas-tests/` | TypeScript | Integration test suite (332+ tests) |

## Quick Start

### Prerequisites

- Node.js >= 20
- TypeScript >= 5.0
- Python >= 3.10 (for Python modules)
- C++20 compiler + CMake >= 3.20 (for hardware drivers)

### Install & Run

```bash
# TypeScript core
git clone https://github.com/your-org/atlas.git
cd atlas
npm install

# Python SDK
cd atlas-sdk/python && pip install -e . && cd ../..

# C++ hardware drivers
cd atlas-hardware-cpp && cmake -S . -B build && cmake --build build && cd ../..

# Run the CLI
npx atlas run
```

### Run Tests

```bash
npm test                    # TypeScript (332+ tests)
cd atlas-perception-py && python -m pytest   # Python perception
```

## Key Features

- **Event-Driven Architecture** — All modules communicate through a central EventBus; no tight coupling
- **Capability System** — Applications request capabilities (Move, Capture, Sense), not specific hardware
- **Polyglot by Design** — TypeScript for orchestration & tooling, Python for AI/ML, C++ for real-time hardware
- **Hardware Abstraction** — The same mission scripts work in simulation and on real hardware
- **Swarm Ready** — Built-in fleet coordination, telemetry, and multi-agent messaging
- **Supabase Backend** — Optional cloud persistence via PostgreSQL + real-time subscriptions
- **Plugin System** — Everything beyond the kernel is a loadable plugin

## Hardware Integration

Atlas connects to real hardware through a **C++ daemon** (`atlas_hardware_daemon`) that communicates with TypeScript via JSON-over-stdin/stdout IPC. The TypeScript `CppBridge` and Python `CppBridge` provide transparent access to:

- **GPS** — Real GPSD serial data
- **Camera** — V4L2 video capture
- **Motors** — Serial/CAN PWM control
- **GPIO, CAN, UART** — Direct bus access

```
TypeScript Runtime  ←→  CppBridge  ←→  C++ Daemon  ←→  Hardware (GPSD/V4L2/Serial)
Python SDK          ←→  CppBridge  ←→  C++ Daemon  ←→  Hardware
```

## Documentation

- [Architecture](docs/architecture.md) — Full system design
- [Tech Stack](docs/tech-stack.md) — Language and framework rationale
- [Project Status](PROJECT_STATUS.md) — Complete phase breakdown

## License

[MIT](LICENSE)
