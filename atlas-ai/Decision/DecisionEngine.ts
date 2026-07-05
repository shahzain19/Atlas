import { DecisionContext, Decision } from "./types";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";
import { BasicTask } from "../../atlas-examples/BasicTask";

export class DecisionEngine {
  private runtime: AtlasRuntime;

  constructor(runtime: AtlasRuntime) {
    this.runtime = runtime;
  }

  decide(ctx: DecisionContext): Decision[] {
    const event = ctx.event;

    const decisions: Decision[] = [];

    // 🔥 RULE 1: system heartbeat reaction
    if (event.type === "TICK") {
      const dt = event.payload.dt;

      if (dt > 40) {
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
    }

    return decisions;
  }
}