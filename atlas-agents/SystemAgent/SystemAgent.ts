import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai_deprecated/Decision/types";

export class SystemAgent extends BaseAgent {
  readonly name = "SystemAgent";

  handle(event: Event): Decision[] {
    return [];
  }
}