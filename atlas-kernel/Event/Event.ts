export type EventType = string;

export enum EventPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export interface Event {
  type: EventType;
  source?: string;
  payload?: any;
  timestamp: number;
  priority?: EventPriority;
  metadata?: {
    category?: string;
    importance?: number; // 0.0 to 1.0
    tags?: string[];
  };
}