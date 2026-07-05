import { seededRange } from "../../atlas-kernel/utils/deterministic";

export interface LidarPoint {
  x: number;
  y: number;
  z: number;
  intensity: number;
  timestamp: number;
}

export interface LidarScan {
  points: LidarPoint[];
  timestamp: number;
}

export interface LidarConfig {
  minRange?: number;
  maxRange?: number;
  scanRate?: number;
  channels?: number;
}

export class LidarSensor {
  private config: LidarConfig;
  private isRunning: boolean;
  private scanCallback?: (scan: LidarScan) => void;
  private scanIndex = 0;

  constructor(config: LidarConfig = {}) {
    this.config = {
      minRange: config.minRange || 0.1,
      maxRange: config.maxRange || 100,
      scanRate: config.scanRate || 10,
      channels: config.channels || 1,
    };
    this.isRunning = false;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
  }

  setScanCallback(callback: (scan: LidarScan) => void): void {
    this.scanCallback = callback;
  }

  captureScan(): LidarScan {
    const points: LidarPoint[] = [];
    const numPoints = 360;
    const timestamp = Date.now();

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const seed = this.scanIndex * 1000 + i;
      const distance = 5 + seededRange(seed, 0, 10);
      points.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        z: 0,
        intensity: 0.5 + seededRange(seed + 1, 0, 0.5),
        timestamp,
      });
    }

    this.scanIndex += 1;
    const scan = { points, timestamp };
    this.scanCallback?.(scan);
    return scan;
  }

  updateConfig(newConfig: Partial<LidarConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): LidarConfig {
    return { ...this.config };
  }
}
