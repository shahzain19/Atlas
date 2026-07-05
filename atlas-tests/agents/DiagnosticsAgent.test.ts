import { DiagnosticsAgent } from "../../atlas-agents/DiagnosticsAgent/DiagnosticsAgent";
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

function makeTaskFailureEvent(taskId = "task-1", error = "Failed") {
  return {
    type: "TASK_FAILURE",
    timestamp: Date.now(),
    payload: { taskId, error },
  };
}

function makeRuntimeHealthEvent() {
  return {
    type: "RUNTIME_HEALTH",
    timestamp: Date.now(),
    payload: { tasks: "active" },
  };
}

describe("DiagnosticsAgent", () => {
  it("should initialize", () => {
    const rt = makeMockRuntime();
    const agent = new DiagnosticsAgent(rt);
    const stats = agent.getStats();
    expect(stats.tickCount).toBe(0);
    expect(stats.taskFailures).toBe(0);
    expect(stats.averageTickLatency).toBe(0);
  });

  it("handle TICK should update tick stats", () => {
    const rt = makeMockRuntime();
    const agent = new DiagnosticsAgent(rt);
    agent.handle(makeTickEvent(10));
    let stats = agent.getStats();
    expect(stats.tickCount).toBe(1);
    expect(stats.averageTickLatency).toBe(10);
    agent.handle(makeTickEvent(20));
    stats = agent.getStats();
    expect(stats.tickCount).toBe(2);
    expect(stats.averageTickLatency).toBe(15); // (10 + 20) / 2
  });

  it("handle TICK with dt=0 should not break stats", () => {
    const rt = makeMockRuntime();
    const agent = new DiagnosticsAgent(rt);
    agent.handle(makeTickEvent(0));
    const stats = agent.getStats();
    expect(stats.tickCount).toBe(1);
    expect(stats.averageTickLatency).toBe(0);
  });

  it("handle TASK_FAILURE should increment count", () => {
    const rt = makeMockRuntime();
    const agent = new DiagnosticsAgent(rt);
    agent.handle(makeTaskFailureEvent("task-1"));
    expect(agent.getStats().taskFailures).toBe(1);
    agent.handle(makeTaskFailureEvent("task-2"));
    expect(agent.getStats().taskFailures).toBe(2);
  });

  it("handle 3+ TASK_FAILURES should return DiagnosticsAlert decision", () => {
    const rt = makeMockRuntime();
    const agent = new DiagnosticsAgent(rt);
    agent.handle(makeTaskFailureEvent());
    agent.handle(makeTaskFailureEvent());
    const decisions = agent.handle(makeTaskFailureEvent());
    expect(decisions).toHaveLength(1);
    expect(decisions[0].name).toBe("DiagnosticsAlert");
    expect(decisions[0].confidence).toBe(0.9);
  });

  it("DiagnosticsAlert decision execute should emit DIAGNOSTICS_ALERT", () => {
    const rt = makeMockRuntime();
    const agent = new DiagnosticsAgent(rt);
    // Add some tick data to make stats interesting
    agent.handle(makeTickEvent(10));
    agent.handle(makeTickEvent(20));
    agent.handle(makeTaskFailureEvent());
    agent.handle(makeTaskFailureEvent());
    const decisions = agent.handle(makeTaskFailureEvent());
    decisions[0].execute();
    expect(rt.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "DIAGNOSTICS_ALERT",
        source: "DiagnosticsAgent",
      })
    );
    const alert = rt.emitted.find((e: any) => e.type === "DIAGNOSTICS_ALERT");
    expect(alert.payload).toEqual(
      expect.objectContaining({
        tickCount: 2,
        taskFailures: 3,
        averageTickLatency: 15,
      })
    );
  });

  it("handle RUNTIME_HEALTH should return HealthReport decision", () => {
    const rt = makeMockRuntime();
    const agent = new DiagnosticsAgent(rt);
    const decisions = agent.handle(makeRuntimeHealthEvent());
    expect(decisions).toHaveLength(1);
    expect(decisions[0].name).toBe("HealthReport");
    expect(decisions[0].confidence).toBe(0.7);
  });

  it("HealthReport decision execute should emit HEALTH_REPORT", () => {
    const rt = makeMockRuntime();
    const agent = new DiagnosticsAgent(rt);
    agent.handle(makeTickEvent(30));
    const decisions = agent.handle(makeRuntimeHealthEvent());
    decisions[0].execute();
    expect(rt.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "HEALTH_REPORT",
        source: "DiagnosticsAgent",
      })
    );
    const report = rt.emitted.find((e: any) => e.type === "HEALTH_REPORT");
    expect(report.payload).toEqual(
      expect.objectContaining({ tickCount: 1, taskFailures: 0, averageTickLatency: 30 })
    );
  });

  it("should ignore unrelated events", () => {
    const rt = makeMockRuntime();
    const agent = new DiagnosticsAgent(rt);
    const decisions = agent.handle({
      type: "BATTERY_UPDATE",
      timestamp: Date.now(),
      payload: { level: 90 },
    });
    expect(decisions).toEqual([]);
    expect(agent.getStats().tickCount).toBe(0);
    expect(agent.getStats().taskFailures).toBe(0);
  });

  it("getStats() returns correct values after mixed events", () => {
    const rt = makeMockRuntime();
    const agent = new DiagnosticsAgent(rt);
    agent.handle(makeTickEvent(10));
    agent.handle(makeTickEvent(20));
    agent.handle(makeTaskFailureEvent());
    agent.handle(makeRuntimeHealthEvent());
    const stats = agent.getStats();
    expect(stats.tickCount).toBe(2);
    expect(stats.taskFailures).toBe(1);
    expect(stats.averageTickLatency).toBe(15);
  });
});
