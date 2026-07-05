import { AtlasRuntime } from "../Lifecycle/AtlasRuntime";
import {
  RuntimeStatus,
  StudioAgentInfo,
  StudioClientMessage,
  StudioMemoryStats,
  StudioServerMessage,
  StudioSnapshot,
  StudioTaskInfo,
  StudioWorldState,
} from "../../atlas-kernel/Studio/StudioProtocol";
import { Event } from "../../atlas-kernel/Event/Event";
import { Mission } from "../../atlas-kernel/Mission/Mission";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";

export class StudioBridge {
  private running = false;
  private readonly logBuffer: string[] = [];
  private readonly maxLogs = 200;
  private readonly onBroadcast?: (message: StudioServerMessage) => void;

  constructor(
    private readonly runtime: AtlasRuntime,
    options?: { onBroadcast?: (message: StudioServerMessage) => void }
  ) {
    this.onBroadcast = options?.onBroadcast;
    this.runtime.bus.onAll((event) => {
      this.onRuntimeEvent(event);
    });
  }

  isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    this.runtime.start();
    this.running = true;
    this.pushLog("[INFO] Atlas runtime started");
  }

  stop(): void {
    if (!this.running) return;
    this.runtime.stop();
    this.running = false;
    this.pushLog("[INFO] Atlas runtime stopped");
  }

  async handleMessage(raw: string): Promise<StudioServerMessage | null> {
    let message: StudioClientMessage;
    try {
      message = JSON.parse(raw) as StudioClientMessage;
    } catch {
      return { type: "error", payload: { message: "Invalid JSON message" } };
    }

    switch (message.type) {
      case "ping":
        return { type: "pong", timestamp: Date.now() };
      case "get_snapshot":
        return { type: "snapshot", payload: this.getSnapshot() };
      case "start_runtime":
        this.start();
        return { type: "snapshot", payload: this.getSnapshot() };
      case "stop_runtime":
        this.stop();
        return { type: "snapshot", payload: this.getSnapshot() };
      case "submit_mission":
        void this.submitMission(message.payload.name);
        return { type: "event", payload: { type: "MISSION_QUEUED", message: `Mission queued: ${message.payload.name}`, timestamp: Date.now() } };
      case "emit_event":
        void this.runtime.emit(message.payload);
        return null;
      default:
        return { type: "error", payload: { message: `Unknown message type` } };
    }
  }

  getSnapshot(): StudioSnapshot {
    const status: RuntimeStatus = this.running ? "running" : "idle";
    const agents: StudioAgentInfo[] = this.runtime.agents.getAll().map((agent) => ({
      name: agent.name,
      status,
    }));

    const tasks: StudioTaskInfo[] = this.runtime.tasks.getAll().map((task) => ({
      id: task.id,
      name: task.name,
      status: task.status,
    }));

    const memory: StudioMemoryStats = {
      shortTerm: this.runtime.memory.getRecentEvents().length,
      longTerm: this.runtime.history.getEvents().length,
      knowledgeGraph: this.runtime.reasoning.getKnowledgeGraph().size,
    };

    const perception = this.runtime.perception.getState();
    const map = this.runtime.slam.getMap();

    const world: StudioWorldState = {
      position: { ...perception.position },
      confidence: perception.confidence,
      objects: map.objects.map((obj) => ({
        label: obj.label,
        x: obj.position.x,
        y: obj.position.y,
      })),
    };

    return {
      status,
      agents,
      tasks,
      memory,
      world,
      logs: [...this.logBuffer],
    };
  }

  private onRuntimeEvent(event: Event): void {
    if (event.type === "TICK") return;
    const level = event.type.includes("FAILURE") || event.type.includes("ERROR") ? "ERROR" : "INFO";
    const message = `[${level}] ${event.type}${event.payload ? `: ${JSON.stringify(event.payload)}` : ""}`;
    this.pushLog(message);
    this.onBroadcast?.({
      type: "event",
      payload: { type: event.type, message, timestamp: event.timestamp },
    });
    this.onBroadcast?.({ type: "snapshot", payload: this.getSnapshot() });
  }

  private pushLog(line: string): void {
    this.logBuffer.push(line);
    if (this.logBuffer.length > this.maxLogs) {
      this.logBuffer.shift();
    }
  }

  private async submitMission(name: string): Promise<void> {
    const mission: Mission = {
      id: uuidv4(),
      name,
      status: "pending",
      goals: [
        {
          id: uuidv4(),
          description: name,
          priority: 1,
          isCompleted: false,
        },
      ],
    };
    this.pushLog(`[INFO] Submitting mission: ${name}`);
    await this.runtime.submitMission(mission);
  }
}
