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

  it("should return ListenDecision for LISTEN_REQUEST", () => {
    const event: Event = {
      type: "LISTEN_REQUEST",
      timestamp: Date.now(),
      payload: {},
    };
    const decisions = agent.handle(event);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].name).toBe("ListenDecision");
    expect(decisions[0].confidence).toBe(0.8);
  });

  it("should reset state on SPEAK_COMPLETE", () => {
    const speakEvent: Event = {
      type: "SPEAK_REQUEST",
      timestamp: Date.now(),
      payload: { text: "Hi" },
    };
    agent.handle(speakEvent);
    const doneEvent: Event = {
      type: "SPEAK_COMPLETE",
      timestamp: Date.now(),
      payload: {},
    };
    agent.handle(doneEvent);
  });
});
