import { DecisionContext, Decision } from "./types";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";
import { BasicTask } from "../../atlas-examples/BasicTask";

export class DecisionEngine {
  private runtime: AtlasRuntime;

  constructor(runtime: AtlasRuntime) {
    this.runtime = runtime;
  }

  private tickCounter = 0;

  decide(ctx: DecisionContext): Decision[] {
    const event = ctx.event;

    const decisions: Decision[] = [];

    if (event.type === "TICK") {
      const dt = event.payload.dt;

      if (dt > 40 && this.tickCounter % 50 === 0) {
        decisions.push({
          name: "HighLatencyResponse",
          confidence: 0.8,
          execute: () => {
            const task = new BasicTask(
              `latency-${Date.now()}`,
              "Latency Recovery Task"
            );

            this.runtime.registerTask(task);
            this.runtime.runTask(task.id);
          },
        });
      }
      this.tickCounter++;
    }

    return decisions;
  }
}