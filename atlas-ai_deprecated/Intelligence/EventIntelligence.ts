import { Event, EventPriority } from "../../atlas-kernel/Event/Event";

export class EventIntelligence {
  /**
   * Classifies and scores an event based on its type and payload.
   * This is the "Reflex Intelligence" layer.
   */
  process(event: Event): Event {
    // 1. Classification
    const category = this.classify(event);
    
    // 2. Scoring (Importance 0.0 to 1.0)
    const importance = this.score(event);
    
    // 3. Priority Mapping
    const priority = this.mapToPriority(importance);

    return {
      ...event,
      priority,
      metadata: {
        ...event.metadata,
        category,
        importance,
      }
    };
  }

  private classify(event: Event): string {
    if (event.type.startsWith("RUNTIME_") || event.type === "TICK") {
      return "system";
    }
    if (event.type.includes("TASK_")) {
      return "operation";
    }
    if (
      event.type.includes("SENSOR_") ||
      event.type.includes("IMAGE_") ||
      event.type.includes("GPS_") ||
      event.type.includes("OBJECT_")
    ) {
      return "perception";
    }
    return "general";
  }

  private score(event: Event): number {
    // Example scoring logic
    switch (event.type) {
      case "TICK": return 0.1; // Frequent, low importance
      case "RUNTIME_HEALTH": return 0.5;
      case "TASK_REQUEST": return 0.8;
      case "TASK_FAILURE": return 1.0; // Critical
      default: return 0.3;
    }
  }

  private mapToPriority(importance: number): EventPriority {
    if (importance >= 0.9) return EventPriority.CRITICAL;
    if (importance >= 0.7) return EventPriority.HIGH;
    if (importance >= 0.4) return EventPriority.MEDIUM;
    return EventPriority.LOW;
  }
}
