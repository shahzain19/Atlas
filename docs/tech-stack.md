# 🧠 Atlas Tech Stack (Final Design)

## Overview
Atlas is a universal software platform for intelligent machines, designed with a polyglot architecture to leverage the best tools for each layer.

---

## 🧩 1. Core Kernel
**Purpose**: Everything depends on this
- **Language**: TypeScript (primary), Rust (future core rewrite for performance)
- **Runtime**: Node.js (initial), later Deno optional
- **Style**: Event-driven + ECS-like (Entity Component System)

**Why TypeScript**:
- Fast iteration
- Excellent tooling
- Perfect for simulation + orchestration

**Current State**: ✅ Implemented!
- EventBus, Entity, Task, Mission core types
- Runtime orchestration via AtlasRuntime

---

## ⚙️ 2. Runtime System
**Purpose**: Scheduling, task execution, plugin management
- **Concurrency**: Node.js worker threads (initial), later Rust microservices
- **Message Passing**:
  - ✅ In-process EventBus (MVP)
  - Later: NATS / Redis Streams / ZeroMQ

**Current State**: ✅ Implemented!
- Scheduler, TaskManager
- PluginManager (newly added)
- Configuration, Logging (newly added)

---

## 🤖 3. AI Layer
**Purpose**: Reasoning, vision, language, policy
- **Language**: Python (primary AI layer)
- **Frameworks**:
  - PyTorch / JAX
  - OpenCV / vision models
  - LLM orchestration
- **Optional Optimizations**:
  - ONNX Runtime (cross deployment)
  - TensorRT (edge optimization)

**Why Python here**:
- AI ecosystem dominance
- Fastest research iteration

**Current State**: ✅ Implemented (TypeScript stub)!
- DecisionEngine, DecisionRouter
- EventIntelligence
- DeepReasoningEngine
- Memory (STM/LTM/Semantic)
- Planner (TaskPlanner)
- RecoverySystem

---

## 🧭 4. Robotics / Navigation Layer
**Purpose**: Real hardware integration, navigation, SLAM
- **Language**: C++ (ROS2-compatible layer)
- **Robotics Framework**: ROS2 (optional but highly compatible)
- **SLAM Libraries**:
  - ORB-SLAM / RTAB-Map
- **Path Planning**:
  - Custom + A* + RRT*

**Current State**: ✅ Implemented (TypeScript stub)!
- SLAM Engine, Sensor Fusion
- Waypoint, Obstacle Avoidance
- Enhanced Localization

---

## 👁 5. Perception Stack
**Purpose**: Sensor data processing, computer vision
- **Language**: Python + C++ hybrid
- **Tools**:
  - OpenCV
  - PyTorch vision models
  - Sensor fusion (Kalman filters, particle filters)
  - LiDAR processing (PCL - Point Cloud Library)

**Current State**: ✅ Implemented (TypeScript stub)!
- SensorFusion module
- VisionAgent
- Perception state estimate

---

## 🧠 6. Memory System (World model)
**Purpose**: Long-term memory, knowledge graph, semantic search
- **Databases**:
  - PostgreSQL (structured memory)
  - Redis (short-term state/cache)
  - Neo4j (knowledge graph / relationships)
- **Vector DB**:
  - Qdrant or Weaviate (semantic memory)

**Current State**: ✅ Implemented (TypeScript stub)!
- STM (in-memory FIFO)
- LTM (JSON file-based)
- Semantic Memory (local cosine similarity)

---

## 🌐 7. Communication Layer
**Purpose**: Agent communication, swarm coordination
- **Recommended Backbone**: NATS
- **Others**:
  - WebSockets (debug / studio)
  - gRPC (high-performance internal calls)
  - MQTT (IoT / robot fleet support)

**Current State**: ✅ Implemented!
- AgentMessage protocol
- Direct and broadcast message routing via AgentRegistry
- ROS2 Bridge (stub)

---

## 🧪 8. Simulation Layer
**Purpose**: Validate systems before real hardware
- **MVP**: TypeScript + Three.js (visual simulation)
- **Future Options**:
  - Unity (C#)
  - Gazebo (ROS ecosystem)
  - NVIDIA Isaac Sim (high-end robotics sim)

**Current State**: ⏳ Planned
- No simulation module yet

---

## 🧱 9. Hardware Layer
**Purpose**: Real hardware drivers and interfaces
- **Languages**: C++ / Rust
- **Interfaces**:
  - CAN bus
  - UART / Serial
  - Ethernet
  - GPIO

**Current State**: ✅ Implemented (TypeScript stubs)!
- Hardware Abstraction Layer (HAL)
- HardwareManager
- Mock drivers (MockMotor, MockGPS, MockCamera)

---

## 🧰 10. Tooling / Dev Ecosystem
**Purpose**: Developer experience
- **Studio Frontend**: React + Vite + TypeScript
- **CLI**: Node.js + Rust helper binaries
- **Config**: YAML + JSON5
- **Logging**: OpenTelemetry
