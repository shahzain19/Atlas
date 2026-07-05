import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai/Decision/types";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";

export class SafetyAgent extends BaseAgent {
  readonly name = "SafetyAgent";
  private runtime: AtlasRuntime;
  safetyViolations: string[] = [];

  constructor(runtime: AtlasRuntime) {
    super();
    this.runtime = runtime;
  }

  getViolations(): string[] {
    return this.safetyViolations;
  }

  clearViolations(): void {
    this.safetyViolations = [];
  }

  handle(event: Event): Decision[] {
    if (event.type === "OBSTACLE_DETECTED") {
      const payload = event.payload;
      return [
        {
          name: "EmergencyStop",
          confidence: 1.0,
          execute: () => {
            this.runtime.emit({
              type: "EMERGENCY_STOP",
              source: this.name,
              timestamp: Date.now(),
              payload,
            });
          },
        },
      ];
    }

    if (event.type === "BATTERY_CRITICAL") {
      return [
        {
          name: "SafetyShutdown",
          confidence: 1.0,
          execute: () => {
            this.runtime.emit({
              type: "SAFETY_SHUTDOWN",
              source: this.name,
              timestamp: Date.now(),
              payload: event.payload,
            });
          },
        },
      ];
    }

    if (event.type === "EMERGENCY_STOP" && event.source !== this.name) {
      const violation = `EMERGENCY_STOP received from ${event.source ?? "unknown"} at ${event.timestamp}`;
      console.warn(`[SafetyAgent] Safety violation logged: ${violation}`);
      this.safetyViolations.push(violation);
      return [];
    }

    return [];
  }
}
