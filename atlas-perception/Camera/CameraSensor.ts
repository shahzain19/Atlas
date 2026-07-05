/**
 * Camera Sensor Interface
 */
import { seededRange } from "../../atlas-kernel/utils/deterministic";

export interface CameraFrame {
  width: number;
  height: number;
  channels: number;
  data: Uint8Array;
  timestamp: number;
}

export interface CameraConfig {
  width?: number;
  height?: number;
  fps?: number;
  exposure?: number;
}

export type FrameProvider = (config: Required<CameraConfig>) => CameraFrame;

function defaultFrameProvider(config: Required<CameraConfig>): CameraFrame {
  const totalPixels = config.width * config.height;
  const data = new Uint8Array(totalPixels * 3);
  const timestamp = Date.now();

  for (let y = 0; y < config.height; y++) {
    for (let x = 0; x < config.width; x++) {
      const idx = (y * config.width + x) * 3;
      const seed = x * 1000 + y;
      data[idx] = Math.floor(seededRange(seed, 0, 256));
      data[idx + 1] = Math.floor(seededRange(seed + 1, 0, 256));
      data[idx + 2] = Math.floor(seededRange(seed + 2, 0, 256));
    }
  }

  return { width: config.width, height: config.height, channels: 3, data, timestamp };
}

export class CameraSensor {
  private config: Required<CameraConfig>;
  private isRunning: boolean;
  private frameCallback?: (frame: CameraFrame) => void;
  private frameProvider: FrameProvider;
  private frameCount = 0;

  constructor(config: CameraConfig = {}, frameProvider?: FrameProvider) {
    this.config = {
      width: config.width || 640,
      height: config.height || 480,
      fps: config.fps || 30,
      exposure: config.exposure || 0.1,
    };
    this.isRunning = false;
    this.frameProvider = frameProvider ?? defaultFrameProvider;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
  }

  setFrameCallback(callback: (frame: CameraFrame) => void): void {
    this.frameCallback = callback;
  }

  captureFrame(): CameraFrame {
    const frame = this.frameProvider(this.config);
    this.frameCount += 1;
    this.frameCallback?.(frame);
    return frame;
  }

  updateConfig(newConfig: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): CameraConfig {
    return { ...this.config };
  }
}
