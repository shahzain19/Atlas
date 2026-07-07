import { EventBus } from "../../atlas-kernel/Event/EventBus";
import { Scheduler } from "../Scheduler/Scheduler";
import { TaskManager } from "../TaskManager/TaskManager";
import { Task } from "../../atlas-kernel/Task/Task";
import { DecisionEngine } from "../../atlas-ai_deprecated/Decision/DecisionEngine";
import { DecisionRouter } from "../../atlas-ai_deprecated/Decision/DecisionRouter";
import { Event } from "../../atlas-kernel/Event/Event";
import { AgentRegistry } from "../../atlas-agents/AgentRegistry/AgentRegistry";
import { EventIntelligence } from "../../atlas-ai_deprecated/Intelligence/EventIntelligence";
import { ShortTermMemory } from "../Memory/ShortTermMemory";
import { LongTermMemory } from "../Memory/LongTermMemory";
import { SemanticMemory } from "../Memory/SemanticMemory";
import { LocalEmbedder } from "../Memory/Embedder";
import { MissionManager } from "../MissionManager/MissionManager";
import { TaskPlanner } from "../Planner/TaskPlanner";
import { Mission } from "../../atlas-kernel/Mission/Mission";
import { RecoverySystem } from "../Recovery/RecoverySystem";
import { AgentMessage } from "../../atlas-kernel/Communication/AgentMessage";
import { HardwareManager } from "../HardwareManager/HardwareManager";
import { SensorFusion } from "../Perception/SensorFusion";
import { SLAMEngine } from "../Perception/SLAMEngine";
import { ROS2Bridge } from "../Communication/ROS2Bridge";
import { DeepReasoningEngine } from "../../atlas-ai_deprecated/Reasoning/DeepReasoning";
import { CapabilityRegistry } from "../../atlas-kernel/Capability/CapabilityRegistry";
import { Configuration } from "../Configuration/Configuration";
import { Logger } from "../Logging/Logger";
import { PluginManager } from "../PluginManager/PluginManager";
import { HardwareAbstractionLayer } from "../../atlas-hardware_deprecated/HAL/HardwareAbstractionLayer";
import { HardwareBridge, createDefaultHardwareStack, tryInitCppBridge, HardwareMode, HardwareStackConfig } from "../../atlas-hardware_deprecated/Bridge/HardwareBridge";
import { EventHistory } from "../../atlas-memory/History/EventHistory";
import { GridMap } from "../../atlas-memory/Map/GridMap";
import { ObjectDatabase } from "../../atlas-memory/Objects/ObjectDatabase";
import { ObstacleTracker } from "../../atlas-memory/Obstacles/ObstacleTracker";
import { HumanTracker } from "../../atlas-memory/Humans/HumanTracker";
import { RobotState } from "../../atlas-memory/Robots/RobotState";
import { SceneGraph } from "../../atlas-memory/Scene/SceneGraph";
import { SemanticMap } from "../../atlas-memory/SemanticMap/SemanticMap";

export class AtlasRuntime {
  private eventBus: EventBus;
  private scheduler: Scheduler;
  private taskManager: TaskManager;
  private decisionEngine: DecisionEngine;
  private decisionRouter: DecisionRouter;
  private agentRegistry: AgentRegistry;
  private eventIntelligence: EventIntelligence;
  private stm: ShortTermMemory;
  private ltm: LongTermMemory;
  private semantic: SemanticMemory;
  private missionManager: MissionManager;
  private taskPlanner: TaskPlanner;
  private recoverySystem: RecoverySystem;
  private hardwareManager: HardwareManager;
  private sensorFusion: SensorFusion;
  private slamEngine: SLAMEngine;
  private ros2: ROS2Bridge;
  private reasoningEngine: DeepReasoningEngine;
  private capabilityRegistry: CapabilityRegistry;
  private config: Configuration;
  private logger: Logger;
  private pluginManager: PluginManager;
  private hal: HardwareAbstractionLayer;
  private bridge: HardwareBridge;
  private eventHistory: EventHistory;
  private gridMap: GridMap;
  private cppDaemon: import("../../atlas-hardware_deprecated/Bridge/CppBridge").CppBridgeDaemon | null = null;
  private objectDb: ObjectDatabase;
  private obstacleTracker: ObstacleTracker;
  private humanTracker: HumanTracker;
  private robotState: RobotState;
  private sceneGraph: SceneGraph;
  private _semanticMap: SemanticMap;
  private active = false;

  constructor(options?: { hardwareMode?: HardwareMode; gpsPort?: string; motorPort?: string }) {
    this.eventBus = new EventBus();
    this.scheduler = new Scheduler();
    this.taskManager = new TaskManager();
    this.agentRegistry = new AgentRegistry();
    this.eventIntelligence = new EventIntelligence();
    this.stm = new ShortTermMemory(100);
    this.ltm = new LongTermMemory();
    this.semantic = new SemanticMemory(new LocalEmbedder());
    this.missionManager = new MissionManager();
    this.taskPlanner = new TaskPlanner(this);
    this.recoverySystem = new RecoverySystem(this);
    this.hardwareManager = new HardwareManager();
    this.sensorFusion = new SensorFusion();
    this.slamEngine = new SLAMEngine();
    this.ros2 = new ROS2Bridge();
    this.reasoningEngine = new DeepReasoningEngine(this.semantic);
    this.capabilityRegistry = new CapabilityRegistry();
    this.config = new Configuration();
    this.logger = new Logger();
    this.pluginManager = new PluginManager(this);
    this.eventHistory = new EventHistory();
    this.gridMap = new GridMap(0.5, 200, 200);
    this.objectDb = new ObjectDatabase();
    this.obstacleTracker = new ObstacleTracker();
    this.humanTracker = new HumanTracker();
    this.robotState = new RobotState();
    this.sceneGraph = new SceneGraph();
    this._semanticMap = new SemanticMap();

    const mode = options?.hardwareMode || (process.env.ATLAS_HARDWARE_MODE as HardwareMode) || "simulation";
    const hwConfig: HardwareStackConfig = {
      mode,
      gpsPort: options?.gpsPort || process.env.ATLAS_GPS_PORT,
      motorPort: options?.motorPort || process.env.ATLAS_MOTOR_PORT,
    };
    const stack = createDefaultHardwareStack(this.hardwareManager, hwConfig);
    this.hal = stack.hal;
    this.bridge = stack.bridge;

    // 🧠 Brain layer
    this.decisionEngine = new DecisionEngine(this);
    this.decisionRouter = new DecisionRouter(this, this.decisionEngine);
  }

  get bus() {
    return this.eventBus;
  }

  get tasks() {
    return this.taskManager;
  }

  get agents() {
    return this.agentRegistry;
  }

  get memory() {
    return this.stm;
  }

  get history() {
    return this.ltm;
  }

  get context() {
    return this.semantic;
  }

  get missions() {
    return this.missionManager;
  }

  get hardware() {
    return this.hardwareManager;
  }

  get halLayer() {
    return this.hal;
  }

  get hardwareBridge() {
    return this.bridge;
  }

  get perception() {
    return this.sensorFusion;
  }

  get slam() {
    return this.slamEngine;
  }

  get ros() {
    return this.ros2;
  }

  get reasoning() {
    return this.reasoningEngine;
  }

  get capabilities() {
    return this.capabilityRegistry;
  }

  get configuration() {
    return this.config;
  }

  get log() {
    return this.logger;
  }

  get plugins() {
    return this.pluginManager;
  }

  get eventLog() {
    return this.eventHistory;
  }

  get map() {
    return this.gridMap;
  }

  get objects() {
    return this.objectDb;
  }

  get obstacles() {
    return this.obstacleTracker;
  }

  get humans() {
    return this.humanTracker;
  }

  get robots() {
    return this.robotState;
  }

  get scene() {
    return this.sceneGraph;
  }

  get semanticMap() {
    return this._semanticMap;
  }

  /**
   * Facilitates inter-agent communication via the registry.
   */
  sendMessage(message: AgentMessage) {
    this.agentRegistry.route(message);
  }

  async submitMission(mission: Mission) {
    console.log(`[AtlasRuntime] New Mission Received: ${mission.name}`);
    this.missionManager.addMission(mission);
    
    // 🧠 Emit mission received event
    await this.emit({
      type: "MISSION_RECEIVED",
      timestamp: Date.now(),
      payload: { id: mission.id, name: mission.name },
    });

    // 🧠 Plan the mission
    const tasks = await this.taskPlanner.plan(mission);
    console.log(`[AtlasRuntime] Mission decomposed into ${tasks.length} tasks`);

    this.missionManager.startMission(mission.id);

    // 🧠 Execute tasks sequentially
    let missionFailed = false;
    for (const task of tasks) {
      this.registerTask(task);
      try {
        await this.runTask(task.id);
      } catch {
        console.error(`[AtlasRuntime] Task ${task.name} failed, aborting mission`);
        missionFailed = true;
        break;
      }
    }

    if (missionFailed) {
      this.missionManager.failMission(mission.id);
    } else {
      this.missionManager.completeMission(mission.id);
    }
    
    await this.emit({
      type: "MISSION_COMPLETED",
      timestamp: Date.now(),
      payload: { id: mission.id },
    });
  }

  async emit(event: Event) {
    // 🧠 Intelligence: Classify and score the event before routing
    const enrichedEvent = this.eventIntelligence.process(event);
    
    // 🧠 Perception: Update state estimate if this is a sensor event
    if (enrichedEvent.metadata?.category === "perception") {
      const observation = {
        source: enrichedEvent.source || "unknown",
        type: enrichedEvent.type === "GPS_UPDATE" ? "position" : enrichedEvent.type,
        data: enrichedEvent.payload,
        uncertainty: enrichedEvent.payload.uncertainty || 0.5,
        timestamp: enrichedEvent.timestamp,
      };

      this.sensorFusion.update(observation);
      
      // Also feed into SLAM engine if it's an object detection
      if (enrichedEvent.type === "OBJECT_DETECTED") {
        this.slamEngine.processObservation(observation);
      }

      // ROS2 Mirroring: Publish perception data to ROS2 topics
      if (enrichedEvent.type === "GPS_UPDATE") {
        this.ros2.publish("/atlas/gps", "sensor_msgs/NavSatFix", enrichedEvent.payload);
      } else if (enrichedEvent.type === "OBJECT_DETECTED") {
        this.ros2.publish("/atlas/objects", "vision_msgs/Detection3D", enrichedEvent.payload);
      }
      this.ros2.mirrorEvent(enrichedEvent);
    }

    // 🧠 Memory: Store in short-term buffer
    this.stm.remember(enrichedEvent);

    // 🧠 Long-term logging: Only store meaningful events to disk to save resources
    const importance = enrichedEvent.metadata?.importance || 0;
    if (importance >= 0.5) {
      this.ltm.logEvent(enrichedEvent);
      // Also store in semantic memory for similarity search
      await this.semantic.add(enrichedEvent);
    }
    
    this.eventBus.emit(enrichedEvent);
    this.decisionRouter.handle(enrichedEvent);
  }

  async start() {
    if (this.active) return;
    console.log("⚡ Atlas Runtime Starting...");
    this.active = true;

    // Attempt to connect C++ hardware daemon
    try {
      this.cppDaemon = await tryInitCppBridge(this.hardwareManager);
      if (this.cppDaemon) {
        console.log("[AtlasRuntime] C++ hardware daemon connected, real hardware active");
      }
    } catch {
      // Daemon is optional — stay in simulation mode
    }

    this.scheduler.onTick((dt) => {
      this.tick(dt);
    });

    this.scheduler.start(50);
  }

  stop() {
    if (!this.active) return;
    this.scheduler.stop();
    this.active = false;
    console.log("Atlas Runtime Stopped.");
  }

  isActive(): boolean {
    return this.active;
  }

  private async tick(dt: number) {
    // 🧠 Create events
    const tickEvent: Event = {
      type: "TICK",
      timestamp: Date.now(),
      payload: { dt },
    };

    const healthEvent: Event = {
      type: "RUNTIME_HEALTH",
      timestamp: Date.now(),
      payload: {
        tasks: "active",
      },
    };

    // 🔁 Emit into system and brain
    await this.emit(tickEvent);
    await this.emit(healthEvent);
  }

  registerTask(task: Task) {
    this.taskManager.add(task);
  }

  async runTask(taskId: string) {
    try {
      const task = this.taskManager.getTask(taskId);
      if (task && task.status === "pending") {
        task.retryCount = 0; // Initialize retry count for new tasks
      }
      const result = await this.taskManager.run(taskId);
      if (task) {
        await this.reasoningEngine.learn(`Task ${task.name} completed successfully.`);
      }
      return result;
    } catch (err) {
      const task = this.taskManager.getTask(taskId);
      if (task) {
        await this.reasoningEngine.learn(`Task ${task.name} failed with error ${(err as Error).message}.`);
        // 🧠 Recovery: Let the recovery system handle the failure
        const recovered = await this.recoverySystem.recover(task, err as Error);
        if (recovered) return;
      }

      // If recovery failed or task not found, rethrow and emit failure event
      await this.emit({
        type: "TASK_FAILURE",
        timestamp: Date.now(),
        payload: { taskId, error: (err as Error).message },
      });
      throw err;
    }
  }
}