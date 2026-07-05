import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai/Decision/types";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";

export class DiagnosticsAgent extends BaseAgent {
  readonly name = "DiagnosticsAgent";
  private runtime: AtlasRuntime;

  private tickCount: number = 0;
  private taskFailures: number = 0;
  private lastTickTime: number = 0;
  private averageTickLatency: number = 0;

  constructor(runtime: AtlasRuntime) {
    super();
    this.runtime = runtime;
  }

  getStats(): { tickCount: number; taskFailures: number; averageTickLatency: number } {
    return {
      tickCount: this.tickCount,
      taskFailures: this.taskFailures,
      averageTickLatency: this.averageTickLatency,
    };
  }

  handle(event: Event): Decision[] {
    if (event.type === "TICK") {
      const dt: number = event.payload?.dt ?? 0;
      this.tickCount += 1;
      // Running average: avg = avg + (dt - avg) / n
      this.averageTickLatency =
        this.averageTickLatency + (dt - this.averageTickLatency) / this.tickCount;
      this.lastTickTime = event.timestamp;
      return [];
    }

    if (event.type === "TASK_FAILURE") {
      this.taskFailures += 1;

      if (this.taskFailures >= 3) {
        const { tickCount, taskFailures, averageTickLatency } = this;
        return [
          {
            name: "DiagnosticsAlert",
            confidence: 0.9,
            execute: () => {
              this.runtime.emit({
                type: "DIAGNOSTICS_ALERT",
                source: this.name,
                timestamp: Date.now(),
                payload: { tickCount, taskFailures, averageTickLatency },
              });
            },
          },
        ];
      }

      return [];
    }

    if (event.type === "RUNTIME_HEALTH") {
      const { tickCount, taskFailures, averageTickLatency } = this;
      return [
        {
          name: "HealthReport",
          confidence: 0.7,
          execute: () => {
            this.runtime.emit({
              type: "HEALTH_REPORT",
              source: this.name,
              timestamp: Date.now(),
              payload: { tickCount, taskFailures, averageTickLatency },
            });
          },
        },
      ];
    }

    return [];
  }
}
