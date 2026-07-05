import { EventIntelligence } from "../../atlas-ai/Intelligence/EventIntelligence";
import { EventPriority } from "../../atlas-kernel/Event/Event";

describe("EventIntelligence", () => {
  let intelligence: EventIntelligence;

  beforeEach(() => {
    intelligence = new EventIntelligence();
  });

  it("should classify system events", () => {
    const event = { type: "TICK", timestamp: Date.now() };
    const processed = intelligence.process(event);
    expect(processed.metadata?.category).toBe("system");
    expect(processed.priority).toBe(EventPriority.LOW);
  });

  it("should classify operation events", () => {
    const event = { type: "TASK_REQUEST", timestamp: Date.now() };
    const processed = intelligence.process(event);
    expect(processed.metadata?.category).toBe("operation");
    expect(processed.metadata?.importance).toBe(0.8);
    expect(processed.priority).toBe(EventPriority.HIGH);
  });

  it("should mark failures as critical", () => {
    const event = { type: "TASK_FAILURE", timestamp: Date.now() };
    const processed = intelligence.process(event);
    expect(processed.metadata?.importance).toBe(1.0);
    expect(processed.priority).toBe(EventPriority.CRITICAL);
  });

  it("should classify perception events", () => {
    const event = { type: "SENSOR_UPDATE", timestamp: Date.now() };
    const processed = intelligence.process(event);
    expect(processed.metadata?.category).toBe("perception");
  });
});
