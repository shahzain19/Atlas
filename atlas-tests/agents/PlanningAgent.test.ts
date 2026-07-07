import { PlanningAgent } from "../../atlas-agents/PlanningAgent/PlanningAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Waypoint } from "../../atlas-navigation_deprecated/RoutePlanning/RoutePlanner";

describe("PlanningAgent", () => {
  let agent: PlanningAgent;

  beforeEach(() => {
    agent = new PlanningAgent();
  });

  it("should initialize", () => {
    expect(() => agent.initialize()).not.toThrow();
  });

  it("should return empty decisions for handle()", () => {
    const event: Event = {
      type: "TICK",
      timestamp: Date.now(),
      payload: { dt: 50 },
    };
    const decisions = agent.handle(event);
    expect(decisions).toEqual([]);
  });

  it("should return PlanTasksDecision for REQUEST_PLAN", () => {
    const event: Event = {
      type: "REQUEST_PLAN",
      timestamp: Date.now(),
      payload: { goal: "Inspect area" },
    };
    const decisions = agent.handle(event);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].name).toBe("PlanTasksDecision");
    expect(decisions[0].confidence).toBe(0.9);
  });

  it("should return PlanRouteDecision for REQUEST_ROUTE", () => {
    const event: Event = {
      type: "REQUEST_ROUTE",
      timestamp: Date.now(),
      payload: { start: { x: 0, y: 0 }, end: { x: 5, y: 5 } },
    };
    const decisions = agent.handle(event);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].name).toBe("PlanRouteDecision");
    expect(decisions[0].confidence).toBe(0.9);
  });

  it("planTasks() should return tasks for a goal", () => {
    const tasks = agent.planTasks("Explore area");
    expect(tasks).toHaveLength(2);
    expect(tasks[0].name).toContain("Move toward goal");
    expect(tasks[0].status).toBe("pending");
    expect(tasks[1].name).toBe("Scan surroundings");
    expect(tasks[1].status).toBe("pending");
  });

  it("planRoute() should return a route", () => {
    const start: Waypoint = { x: 0, y: 0, z: 0 };
    const end: Waypoint = { x: 10, y: 10, z: 0 };
    const route = agent.planRoute(start, end);
    expect(route.waypoints).toBeDefined();
    expect(route.waypoints.length).toBeGreaterThanOrEqual(2);
    expect(route.distance).toBeGreaterThan(0);
    expect(route.estimatedTime).toBeGreaterThan(0);
  });
});
