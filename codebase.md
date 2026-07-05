# Atlas Codebase File Reference

This document describes every tracked source, configuration, and documentation file in the Atlas repository. It is organized by top-level module.

Total files: 419


## CODE_OF_CONDUCT.md


### 

- `CODE_OF_CONDUCT.md`: Markdown documentation: We as members, contributors, and leaders pledge to make participation in our

## CONTRIBUTING.md

- `CONTRIBUTING.md`: Markdown documentation: Thank you for your interest in contributing to Atlas! We welcome

## Dockerfile

- `Dockerfile`: FROM node:22-alpine AS base

## PROJECT_STATUS.md

- `PROJECT_STATUS.md`: Markdown documentation: This document provides a comprehensive summary of the current state of the Atlas platform, detailing the architectural milestones achieved from Phase 1 through Phase 5.

## README.md

- `README.md`: Markdown documentation: [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## SECURITY.md

- `SECURITY.md`: Markdown documentation: | Version | Supported          |

## atlas-agents

Behavioral agent implementations, agent registry, and message routing between agents.


### atlas-agents/AgentRegistry

- `AgentRegistry.ts`: Exports: AgentRegistry

### atlas-agents/BaseAgent

- `BaseAgent.ts`: export abstract class BaseAgent {

### atlas-agents/BatteryAgent

- `BatteryAgent.ts`: Exports: BatteryAgent

### atlas-agents/DiagnosticsAgent

- `DiagnosticsAgent.ts`: Exports: DiagnosticsAgent

### atlas-agents/LocalizationAgent

- `LocalizationAgent.ts`: Exports: Pose, LocalizationAgent

### atlas-agents/MissionAgent

- `MissionAgent.ts`: Exports: MissionAgent

### atlas-agents/NavigationAgent

- `NavigationAgent.ts`: --------------------------------------------------------------------------- | Exports: NavigationAgent

### atlas-agents/PlanningAgent

- `PlanningAgent.ts`: Exports: PlanningAgent

### atlas-agents/SafetyAgent

- `SafetyAgent.ts`: Exports: SafetyAgent

### atlas-agents/SpeechAgent

- `SpeechAgent.ts`: Exports: SpeechAgent

### atlas-agents/SystemAgent

- `SystemAgent.ts`: Exports: SystemAgent

### atlas-agents/TaskAgent

- `TaskAgent.ts`: Exports: TaskAgent

### atlas-agents/VisionAgent

- `VisionAgent.ts`: Exports: VisionAgent

## atlas-ai-py

Python reference implementations for AI/decision/vision/reasoning/learning modules.


### atlas-ai-py/.pytest_cache

- `README.md`: Markdown documentation: This directory contains data from the pytest's cache plugin,

### atlas-ai-py/atlas_ai

- `__init__.py`: Python module: from atlas_ai.types import Event, EventPriority, DecisionContext, Decision, hash_string, seeded_unit, seeded_range, seeded_int

### atlas-ai-py/atlas_ai/decision

- `__init__.py`: Python module: from atlas_ai.decision.decision_engine import DecisionEngine
- `decision_engine.py`: Python module definition: class DecisionEngine:
- `decision_router.py`: Python module definition: class DecisionRouter:

### atlas-ai-py/atlas_ai/inference

- `__init__.py`: Python module: from atlas_ai.inference.onnx_runtime import ONNXRuntime, Tensor
- `onnx_runtime.py`: Python module definition: class Tensor:

### atlas-ai-py/atlas_ai/intelligence

- `__init__.py`: Python module: from atlas_ai.intelligence.event_intelligence import EventIntelligence
- `event_intelligence.py`: Python module definition: class EventIntelligence:

### atlas-ai-py/atlas_ai/language

- `__init__.py`: Python module: from atlas_ai.language.language_model import LanguageModel
- `language_model.py`: Python module definition: class LanguageGenerationOptions:

### atlas-ai-py/atlas_ai/learning

- `__init__.py`: Python module: from atlas_ai.learning.neural_network import NeuralNetwork
- `neural_network.py`: Python module definition: class NeuralNetwork:

### atlas-ai-py/atlas_ai/optimization

- `__init__.py`: Python module: from atlas_ai.optimization.deep_optimizer import DeepOptimizer
- `deep_optimizer.py`: Python module definition: class OptimizationResult:

### atlas-ai-py/atlas_ai/policy

- `__init__.py`: Python module: from atlas_ai.policy.policy_engine import Policy, EpsilonGreedyPolicy, RandomPolicy, PolicyEngine
- `policy_engine.py`: Python module definition: class Observation:

### atlas-ai-py/atlas_ai/prediction

- `__init__.py`: Python module: from atlas_ai.prediction.predictive_model import PredictiveModel
- `predictive_model.py`: Python module definition: class PredictionMetrics:

### atlas-ai-py/atlas_ai/reasoning

- `__init__.py`: Python module: from atlas_ai.reasoning.deep_reasoning import DeepReasoningEngine
- `deep_reasoning.py`: Python module definition: class ReasoningNode:
- `types.py`: Python module definition: class EventPriority(IntEnum):

### atlas-ai-py/atlas_ai/vision

- `__init__.py`: Python module: from atlas_ai.vision.vision_processor import VisionProcessor, Tensor, DetectedObject, CameraFrame
- `vision_processor.py`: Python module definition: class Tensor:
- `pyproject.toml`: Data/config file (23 lines)

### atlas-ai-py/tests

- `__init__.py`: Python module file
- `test_decision.py`: Python module definition: def test_decision_engine_tick_high_latency():
- `test_deep_optimizer.py`: Python module definition: def test_optimize_basic():
- `test_deep_reasoning.py`: Python module definition: def engine():
- `test_event_intelligence.py`: Python module definition: def test_classify_system():
- `test_language_model.py`: Python module definition: def lm():
- `test_neural_network.py`: Python module definition: def test_initialization():
- `test_onnx_runtime.py`: Python module definition: def runtime():
- `test_policy_engine.py`: Python module definition: def policy():
- `test_predictive_model.py`: Python module definition: def test_initialization():
- `test_vision_processor.py`: Python module: import pytest

## atlas-ai

TypeScript AI modules: decision engine/router, event intelligence, reasoning, vision, language model, neural network, optimizer, policy, prediction.


### atlas-ai/Decision

- `DecisionEngine.ts`: Exports: DecisionEngine
- `DecisionRouter.ts`: Exports: DecisionRouter
- `types.ts`: Exports: DecisionContext, Decision

### atlas-ai/Inference

- `ONNXRuntime.ts`: * ONNX Runtime wrapper with deterministic feedforward inference. | Exports: InferenceSessionOptions, Tensor, ONNXRuntime

### atlas-ai/Intelligence

- `EventIntelligence.ts`: 1. Classification | Exports: EventIntelligence

### atlas-ai/Language

- `LanguageModel.ts`: Exports: LanguageGenerationOptions, TextAnalysisResult, EmbeddingResult, LanguageModel

### atlas-ai/Learning

- `NeuralNetwork.ts`: * NeuralNetwork - A simple feedforward neural network implementation * Supports forward propagation, backpropagation, and training | Exports: NeuralNetwork

### atlas-ai/Optimization

- `DeepOptimizer.ts`: * DeepOptimizer - Advanced optimization component * Supports various optimization strategies and convergence detection | Exports: OptimizationResult, OptimizationConfig, OptimizationState, DeepOptimizer

### atlas-ai/Policy

- `PolicyEngine.ts`: * Policy Engine - selects actions based on observations | Exports: Observation, Action, EpsilonGreedyPolicy, RandomPolicy, PolicyEngine

### atlas-ai/Prediction

- `PredictiveModel.ts`: * PredictiveModel - Time series forecasting and prediction model * Supports training, prediction, and evaluation metrics | Exports: PredictionMetrics, TrainingHistory, ForecastResult, PredictiveModel

### atlas-ai/Reasoning

- `DeepReasoning.ts`: Exports: ReasoningNode, ReasoningPath, ReasoningResult, AnalysisResult, PredictionResult, LearningResult, DeepReasoningEngine

### atlas-ai/Vision

- `VisionProcessor.ts`: Exports: VisionProcessor

## atlas-cli

Command-line interface entrypoint and TypeScript config.


### atlas-cli/src

- `index.ts`: #!/usr/bin/env node
- `tsconfig.json`: Data/config with keys: ['extends', 'compilerOptions', 'include', 'exclude']

## atlas-examples

Demo scripts and example applications.

- `BasicTask.ts`: Exports: BasicTask

## atlas-fleet

Multi-robot fleet coordination, swarm communication, and telemetry streaming.


### atlas-fleet/Coordinator

- `FleetCoordinator.ts`: * Represents a mission assigned to fleet nodes. | Exports: FleetMission, MissionTask, ConsensusResult, FleetCoordinator

### atlas-fleet/Swarm

- `Swarm.ts`: * Represents a signal sent between swarm agents. | Exports: SwarmSignal, SwarmBehaviorPattern, SwarmBehavior, SwarmConsensusResult, Swarm

### atlas-fleet/Telemetry

- `FleetTelemetry.ts`: * Represents a node in the fleet with its current state and health information. | Exports: FleetNode, TelemetryData, FleetTelemetry

## atlas-hardware-cpp

C++ hardware bridge daemon source, native driver implementations, tests, and build artifacts.


### atlas-hardware-cpp/include/atlas_hardware/Bridge

- `HardwareBridge.h`: C++ source: #pragma once

### atlas-hardware-cpp/include/atlas_hardware/Drivers/Device

- `NMEAGPSSensor.h`: C++ source: #pragma once
- `SerialMotorController.h`: C++ source: Build simple text protocol: "CMD opcode param1=val1 param2=val2\n"
- `V4L2CameraDriver.h`: C++ source: #pragma once

### atlas-hardware-cpp/include/atlas_hardware/Drivers/Real

- `CANBusDriver.h`: C++ source: #pragma once
- `SerialPortDriver.h`: C++ source: #pragma once
- `SysfsGPIODriver.h`: C++ source: #pragma once

### atlas-hardware-cpp/include/atlas_hardware/HAL

- `HardwareAbstractionLayer.h`: C++ source: #pragma once

### atlas-hardware-cpp/include/atlas_hardware

- `HardwareManager.h`: C++ source: #pragma once

### atlas-hardware-cpp/include/atlas_hardware/Interfaces

- `BaseDriver.h`: C++ source: #pragma once
- `CANDriver.h`: C++ source: #pragma once
- `GPIODriver.h`: C++ source: #pragma once
- `SerialDriver.h`: C++ source: #pragma once

### atlas-hardware-cpp/include/atlas_hardware/Protocol

- `NMEAParser.h`: C++ source: trim \r

### atlas-hardware-cpp/include/atlas_hardware/Transport

- `CANTransport.h`: C++ source: #pragma once
- `GPIOBackend.h`: C++ source: #pragma once
- `SerialTransport.h`: C++ source: #pragma once
- `Types.h`: C++ source: #pragma once

### atlas-hardware-cpp/src

- `hardware_daemon.cpp`: C++ source: ── Minimal JSON helpers ──────────────────────────────────────────

### atlas-hardware-cpp/tests

- `test_bridge.cpp`: C++ source: Expect no crash/exception
- `test_can.cpp`: C++ source: #include <gtest/gtest.h>
- `test_device_drivers.cpp`: C++ source: Second fix with different coordinates
- `test_gpio.cpp`: C++ source: After shutdown, reading should throw
- `test_hal.cpp`: C++ source: #include <gtest/gtest.h>
- `test_hardware_manager.cpp`: C++ source: #include <gtest/gtest.h>
- `test_main.cpp`: C++ source: #include <gtest/gtest.h>
- `test_nmea_parser.cpp`: C++ source: Multiple sentences in one chunk
- `test_serial.cpp`: C++ source: #include <gtest/gtest.h>
- `test_transport.cpp`: C++ source: ---- Serial Transport ----

## atlas-hardware

Hardware abstraction layer, drivers for serial/CAN/GPIO, NMEA and other protocols, transports, and the bridge to the C++ daemon.


### atlas-hardware/Bridge

- `CppBridge.ts`: Exports: CppBridgeDaemon, CppGPSSensor, CppMotorActuator, CppCameraSensor
- `HardwareBridge.ts`: Exports: HardwareDeviceBundle, HardwareBridge, createDefaultHardwareStack

### atlas-hardware/Drivers/Devices

- `NMEAGPSSensor.ts`: Exports: NMEAGPSSensor, NMEAGPSSensorAdapter
- `SerialMotorActuator.ts`: Exports: SerialMotorController, SerialMotorActuator

### atlas-hardware/Drivers/Mock

- `MockDrivers.ts`: Exports: MockMotor, mockGPSReading, MockGPS, mockCameraFrame, MockCamera

### atlas-hardware/Drivers/Real

- `CANBusDriver.ts`: Exports: CANBusDriver
- `SerialPortDriver.ts`: Exports: SerialPortDriver
- `SysfsGPIODriver.ts`: Exports: SysfsGPIODriver

### atlas-hardware/HAL

- `HardwareAbstractionLayer.ts`: * Hardware Abstraction Layer (HAL) * Provides uniform interface to all hardware | Exports: HardwareStatus, HardwareInfo, HardwareAbstractionLayer

### atlas-hardware/Interfaces

- `BaseDriver.ts`: export abstract class BaseDriver {
- `CANDriver.ts`: Exports: CANFrame
- `GPIODriver.ts`: Exports: GPIOMode, GPIOValue
- `SerialDriver.ts`: export abstract class SerialDriver extends BaseDriver {

### atlas-hardware/Protocol

- `NMEAParser.ts`: Exports: NMEAFix, NMEAParser

### atlas-hardware/Transport

- `CANTransport.ts`: Exports: CANTransport, MemoryCANTransport, SocketCANTransport
- `GPIOBackend.ts`: Exports: GPIOBackend, MemoryGPIOBackend, SysfsGPIOBackend
- `SerialTransport.ts`: Exports: SerialTransportOptions, SerialTransport, MemorySerialTransport, TcpSerialTransport

## atlas-kernel

Foundational types, event system, hardware interfaces, capability registry, and utilities/helpers.


### atlas-kernel/Capability

- `Capability.ts`: Exports: CapabilityType, Capability, MotionCapability, SensingCapability, ImagingCapability, CommunicationCapability, ComputationCapability, StorageCapability, ManipulationCapability, AnyCapability
- `CapabilityRegistry.ts`: Exports: CapabilityRegistry

### atlas-kernel/Communication

- `AgentMessage.ts`: Exports: AgentMessage, AgentSignal
- `ROS2.ts`: Exports: ROS2Message, ROS2Callback, IROS2Bridge

### atlas-kernel/Entity

- `Entity.ts`: Exports: EntityID, Entity

### atlas-kernel/Event

- `Event.ts`: Exports: EventType, EventPriority, Event
- `EventBus.ts`: Exports: EventBus

### atlas-kernel/Hardware

- `Hardware.ts`: Exports: CapabilityType, HardwareCapability, Actuator, Sensor

### atlas-kernel/Mission

- `Mission.ts`: Exports: MissionStatus, Goal, Mission

### atlas-kernel/Perception

- `LocalMap.ts`: Exports: MapObject, LocalMap
- `StateEstimate.ts`: Exports: Vector3, Quaternion, StateEstimate, Observation

### atlas-kernel/Studio

- `StudioProtocol.ts`: * Atlas Studio ↔ Runtime WebSocket protocol | Exports: RuntimeStatus, StudioAgentInfo, StudioTaskInfo, StudioMemoryStats, StudioWorldObject, StudioWorldState, StudioSnapshot, StudioClientMessage, StudioServerMessage, STUDIO_WS_PATH

### atlas-kernel/Task

- `Task.ts`: Exports: TaskStatus, Task

### atlas-kernel/utils

- `deterministic.ts`: Deterministic pseudo-random value in [0, 1) from a numeric seed. | Exports: seededUnit, seededRange, seededInt, hashString
- `uuid.ts`: * Simple UUID generator (no external dependencies) | Exports: uuidv4

## atlas-memory

Memory subsystems: short-term, long-term, semantic memory, knowledge graph, world model.


### atlas-memory/KnowledgeGraph

- `GraphEdge.ts`: Exports: GraphEdge
- `GraphNode.ts`: Exports: GraphNode
- `KnowledgeGraph.ts`: Exports: KnowledgeGraph

### atlas-memory/WorldModel

- `WorldModel.ts`: Exports: WorldModel
- `WorldObject.ts`: Exports: WorldPosition, WorldObject

## atlas-navigation-cpp

C++ navigation core: SLAM engine, localization, feature extraction, graph optimization, tests, and build artifacts.


### atlas-navigation-cpp/include/atlas_navigation/Localization

- `EnhancedLocalization.h`: C++ source: #pragma once

### atlas-navigation-cpp/include/atlas_navigation/Navigation

- `GeofenceManager.h`: C++ source: #pragma once
- `ObstacleAvoidance.h`: C++ source: #pragma once
- `RoutePlanner.h`: C++ source: #pragma once
- `TerrainMap.h`: C++ source: #pragma once
- `Waypoint.h`: C++ source: #pragma once

### atlas-navigation-cpp/include/atlas_navigation/Planning

- `BehaviorTree.h`: C++ source: #pragma once
- `TaskPlanner.h`: C++ source: #pragma once

### atlas-navigation-cpp/include/atlas_navigation/SLAM

- `FeatureExtractor.h`: C++ source: #pragma once
- `GraphOptimizer.h`: C++ source: #pragma once
- `SLAMEngine.h`: C++ source: #pragma once
- `SLAMTypes.h`: C++ source: #pragma once

### atlas-navigation-cpp/include/atlas_navigation

- `Types.h`: C++ source: #pragma once

### atlas-navigation-cpp/src

- `EnhancedLocalization.cpp`: C++ source: #include "atlas_navigation/Localization/EnhancedLocalization.h"
- `FeatureExtractor.cpp`: C++ source: --- ORBDetector ---
- `GraphOptimizer.cpp`: C++ source: --- GraphOptimizer ---
- `SLAMEngine.cpp`: C++ source: Create default info matrix

### atlas-navigation-cpp/tests

- `test_behavior_tree.cpp`: C++ source: #include <gtest/gtest.h>
- `test_enhanced_localization.cpp`: C++ source: #include <gtest/gtest.h>
- `test_feature_extractor.cpp`: C++ source: #include <gtest/gtest.h>
- `test_geofence.cpp`: C++ source: #include <gtest/gtest.h>
- `test_graph_optimizer.cpp`: C++ source: Can't easily get edge id, but test it doesn't crash
- `test_main.cpp`: C++ source: #include <gtest/gtest.h>
- `test_obstacle_avoidance.cpp`: C++ source: Vector points away from obstacle at (2,2): repulsion pushes from obstacle
- `test_route_planner.cpp`: C++ source: 0->(1.5,2)->(3,4) = sqrt(1.5^2+2^2) * 2 = 2.5 * 2 = 5
- `test_slam_engine.cpp`: C++ source: Set a recent timestamp so dt is reasonable
- `test_task_planner.cpp`: C++ source: #include <gtest/gtest.h>
- `test_terrain_map.cpp`: C++ source: #include <gtest/gtest.h>
- `test_waypoint.cpp`: C++ source: #include <gtest/gtest.h>

## atlas-navigation

Navigation stack components: route planning, obstacle avoidance, SLAM, localization, terrain mapping, geofencing.


### atlas-navigation/Avoidance

- `ObstacleAvoidance.ts`: Exports: Obstacle, ObstacleAvoidance

### atlas-navigation/Geofencing

- `Geofence.ts`: Exports: GeofenceType, Geofence, GeofenceManager

### atlas-navigation/Localization

- `EnhancedLocalization.ts`: * Enhanced Localization - SLAM-based localization system | Exports: LocalizationResult, MapUpdateInfo, EnhancedLocalization

### atlas-navigation/RoutePlanning

- `RoutePlanner.ts`: Exports: Waypoint, Route, RoutePlanner

### atlas-navigation/SLAM

- `FeatureExtractor.ts`: * Feature Extractor - Extracts features from observations for SLAM | Exports: Detector, DescriptorExtractor, FeatureExtractionResult, FeatureExtractor
- `GraphOptimizer.ts`: * Graph Optimizer - Pose graph optimization for SLAM | Exports: GraphOptimizerConfig, GraphOptimizer
- `SLAMTypes.ts`: * SLAM Types - Core type definitions for SLAM integration | Exports: SLAMConfig, SLAMState, Pose, MapPoint, KeypointObservation, Keyframe, KeyframeConnection, Keypoint

### atlas-navigation/Terrain

- `TerrainMap.ts`: Exports: TerrainCell, TerrainMap

### atlas-navigation/Waypoint

- `Waypoint.ts`: Exports: Waypoint, WaypointStatus, WaypointEntry

## atlas-network

Networking stack: NATS and WebSocket transports, gRPC stub, message broker, node discovery.


### atlas-network/Discovery

- `NodeDiscovery.ts`: Exports: NodeInfo, DiscoveryEvent, NodeDiscovery

### atlas-network/Grpc

- `GrpcStub.ts`: Exports: ServiceDefinition, GrpcCallOptions, GrpcStub
- `MessageBroker.ts`: Exports: BrokerPattern, PublishOptions, SubscribeOptions, MessageBroker

### atlas-network/Transport

- `NATSClient.ts`: Exports: ConnectionState, NATSClient
- `NATSTransport.ts`: Exports: NATSTransport
- `Transport.ts`: Exports: TransportMessage
- `WebSocketTransport.ts`: Exports: WebSocketTransport

## atlas-perception-py

Python perception sensors, vision/depth/lidar/IMU/GPS drivers, pipeline, hardware bridge, and tests.


### atlas-perception-py/.pytest_cache

- `README.md`: Markdown documentation: This directory contains data from the pytest's cache plugin,

### atlas-perception-py/atlas_perception

- `__init__.py`: Python module file

### atlas-perception-py/atlas_perception/camera

- `__init__.py`: Python module file
- `camera_sensor.py`: Python module definition: def default_frame_provider(config: dict) -> CameraFrame:

### atlas-perception-py/atlas_perception/depth

- `__init__.py`: Python module file
- `depth_sensor.py`: Python module definition: class DepthSensor:

### atlas-perception-py/atlas_perception/detection

- `__init__.py`: Python module file
- `object_detector.py`: Python module definition: class ObjectDetector:
- `deterministic.py`: Python module definition: def seeded_unit(seed: float) -> float:

### atlas-perception-py/atlas_perception/gps

- `__init__.py`: Python module file
- `gps_sensor.py`: Python module definition: def default_gps_provider() -> GPSData:

### atlas-perception-py/atlas_perception/hardware

- `__init__.py`: Python module file
- `cpp_bridge.py`: Python module definition: class CppBridge:

### atlas-perception-py/atlas_perception/imu

- `__init__.py`: Python module file
- `imu_sensor.py`: Python module definition: class IMUSensor:

### atlas-perception-py/atlas_perception/lidar

- `__init__.py`: Python module file
- `lidar_sensor.py`: Python module definition: class LidarSensor:

### atlas-perception-py/atlas_perception/pipeline

- `__init__.py`: Python module file
- `perception_pipeline.py`: Python module definition: class PerceptionPipeline:

### atlas-perception-py/atlas_perception/radar

- `__init__.py`: Python module file
- `radar_sensor.py`: Python module definition: class RadarSensor:

### atlas-perception-py/atlas_perception/thermal

- `__init__.py`: Python module file
- `thermal_sensor.py`: Python module definition: class ThermalSensor:
- `types.py`: Python module definition: class CameraFrame(NamedTuple):
- `pyproject.toml`: Data/config file (15 lines)

### atlas-perception-py/tests

- `__init__.py`: Python module file
- `test_camera_sensor.py`: Python module definition: class TestCameraSensorDefaults:
- `test_depth_sensor.py`: Python module definition: class TestDepthSensor:
- `test_gps_sensor.py`: Python module definition: class TestGPSSensor:
- `test_imu_sensor.py`: Python module definition: class TestIMUSensor:
- `test_lidar_sensor.py`: Python module definition: class TestLidarSensorDefaults:
- `test_object_detector.py`: Python module definition: def make_test_frame(width=64, height=64, value=200):
- `test_perception_pipeline.py`: Python module definition: def _bright_frame_provider(config):
- `test_radar_sensor.py`: Python module definition: class TestRadarSensor:
- `test_thermal_sensor.py`: Python module definition: class TestThermalSensor:

## atlas-perception

Perception pipeline: camera, lidar, depth, radar, IMU, GPS sensors, object detection, frame types, and pipeline orchestration.


### atlas-perception/Camera

- `CameraSensor.ts`: * Camera Sensor Interface | Exports: CameraFrame, CameraConfig, FrameProvider, CameraSensor

### atlas-perception/Depth

- `DepthSensor.ts`: Exports: DepthFrame, DepthSensor

### atlas-perception/GPS

- `GPSSensor.ts`: Exports: GPSData, GPSDataProvider, GPSSensor

### atlas-perception/IMU

- `IMUSensor.ts`: Exports: IMUData, IMUSensor

### atlas-perception/Lidar

- `LidarSensor.ts`: Exports: LidarPoint, LidarScan, LidarConfig, LidarSensor

### atlas-perception/ObjectDetection

- `ObjectDetector.ts`: * Object Detection using brightness-region blob analysis. | Exports: DetectedObject, ObjectDetectionConfig, ObjectDetector
- `PerceptionPipeline.ts`: * Perception Pipeline - integrates sensors and processing * Part of atlas-perception module | Exports: PerceptionState, PerceptionPipeline

### atlas-perception/Radar

- `RadarSensor.ts`: Exports: RadarPoint, RadarScan, RadarSensor

### atlas-perception/Thermal

- `ThermalSensor.ts`: Exports: ThermalFrame, ThermalSensor

## atlas-planning

Legacy/planning modules: task planner interfaces and behavior tree definitions.


### atlas-planning/BehaviorTree

- `BehaviorTree.ts`: * BehaviorTree.ts * Complete Behavior Tree implementation for the Atlas robotics platform. | Exports: NodeStatus, ActionNode, ConditionNode, SequenceNode, SelectorNode, ParallelNode

### atlas-planning/TaskPlanner

- `TaskPlanner.ts`: Exports: TaskPlanner

## atlas-runtime

Main runtime lifecycle, event bus, task/mission management, SLAM engine, sensor fusion, memory stores, ROS2 bridge, hardware manager, logger, and plugin system.


### atlas-runtime/Autonomy

- `AutonomousAgent.ts`: * Autonomous Agent - Implements the full Observe → Remember → Reason → Plan → Act → Learn loop | Exports: AgentState, AutonomousAgent

### atlas-runtime/Communication

- `ROS2Bridge.ts`: Exports: ROS2Bridge

### atlas-runtime/Configuration

- `Configuration.ts`: Exports: ConfigOptions, Configuration

### atlas-runtime/HardwareManager

- `HardwareManager.ts`: Exports: HardwareManager

### atlas-runtime/Lifecycle

- `AtlasRuntime.ts`: Exports: AtlasRuntime

### atlas-runtime/Logging

- `Logger.ts`: Exports: LogLevel, LogEntry, Logger, logger

### atlas-runtime/Memory

- `Embedder.ts`: Exports: Vector, Embedder, LocalEmbedder
- `LongTermMemory.ts`: Exports: MemoryData, LongTermMemory
- `SemanticMemory.ts`: Exports: SemanticEntry, SemanticMemory
- `ShortTermMemory.ts`: Exports: ShortTermMemory

### atlas-runtime/MissionManager

- `MissionManager.ts`: Exports: MissionManager

### atlas-runtime/Perception

- `SLAMEngine.ts`: * SLAM Engine configuration | Exports: SLAMEngineConfig, SLAMKeyframe, KeyframeConnection, Transform3D, LoopClosureResult, PoseGraphResult, SLAMEngine
- `SensorFusion.ts`: Exports: SensorFusion

### atlas-runtime/Planner

- `TaskPlanner.ts`: Exports: TaskPlanner

### atlas-runtime/PluginManager

- `PluginManager.ts`: Exports: Plugin, PluginManager

### atlas-runtime/Recovery

- `RecoverySystem.ts`: Exports: RecoverySystem

### atlas-runtime/Scheduler

- `Scheduler.ts`: Exports: Scheduler

### atlas-runtime/Studio

- `StudioBridge.ts`: Exports: StudioBridge
- `StudioServer.ts`: Exports: StudioServerOptions, StudioServer

### atlas-runtime/Task

- `HardwareTask.ts`: Exports: HardwareTask

### atlas-runtime/TaskManager

- `TaskManager.ts`: Exports: TaskManager

### atlas-runtime/Telemetry

- `FleetTelemetry.ts`: * Represents a tracked node in the runtime system. | Exports: TrackedNode, NodeMetrics, TelemetryBufferEntry, FleetTelemetry

## atlas-sdk

SDK bindings and examples for external consumers (Python SDK, docs).


### atlas-sdk/python

- `README.md`: Markdown documentation: Official Python SDK for the Atlas universal intelligent machine platform.

### atlas-sdk/python/atlas_sdk

- `__init__.py`: Python module: from .client import AtlasClient
- `client.py`: Python module definition: class AtlasClient:
- `config.py`: Python module definition: class Config:
- `entity.py`: Python module definition: class Entity:
- `event.py`: Python module definition: class Event:
- `setup.py`: Python module: from setuptools import setup, find_packages

## atlas-security

Security layer: authentication, authorization, user, and token management.


### atlas-security/Authentication

- `Authenticator.ts`: Add default admin user for testing | Exports: Authenticator
- `User.ts`: Exports: User, AuthToken

### atlas-security/Authorization

- `Authorizer.ts`: Exports: Authorizer

## atlas-simulation

Simulation environment: physics engine, collision detection, scene management, HUD, sensor visualization, runtime bridge.

- `package-lock.json`: Data/config file (1543 lines)
- `package.json`: Data/config with keys: ['name', 'version', 'private', 'type', 'scripts', 'dependencies', 'devDependencies']

### atlas-simulation/src

- `RuntimeBridge.ts`: Exports: RuntimeStatus, RuntimeBridge

### atlas-simulation/src/core

- `Simulation.ts`: Exports: Simulation
- `SimulationConfig.ts`: Exports: SimulationConfig, DEFAULT_CONFIG
- `SimulationEvents.ts`: Exports: SimulationEvents

### atlas-simulation/src/entities

- `EntityBase.ts`: export abstract class EntityBase {
- `Robot.ts`: Exports: Robot
- `RobotController.ts`: Exports: ControllerState, RobotController

### atlas-simulation/src/environment

- `Obstacles.ts`: Exports: ObstacleData, Obstacles
- `Terrain.ts`: Exports: Terrain
- `Waypoints.ts`: Exports: Waypoints

### atlas-simulation/src/hud

- `Controls.ts`: Exports: Controls
- `HUD.ts`: Exports: HUD
- `MiniMap.ts`: Exports: MiniMap
- `TelemetryPanel.ts`: Exports: TelemetryPanel
- `main.ts`: const sim = new Simulation();

### atlas-simulation/src/physics

- `CollisionDetector.ts`: Exports: Collider, CollisionDetector
- `PhysicsEngine.ts`: Exports: PhysicsEngine

### atlas-simulation/src/scene

- `CameraController.ts`: Exports: CamMode, CameraController
- `Environment.ts`: Exports: Environment
- `SceneManager.ts`: Exports: SceneManager

### atlas-simulation/src/sensors

- `CameraVisualizer.ts`: Exports: CameraVisualizer
- `GPSTrail.ts`: Exports: GPSTrail
- `LidarVisualizer.ts`: Exports: LidarVisualizer
- `RadarVisualizer.ts`: Exports: RadarVisualizer
- `SensorVisualizer.ts`: export abstract class SensorVisualizer {

### atlas-simulation/tests

- `collision.test.ts`: describe('CollisionDetector', () => {
- `physics.test.ts`: function makeConfig(overrides?: Partial<SimulationConfig>): SimulationConfig {
- `robot_controller.test.ts`: describe('RobotController', () => {
- `simulation_events.test.ts`: describe('SimulationEvents', () => {
- `tsconfig.json`: Data/config with keys: ['compilerOptions', 'include']
- `vite.config.ts`: export default defineConfig({

## atlas-studio

Atlas Studio IDE frontend: React app, 3D world view, connection hooks, protocol definitions, bridge to runtime.

- `package-lock.json`: Data/config file (3583 lines)
- `package.json`: Data/config with keys: ['name', 'private', 'version', 'type', 'scripts', 'dependencies', 'devDependencies']

### atlas-studio/src

- `App.tsx`: function App() {

### atlas-studio/src/components

- `WorldView3D.tsx`: interface Props {

### atlas-studio/src/hooks

- `useAtlasConnection.ts`: Exports: useAtlasConnection
- `main.tsx`: ReactDOM.createRoot(document.getElementById('root')!).render(

### atlas-studio/src/types

- `protocol.ts`: Exports: RuntimeStatus, StudioAgentInfo, StudioTaskInfo, StudioMemoryStats, StudioWorldObject, StudioWorldState, StudioSnapshot, StudioClientMessage, StudioServerMessage, STUDIO_WS_URL
- `vite-env.d.ts`: <reference types="vite/client" />
- `tsconfig.json`: Data/config with keys: ['compilerOptions', 'include', 'references']
- `tsconfig.node.json`: Data/config with keys: ['compilerOptions', 'include']
- `vite.config.ts`: https://vitejs.dev/config/

## atlas-supabase

Supabase backend configuration, migrations, and schema definitions.

- `package-lock.json`: Data/config file (3961 lines)
- `package.json`: Data/config with keys: ['name', 'version', 'description', 'main', 'types', 'scripts', 'dependencies', 'devDependencies', 'jest']

### atlas-supabase/src

- `client.ts`: Exports: createClient, setClient, resetClient

### atlas-supabase/src/config

- `index.ts`: Exports: config

### atlas-supabase/src/events

- `event_bus_supabase.ts`: Exports: EventBusSupabase
- `event_store.ts`: Exports: EventStore
- `index.ts`: export { EventStore } from './event_store';
- `index.ts`: export { createClient, setClient, resetClient } from './client';

### atlas-supabase/src/knowledge

- `graph_queries.ts`: Exports: PathResult, GraphQueries
- `index.ts`: export { KnowledgeGraph } from './knowledge_graph';
- `knowledge_graph.ts`: Exports: KnowledgeGraph

### atlas-supabase/src/memory

- `index.ts`: export { ShortTermMemory } from './short_term_memory';
- `long_term_memory.ts`: Exports: EventFilters, LongTermMemory
- `semantic_memory.ts`: Exports: SemanticMemory
- `short_term_memory.ts`: Exports: ShortTermMemory
- `types.ts`: DB row types | Exports: EventRow, WorldObjectRow, GraphNodeRow, GraphEdgeRow, MemoryEntryRow, SystemConfigRow, EventInput, WorldObjectInput, GraphNodeInput, GraphEdgeInput

### atlas-supabase/src/world

- `index.ts`: export { WorldModel } from './world_model';
- `spatial_index.ts`: Exports: BoundingBox, SpatialIndex
- `world_model.ts`: Exports: WorldModel

### atlas-supabase/supabase/migrations

- `001_initial_schema.sql`: SQL script (85 lines)

### atlas-supabase/supabase

- `seed.sql`: SQL script (6 lines)

### atlas-supabase/tests/events

- `event_store.test.ts`: describe('EventStore', () => {

### atlas-supabase/tests

- `helpers.ts`: Exports: createTestEvent, createTestWorldObject, createTestNode, createTestEdge

### atlas-supabase/tests/knowledge

- `graph_queries.test.ts`: describe('GraphQueries', () => {
- `knowledge_graph.test.ts`: describe('KnowledgeGraph', () => {

### atlas-supabase/tests/memory

- `long_term_memory.test.ts`: describe('LongTermMemory', () => {
- `semantic_memory.test.ts`: describe('SemanticMemory', () => {
- `short_term_memory.test.ts`: describe('ShortTermMemory', () => {
- `setup.ts`: const client = createClient();

### atlas-supabase/tests/world

- `spatial_index.test.ts`: describe('SpatialIndex', () => {
- `world_model.test.ts`: describe('WorldModel', () => {
- `tsconfig.json`: Data/config with keys: ['compilerOptions', 'include', 'exclude']

## atlas-tests

Jest test suites and fixtures mirroring core modules.


### atlas-tests/agents

- `BatteryAgent.test.ts`: function makeMockRuntime() {
- `DiagnosticsAgent.test.ts`: function makeMockRuntime() {
- `LocalizationAgent.test.ts`: describe("LocalizationAgent", () => {
- `MissionAgent.test.ts`: describe("MissionAgent", () => {
- `NavigationAgent.test.ts`: ---------------------------------------------------------------------------
- `PlanningAgent.test.ts`: describe("PlanningAgent", () => {
- `SafetyAgent.test.ts`: function makeMockRuntime() {
- `SpeechAgent.test.ts`: describe("SpeechAgent", () => {
- `SwarmCommunication.test.ts`: describe("SwarmCommunication", () => {
- `SystemAgent.test.ts`: describe("SystemAgent", () => {
- `TaskAgent.test.ts`: describe("TaskAgent", () => {

### atlas-tests/ai

- `DeepOptimizer.test.ts`: describe("DeepOptimizer", () => {
- `DeepReasoning.test.ts`: describe("DeepReasoningEngine", () => {
- `EventIntelligence.test.ts`: describe("EventIntelligence", () => {
- `NeuralNetwork.test.ts`: describe("NeuralNetwork", () => {
- `ONNXRuntime.test.ts`: describe("ONNXRuntime", () => {
- `PolicyEngine.test.ts`: describe("PolicyEngine", () => {
- `PredictiveModel.test.ts`: describe("PredictiveModel", () => {

### atlas-tests/autonomy

- `AutonomousAgent.test.ts`: describe("AutonomousAgent", () => {

### atlas-tests/fleet

- `FleetCoordinator.test.ts`: describe("FleetCoordinator", () => {
- `FleetTelemetry.test.ts`: describe("FleetTelemetry", () => {
- `Swarm.test.ts`: describe("Swarm", () => {

### atlas-tests/hardware

- `CANBusDriver.test.ts`: describe("CANBusDriver", () => {
- `HAL.test.ts`: class MockDriver implements BaseDriver {
- `HardwareBridge.test.ts`: describe("NMEAGPSSensor", () => {
- `NMEAParser.test.ts`: describe("NMEAParser", () => {
- `SerialPortDriver.test.ts`: describe("SerialPortDriver", () => {
- `SysfsGPIODriver.test.ts`: describe("SysfsGPIODriver", () => {

### atlas-tests/kernel

- `CapabilityRegistry.test.ts`: CapabilityType,
- `EventBus.test.ts`: describe("EventBus", () => {

### atlas-tests/memory

- `KnowledgeGraph.test.ts`: describe("KnowledgeGraph", () => {
- `WorldModel.test.ts`: describe("WorldModel", () => {

### atlas-tests/navigation

- `EnhancedLocalization.test.ts`: describe("EnhancedLocalization", () => {
- `FeatureExtractor.test.ts`: describe("FeatureExtractor", () => {
- `GraphOptimizer.test.ts`: describe("GraphOptimizer", () => {
- `RoutePlanner.test.ts`: describe("RoutePlanner", () => {

### atlas-tests/network

- `GrpcStub.test.ts`: const calculatorService: ServiceDefinition = {
- `MessageBroker.test.ts`: describe("MessageBroker", () => {
- `NATSClient.test.ts`: describe("NATSClient", () => {
- `NATSErrorHandling.test.ts`: describe("NATS Error Handling", () => {
- `NATSRequestReply.test.ts`: describe("NATS Request-Reply", () => {
- `NATSTransport.test.ts`: describe("NATSTransport", () => {
- `NodeDiscovery.test.ts`: describe("NodeDiscovery", () => {
- `WebSocketTransport.test.ts`: describe("WebSocketTransport", () => {

### atlas-tests/perception

- `CameraSensor.test.ts`: describe("CameraSensor", () => {
- `LidarSensor.test.ts`: describe("LidarSensor", () => {
- `ObjectDetector.test.ts`: describe("ObjectDetector", () => {
- `PerceptionPipeline.test.ts`: describe("PerceptionPipeline", () => {

### atlas-tests/planning

- `BehaviorTree.test.ts`: NodeStatus,
- `TaskPlanner.test.ts`: Mock uuid so we can verify IDs are generated

### atlas-tests/runtime

- `AtlasRuntime.test.ts`: class NoopAgent extends BaseAgent {
- `Configuration.test.ts`: Clean up test file before each test
- `HardwareManager.test.ts`: describe("HardwareManager", () => {
- `Logger.test.ts`: describe("Logger", () => {
- `LongTermMemory.test.ts`: describe("LongTermMemory", () => {
- `MissionManager.test.ts`: describe("MissionManager", () => {
- `PluginManager.test.ts`: describe("PluginManager", () => {
- `ROS2Bridge.test.ts`: describe("ROS2Bridge", () => {
- `RecoverySystem.test.ts`: describe("RecoverySystem", () => {
- `SLAMEngine.test.ts`: describe("SLAMEngine", () => {
- `SemanticMemory.test.ts`: describe("SemanticMemory", () => {
- `SensorFusion.test.ts`: describe("SensorFusion", () => {
- `ShortTermMemory.test.ts`: describe("ShortTermMemory", () => {
- `TaskManager.test.ts`: describe("TaskManager", () => {
- `TaskPlanner.test.ts`: describe("TaskPlanner", () => {

### atlas-tests/security

- `Authenticator.test.ts`: describe("Authenticator", () => {
- `Authorizer.test.ts`: describe("Authorizer", () => {

### atlas-tests/studio

- `StudioBridge.test.ts`: describe("StudioBridge", () => {

## codebase.md

- `codebase.md`: Markdown documentation: This document describes every tracked source, configuration, and documentation file in the Atlas repository. It is organized by top-level module.

## docker-compose.yml

- `docker-compose.yml`: YAML configuration (63 lines)

## docs

Design documents, architecture notes, roadmap, and tech-stack overviews.

- `architecture.md`: Markdown documentation: Atlas Architecture Specification v0.1
- `roadmap.md`: Markdown documentation: 🧭 ATLAS ROADMAP (FULL SYSTEM EVOLUTION)
- `tech-stack.md`: Markdown documentation: Atlas is a universal software platform for intelligent machines, designed with a polyglot architecture to leverage the best tools for each layer.

## examples

High-level demo scripts.

- `demo-autonomous-agent.ts`: #!/usr/bin/env ts-node
- `studio-server.ts`: const port = Number(process.env.ATLAS_STUDIO_PORT ?? 8080);

## jest.config.js

- `jest.config.js`: const { createDefaultPreset } = require("ts-jest");

## main.ts

- `main.ts`: Register Agents

## package-lock.json

- `package-lock.json`: Data/config file (5119 lines)

## package.json

- `package.json`: Data/config with keys: ['name', 'version', 'description', 'bin', 'directories', 'scripts', 'keywords', 'author', 'license', 'type', 'dependencies', 'devDependencies']

## storage

Runtime storage files (JSON blobs).

- `memory.json`: Data/config file (901138 lines)

## tsconfig.json

- `tsconfig.json`: Data/config with keys: ['compilerOptions', 'exclude']
