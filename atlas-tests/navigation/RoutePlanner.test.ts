import { RoutePlanner } from "../../atlas-navigation/RoutePlanning/RoutePlanner";
import { Waypoint } from "../../atlas-navigation/RoutePlanning/RoutePlanner";

describe("RoutePlanner", () => {
  let planner: RoutePlanner;

  beforeEach(() => {
    planner = new RoutePlanner();
  });

  it("should return a route with start and end waypoints", () => {
    const start: Waypoint = { x: 0, y: 0, z: 0 };
    const end: Waypoint = { x: 10, y: 10, z: 0 };
    const route = planner.planPath(start, end);
    expect(route.waypoints.length).toBeGreaterThanOrEqual(2);
    expect(route.waypoints[0]).toEqual(start);
    expect(route.waypoints[route.waypoints.length - 1]).toEqual(end);
    expect(route.distance).toBeGreaterThan(0);
    expect(route.estimatedTime).toBeGreaterThan(0);
  });

  it("should avoid obstacles when planning", () => {
    const start: Waypoint = { x: 0, y: 0, z: 0 };
    const end: Waypoint = { x: 10, y: 0, z: 0 };
    const obstacle = { x: 5, y: 0, z: 0, radius: 2 } as any as Waypoint;
    const route = planner.planPath(start, end, [obstacle]);
    const blocked = route.waypoints.some(
      wp => Math.abs(wp.x - 5) < 1.5 && Math.abs(wp.y - 0) < 1.5
    );
    expect(blocked).toBe(false);
    // Detour adds extra distance beyond the straight-line 10
    expect(route.distance).toBeGreaterThan(10.5);
  });

  it("should handle start equals end", () => {
    const start: Waypoint = { x: 5, y: 5, z: 0 };
    const end: Waypoint = { x: 5, y: 5, z: 0 };
    const route = planner.planPath(start, end);
    expect(route.waypoints.length).toBeGreaterThanOrEqual(1);
    expect(route.distance).toBeGreaterThanOrEqual(0);
  });

  it("should preserve z coordinate from start/end", () => {
    const start: Waypoint = { x: 0, y: 0, z: 10 };
    const end: Waypoint = { x: 5, y: 5, z: 20 };
    const route = planner.planPath(start, end);
    expect(route.waypoints[0].z).toBe(10);
    expect(route.waypoints[route.waypoints.length - 1].z).toBe(20);
  });
});
