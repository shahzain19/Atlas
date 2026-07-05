import { CameraFrame } from "../../atlas-perception/Camera/CameraSensor";
import { DetectedObject } from "../../atlas-perception/ObjectDetection/ObjectDetector";
import { ONNXRuntime, Tensor } from "../Inference/ONNXRuntime";

export class VisionProcessor {
  private onnx: ONNXRuntime;
  private modelLoaded = false;

  constructor(onnx?: ONNXRuntime) {
    this.onnx = onnx ?? new ONNXRuntime();
  }

  async loadDetectionModel(modelPath: string): Promise<void> {
    await this.onnx.loadModel(modelPath);
    this.modelLoaded = true;
  }

  async preprocess(frame: CameraFrame): Promise<Tensor> {
    const size = frame.width * frame.height;
    const data = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const idx = i * 3;
      data[i] = frame.data[idx] / 255;
    }
    return {
      data,
      shape: [1, 1, frame.height, frame.width],
      type: "float32",
    };
  }

  async postprocess(output: Record<string, Tensor>, frame: CameraFrame): Promise<DetectedObject[]> {
    const tensor = output.output;
    if (!tensor || !(tensor.data instanceof Float32Array)) return [];

    const detections: DetectedObject[] = [];
    const blockW = Math.max(32, Math.floor(frame.width / 8));
    const blockH = Math.max(32, Math.floor(frame.height / 8));

    for (let i = 0; i < tensor.data.length; i++) {
      const score = Math.abs(tensor.data[i]);
      if (score < 0.2) continue;

      const col = i % 4;
      const row = Math.floor(i / 4);
      detections.push({
        label: ["person", "car", "bicycle", "structure"][i % 4],
        confidence: Math.min(0.99, score),
        boundingBox: {
          x: col * blockW,
          y: row * blockH,
          width: blockW,
          height: blockH,
        },
      });
    }

    return detections;
  }

  async detectObjects(frame: CameraFrame): Promise<DetectedObject[]> {
    if (!this.modelLoaded) {
      throw new Error("Model not loaded");
    }

    const input = await this.preprocess(frame);
    const output = await this.onnx.run({ input });
    return this.postprocess(output, frame);
  }
}
