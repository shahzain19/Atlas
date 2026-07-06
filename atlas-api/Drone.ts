import { AtlasRuntime } from "../atlas-runtime/Lifecycle/AtlasRuntime";
import { DroneStatus, GeoPosition, Position } from "./types";

export interface DroneOptions {
  name?: string;
}

export class Drone {
  private runtime: AtlasRuntime;
  readonly id: string;
  readonly name: string;
  private homePosition: Position = { x: 0, y: 0, z: 0 };
  private _altitude = 0;
  private _mode: DroneStatus["mode"] = "grounded";

  constructor(runtime: AtlasRuntime, id: string, options?: DroneOptions) {
    this.runtime = runtime;
    this.id = id;
    this.name = options?.name || `Drone-${id}`;
  }

  async takeoff(altitude = 10): Promise<void> {
    this._mode = "taking_off";
    const state = this.runtime.perception.getState();
    this.homePosition = { ...state.position };

    for (let i = 1; i <= 10; i++) {
      this._altitude = (altitude * i) / 10;
      await this.runtime.emit({
        type: "DRONE_TAKEOFF",
        source: this.name,
        timestamp: Date.now(),
        payload: {
          altitude: this._altitude,
          targetAltitude: altitude,
          progress: i / 10,
          droneId: this.id,
        },
      });
      await sleep(100);
    }

    this._altitude = altitude;
    this._mode = "flying";

    await this.runtime.emit({
      type: "GPS_UPDATE",
      source: this.name,
      timestamp: Date.now(),
      payload: {
        x: this.homePosition.x,
        y: this.homePosition.y,
        z: this._altitude,
        uncertainty: 0.1,
      },
    });
  }

  async flyTo(target: GeoPosition): Promise<void> {
    this._mode = "flying";

    const startX = this.homePosition.x;
    const startY = this.homePosition.y;
    const endX = target.latitude;
    const endY = target.longitude;
    const endAlt = target.altitude || this._altitude;

    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      const z = this._altitude + (endAlt - this._altitude) * t;

      await this.runtime.emit({
        type: "DRONE_FLY_TO",
        source: this.name,
        timestamp: Date.now(),
        payload: {
          position: { x, y, z },
          progress: t,
          droneId: this.id,
        },
      });

      await this.runtime.emit({
        type: "GPS_UPDATE",
        source: this.name,
        timestamp: Date.now(),
        payload: { x, y, z, uncertainty: 0.15 },
      });

      await sleep(100);
    }

    this.homePosition = { x: endX, y: endY, z: endAlt };
    this._altitude = endAlt;
  }

  async captureImage(): Promise<{ width: number; height: number; timestamp: number }> {
    await this.runtime.emit({
      type: "IMAGE_CAPTURED",
      source: this.name,
      timestamp: Date.now(),
      payload: { camera: "downward", droneId: this.id },
    });

    return {
      width: 640,
      height: 480,
      timestamp: Date.now(),
    };
  }

  async returnHome(): Promise<void> {
    this._mode = "returning";
    await this.flyTo({
      latitude: this.homePosition.x,
      longitude: this.homePosition.y,
      altitude: this.homePosition.z,
    });
    await this.land();
  }

  async land(): Promise<void> {
    this._mode = "landing";

    const startAlt = this._altitude;
    for (let i = 1; i <= 10; i++) {
      this._altitude = startAlt * (1 - i / 10);
      await this.runtime.emit({
        type: "DRONE_LAND",
        source: this.name,
        timestamp: Date.now(),
        payload: {
          altitude: this._altitude,
          progress: i / 10,
          droneId: this.id,
        },
      });
      await sleep(100);
    }

    this._altitude = 0;
    this._mode = "grounded";

    await this.runtime.emit({
      type: "GPS_UPDATE",
      source: this.name,
      timestamp: Date.now(),
      payload: {
        x: this.homePosition.x,
        y: this.homePosition.y,
        z: 0,
        uncertainty: 0.05,
      },
    });
  }

  getStatus(): DroneStatus {
    const state = this.runtime.perception.getState();

    return {
      position: {
        x: state.position.x,
        y: state.position.y,
        z: this._altitude,
      },
      battery: 80,
      altitude: this._altitude,
      mode: this._mode,
      speed: Math.sqrt(
        state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2
      ),
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
