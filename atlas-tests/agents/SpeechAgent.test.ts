import { SpeechAgent } from "../../atlas-agents/SpeechAgent/SpeechAgent";
import { Event } from "../../atlas-kernel/Event/Event";

describe("SpeechAgent", () => {
  let agent: SpeechAgent;

  beforeEach(() => {
    agent = new SpeechAgent();
  });

  it("should initialize", () => {
    expect(() => agent.initialize()).not.toThrow();
  });

  it("should return SpeakDecision for SPEAK_REQUEST events", () => {
    const event: Event = {
      type: "SPEAK_REQUEST",
      timestamp: Date.now(),
      payload: { text: "Hello!" },
    };
    const decisions = agent.handle(event);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].name).toBe("SpeakDecision");
    expect(decisions[0].confidence).toBe(1.0);
  });

  it("should ignore non-SPEAK_REQUEST events", () => {
    const event: Event = {
      type: "TICK",
      timestamp: Date.now(),
      payload: { dt: 50 },
    };
    const decisions = agent.handle(event);
    expect(decisions).toHaveLength(0);
  });

  it("listen() should return string", async () => {
    const result = await agent.listen();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
