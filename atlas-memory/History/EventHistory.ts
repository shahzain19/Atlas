import { uuidv4 } from "../../atlas-kernel/utils/uuid";

export interface HistoryEvent {
  id: string;
  type: string;
  source?: string;
  payload?: unknown;
  timestamp: number;
  category?: string;
  metadata?: Record<string, unknown>;
}

export class EventHistory {
  private events: HistoryEvent[] = [];

  addEvent(event: Omit<HistoryEvent, "id">): HistoryEvent {
    const newEvent: HistoryEvent = { ...event, id: uuidv4() };
    this.events.push(newEvent);
    return newEvent;
  }

  getEventsBetween(startTime: number, endTime: number): HistoryEvent[] {
    return this.events.filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime
    );
  }

  getEventsByType(type: string): HistoryEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  getEvents(limit: number = 50, offset: number = 0): HistoryEvent[] {
    return this.events.slice(offset, offset + limit);
  }

  getRecentEvents(minutes: number): HistoryEvent[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.events.filter((e) => e.timestamp >= cutoff);
  }

  countByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of this.events) {
      counts[event.type] = (counts[event.type] || 0) + 1;
    }
    return counts;
  }

  get totalCount(): number {
    return this.events.length;
  }

  clear(): void {
    this.events = [];
  }

  trimOlderThan(timestamp: number): void {
    this.events = this.events.filter((e) => e.timestamp >= timestamp);
  }
}
