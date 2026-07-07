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
  private velocity = { x: 0, y: 0, z: 0 };
  private orientation = { roll: 0, pitch: 0, yaw: 0 };

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
    const t = this.sampleIndex * 0.01;

    const accelX = Math.sin(t * 1.3) * 0.3 + seededRange(seed, -0.02, 0.02);
    const accelY = Math.cos(t * 0.7) * 0.2 + seededRange(seed + 1, -0.02, 0.02);
    const accelZ = 9.81 + Math.sin(t * 2.1) * 0.1 + seededRange(seed + 2, -0.01, 0.01);

    this.velocity.x += accelX * 0.01;
    this.velocity.y += accelY * 0.01;

    this.orientation.roll += Math.sin(t * 1.1) * 0.002;
    this.orientation.pitch += Math.cos(t * 0.9) * 0.002;
    this.orientation.yaw += Math.sin(t * 0.5) * 0.003;

    const gyroX = Math.sin(t * 1.3) * 0.003 + seededRange(seed + 3, -0.001, 0.001);
    const gyroY = Math.cos(t * 0.9) * 0.002 + seededRange(seed + 4, -0.001, 0.001);
    const gyroZ = Math.sin(t * 0.5) * 0.004 + seededRange(seed + 5, -0.001, 0.001);

    const magX = Math.cos(t * 0.3) * 30 + seededRange(seed + 6, -1, 1);
    const magY = Math.sin(t * 0.3) * 30 + seededRange(seed + 7, -1, 1);
    const magZ = 40 + Math.sin(t * 0.2) * 5 + seededRange(seed + 8, -1, 1);

    const data: IMUData = {
      acceleration: { x: accelX, y: accelY, z: accelZ },
      gyroscope: { x: gyroX, y: gyroY, z: gyroZ },
      magnetometer: { x: magX, y: magY, z: magZ },
      timestamp: Date.now(),
    };
    this.dataCallback?.(data);
    return data;
  }

  setDataCallback(callback: (data: IMUData) => void): void {
    this.dataCallback = callback;
  }
}
