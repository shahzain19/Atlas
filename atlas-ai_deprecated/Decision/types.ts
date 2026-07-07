import { Event } from "../../atlas-kernel/Event/Event";

export interface DecisionContext {
  event: Event;
  state?: Record<string, any>;
}

export interface Decision {
  name: string;
  confidence: number;
  execute: () => void;
}