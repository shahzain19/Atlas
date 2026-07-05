import { SystemAgent } from "../../atlas-agents/SystemAgent/SystemAgent";
import { Event } from "../../atlas-kernel/Event/Event";

describe("SystemAgent", () => {
  let agent: SystemAgent;

  beforeEach(() => {
    agent = new SystemAgent();
  });

  it("should initialize", () => {
    expect(agent.name).toBe("SystemAgent");
  });

  it("should return empty decisions for TICK events", () => {
    const event: Event = {
      type: "TICK",
      timestamp: Date.now(),
      payload: { dt: 50 },
    };
    const decisions = agent.handle(event);
    expect(decisions).toEqual([]);
  });

  it("should ignore non-TICK events", () => {
    const event: Event = {
      type: "SPEAK_REQUEST",
      timestamp: Date.now(),
      payload: { text: "Hello" },
    };
    const decisions = agent.handle(event);
    expect(decisions).toHaveLength(0);
  });
});
