import { StudioBridge } from "../../atlas-runtime/Studio/StudioBridge";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";
import { SystemAgent } from "../../atlas-agents/SystemAgent/SystemAgent";

describe("StudioBridge", () => {
  let runtime: AtlasRuntime;
  let bridge: StudioBridge;

  beforeEach(() => {
    runtime = new AtlasRuntime();
    runtime.agents.register(new SystemAgent());
    bridge = new StudioBridge(runtime);
  });

  it("returns a snapshot with registered agents", () => {
    const snapshot = bridge.getSnapshot();
    expect(snapshot.agents.some((a) => a.name === "SystemAgent")).toBe(true);
    expect(snapshot.status).toBe("idle");
  });

  it("starts and stops the runtime", async () => {
    await bridge.handleMessage(JSON.stringify({ type: "start_runtime" }));
    expect(bridge.isRunning()).toBe(true);
    expect(bridge.getSnapshot().status).toBe("running");

    await bridge.handleMessage(JSON.stringify({ type: "stop_runtime" }));
    expect(bridge.isRunning()).toBe(false);
  });

  it("responds to ping", async () => {
    const response = await bridge.handleMessage(JSON.stringify({ type: "ping" }));
    expect(response?.type).toBe("pong");
  });

  it("records runtime events in logs", async () => {
    await runtime.emit({
      type: "TASK_REQUEST",
      timestamp: Date.now(),
      payload: { name: "Test Task" },
    });

    const snapshot = bridge.getSnapshot();
    expect(snapshot.logs.some((line) => line.includes("TASK_REQUEST"))).toBe(true);
  });
});
