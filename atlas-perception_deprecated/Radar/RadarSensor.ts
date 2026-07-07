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
  private targets: { azimuth: number; elevation: number; range: number; velocity: number; rc: number }[] = [];

  constructor() {
    this.config = { maxRange: 200, scanRate: 10 };
    this.isRunning = false;
    this.targets = [
      { azimuth: 0.3, elevation: 0.1, range: 80, velocity: 15, rc: 10 },
      { azimuth: -0.5, elevation: -0.05, range: 120, velocity: -5, rc: 5 },
      { azimuth: 1.2, elevation: 0.15, range: 50, velocity: 0, rc: 20 },
      { azimuth: -1.0, elevation: -0.1, range: 150, velocity: 8, rc: 3 },
      { azimuth: 0.8, elevation: -0.2, range: 35, velocity: -2, rc: 8 },
    ];
  }

  async start(): Promise<void> {
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  captureScan(): RadarScan {
    const points: RadarPoint[] = [];
    const timestamp = Date.now();
    const maxRange = this.config.maxRange;
    const t = this.scanIndex * 0.1;

    for (const target of this.targets) {
      const driftAz = Math.sin(t * 0.2 + target.azimuth * 2) * 0.05;
      const driftRange = Math.sin(t * 0.3 + target.range * 0.01) * 3;
      const rcsFluctuation = 0.7 + Math.sin(t * 0.5 + target.rc) * 0.3;

      const point: RadarPoint = {
        azimuth: target.azimuth + driftAz + seededRange(this.scanIndex * 10 + 0, -0.005, 0.005),
        elevation: target.elevation + seededRange(this.scanIndex * 10 + 1, -0.005, 0.005),
        range: target.range + driftRange + seededRange(this.scanIndex * 10 + 2, -0.5, 0.5),
        velocity: target.velocity + seededRange(this.scanIndex * 10 + 3, -0.5, 0.5),
        intensity: Math.max(0.05, rcsFluctuation + seededRange(this.scanIndex * 10 + 4, -0.1, 0.1)),
      };
      if (point.range > 0 && point.range < maxRange) {
        points.push(point);
      }
    }

    for (let i = 0; i < 15; i++) {
      const seed = this.scanIndex * 100 + i * 7;
      points.push({
        azimuth: seededRange(seed, -Math.PI, Math.PI),
        elevation: seededRange(seed + 1, -0.3, 0.3),
        range: 10 + seededRange(seed + 2, 0, maxRange - 10),
        velocity: seededRange(seed + 3, -20, 20),
        intensity: seededRange(seed + 4, 0.02, 0.15),
      });
    }

    this.scanIndex += 1;
    const scan = { points, timestamp };
    this.scanCallback?.(scan);
    return scan;
  }

  setScanCallback(callback: (scan: RadarScan) => void): void {
    this.scanCallback = callback;
  }
}
