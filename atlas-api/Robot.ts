import { AtlasRuntime } from "../atlas-runtime/Lifecycle/AtlasRuntime";
import { CameraSensor } from "../atlas-perception/Camera/CameraSensor";
import { VisionProcessor } from "../atlas-ai/Vision/VisionProcessor";
import { NavigateTarget, RobotStatus, ScanResult } from "./types";

export interface RobotOptions {
  name?: string;
}

export class Robot {
  private runtime: AtlasRuntime;
  readonly id: string;
  readonly name: string;
  private camera: CameraSensor;
  private vision: VisionProcessor;

  constructor(runtime: AtlasRuntime, id: string, options?: RobotOptions) {
    this.runtime = runtime;
    this.id = id;
    this.name = options?.name || `Robot-${id}`;
    this.camera = new CameraSensor({ width: 640, height: 480, fps: 15 });
    this.vision = new VisionProcessor({ confidenceThreshold: 0.3 });
  }

  async navigateTo(target: NavigateTarget): Promise<void> {
    const pos = "latitude" in target
      ? { x: target.latitude, y: target.longitude, z: target.altitude || 0 }
      : { x: target.x || 0, y: target.y || 0, z: target.z || 0 };

    const navAgent = this.runtime.agents.getAgent("NavigationAgent") as any;
    if (navAgent?.loadWaypoints) {
      navAgent.loadWaypoints([{ id: `wp-${Date.now()}`, position: pos }]);
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
    const frame = this.camera.captureFrame();
    const objects = await this.vision.detectObjects(frame);

    await this.runtime.emit({
      type: "IMAGE_CAPTURED",
      source: this.name,
      timestamp: frame.timestamp,
      payload: { camera: "front", robotId: this.id, width: frame.width, height: frame.height },
    });

    for (const obj of objects) {
      await this.runtime.emit({
        type: "OBJECT_DETECTED",
        source: this.name,
        timestamp: frame.timestamp,
        payload: {
          object: obj.label,
          confidence: obj.confidence,
          position: obj.position || { x: frame.width / 2, y: frame.height / 2, z: 0 },
          boundingBox: obj.boundingBox,
        },
      });
    }

    return {
      timestamp: frame.timestamp,
      objects: objects.map(o => ({
        label: o.label,
        confidence: o.confidence,
        position: o.position || { x: frame.width / 2, y: frame.height / 2, z: 0 },
      })),
    };
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
