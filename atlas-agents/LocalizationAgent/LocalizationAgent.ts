import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai/Decision/types";
import { GPSData } from "../../atlas-perception/GPS/GPSSensor";
import { IMUData } from "../../atlas-perception/IMU/IMUSensor";

export interface Pose {
  x: number;
  y: number;
  z: number;
  roll: number;
  pitch: number;
  yaw: number;
  timestamp: number;
}

export class LocalizationAgent extends BaseAgent {
  readonly name = "LocalizationAgent";

  private pose: Pose = {
    x: 0,
    y: 0,
    z: 0,
    roll: 0,
    pitch: 0,
    yaw: 0,
    timestamp: Date.now(),
  };

  initialize(): void {
    console.log("Localization Agent initialized");
  }

  handle(_event: Event): Decision[] {
    return [];
  }

  updateFromGPS(data: GPSData): void {
    if (data.latitude && data.longitude) {
      this.pose.x = data.longitude * 100000;
      this.pose.y = data.latitude * 100000;
      this.pose.timestamp = data.timestamp;
    }
  }

  updateFromIMU(data: IMUData): void {
    this.pose.timestamp = data.timestamp;
  }

  getPose(): Pose {
    return { ...this.pose };
  }

  setPose(pose: Pose): void {
    this.pose = { ...pose };
  }
}
