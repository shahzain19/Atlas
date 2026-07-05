import { seededRange } from "../../atlas-kernel/utils/deterministic";

export interface RadarPoint {
  azimuth: number;
  elevation: number;
  range: number;
  velocity?: number;
  intensity: number;
}

export interface RadarScan {
  points: RadarPoint[];
  timestamp: number;
}

export class RadarSensor {
  private config: { maxRange: number; scanRate: number };
  private isRunning: boolean;
  private scanCallback?: (scan: RadarScan) => void;
  private scanIndex = 0;

  constructor() {
    this.config = { maxRange: 200, scanRate: 10 };
    this.isRunning = false;
  }

  async start(): Promise<void> {
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  captureScan(): RadarScan {
    const points: RadarPoint[] = [];
    for (let i = 0; i < 100; i++) {
      const seed = this.scanIndex * 100 + i;
      points.push({
        azimuth: (i / 100) * Math.PI * 2,
        elevation: seededRange(seed, -Math.PI / 2, Math.PI / 2),
        range: 10 + seededRange(seed + 1, 0, 190),
        intensity: seededRange(seed + 2, 0, 1),
      });
    }
    this.scanIndex += 1;
    const scan = { points, timestamp: Date.now() };
    this.scanCallback?.(scan);
    return scan;
  }

  setScanCallback(callback: (scan: RadarScan) => void): void {
    this.scanCallback = callback;
  }
}
