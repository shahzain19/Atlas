import { ModelManager } from "../../atlas-kernel/Models/ModelManager";
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
  backend?: "local" | "groq" | "auto";
}

export class ObjectDetector {
  private config: ObjectDetectionConfig;
  private modelLoaded: boolean;
  private modelName: string;
  private backend: "local" | "groq";

  constructor(config: ObjectDetectionConfig = {}) {
    this.config = {
      modelName: config.modelName || "object_detection.onnx",
      confidenceThreshold: config.confidenceThreshold || 0.3,
      iouThreshold: config.iouThreshold || 0.5,
      maxDetections: config.maxDetections || 20,
    };
    this.modelName = this.config.modelName!;
    const b = config.backend || "auto";
    this.backend = b === "auto" ? "local" : b;
    this.modelLoaded = false;
  }

  async loadModel(): Promise<void> {
    this.modelLoaded = true;
  }

  async detect(frame: CameraFrame): Promise<DetectedObject[]> {
    if (!this.modelLoaded) await this.loadModel();

    if (this.backend === "local") {
      try {
        return await this.detectLocal(frame);
      } catch {
        // fall through
      }
    }

    return this.detectGroq(frame);
  }

  private async detectLocal(frame: CameraFrame): Promise<DetectedObject[]> {
    const manager = ModelManager.getInstance();
    const session = await manager.loadSession(this.modelName);

    const { width, height } = frame;
    const inputSize = 64;
    const resized = new Float32Array(3 * inputSize * inputSize);
    for (let y = 0; y < inputSize; y++) {
      for (let x = 0; x < inputSize; x++) {
        const sy = Math.floor((y / inputSize) * height);
        const sx = Math.floor((x / inputSize) * width);
        const srcIdx = (sy * width + sx) * 3;
        const dstIdx = y * inputSize + x;
        resized[dstIdx] = frame.data[srcIdx] / 255;
        resized[inputSize * inputSize + dstIdx] = frame.data[srcIdx + 1] / 255;
        resized[2 * inputSize * inputSize + dstIdx] = frame.data[srcIdx + 2] / 255;
      }
    }

    const ort = require("onnxruntime-node");
    const feeds = { input: new ort.Tensor("float32", resized, [1, 3, inputSize, inputSize]) };
    const results = await session.run(feeds);

    const bboxArr = Array.from(results.bbox.data as Float32Array);
    const scoresArr = Array.from(results.scores.data as Float32Array);

    const threshold = this.config.confidenceThreshold!;
    const maxDet = this.config.maxDetections!;
    const detections: DetectedObject[] = [];
    const numDetections = Math.min(bboxArr.length / 4, scoresArr.length);

    for (let i = 0; i < numDetections; i++) {
      const confidence = scoresArr[i];
      if (confidence < threshold) continue;

      const rx = Math.max(0, Math.min(1, bboxArr[i * 4]));
      const ry = Math.max(0, Math.min(1, bboxArr[i * 4 + 1]));
      const rw = Math.max(0, Math.min(1 - rx, bboxArr[i * 4 + 2]));
      const rh = Math.max(0, Math.min(1 - ry, bboxArr[i * 4 + 3]));

      detections.push({
        id: `det-${i}`,
        label: confidence > 0.7 ? "object" : "blob",
        confidence: Math.min(0.99, confidence),
        boundingBox: {
          x: Math.round(rx * width),
          y: Math.round(ry * height),
          width: Math.round(rw * width),
          height: Math.round(rh * height),
        },
        position: {
          x: (rx + rw / 2) * width,
          y: (ry + rh / 2) * height,
          z: 0,
        },
      });

      if (detections.length >= maxDet) break;
    }

    return detections;
  }

  private async detectGroq(frame: CameraFrame): Promise<DetectedObject[]> {
    const { GroqClient } = await import("../../atlas-kernel/Groq/GroqClient");
    const groq = GroqClient.getInstance();

    const sample = [];
    for (let i = 0; i < Math.min(60, frame.data.length); i += 3) {
      sample.push({ r: frame.data[i], g: frame.data[i + 1], b: frame.data[i + 2] });
    }

    const desc = `Camera ${frame.width}x${frame.height}px. Sample pixel data (RGB): ${JSON.stringify(sample)}. Brightness distribution: ${this.describeBrightness(frame)}.`;
    const result = await groq.detectObjects(desc);

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
    if (newConfig.backend) {
      this.backend = newConfig.backend === "auto" ? "local" : newConfig.backend;
    }
    if (newConfig.modelName) {
      this.modelName = newConfig.modelName;
    }
  }

  getConfig(): ObjectDetectionConfig {
    return { ...this.config };
  }
}
