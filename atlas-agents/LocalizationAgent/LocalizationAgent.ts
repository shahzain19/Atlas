import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai_deprecated/Decision/types";
import { GPSData } from "../../atlas-perception_deprecated/GPS/GPSSensor";
import { IMUData } from "../../atlas-perception_deprecated/IMU/IMUSensor";

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

  handle(event: Event): Decision[] {
    switch (event.type) {
      case "GPS_UPDATE":
        this.updateFromGPS(event.payload as any);
        return [
          {
            name: "GPSLocalizationDecision",
            confidence: 0.9,
            execute: () => {},
          },
        ];
      case "IMU_UPDATE":
        this.updateFromIMU(event.payload as any);
        return [
          {
            name: "IMUAttitudeDecision",
            confidence: 0.7,
            execute: () => {},
          },
        ];
      default:
        return [];
    }
  }

  updateFromGPS(data: GPSData): void {
    if (data.latitude != null && data.longitude != null) {
      this.pose.x = data.longitude * 100000;
      this.pose.y = data.latitude * 100000;
      this.pose.timestamp = data.timestamp;
    }
  }

  updateFromIMU(data: IMUData): void {
    this.pose.timestamp = data.timestamp;

    // Update attitude from gyroscope as a simple dead-reckoning delta
    if (data.gyroscope) {
      this.pose.roll += data.gyroscope.x;
      this.pose.pitch += data.gyroscope.y;
      this.pose.yaw += data.gyroscope.z;
    }
  }

  getPose(): Pose {
    return { ...this.pose };
  }

  setPose(pose: Pose): void {
    this.pose = { ...pose };
  }
}
