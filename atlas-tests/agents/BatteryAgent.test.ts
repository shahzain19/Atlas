import { BatteryAgent } from "../../atlas-agents/BatteryAgent/BatteryAgent";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";

function makeMockRuntime() {
  const emitted: any[] = [];
  return {
    emit: jest.fn(async (event: any) => { emitted.push(event); }),
    sendMessage: jest.fn(),
    emitted,
  } as unknown as AtlasRuntime & { emitted: any[] };
}

function makeTickEvent(dt = 50) {
  return { type: "TICK", timestamp: Date.now(), payload: { dt } };
}

function makeBatteryUpdateEvent(level: number) {
  return { type: "BATTERY_UPDATE", timestamp: Date.now(), payload: { level } };
}

describe("BatteryAgent", () => {
  it("should initialize with 100% battery", () => {
    const rt = makeMockRuntime();
    const agent = new BatteryAgent(rt);
    expect(agent.getBatteryLevel()).toBe(100);
  });

  it("handle BATTERY_UPDATE should update battery level", () => {
    const rt = makeMockRuntime();
    const agent = new BatteryAgent(rt);
    agent.handle(makeBatteryUpdateEvent(75));
    expect(agent.getBatteryLevel()).toBe(75);
  });

  it("handle BATTERY_UPDATE should reject invalid levels", () => {
    const rt = makeMockRuntime();
    const agent = new BatteryAgent(rt);
    agent.handle(makeBatteryUpdateEvent(999));
    expect(agent.getBatteryLevel()).toBe(100);
    agent.handle(makeBatteryUpdateEvent(-1));
    expect(agent.getBatteryLevel()).toBe(100);
  });

  it("handle TICK should decrement battery by 0.05%", () => {
    const rt = makeMockRuntime();
    const agent = new BatteryAgent(rt);
    agent.handle(makeTickEvent());
    expect(agent.getBatteryLevel()).toBeCloseTo(99.95);
  });

  it("handle TICK should emit BATTERY_UPDATE event", () => {
    const rt = makeMockRuntime();
    const agent = new BatteryAgent(rt);
    agent.handle(makeTickEvent());
    const updates = rt.emitted.filter((e: any) => e.type === "BATTERY_UPDATE");
    expect(updates).toHaveLength(1);
    expect(updates[0].payload.level).toBeCloseTo(99.95);
  });

  it("should emit BATTERY_LOW when battery < 50% (after many ticks)", () => {
    const rt = makeMockRuntime();
    const agent = new BatteryAgent(rt);
    // Start at 100, need to drop below 50 -> 1000 ticks at 0.05 each = 50%
    for (let i = 0; i < 1000; i++) {
      agent.handle(makeTickEvent());
    }
    expect(agent.getBatteryLevel()).toBeCloseTo(50, 0);
    // One more tick pushes below 50
    const decisions = agent.handle(makeTickEvent());
    expect(decisions).toHaveLength(1);
    expect(decisions[0].name).toBe("RequestCharge");
    expect(decisions[0].confidence).toBe(0.8);
  });

  it("should return EmergencyCharge decision when battery < 20%", () => {
    const rt = makeMockRuntime();
    const agent = new BatteryAgent(rt);
    for (let i = 0; i < 1601; i++) {
      agent.handle(makeTickEvent());
    }
    expect(agent.getBatteryLevel()).toBeLessThan(20);
    const decisions = agent.handle(makeTickEvent());
    expect(decisions).toHaveLength(1);
    expect(decisions[0].name).toBe("EmergencyCharge");
    expect(decisions[0].confidence).toBe(1.0);
  });

  it("EmergencyCharge decision execute should emit BATTERY_CRITICAL and send message", () => {
    const rt = makeMockRuntime();
    const agent = new BatteryAgent(rt);
    const levelBefore = agent.getBatteryLevel();
    for (let i = 0; i < 1601; i++) {
      agent.handle(makeTickEvent());
    }
    const decisions = agent.handle(makeTickEvent());
    expect(decisions).toHaveLength(1);
    decisions[0].execute();
    const critical = rt.emitted.find((e: any) => e.type === "BATTERY_CRITICAL");
    expect(critical).toBeDefined();
    expect(critical.payload.level).toBeLessThan(20);
    expect(rt.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "BATTERY_CRITICAL" })
    );
  });

  it("receive() should handle BATTERY_CRITICAL messages", () => {
    const rt = makeMockRuntime();
    const agent = new BatteryAgent(rt);
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation();
    agent.receive({
      id: "msg-1",
      sender: "SafetyAgent",
      recipient: "BatteryAgent",
      type: "BATTERY_CRITICAL",
      payload: { level: 15 },
      timestamp: Date.now(),
    });
    expect(consoleWarn).toHaveBeenCalledWith(
      "[BatteryAgent] Received BATTERY_CRITICAL from SafetyAgent"
    );
    consoleWarn.mockRestore();
  });

  it("getBatteryLevel() returns current level", () => {
    const rt = makeMockRuntime();
    const agent = new BatteryAgent(rt);
    expect(agent.getBatteryLevel()).toBe(100);
    agent.handle(makeBatteryUpdateEvent(42));
    expect(agent.getBatteryLevel()).toBe(42);
  });
});
