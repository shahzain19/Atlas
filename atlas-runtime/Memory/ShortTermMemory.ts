import { Event } from "../../atlas-kernel/Event/Event";

export class ShortTermMemory {
  private buffer: Event[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Adds an event to the short-term buffer.
   * If the buffer is full, it removes the oldest event (FIFO).
   */
  remember(event: Event): void {
    this.buffer.push(event);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  /**
   * Returns all recent events in chronological order.
   */
  getRecentEvents(): Event[] {
    return [...this.buffer];
  }

  /**
   * Searches for recent events of a specific type.
   */
  findRecentByType(type: string): Event[] {
    return this.buffer.filter((e) => e.type === type);
  }

  /**
   * Clears the short-term memory.
   */
  clear(): void {
    this.buffer = [];
  }
}
