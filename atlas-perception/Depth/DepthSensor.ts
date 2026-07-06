import { seededRange } from "../../atlas-kernel/utils/deterministic";

export interface DepthFrame {
  width: number;
  height: number;
  depthData: Uint16Array;
  confidence?: Uint8Array;
  timestamp: number;
}

export class DepthSensor {
  private config: { width: number; height: number };
  private isRunning: boolean;
  private frameCallback?: (frame: DepthFrame) => void;
  private frameIndex = 0;

  constructor() {
    this.config = { width: 640, height: 480 };
    this.isRunning = false;
  }

  async start(): Promise<void> {
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  captureFrame(): DepthFrame {
    const { width, height } = this.config;
    const numPixels = width * height;
    const depthData = new Uint16Array(numPixels);
    const confidence = new Uint8Array(numPixels);
    const t = this.frameIndex;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const cx = x / width - 0.5;
        const cy = y / height - 0.5;

        const wallDist = 2000 + Math.abs(cx) * 6000;
        const floorDist = 1500 + Math.abs(cy) * 4000;
        const minDist = Math.min(wallDist, floorDist);

        const nearField = 300 + Math.sin(t * 0.02 + x * 0.01) * 100;
        const depth = Math.min(10000, Math.max(200, minDist * seededRange(t * 1000 + i, 0.95, 1.05)));

        if (Math.hypot(cx - 0.2, cy + 0.1) < 0.08) {
          depthData[i] = 800 + Math.floor(seededRange(t * 1000 + i, -50, 50));
          confidence[i] = 200;
        } else if (Math.hypot(cx + 0.15, cy - 0.05) < 0.06) {
          depthData[i] = 1200 + Math.floor(seededRange(t * 1000 + i + 1, -80, 80));
          confidence[i] = 180;
        } else if (Math.abs(cx) < 0.02 && depth < 4000) {
          depthData[i] = Math.floor(depth);
          confidence[i] = Math.max(0, Math.min(255, 220 - Math.floor(depth / 50)));
        } else {
          depthData[i] = Math.floor(depth);
          confidence[i] = Math.max(0, Math.min(255, 200 - Math.floor(depth / 100)));
        }
      }
    }

    this.frameIndex += 1;
    const frame = { width, height, depthData, confidence, timestamp: Date.now() };
    this.frameCallback?.(frame);
    return frame;
  }

  setFrameCallback(callback: (frame: DepthFrame) => void): void {
    this.frameCallback = callback;
  }
}
