export interface Waypoint {
  x: number;
  y: number;
  z?: number;
}

export interface Route {
  waypoints: Waypoint[];
  distance: number;
  estimatedTime: number;
}

export class RoutePlanner {
  planPath(start: Waypoint, end: Waypoint, obstacles?: Waypoint[]): Route {
    // Placeholder: simple straight line path
    const waypoints: Waypoint[] = [
      { ...start },
      { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2, z: start.z },
      { ...end },
    ];

    let distance = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const dx = waypoints[i].x - waypoints[i-1].x;
      const dy = waypoints[i].y - waypoints[i-1].y;
      distance += Math.sqrt(dx*dx + dy*dy);
    }

    return {
      waypoints,
      distance,
      estimatedTime: distance / 1.0, // 1 m/s
    };
  }
}
