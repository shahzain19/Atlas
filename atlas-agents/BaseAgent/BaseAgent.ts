import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai_deprecated/Decision/types";
import { AgentMessage } from "../../atlas-kernel/Communication/AgentMessage";

export abstract class BaseAgent {
  abstract readonly name: string;

  initialize?(): void;

  abstract handle(event: Event): Decision[];

  /**
   * Receives a message from another agent or the system.
   */
  receive?(message: AgentMessage): void;
}