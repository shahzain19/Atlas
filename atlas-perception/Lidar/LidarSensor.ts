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
    const timestamp = Date.now();
    const numPoints = 360;
    const maxRange = 100;
    const walls: { angle: number; dist: number; width: number }[] = [
      { angle: 0, dist: 30, width: Math.PI / 6 },
      { angle: Math.PI / 2, dist: 20, width: Math.PI / 4 },
      { angle: Math.PI, dist: 40, width: Math.PI / 3 },
      { angle: -Math.PI / 2, dist: 25, width: Math.PI / 5 },
    ];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const seed = this.scanIndex * 1000 + i;

      let minDist = maxRange;
      for (const wall of walls) {
        const da = angle - wall.angle;
        const wrappedDa = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(wrappedDa) < wall.width / 2) {
          const wallDist = wall.dist / Math.cos(wrappedDa);
          if (wallDist > 0 && wallDist < minDist) {
            minDist = wallDist;
          }
        }
      }

      if (i % 8 === 0) {
        const scatterDist = 1 + seededRange(seed + 100, 0, maxRange - 1);
        minDist = Math.min(minDist, scatterDist);
      }

      const noise = seededRange(seed, -0.05, 0.05);
      const distance = minDist * (1 + noise);
      const intensity = distance < 5 ? 0.9 : Math.max(0.1, 0.5 - (distance / maxRange) * 0.4);

      points.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        z: seededRange(seed + 1, -0.1, 0.1),
        intensity: intensity + seededRange(seed + 2, -0.05, 0.05),
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
