import { SafetyAgent } from "../../atlas-agents/SafetyAgent/SafetyAgent";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";

function makeMockRuntime() {
  const emitted: any[] = [];
  return {
    emit: jest.fn(async (event: any) => { emitted.push(event); }),
    sendMessage: jest.fn(),
    emitted,
  } as unknown as AtlasRuntime & { emitted: any[] };
}

describe("SafetyAgent", () => {
  it("should initialize", () => {
    const rt = makeMockRuntime();
    const agent = new SafetyAgent(rt);
    expect(agent.name).toBe("SafetyAgent");
    expect(agent.getViolations()).toEqual([]);
  });

  it("handle OBSTACLE_DETECTED should return EmergencyStop decision", () => {
    const rt = makeMockRuntime();
    const agent = new SafetyAgent(rt);
    const payload = { position: { x: 10, y: 5, z: 0 }, radius: 2, confidence: 0.95 };
    const decisions = agent.handle({
      type: "OBSTACLE_DETECTED",
      timestamp: Date.now(),
      payload,
    });
    expect(decisions).toHaveLength(1);
    expect(decisions[0].name).toBe("EmergencyStop");
    expect(decisions[0].confidence).toBe(1.0);
  });

  it("EmergencyStop decision execute should emit EMERGENCY_STOP", () => {
    const rt = makeMockRuntime();
    const agent = new SafetyAgent(rt);
    const payload = { position: { x: 10, y: 5, z: 0 }, radius: 2 };
    const decisions = agent.handle({
      type: "OBSTACLE_DETECTED",
      timestamp: Date.now(),
      payload,
    });
    decisions[0].execute();
    expect(rt.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: "EMERGENCY_STOP", source: "SafetyAgent", payload })
    );
  });

  it("handle BATTERY_CRITICAL should return SafetyShutdown decision", () => {
    const rt = makeMockRuntime();
    const agent = new SafetyAgent(rt);
    const payload = { level: 5 };
    const decisions = agent.handle({
      type: "BATTERY_CRITICAL",
      timestamp: Date.now(),
      payload,
    });
    expect(decisions).toHaveLength(1);
    expect(decisions[0].name).toBe("SafetyShutdown");
    expect(decisions[0].confidence).toBe(1.0);
  });

  it("SafetyShutdown decision execute should emit SAFETY_SHUTDOWN", () => {
    const rt = makeMockRuntime();
    const agent = new SafetyAgent(rt);
    const payload = { level: 5 };
    const decisions = agent.handle({
      type: "BATTERY_CRITICAL",
      timestamp: Date.now(),
      payload,
    });
    decisions[0].execute();
    expect(rt.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SAFETY_SHUTDOWN", source: "SafetyAgent", payload })
    );
  });

  it("handle EMERGENCY_STOP from other source should log violation", () => {
    const rt = makeMockRuntime();
    const agent = new SafetyAgent(rt);
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation();
    const decisions = agent.handle({
      type: "EMERGENCY_STOP",
      source: "NavigationAgent",
      timestamp: Date.now(),
      payload: {},
    });
    expect(decisions).toEqual([]);
    expect(agent.getViolations()).toHaveLength(1);
    expect(agent.getViolations()[0]).toContain("EMERGENCY_STOP received from NavigationAgent");
    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it("handle EMERGENCY_STOP from self should NOT log violation", () => {
    const rt = makeMockRuntime();
    const agent = new SafetyAgent(rt);
    const decisions = agent.handle({
      type: "EMERGENCY_STOP",
      source: "SafetyAgent",
      timestamp: Date.now(),
      payload: {},
    });
    expect(decisions).toEqual([]);
    expect(agent.getViolations()).toEqual([]);
  });

  it("handle unrelated events should return empty", () => {
    const rt = makeMockRuntime();
    const agent = new SafetyAgent(rt);
    const decisions = agent.handle({
      type: "TICK",
      timestamp: Date.now(),
      payload: { dt: 50 },
    });
    expect(decisions).toEqual([]);
  });

  it("clearViolations should reset violations", () => {
    const rt = makeMockRuntime();
    const agent = new SafetyAgent(rt);
    agent.handle({
      type: "EMERGENCY_STOP",
      source: "NavigationAgent",
      timestamp: Date.now(),
      payload: {},
    });
    expect(agent.getViolations()).toHaveLength(1);
    agent.clearViolations();
    expect(agent.getViolations()).toEqual([]);
  });

  it("getViolations returns current violations", () => {
    const rt = makeMockRuntime();
    const agent = new SafetyAgent(rt);
    agent.handle({
      type: "EMERGENCY_STOP",
      source: "NavigationAgent",
      timestamp: Date.now(),
      payload: {},
    });
    expect(agent.getViolations()).toHaveLength(1);
    expect(agent.getViolations()[0]).toContain("EMERGENCY_STOP received from NavigationAgent");
  });
});
