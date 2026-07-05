import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai/Decision/types";
import { AgentMessage } from "../../atlas-kernel/Communication/AgentMessage";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";

export class VisionAgent extends BaseAgent {
  readonly name = "VisionAgent";
  private runtime: AtlasRuntime;

  constructor(runtime: AtlasRuntime) {
    super();
    this.runtime = runtime;
  }

  handle(event: Event): Decision[] {
    if (event.type === "IMAGE_CAPTURED") {
      console.log("[VisionAgent] Analyzing image...");
      
      return [{
        name: "NotifyObjectDetection",
        confidence: 0.9,
        execute: async () => {
          await this.runtime.emit({
            type: "OBJECT_DETECTED",
            source: this.name,
            timestamp: Date.now(),
            payload: { object: "Wind Turbine", confidence: 0.98 },
          });

          this.runtime.sendMessage({
            id: `msg-${Date.now()}`,
            sender: this.name,
            recipient: "all",
            type: "OBJECT_DETECTED",
            payload: { object: "Wind Turbine", confidence: 0.98 },
            timestamp: Date.now()
          });
        }
      }];
    }
    return [];
  }

  receive(message: AgentMessage): void {
    console.log(`[VisionAgent] Received message from ${message.sender}: ${message.type}`);
  }
}
