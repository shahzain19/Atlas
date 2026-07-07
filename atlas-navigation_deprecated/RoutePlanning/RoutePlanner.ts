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
    return this.planAStar(start, end, obstacles ?? []);
  }

  private planAStar(start: Waypoint, end: Waypoint, obstacles: Waypoint[]): Route {
    const cellSize = 1.0;
    const padding = 5.0;
    const minX = Math.min(start.x, end.x, ...obstacles.map(o => o.x)) - padding;
    const maxX = Math.max(start.x, end.x, ...obstacles.map(o => o.x)) + padding;
    const minY = Math.min(start.y, end.y, ...obstacles.map(o => o.y)) - padding;
    const maxY = Math.max(start.y, end.y, ...obstacles.map(o => o.y)) + padding;

    const cols = Math.max(1, Math.ceil((maxX - minX) / cellSize));
    const rows = Math.max(1, Math.ceil((maxY - minY) / cellSize));

    const toCell = (x: number, y: number) => ({
      x: Math.floor((x - minX) / cellSize),
      y: Math.floor((y - minY) / cellSize),
    });

    const toWorld = (cx: number, cy: number): Waypoint => ({
      x: minX + cx * cellSize + cellSize / 2,
      y: minY + cy * cellSize + cellSize / 2,
      z: start.z,
    });

    const blocked = new Set<string>();
    for (const obs of obstacles) {
      const radius = (obs as any).radius ?? 2.0;
      const inflated = radius + 1.0;
      const minCX = Math.max(0, Math.floor(((obs.x - inflated) - minX) / cellSize));
      const maxCX = Math.min(cols - 1, Math.floor(((obs.x + inflated) - minX) / cellSize));
      const minCY = Math.max(0, Math.floor(((obs.y - inflated) - minY) / cellSize));
      const maxCY = Math.min(rows - 1, Math.floor(((obs.y + inflated) - minY) / cellSize));
      for (let cx = minCX; cx <= maxCX; cx++) {
        for (let cy = minCY; cy <= maxCY; cy++) {
          const dx = minX + cx * cellSize + cellSize / 2 - obs.x;
          const dy = minY + cy * cellSize + cellSize / 2 - obs.y;
          if (Math.sqrt(dx * dx + dy * dy) < inflated) {
            blocked.add(`${cx},${cy}`);
          }
        }
      }
    }

    const startCell = toCell(start.x, start.y);
    const endCell = toCell(end.x, end.y);

    const heuristic = (a: {x:number;y:number}, b: {x:number;y:number}) =>
      Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    const key = (c: {x:number;y:number}) => `${c.x},${c.y}`;
    const neighbors = (c: {x:number;y:number}) => {
      const dirs = [
        {x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0},
        {x:-1,y:-1},{x:1,y:-1},{x:-1,y:1},{x:1,y:1}
      ];
      const out: {x:number;y:number;cost:number}[] = [];
      for (const d of dirs) {
        const nx = c.x + d.x;
        const ny = c.y + d.y;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        if (blocked.has(key({x:nx,y:ny}))) continue;
        const cost = (d.x !== 0 && d.y !== 0) ? 1.414 : 1.0;
        out.push({x:nx,y:ny,cost});
      }
      return out;
    };

    type AStarNode = { x: number; y: number; g: number; f: number };

    const open = new Map<string, AStarNode>();
    const closed = new Set<string>();
    const parents = new Map<string, { x: number; y: number }>();
    const startKey = key(startCell);
    open.set(startKey, { x: startCell.x, y: startCell.y, g: 0, f: heuristic(startCell, endCell) });

    let reached = false;
    while (open.size > 0) {
      let currentKey = '';
      let current: AStarNode | undefined;
      for (const [k, node] of open) {
        if (!current || node.f < current.f) {
          current = node;
          currentKey = k;
        }
      }
      if (!current) break;

      if (current.x === endCell.x && current.y === endCell.y) {
        reached = true;
        break;
      }

      open.delete(currentKey);
      closed.add(currentKey);

      for (const n of neighbors(current)) {
        const nKey = key(n);
        if (closed.has(nKey)) continue;
        const tentativeG = current.g + n.cost;
        const existing = open.get(nKey);
        if (!existing || tentativeG < existing.g) {
          open.set(nKey, {
            x: n.x,
            y: n.y,
            g: tentativeG,
            f: tentativeG + heuristic({ x: n.x, y: n.y }, endCell),
          });
          parents.set(nKey, { x: current.x, y: current.y });
        }
      }
    }

    const waypoints: Waypoint[] = [];
    if (reached) {
      const path: { x: number; y: number }[] = [];
      let cur: { x: number; y: number } | undefined = endCell;
      const pushed = new Set<string>();
      while (cur && !pushed.has(key(cur))) {
        pushed.add(key(cur));
        path.unshift(cur);
        cur = parents.get(key(cur));
      }
      for (let i = 0; i < path.length; i++) {
        waypoints.push(toWorld(path[i].x, path[i].y));
      }
    }

    if (waypoints.length === 0) {
      waypoints.push({ ...start }, { ...end });
    } else {
      waypoints[0] = { ...start, z: start.z };
      waypoints[waypoints.length - 1] = { ...end, z: end.z };
    }

    let distance = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const dx = waypoints[i].x - waypoints[i - 1].x;
      const dy = waypoints[i].y - waypoints[i - 1].y;
      distance += Math.sqrt(dx * dx + dy * dy);
    }

    return {
      waypoints,
      distance,
      estimatedTime: distance / 1.0,
    };
  }
}