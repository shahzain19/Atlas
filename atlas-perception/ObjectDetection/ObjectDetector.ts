/**
 * Object Detection using brightness-region blob analysis.
 */
import { CameraFrame } from "../Camera/CameraSensor";

export interface DetectedObject {
  id?: string;
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  position?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface ObjectDetectionConfig {
  modelName?: string;
  confidenceThreshold?: number;
  iouThreshold?: number;
  maxDetections?: number;
}

const LABELS = ["Object", "Structure", "Obstacle", "Marker", "Surface"];

export class ObjectDetector {
  private config: ObjectDetectionConfig;
  private modelLoaded: boolean;

  constructor(config: ObjectDetectionConfig = {}) {
    this.config = {
      modelName: config.modelName || "atlas-blob-detector",
      confidenceThreshold: config.confidenceThreshold || 0.5,
      iouThreshold: config.iouThreshold || 0.5,
      maxDetections: config.maxDetections || 20,
    };
    this.modelLoaded = false;
  }

  async loadModel(): Promise<void> {
    this.modelLoaded = true;
  }

  async detect(frame: CameraFrame): Promise<DetectedObject[]> {
    if (!this.modelLoaded) {
      await this.loadModel();
    }

    const regions = this.findBrightRegions(frame);
    const threshold = this.config.confidenceThreshold!;
    const maxDetections = this.config.maxDetections!;

    return regions.slice(0, maxDetections).map((region, index) => ({
      id: `det-${index}`,
      label: LABELS[index % LABELS.length],
      confidence: Math.min(0.99, threshold + region.score * (1 - threshold)),
      boundingBox: region.box,
      position: {
        x: region.box.x + region.box.width / 2,
        y: region.box.y + region.box.height / 2,
        z: 0,
      },
    }));
  }

  private findBrightRegions(frame: CameraFrame): Array<{ box: DetectedObject["boundingBox"]; score: number }> {
    const { width, height, data } = frame;
    const block = 32;
    const regions: Array<{ box: DetectedObject["boundingBox"]; score: number }> = [];

    for (let by = 0; by < height; by += block) {
      for (let bx = 0; bx < width; bx += block) {
        let sum = 0;
        let count = 0;
        for (let y = by; y < Math.min(by + block, height); y++) {
          for (let x = bx; x < Math.min(bx + block, width); x++) {
            const idx = (y * width + x) * 3;
            sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            count += 1;
          }
        }
        const avg = sum / count;
        if (avg > 128) {
          regions.push({
            score: avg / 255,
            box: {
              x: bx,
              y: by,
              width: Math.min(block, width - bx),
              height: Math.min(block, height - by),
            },
          });
        }
      }
    }

    return regions.sort((a, b) => b.score - a.score);
  }

  updateConfig(newConfig: Partial<ObjectDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ObjectDetectionConfig {
    return { ...this.config };
  }
}
