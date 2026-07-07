import { NavigationAgent } from "../../atlas-agents/NavigationAgent/NavigationAgent";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";
import { Waypoint } from "../../atlas-navigation_deprecated/Waypoint/Waypoint";

// ---------------------------------------------------------------------------
// Minimal runtime mock
// ---------------------------------------------------------------------------
function makeMockRuntime() {
  const emitted: any[] = [];
  return {
    emit: jest.fn(async (event: any) => { emitted.push(event); }),
    sendMessage: jest.fn(),
    perception: {
      getState: jest.fn(() => ({
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
        confidence: 1,
        timestamp: Date.now(),
      })),
    },
    emitted,
  } as unknown as AtlasRuntime & { emitted: any[] };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TICK = { type: "TICK", timestamp: Date.now(), payload: { dt: 50 } };

function tickN(agent: NavigationAgent, n: number) {
  for (let i = 0; i < n; i++) agent.handle(TICK);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NavigationAgent", () => {
  it("starts in IDLE state", () => {
    const rt = makeMockRuntime();
    const agent = new NavigationAgent(rt);
    expect(agent.getState()).toBe("IDLE");
  });

  it("transitions to NAVIGATING when waypoints are loaded", () => {
    const rt = makeMockRuntime();
    const agent = new NavigationAgent(rt);
    const wps: Waypoint[] = [{ id: "wp1", position: { x: 100, y: 0, z: 0 } }];
    agent.loadWaypoints(wps);
    expect(agent.getState()).toBe("NAVIGATING");
  });

  it("emits WAYPOINT_REACHED and NAVIGATION_COMPLETE for a reachable target", () => {
    const rt = makeMockRuntime();
    const agent = new NavigationAgent(rt);

    // Place target very close so it's reached immediately (within tolerance=2)
    const wps: Waypoint[] = [
      { id: "wp-close", position: { x: 1, y: 0, z: 0 }, tolerance: 5 },
    ];
    agent.loadWaypoints(wps);
    agent.handle(TICK);

    const types = rt.emitted.map((e: any) => e.type);
    expect(types).toContain("WAYPOINT_REACHED");
    expect(types).toContain("NAVIGATION_COMPLETE");
    expect(agent.getState()).toBe("ARRIVED");
  });

  it("reaches multiple waypoints in sequence", () => {
    const rt = makeMockRuntime();
    const agent = new NavigationAgent(rt);

    const wps: Waypoint[] = [
      { id: "wp1", position: { x: 1, y: 0, z: 0 }, tolerance: 5 },
      { id: "wp2", position: { x: 2, y: 0, z: 0 }, tolerance: 5 },
    ];
    agent.loadWaypoints(wps);
    tickN(agent, 5);

    const reached = rt.emitted
      .filter((e: any) => e.type === "WAYPOINT_REACHED")
      .map((e: any) => e.payload.waypointId);

    expect(reached).toContain("wp1");
    expect(reached).toContain("wp2");
    expect(agent.getState()).toBe("ARRIVED");
  });

  it("enters AVOIDING state when OBSTACLE_DETECTED event is received while navigating", () => {
    const rt = makeMockRuntime();
    const agent = new NavigationAgent(rt);

    agent.loadWaypoints([{ id: "wp1", position: { x: 100, y: 0, z: 0 } }]);
    agent.handle({
      type: "OBSTACLE_DETECTED",
      timestamp: Date.now(),
      payload: { position: { x: 2, y: 0, z: 0 }, radius: 1.5, confidence: 0.9 },
    });

    // The decision should have been returned; trigger it
    const decisions = agent.handle({
      type: "OBSTACLE_DETECTED",
      timestamp: Date.now(),
      payload: { position: { x: 2, y: 0, z: 0 }, radius: 1.5, confidence: 0.9 },
    });
    decisions.forEach((d) => d.execute());

    expect(agent.getState()).toBe("AVOIDING");
  });

  it("registers obstacle from agent message (OBJECT_DETECTED)", () => {
    const rt = makeMockRuntime();
    const agent = new NavigationAgent(rt);

    agent.loadWaypoints([{ id: "wp1", position: { x: 50, y: 0, z: 0 } }]);
    agent.receive({
      id: "msg-1",
      sender: "VisionAgent",
      recipient: "NavigationAgent",
      type: "OBJECT_DETECTED",
      payload: { object: "Tree", confidence: 0.85, position: { x: 5, y: 0, z: 0 } },
      timestamp: Date.now(),
    });

    // Just ensure it doesn't throw — obstacle is registered internally
    expect(() => tickN(agent, 3)).not.toThrow();
  });

  it("aborts navigation when NAV_ABORT event is received", () => {
    const rt = makeMockRuntime();
    const agent = new NavigationAgent(rt);

    agent.loadWaypoints([{ id: "wp1", position: { x: 100, y: 0, z: 0 } }]);
    agent.handle({ type: "NAV_ABORT", timestamp: Date.now(), payload: {} });

    expect(agent.getState()).toBe("IDLE");
    expect(agent.getQueue()).toHaveLength(0);
  });

  it("loads waypoints via NAV_LOAD_WAYPOINTS event", () => {
    const rt = makeMockRuntime();
    const agent = new NavigationAgent(rt);

    agent.handle({
      type: "NAV_LOAD_WAYPOINTS",
      timestamp: Date.now(),
      payload: {
        waypoints: [{ id: "wp-event", position: { x: 10, y: 0, z: 0 } }],
      },
    });

    expect(agent.getState()).toBe("NAVIGATING");
    expect(agent.getQueue()).toHaveLength(1);
  });

  it("emits NAV_AVOIDING when path is blocked", () => {
    const rt = makeMockRuntime();
    const agent = new NavigationAgent(rt);

    // Put a big obstacle right on the path to the target
    agent.loadWaypoints([{ id: "wp1", position: { x: 100, y: 0, z: 0 } }]);
    agent.handle({
      type: "OBSTACLE_DETECTED",
      timestamp: Date.now(),
      payload: { position: { x: 3, y: 0, z: 0 }, radius: 10, confidence: 1.0 },
    });

    // Tick once to let the agent process path blocked check
    const decisions = agent.handle(TICK);
    decisions.forEach((d) => d.execute());

    const avoiding = rt.emitted.some((e: any) => e.type === "NAV_AVOIDING");
    expect(avoiding).toBe(true);
  });
});
