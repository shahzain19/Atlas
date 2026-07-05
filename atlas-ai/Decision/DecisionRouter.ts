import { Event } from "../../atlas-kernel/Event/Event";
import { DecisionEngine } from "./DecisionEngine";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";

export class DecisionRouter {
  private runtime: AtlasRuntime;
  private engine: DecisionEngine;

  constructor(runtime: AtlasRuntime, engine: DecisionEngine) {
    this.runtime = runtime;
    this.engine = engine;
  }

  handle(event: Event) {
    const category = event.metadata?.category || "unknown";
    const importance = event.metadata?.importance || 0;

    if (importance > 0.7) {
      console.log(
        `[DecisionRouter] High Importance Event: ${event.type} (${category})`
      );
    }

    // 1. Get decisions from core engine
    const coreDecisions = this.engine.decide({ event });

    // 2. Get decisions from all registered agents
    const agentDecisions = this.runtime.agents
      .getAll()
      .flatMap((agent) => agent.handle(event));

    const allDecisions = [...coreDecisions, ...agentDecisions];

    for (const decision of allDecisions) {
      if (decision.confidence > 0.5) {
        decision.execute();
      }
    }
  }
}