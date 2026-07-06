import { AtlasRuntime } from "../atlas-runtime/Lifecycle/AtlasRuntime";
import { SystemAgent } from "../atlas-agents/SystemAgent/SystemAgent";
import { TaskAgent } from "../atlas-agents/TaskAgent/TaskAgent";
import { VisionAgent } from "../atlas-agents/VisionAgent/VisionAgent";
import { NavigationAgent } from "../atlas-agents/NavigationAgent/NavigationAgent";
import { Mission as MissionType } from "../atlas-kernel/Mission/Mission";
import { Robot } from "./Robot";
import { Drone } from "./Drone";
import { Fleet } from "./Fleet";
import { AtlasEvent, MissionDefinition } from "./types";

export interface AtlasConfig {
  agents?: boolean;
  autoStart?: boolean;
}

export class Atlas {
  private runtime: AtlasRuntime;
  private robots: Map<string, Robot> = new Map();
  private drones: Map<string, Drone> = new Map();
  private _fleet: Fleet;

  constructor(config: AtlasConfig = {}) {
    this.runtime = new AtlasRuntime();

    if (config.agents !== false) {
      this.runtime.agents.register(new SystemAgent());
      this.runtime.agents.register(new TaskAgent(this.runtime));
      this.runtime.agents.register(new VisionAgent(this.runtime));
      this.runtime.agents.register(new NavigationAgent(this.runtime));
    }

    this._fleet = new Fleet(this.runtime);

    if (config.autoStart !== false) {
      this.runtime.start();
    }
  }

  robot(id?: string, options?: { name?: string }): Robot {
    const key = id || "_default_robot";
    if (!this.robots.has(key)) {
      this.robots.set(key, new Robot(this.runtime, key, options));
    }
    return this.robots.get(key)!;
  }

  drone(id?: string, options?: { name?: string }): Drone {
    const key = id || "_default_drone";
    if (!this.drones.has(key)) {
      this.drones.set(key, new Drone(this.runtime, key, options));
    }
    return this.drones.get(key)!;
  }

  fleet(): Fleet {
    return this._fleet;
  }

  async submitMission(mission: MissionDefinition): Promise<void> {
    const m: MissionType = {
      id: `mission-${Date.now()}`,
      name: mission.name,
      status: "pending",
      goals: mission.goals.map((g, i) => ({
        id: `goal-${i}`,
        description: g.description,
        priority: g.priority || 1,
        isCompleted: false,
      })),
    };
    await this.runtime.submitMission(m);
  }

  on(type: string, handler: (event: any) => void): void {
    this.runtime.bus.on(type, handler);
  }

  emit(event: AtlasEvent): Promise<void> {
    return this.runtime.emit({
      type: event.type,
      timestamp: event.timestamp,
      payload: event.payload || {},
      source: event.source || "user",
    });
  }

  start(): void {
    this.runtime.start();
  }

  stop(): void {
    this.runtime.stop();
  }

  get active(): boolean {
    return this.runtime.isActive();
  }

  getRuntime(): AtlasRuntime {
    return this.runtime;
  }

  get status(): {
    running: boolean;
    agents: number;
    tasks: number;
    robots: number;
    drones: number;
  } {
    return {
      running: this.runtime.isActive(),
      agents: this.runtime.agents.getAll().length,
      tasks: this.runtime.tasks.getAll().length,
      robots: this.robots.size,
      drones: this.drones.size,
    };
  }
}
