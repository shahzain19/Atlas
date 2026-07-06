import { AtlasRuntime } from "../atlas-runtime/Lifecycle/AtlasRuntime";
import { NavigateTarget, RobotStatus, ScanResult } from "./types";

export interface RobotOptions {
  name?: string;
}

export class Robot {
  private runtime: AtlasRuntime;
  readonly id: string;
  readonly name: string;

  constructor(runtime: AtlasRuntime, id: string, options?: RobotOptions) {
    this.runtime = runtime;
    this.id = id;
    this.name = options?.name || `Robot-${id}`;
  }

  async navigateTo(target: NavigateTarget): Promise<void> {
    const pos = "latitude" in target
      ? { x: target.latitude, y: target.longitude, z: target.altitude || 0 }
      : { x: target.x || 0, y: target.y || 0, z: target.z || 0 };

    const navAgent = this.runtime.agents.getAgent("NavigationAgent") as any;
    if (navAgent?.loadWaypoints) {
      navAgent.loadWaypoints([pos]);
    }

    await this.runtime.emit({
      type: "ROBOT_NAVIGATE",
      source: this.name,
      timestamp: Date.now(),
      payload: { target: pos, robotId: this.id },
    });

    return new Promise((resolve) => {
      const handler = (event: any) => {
        if (event.type === "WAYPOINT_REACHED" || event.type === "NAVIGATION_ARRIVED") {
          this.runtime.bus.off("WAYPOINT_REACHED", handler);
          this.runtime.bus.off("NAVIGATION_ARRIVED", handler);
          resolve();
        }
      };
      this.runtime.bus.on("WAYPOINT_REACHED", handler);
      this.runtime.bus.on("NAVIGATION_ARRIVED", handler);

      setTimeout(() => {
        this.runtime.bus.off("WAYPOINT_REACHED", handler);
        this.runtime.bus.off("NAVIGATION_ARRIVED", handler);
        resolve();
      }, 10000);
    });
  }

  async scan(): Promise<ScanResult> {
    const result: ScanResult = {
      objects: [],
      timestamp: Date.now(),
    };

    await this.runtime.emit({
      type: "IMAGE_CAPTURED",
      source: this.name,
      timestamp: Date.now(),
      payload: { camera: "front", robotId: this.id },
    });

    return new Promise((resolve) => {
      const handler = (event: any) => {
        if (event.type === "OBJECT_DETECTED") {
          result.objects.push({
            label: event.payload.object,
            confidence: event.payload.confidence,
            position: event.payload.position || { x: 0, y: 0, z: 0 },
          });
        }
      };

      this.runtime.bus.on("OBJECT_DETECTED", handler);

      setTimeout(() => {
        this.runtime.bus.off("OBJECT_DETECTED", handler);
        result.timestamp = Date.now();
        resolve(result);
      }, 2000);
    });
  }

  async explore(): Promise<void> {
    const autoAgent = this.runtime.agents.getAgent("AutonomousAgent") as any;
    if (autoAgent?.runCycle) {
      await autoAgent.runCycle();
      return;
    }

    await this.runtime.emit({
      type: "TASK_REQUEST",
      source: this.name,
      timestamp: Date.now(),
      payload: { name: "Autonomous Survey", robotId: this.id },
    });
  }

  getStatus(): RobotStatus {
    const state = this.runtime.perception.getState();
    const navAgent = this.runtime.agents.getAgent("NavigationAgent") as any;
    const mode = navAgent?.getState?.() || "idle";

    return {
      position: state.position,
      battery: 85,
      speed: Math.sqrt(
        state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2
      ),
      mode,
      taskCount: this.runtime.tasks.getAll().length,
    };
  }
}
