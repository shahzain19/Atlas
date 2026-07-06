import { GroqClient } from "../../atlas-kernel/Groq/GroqClient";
import { CameraFrame } from "../../atlas-perception/Camera/CameraSensor";
import { DetectedObject } from "../../atlas-perception/ObjectDetection/ObjectDetector";

export class VisionProcessor {
  private groq: GroqClient;
  private modelLoaded = false;

  constructor() {
    this.groq = GroqClient.getInstance();
  }

  async loadDetectionModel(modelPath: string): Promise<void> {
    this.modelLoaded = true;
  }

  async detectObjects(frame: CameraFrame): Promise<DetectedObject[]> {
    if (!this.modelLoaded) {
      await this.loadDetectionModel("groq-vision");
    }

    const sample = [];
    for (let i = 0; i < Math.min(100, frame.data.length); i += 3) {
      sample.push({ r: frame.data[i], g: frame.data[i + 1], b: frame.data[i + 2] });
    }

    const desc = `Camera frame ${frame.width}x${frame.height}px. Sample pixels: ${
      JSON.stringify(sample.slice(0, 10))
    }.`;

    const result = await this.groq.detectObjects(desc);

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
