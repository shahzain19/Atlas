import { seededRange } from "../../atlas-kernel/utils/deterministic";

export interface IMUData {
  acceleration: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  magnetometer?: { x: number; y: number; z: number };
  timestamp: number;
}

export class IMUSensor {
  private isRunning: boolean;
  private dataCallback?: (data: IMUData) => void;
  private sampleIndex = 0;

  constructor() {
    this.isRunning = false;
  }

  async start(): Promise<void> {
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  captureData(): IMUData {
    const seed = this.sampleIndex++;
    const data: IMUData = {
      acceleration: {
        x: seededRange(seed, -0.05, 0.05),
        y: seededRange(seed + 1, -0.05, 0.05),
        z: 9.81 + seededRange(seed + 2, -0.05, 0.05),
      },
      gyroscope: {
        x: seededRange(seed + 3, -0.005, 0.005),
        y: seededRange(seed + 4, -0.005, 0.005),
        z: seededRange(seed + 5, -0.005, 0.005),
      },
      timestamp: Date.now(),
    };
    this.dataCallback?.(data);
    return data;
  }

  setDataCallback(callback: (data: IMUData) => void): void {
    this.dataCallback = callback;
  }
}
