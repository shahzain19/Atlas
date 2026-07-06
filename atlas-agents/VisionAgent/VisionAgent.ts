import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai/Decision/types";
import { AgentMessage } from "../../atlas-kernel/Communication/AgentMessage";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";
import { CameraSensor } from "../../atlas-perception/Camera/CameraSensor";
import { ObjectDetector } from "../../atlas-perception/ObjectDetection/ObjectDetector";

export class VisionAgent extends BaseAgent {
  readonly name = "VisionAgent";
  private runtime: AtlasRuntime;
  private camera: CameraSensor;
  private detector: ObjectDetector;

  constructor(runtime: AtlasRuntime) {
    super();
    this.runtime = runtime;
    this.camera = new CameraSensor({ width: 640, height: 480, fps: 15 });
    this.detector = new ObjectDetector({ confidenceThreshold: 0.3 });
  }

  handle(event: Event): Decision[] {
    if (event.type === "IMAGE_CAPTURED") {
      return [{
        name: "AnalyzeFrame",
        confidence: 0.9,
        execute: async () => {
          const frame = this.camera.captureFrame();
          const objects = await this.detector.detect(frame);
          for (const obj of objects) {
            const payload: Record<string, unknown> = {
              object: obj.label,
              confidence: obj.confidence,
              position: obj.position || { x: frame.width / 2, y: frame.height / 2, z: 0 },
            };
            await this.runtime.emit({
              type: "OBJECT_DETECTED",
              source: this.name,
              timestamp: frame.timestamp,
              payload,
            });
            this.runtime.sendMessage({
              id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              sender: this.name,
              recipient: "all",
              type: "OBJECT_DETECTED",
              payload,
              timestamp: Date.now(),
            });
          }
        }
      }];
    }
    return [];
  }

  receive(message: AgentMessage): void {
    console.log(`[VisionAgent] Received message from ${message.sender}: ${message.type}`);
  }
}
