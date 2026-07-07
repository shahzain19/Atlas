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
  const { width, height } = config;
  const data = new Uint8Array(width * height * 3);
  const timestamp = Date.now();
  const horizonY = Math.floor(height * 0.55);
  const sunX = Math.floor(width * 0.7);
  const sunY = Math.floor(height * 0.15);
  const sunRadius = 12;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const seed = x * 1000 + y;
      let r: number, g: number, b: number;

      if (y < horizonY - 2) {
        const skyGrad = y / (horizonY - 2);
        r = Math.floor(60 + skyGrad * 80 + seededRange(seed, -5, 5));
        g = Math.floor(120 + skyGrad * 100 + seededRange(seed + 1, -5, 5));
        b = Math.floor(180 + skyGrad * 75 + seededRange(seed + 2, -5, 5));
      } else if (y > horizonY + 2) {
        const groundGrad = (y - horizonY) / (height - horizonY);
        r = Math.floor(80 + groundGrad * 40 + seededRange(seed, -8, 8));
        g = Math.floor(130 - groundGrad * 30 + seededRange(seed + 1, -8, 8));
        b = Math.floor(50 + groundGrad * 10 + seededRange(seed + 2, -5, 5));
      } else {
        r = Math.floor(80 + seededRange(seed, -10, 10));
        g = Math.floor(80 + seededRange(seed + 1, -10, 10));
        b = Math.floor(80 + seededRange(seed + 2, -10, 10));
      }

      if (Math.abs(x - sunX) < sunRadius && Math.abs(y - sunY) < sunRadius) {
        const dist = Math.hypot(x - sunX, y - sunY);
        if (dist < sunRadius) {
          const brightness = 1 - dist / sunRadius;
          r = Math.min(255, r + Math.floor(brightness * 120));
          g = Math.min(255, g + Math.floor(brightness * 100));
          b = Math.min(255, b - Math.floor(brightness * 40));
        }
      }

      data[idx] = Math.max(0, Math.min(255, r));
      data[idx + 1] = Math.max(0, Math.min(255, g));
      data[idx + 2] = Math.max(0, Math.min(255, b));
    }
  }

  const numClouds = 3;
  for (let c = 0; c < numClouds; c++) {
    const cx = Math.floor(seededRange(c * 777, 0, width));
    const cy = Math.floor(seededRange(c * 777 + 1, 0, horizonY * 0.6));
    const cw = 30 + Math.floor(seededRange(c * 777 + 2, 0, 40));
    const ch = 10 + Math.floor(seededRange(c * 777 + 3, 0, 15));
    for (let dy = -ch; dy <= ch; dy++) {
      for (let dx = -cw; dx <= cw; dx++) {
        const dist = Math.hypot(dx / cw, dy / ch);
        if (dist > 1) continue;
        const px = cx + dx;
        const py = cy + dy;
        if (px < 0 || px >= width || py < 0 || py >= height) continue;
        const idx = (py * width + px) * 3;
        const blend = (1 - dist) * 0.6;
        data[idx] = Math.min(255, data[idx] + Math.floor(blend * 80));
        data[idx + 1] = Math.min(255, data[idx + 1] + Math.floor(blend * 80));
        data[idx + 2] = Math.min(255, data[idx + 2] + Math.floor(blend * 80));
      }
    }
  }

  const numTrees = 4;
  for (let t = 0; t < numTrees; t++) {
    const tx = Math.floor(seededRange(t * 333 + 100, 0, width));
    const ty = horizonY + 5 + Math.floor(seededRange(t * 333 + 101, 0, 20));
    const trunkH = 8 + Math.floor(seededRange(t * 333 + 102, 0, 8));
    const crownR = 10 + Math.floor(seededRange(t * 333 + 103, 0, 12));
    for (let dy = -trunkH - crownR; dy <= crownR; dy++) {
      for (let dx = -crownR; dx <= crownR; dx++) {
        const px = tx + dx;
        const py = ty + dy;
        if (px < 0 || px >= width || py < 0 || py >= height) continue;
        const idx = (py * width + px) * 3;
        const dist = Math.hypot(dx, dy);
        if (dy > 0 && Math.abs(dx) < 3 && dist < trunkH + 2) {
          data[idx] = 60;
          data[idx + 1] = 40;
          data[idx + 2] = 20;
        } else if (dist < crownR) {
          const shade = 1 - dist / crownR;
          data[idx] = Math.min(255, Math.floor(30 + shade * 40));
          data[idx + 1] = Math.min(255, Math.floor(80 + shade * 60));
          data[idx + 2] = Math.min(255, Math.floor(25 + shade * 20));
        }
      }
    }
  }

  return { width, height, channels: 3, data, timestamp };
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
