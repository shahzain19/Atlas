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
    const numPixels = this.config.width * this.config.height;
    const depthData = new Uint16Array(numPixels);
    for (let i = 0; i < numPixels; i++) {
      depthData[i] = 1000 + Math.floor(seededRange(this.frameIndex * numPixels + i, 0, 4000));
    }
    this.frameIndex += 1;
    const frame = {
      width: this.config.width,
      height: this.config.height,
      depthData,
      timestamp: Date.now(),
    };
    this.frameCallback?.(frame);
    return frame;
  }

  setFrameCallback(callback: (frame: DepthFrame) => void): void {
    this.frameCallback = callback;
  }
}
