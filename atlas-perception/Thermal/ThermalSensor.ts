import { seededRange } from "../../atlas-kernel/utils/deterministic";

export interface ThermalFrame {
  width: number;
  height: number;
  temperatureData: Float32Array;
  timestamp: number;
}

export class ThermalSensor {
  private config: { width: number; height: number };
  private isRunning: boolean;
  private frameCallback?: (frame: ThermalFrame) => void;
  private frameIndex = 0;

  constructor() {
    this.config = { width: 320, height: 240 };
    this.isRunning = false;
  }

  async start(): Promise<void> {
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  captureFrame(): ThermalFrame {
    const { width, height } = this.config;
    const numPixels = width * height;
    const tempData = new Float32Array(numPixels);
    const t = this.frameIndex * 0.1;
    const horizonY = Math.floor(height * 0.5);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const seed = this.frameIndex * numPixels + i;
        let temp: number;

        if (y < horizonY - 3) {
          const grad = y / (horizonY - 3);
          temp = -5 + grad * 10 + seededRange(seed, -1.5, 1.5);
          if (seededRange(seed + 1000, 0, 1) > 0.97) {
            temp += 5 + seededRange(seed + 2000, 0, 8);
          }
        } else if (y > horizonY + 3) {
          const grad = (y - horizonY) / (height - horizonY);
          temp = 22 + grad * 8 + seededRange(seed, -1, 1);
          if (seededRange(seed + 3000, 0, 1) > 0.96) {
            temp += 10 + seededRange(seed + 4000, 0, 15);
          }
        } else {
          temp = 15 + seededRange(seed, -3, 3);
        }

        const hx = Math.floor(width * 0.6);
        const hy = Math.floor(height * 0.25);
        if (Math.abs(x - hx) < 8 && Math.abs(y - hy) < 8) {
          const dist = Math.hypot(x - hx, y - hy);
          if (dist < 8) temp += 25 * (1 - dist / 8);
        }

        const ex = Math.floor(width * 0.3);
        const ey = Math.floor(height * 0.7);
        if (Math.abs(x - ex) < 5 && Math.abs(y - ey) < 12) {
          const dist = Math.hypot((x - ex) / 5, (y - ey) / 12);
          if (dist < 1) temp += 18 * (1 - dist);
        }

        tempData[i] = temp;
      }
    }

    this.frameIndex += 1;
    const frame = {
      width,
      height,
      temperatureData: tempData,
      timestamp: Date.now(),
    };
    this.frameCallback?.(frame);
    return frame;
  }

  setFrameCallback(callback: (frame: ThermalFrame) => void): void {
    this.frameCallback = callback;
  }
}
