import { Event } from "./Event";

type EventHandler = (event: Event) => void;

export class EventBus {
  private listeners: Map<string, EventHandler[]> = new Map();
  private wildcardHandlers: EventHandler[] = [];

  on(eventType: string, handler: EventHandler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(handler);
  }

  onAll(handler: EventHandler) {
    this.wildcardHandlers.push(handler);
  }

  emit(event: Event) {
    for (const handler of this.wildcardHandlers) {
      handler(event);
    }

    const handlers = this.listeners.get(event.type);
    if (!handlers) return;

    for (const handler of handlers) {
      handler(event);
    }
  }
}