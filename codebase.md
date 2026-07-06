# Atlas Codebase Context

## Mission

Universal platform for intelligent machines. One consistent API for developing,
simulating, deploying, and operating autonomous systems — drones, rovers, robot
arms, industrial inspection, research platforms.

Clone, `npm install`, `npm start`. That's it.

---

## Architecture

```
atlas-api          High-level user-facing API (Atlas, Robot, Drone, Fleet)
atlas-runtime      Core engine — EventBus, Scheduler, Tasks, Memory, Studio Server
atlas-kernel       Foundation types — Event, Task, Mission, Capability, Entity
atlas-agents       Intelligent units — System, Task, Vision, Navigation, Mission, etc.
atlas-ai           Decision engine, reasoning, neural nets, language models
atlas-ai-py        Python port of AI modules (ONNX, vision, reasoning)
atlas-perception   TS sensor stubs (Camera, LiDAR, GPS, Radar, IMU, Depth)
atlas-perception-py Python perception (Camera, LiDAR, GPS, Object Detection) + WS daemon
atlas-navigation   SLAM, route planning, obstacle avoidance, geofencing
atlas-hardware     HAL, driver interfaces, C++ bridge protocol
atlas-hardware-cpp C++ daemon for real hardware (GPS, Camera, Motors, CAN, GPIO)
atlas-fleet        Swarm coordination, telemetry, health monitoring
atlas-network      Transports — WebSocket, NATS, node discovery, gRPC stubs
atlas-memory       World model, knowledge graph, event history, grid map
atlas-security     Authentication (tokens), authorization (roles/permissions)
atlas-studio       React/Vite visual IDE — WebSocket connection to runtime
atlas-simulation   Three.js 3D simulation — physics, sensors, environment
atlas-sdk          Python SDK — local event system + remote WebSocket client
atlas-cli          Commander-based CLI — run, robot, drone, status, simulate, doctor
atlas-planning     Behavior trees, mission/path planners
atlas-supabase     PostgreSQL + real-time cloud persistence
atlas-cloud        Cloud REST API
atlas-tests        332+ integration tests (Jest) + 62 Python perception tests
examples           Demo scripts using the high-level API
```

---

## Module Details

### atlas-api (NEW — current focus)
High-level facade. Primary user entry point. No boilerplate.

```
Atlas            — main class, config, factory methods
  .robot()       — ground robot: navigateTo, scan, explore, getStatus
  .drone()       — aerial drone: takeoff, flyTo, captureImage, returnHome, land
  .fleet()       — fleet: register, deploy, broadcast, monitor
  .submitMission — mission lifecycle
  .on / .emit    — event system access
  .start / .stop — runtime lifecycle
```

### atlas-runtime
Core engine that wires everything together.

```
Lifecycle/
  AtlasRuntime     — Central orchestrator. 25+ property getters (bus, tasks,
                     agents, memory, hardware, perception, slam, ros, reasoning,
                     capabilities, configuration, log, plugins, map, objects,
                     obstacles, humans, robots, scene, semanticMap, ...).
                     Methods: emit (event pipeline), submitMission, start, stop.
                     Tick scheduler at 50ms.
Scheduler/         — setInterval-based tick loop
EventBus/          — (empty — actual bus in atlas-kernel/Event)
Studio/
  StudioServer     — HTTP + WebSocket server on :8080. Serves Studio protocol.
  StudioBridge     — Translates WS messages to runtime control.
Memory/
  ShortTermMemory  — FIFO buffer (100 events)
  LongTermMemory   — JSON file persistence
  SemanticMemory   — Embedding + cosine similarity search
  Embedder         — Local embedding function
Perception/
  SensorFusion     — Weighted average state estimation (position, velocity, orientation)
  SLAMEngine       — Keyframes, loop closure, pose graph optimization, object mapping
Communication/
  ROS2Bridge       — Pub/sub topic mirroring for ROS2 ecosystem
HardwareManager/   — Sensor/actuator registration and command dispatch
TaskManager/       — Task lifecycle management
MissionManager/    — Mission lifecycle
Planner/
  TaskPlanner      — Decomposes goals into executable task sequences
Recovery/
  RecoverySystem   — Retry logic and failure handling
Configuration/     — Nested key JSON config with persistence
Logging/           — Colored logger with levels and filtering
PluginManager/     — Dynamic plugin loading with dependency checks
Autonomy/
  AutonomousAgent  — Observe → Remember → Reason → Plan → Act → Learn cycle
Scheduler/         — Tick loop
Telemetry/         — Metrics collection
Metrics/           — System metrics
ResourceManager/   — Resource tracking
Permissions/       — Permission checks
Task/              — HardwareTask, BasicTask
```

### atlas-kernel
Pure type definitions. Zero runtime logic.

```
Event/             — Event interface, EventBus (on, onAll, off, emit)
Task/              — Task interface (id, name, status, retryCount, maxRetries, run)
Mission/           — Mission, Goal interfaces
Capability/        — Typed capabilities: Motion, Sensing, Imaging, Communication,
                     Computation, Storage, Manipulation + CapabilityRegistry
Hardware/          — Actuator (execute), Sensor (read) interfaces
Perception/        — StateEstimate (Vector3, Quaternion), Observation, LocalMap, MapObject
Communication/     — AgentMessage, ROS2 message types, IROS2Bridge
Studio/            — StudioProtocol (WebSocket message types for Studio ↔ Runtime)
Entity/            — Entity interface
utils/             — uuidv4, deterministic seeded random
```

### atlas-agents
11 agents implementing BaseAgent (handle/receive/initialize):

```
SystemAgent        — Monitors runtime, logs TICK events
TaskAgent          — Handles TASK_REQUEST, creates BasicTask from events
VisionAgent        — Handles IMAGE_CAPTURED, emits OBJECT_DETECTED with mock ML
NavigationAgent    — Full state machine (IDLE/NAVIGATING/AVOIDING/ARRIVED),
                     waypoint following, obstacle avoidance, position sync
MissionAgent       — Mission queue management, start/stop/clear missions
PlanningAgent      — Handles REQUEST_PLAN/REQUEST_ROUTE, uses RoutePlanner
BatteryAgent       — Simulates drain, emits BATTERY_LOW/CRITICAL at thresholds
DiagnosticsAgent   — Tracks tick count, failures, latency; emits DIAGNOSTICS_ALERT
SafetyAgent        — Handles EMERGENCY_STOP, BATTERY_CRITICAL, logs violations
SpeechAgent        — TTS/STT state machine (idle/speaking/listening)
LocalizationAgent  — Fuses GPS + IMU into Pose (x,y,z,roll,pitch,yaw)
```

### atlas-ai (TypeScript)
```
Decision/
  DecisionEngine   — Rule-based reactions to events (e.g., latency recovery)
  DecisionRouter   — Routes events to agents based on importance
  types            — Decision interface (name, confidence, execute)
Intelligence/
  EventIntelligence — Classifies events, assigns priority/category/importance
Reasoning/
  DeepReasoning    — Knowledge graph, reasoning paths, analysis, prediction
Learning/
  NeuralNetwork    — Feedforward NN, backprop, ReLU/sigmoid, Xavier init
Optimization/
  DeepOptimizer    — Gradient descent, coordinate descent, constraints
Prediction/
  PredictiveModel  — Time-series forecasting with multiple metrics
Language/
  LanguageModel    — Text generation, analysis, embeddings, similarity
Policy/
  PolicyEngine     — Policy evaluation/execution
Inference/
  ONNXRuntime      — ONNX model wrapper
Vision/
  VisionProcessor  — Image pre/post processing
```

### atlas-ai-py (Python)
Python ports of the above: decision, reasoning, neural network, optimizer,
predictive model, language model, policy, ONNX runtime, vision processor.

### atlas-perception (TypeScript — stubs)
Sensor type definitions and pipeline: CameraSensor, LidarSensor, RadarSensor,
DepthSensor, ThermalSensor, IMUSensor, GPSSensor, ObjectDetector,
PerceptionPipeline. All simulated.

### atlas-perception-py (Python — primary implementation)
Real perception. All sensors produce realistic simulated data via
deterministic seeded noise. Camera generates pixel data, LiDAR generates
point clouds, GPS produces SF Bay Area coordinates, object detector finds
bright regions.

```
camera/            — CameraSensor with configurable resolution, frame provider
lidar/             — LidarSensor with configurable range, scan rate
depth/             — DepthSensor with uint16 depth frames
radar/             — RadarSensor with azimuth/elevation/range points
thermal/           — ThermalSensor with float32 temperature data
gps/               — GPSSensor with lat/lon/alt/speed/heading
imu/               — IMUSensor with acceleration + gyroscope
detection/         — ObjectDetector: brightness-based blob detection
hardware/          — CppBridge for real hardware daemon communication
pipeline/          — PerceptionPipeline: attach sensors, capture_all
tests/             — 62 tests, all passing
perception_daemon.py — Async daemon connecting to runtime via WebSocket.
                       Feeds GPS_UPDATE (1Hz), OBJECT_DETECTED + IMAGE_CAPTURED
                       + LIDAR_SCAN (0.5Hz), IMU_UPDATE (2Hz). Exponential
                       backoff reconnection. Runtime status monitoring.
```

### atlas-navigation
```
SLAM/              — FeatureExtractor, GraphOptimizer, SLAMTypes
RoutePlanning/     — RoutePlanner with path planning
Avoidance/         — ObstacleAvoidance
Geofencing/        — Geofence manager (keep-in/keep-out zones)
Terrain/           — TerrainMap (elevation, roughness, traversability)
Waypoint/          — Waypoint types
Localization/      — EnhancedLocalization (GPS + IMU fusion)
```

### atlas-hardware
```
HAL/               — HardwareAbstractionLayer: driver registry
Bridge/
  HardwareBridge   — Bridges HAL → HardwareManager
  CppBridge        — JSON-line protocol over stdio to C++ daemon
Drivers/
  Mock/            — MockMotor, MockGPS, MockCamera
  Devices/         — NMEAGPSSensor (parses NMEA sentences), SerialMotorActuator
  Real/            — CANBusDriver, SerialPortDriver, SysfsGPIODriver
Interfaces/        — BaseDriver, CANDriver, GPIODriver, SerialDriver
Transport/         — Memory transports + real SocketCAN, SysfsGPIO, TCP Serial
Protocol/          — NMEAParser (GGA, RMC sentences → lat/lon/alt/speed)
```

### atlas-hardware-cpp
C++20 daemon (`atlas_hardware_daemon`). JSON-line stdio protocol.
Commands: gps_read, camera_capture, motor_set, can_send, gpio_write.
Built with CMake.

### atlas-fleet
```
Coordinator/       — FleetCoordinator — multi-robot mission coordination
Telemetry/         — FleetTelemetry — node registration, health aggregation
Swarm/             — Swarm — formation, consensus, broadcast
Discovery/         — Node discovery
Health/            — Health monitoring
MissionSync/       — Cross-node mission synchronization
Updates/           — Fleet update management
```

### atlas-network
```
Transport/
  WebSocketTransport — Server/client WS with auto-reconnect, heartbeat
  NATSTransport      — In-memory NATS with wildcard subjects, queue groups
  NATSClient         — Client wrapper over NATSTransport
MessageBroker        — Pub/sub/request-reply/work-queue patterns
Discovery/
  NodeDiscovery       — Auto-discovery via hello/info messages
Grpc/
  GrpcStub            — gRPC-style RPC over NATS transport
```

### atlas-memory
```
WorldModel/        — WorldObject, world state management
KnowledgeGraph/    — GraphNode, GraphEdge, query by type/property
History/           — EventHistory (append, query by type/timerange)
Map/               — GridMap (2D grid with cell access)
Objects/           — ObjectDatabase
Obstacles/         — ObstacleTracker
Humans/            — HumanTracker
Robots/            — RobotState
Scene/             — SceneGraph (hierarchical scene)
SemanticMap/       — Semantic regions
```

### atlas-security
```
Authentication/    — Authenticator: createUser, login, validateToken, logout.
                     Token-based, 24h expiry. Default admin.
Authorization/     — Authorizer: checkPermission, checkRole, checkAny/AllPermissions.
                     Wildcard "*" support.
```

### atlas-studio
React + Vite dark-theme IDE. Connects to StudioServer via WebSocket.
Tabs: Dashboard, World (3D view), Agents, Planning, Memory, Logs.
Protocol: StudioClientMessage / StudioServerMessage over WS.

### atlas-simulation
Three.js 3D simulation. Vite dev server on :5174.
Robot entity with keyboard/gamepad control. Procedural terrain, obstacles,
waypoints. Sensor visualizers (LiDAR rays, camera frustum, radar cone, GPS trail).
Physics engine (gravity, collision). HUD, minimap, telemetry.
RuntimeBridge connects to StudioServer via WS, sends GPS_UPDATE + ROBOT_STATUS.

### atlas-sdk (Python)
```
AtlasClient        — Entity/event management, local handlers
  connect(url)     — WebSocket connection to runtime (sync)
  connect_async()  — WebSocket connection (async)
  emit_remote()    — Send events to runtime
  get_snapshot()   — Get runtime state
  start/stop_runtime() — Control runtime lifecycle
Config             — JSON file config
Entity             — Data class (id, name, type, metadata)
Event              — Data class (type, source, payload, timestamp, priority)
```

### atlas-cli
Commander-based CLI with commands: run, robot, drone, status, config,
telemetry, simulate, doctor.

### atlas-planning
BehaviorTree — tree-based behavior composition, DecisionEngine,
MissionPlanner, Optimization, PathPlanner, Recovery, TaskPlanner.

---

## Data Flow

```
User Code (main.ts / CLI / SDK)
  │
  ▼
Atlas API (robot.navigateTo, drone.takeoff, fleet.deploy)
  │
  ▼
AtlasRuntime.emit(event)
  │
  ├── EventIntelligence: classify, score, enrich
  ├── SensorFusion.update (if perception event)
  ├── SLAMEngine.processObservation (if object detection)
  ├── ROS2Bridge.publish (if configured)
  ├── ShortTermMemory.remember
  ├── LongTermMemory.log (if importance >= 0.5)
  ├── SemanticMemory.add (if importance >= 0.5)
  ├── EventBus.emit (to all listeners)
  └── DecisionRouter.handle (triggers agents)
       │
       └── Agent.handle(event) → Decision[].execute()
            │
            ├── TaskAgent → creates BasicTask → TaskManager
            ├── VisionAgent → emits OBJECT_DETECTED
            ├── NavigationAgent → updates state, waypoints
            └── ...
```

---

## Event Types

Perception: GPS_UPDATE, OBJECT_DETECTED, IMAGE_CAPTURED, LIDAR_SCAN, IMU_UPDATE
Runtime:    TICK, RUNTIME_HEALTH, MISSION_RECEIVED, MISSION_COMPLETED
Task:       TASK_REQUEST, TASK_FAILURE, TASK_COMPLETED
Drone:      DRONE_TAKEOFF, DRONE_FLY_TO, DRONE_LAND
Robot:      ROBOT_NAVIGATE, ROBOT_SCAN
Fleet:      WAYPOINT_REACHED, NAVIGATION_ARRIVED
Agent:      BATTERY_LOW, BATTERY_CRITICAL, DIAGNOSTICS_ALERT, EMERGENCY_STOP,
            SPEAK_REQUEST, LISTEN_REQUEST, REQUEST_PLAN, REQUEST_ROUTE
System:     entity:registered, entity:unregistered

---

## Phase Status

Phase 1 — Core Lifecycle           DONE  EventBus, Scheduler, TaskManager, AtlasRuntime
Phase 2 — Reactive Brain           DONE  DecisionEngine, EventIntelligence, AgentRegistry
Phase 3 — Memory & Context         DONE  STM, LTM, SemanticMemory, Embedder
Phase 4 — Planning & Autonomy      DONE  Mission/Goal, MissionManager, TaskPlanner, Recovery
Phase 5 — Multi-Agent Swarm        DONE  AgentMessage, routing, Vision/Navigation agents, Fleet
Phase 6 — Real World Integration   DONE  HAL, HardwareManager, Mock/Real drivers, SensorFusion,
                                         SLAMEngine, ROS2Bridge
Phase 7 — Core Enhancements        DONE  Capability system, Configuration, Logger, PluginManager
Phase 8 — CLI, Perception, SDK     DONE  CLI (6 commands), atlas-perception (TS + Python),
                                         atlas-sdk/python, atlas-network, atlas-security,
                                         atlas-memory (WorldModel, KnowledgeGraph),
                                         atlas-navigation expansion, missing agents
Phase 1 (New) — Intelligence       DONE  AutonomousAgent full cycle, demo script
Phase 2 (New) — Atlas Studio       IP    React/Vite IDE, WebSocket protocol, tabs

---

## Test Coverage

TypeScript: 332+ tests across 18 suites (kernel, runtime, AI, memory,
navigation, agents, fleet, hardware, network, security, perception, planning).
Python:     62 tests (camera, depth, GPS, IMU, LiDAR, object detection,
            perception pipeline, radar, thermal). All passing.
C++:        Hardware daemon tests (CMake build).

---

## Key Integrations

TS ↔ Python:        WebSocket — StudioServer (:8080) ↔ perception_daemon.py
TS ↔ Studio:        WebSocket — StudioServer (:8080) ↔ React (Vite proxy)
TS ↔ Simulation:    WebSocket — StudioServer (:8080) ↔ Three.js (Vite proxy)
TS ↔ C++:           JSON-over-stdin/stdout — CppBridge ↔ atlas_hardware_daemon
TS ↔ ROS2:          In-process pub/sub — ROS2Bridge (topic mirroring)
TS ↔ Cloud:         Supabase (PostgreSQL + real-time subscriptions)
TS ↔ Network:       WebSocket / NATS — atlas-network transports
