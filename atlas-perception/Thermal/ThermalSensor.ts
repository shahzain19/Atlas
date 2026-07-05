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
    const numPixels = this.config.width * this.config.height;
    const tempData = new Float32Array(numPixels);
    for (let i = 0; i < numPixels; i++) {
      tempData[i] = 20 + seededRange(this.frameIndex * numPixels + i, 0, 20);
    }
    this.frameIndex += 1;
    const frame = {
      width: this.config.width,
      height: this.config.height,
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
