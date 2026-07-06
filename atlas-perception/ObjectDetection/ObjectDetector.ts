import { GroqClient } from "../../atlas-kernel/Groq/GroqClient";
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

export class ObjectDetector {
  private groq: GroqClient;
  private config: ObjectDetectionConfig;
  private modelLoaded: boolean;

  constructor(config: ObjectDetectionConfig = {}) {
    this.groq = GroqClient.getInstance();
    this.config = {
      modelName: config.modelName || "groq-vision",
      confidenceThreshold: config.confidenceThreshold || 0.3,
      iouThreshold: config.iouThreshold || 0.5,
      maxDetections: config.maxDetections || 20,
    };
    this.modelLoaded = false;
  }

  async loadModel(): Promise<void> {
    this.modelLoaded = true;
  }

  async detect(frame: CameraFrame): Promise<DetectedObject[]> {
    if (!this.modelLoaded) await this.loadModel();

    const sample = [];
    for (let i = 0; i < Math.min(60, frame.data.length); i += 3) {
      sample.push({ r: frame.data[i], g: frame.data[i + 1], b: frame.data[i + 2] });
    }

    const desc = `Camera ${frame.width}x${frame.height}px. Frame type: ground exploration.
Sample pixel data (RGB): ${JSON.stringify(sample)}.
Brightness distribution: ${this.describeBrightness(frame)}.`;

    const result = await this.groq.detectObjects(desc);

    const threshold = this.config.confidenceThreshold!;
    const maxDet = this.config.maxDetections!;

    return result
      .filter(obj => obj.confidence >= threshold)
      .slice(0, maxDet)
      .map((obj, i) => ({
        id: `det-${i}`,
        label: obj.label,
        confidence: Math.min(0.99, obj.confidence),
        boundingBox: {
          x: Math.round(obj.boundingBox.x * frame.width),
          y: Math.round(obj.boundingBox.y * frame.height),
          width: Math.round(obj.boundingBox.width * frame.width),
          height: Math.round(obj.boundingBox.height * frame.height),
        },
        position: {
          x: obj.boundingBox.x * frame.width + (obj.boundingBox.width * frame.width) / 2,
          y: obj.boundingBox.y * frame.height + (obj.boundingBox.height * frame.height) / 2,
          z: 0,
        },
      }));
  }

  private describeBrightness(frame: CameraFrame): string {
    let sum = 0, min = 255, max = 0;
    for (let i = 0; i < frame.data.length; i += 3) {
      const avg = (frame.data[i] + frame.data[i + 1] + frame.data[i + 2]) / 3;
      sum += avg;
      if (avg < min) min = avg;
      if (avg > max) max = avg;
    }
    const mean = sum / (frame.data.length / 3);
    return `mean=${mean.toFixed(0)}, min=${min.toFixed(0)}, max=${max.toFixed(0)}`;
  }

  updateConfig(newConfig: Partial<ObjectDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ObjectDetectionConfig {
    return { ...this.config };
  }
}
