import { ModelManager } from "../../atlas-kernel/Models/ModelManager";
import { CameraFrame } from "../../atlas-perception/Camera/CameraSensor";
import { DetectedObject } from "../../atlas-perception/ObjectDetection/ObjectDetector";

export interface VisionBackendConfig {
  backend: "local" | "groq" | "auto";
  modelName: string;
  confidenceThreshold: number;
}

export class VisionProcessor {
  private modelLoaded = false;
  private modelName: string;
  private backend: "local" | "groq";

  constructor(config?: Partial<VisionBackendConfig>) {
    this.modelName = config?.modelName || "cnn_vision.onnx";
    const b = config?.backend || "auto";
    this.backend = b === "auto" ? "local" : b;
  }

  async loadDetectionModel(modelName?: string): Promise<void> {
    this.modelName = modelName || this.modelName;
    this.modelLoaded = true;
  }

  async detectObjects(frame: CameraFrame): Promise<DetectedObject[]> {
    if (!this.modelLoaded) {
      await this.loadDetectionModel(this.modelName);
    }

    if (this.backend === "local") {
      try {
        return await this.detectLocal(frame);
      } catch {
        // fall through to groq
      }
    }

    return this.detectGroq(frame);
  }

  private async detectLocal(frame: CameraFrame): Promise<DetectedObject[]> {
    const manager = ModelManager.getInstance();
    const session = await manager.loadSession(this.modelName);

    const { width, height } = frame;
    const inputSize = 32;
    const resized = new Float32Array(3 * inputSize * inputSize);
    for (let y = 0; y < inputSize; y++) {
      for (let x = 0; x < inputSize; x++) {
        const sy = Math.floor((y / inputSize) * height);
        const sx = Math.floor((x / inputSize) * width);
        const srcIdx = (sy * width + sx) * 3;
        const dstIdx = (y * inputSize + x);
        resized[dstIdx] = frame.data[srcIdx] / 255;
        resized[inputSize * inputSize + dstIdx] = frame.data[srcIdx + 1] / 255;
        resized[2 * inputSize * inputSize + dstIdx] = frame.data[srcIdx + 2] / 255;
      }
    }

    const ort = require("onnxruntime-node");
    const feeds = { input: new ort.Tensor("float32", resized, [1, 3, inputSize, inputSize]) };
    const results = await session.run(feeds);
    const scores = Array.from(results.output.data as Float32Array);

    const detections: DetectedObject[] = [];
    const labelMap = ["obstacle", "surface", "structure", "open_area", "vegetation", "sky", "water", "vehicle", "person", "animal"];
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > 0.4) {
        detections.push({
          id: `onnx-${i}`,
          label: labelMap[i % labelMap.length],
          confidence: Math.min(0.99, scores[i]),
          boundingBox: { x: 0, y: 0, width, height },
          position: { x: width / 2, y: height / 2, z: 0 },
        });
      }
    }

    return detections.length > 0 ? detections : [{ id: "onnx-0", label: "scene", confidence: 0.5, boundingBox: { x: 0, y: 0, width, height }, position: { x: width / 2, y: height / 2, z: 0 } }];
  }

  private async detectGroq(frame: CameraFrame): Promise<DetectedObject[]> {
    const { GroqClient } = await import("../../atlas-kernel/Groq/GroqClient");
    const groq = GroqClient.getInstance();

    const sample = [];
    for (let i = 0; i < Math.min(100, frame.data.length); i += 3) {
      sample.push({ r: frame.data[i], g: frame.data[i + 1], b: frame.data[i + 2] });
    }

    const desc = `Camera frame ${frame.width}x${frame.height}px. Sample pixels: ${JSON.stringify(sample.slice(0, 10))}.`;
    const result = await groq.detectObjects(desc);

    return result.map((obj, i) => ({
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
}
