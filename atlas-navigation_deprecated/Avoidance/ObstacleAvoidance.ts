import { Vector3 } from "../../atlas-kernel/Perception/StateEstimate";

export interface Obstacle {
  id: string;
  position: Vector3;
  radius: number;      // metres — bounding sphere
  confidence: number;  // 0.0 – 1.0
  timestamp: number;
}

/**
 * ObstacleAvoidance
 *
 * Maintains a live obstacle registry and provides a simple potential-field
 * avoidance vector that can be added to the nominal heading.
 */
export class ObstacleAvoidance {
  private obstacles: Map<string, Obstacle> = new Map();

  /** Stale obstacles older than this threshold (ms) are pruned automatically. */
  private readonly staleTtl: number;

  constructor(staleTtlMs: number = 5000) {
    this.staleTtl = staleTtlMs;
  }

  // ---------------------------------------------------------------------------
  // Registry
  // ---------------------------------------------------------------------------

  addOrUpdate(obstacle: Obstacle): void {
    this.obstacles.set(obstacle.id, obstacle);
  }

  remove(id: string): void {
    this.obstacles.delete(id);
  }

  /** Remove obstacles that haven't been refreshed within staleTtl. */
  prune(): void {
    const now = Date.now();
    for (const [id, obs] of this.obstacles) {
      if (now - obs.timestamp > this.staleTtl) {
        this.obstacles.delete(id);
      }
    }
  }

  getAll(): Obstacle[] {
    return Array.from(this.obstacles.values());
  }

  clear(): void {
    this.obstacles.clear();
  }

  // ---------------------------------------------------------------------------
  // Collision check
  // ---------------------------------------------------------------------------

  /**
   * Returns true if the straight-line path from `from` to `to` passes within
   * any obstacle's radius (plus `safetyMargin` metres).
   */
  pathBlocked(from: Vector3, to: Vector3, safetyMargin = 1.0): boolean {
    this.prune();
    for (const obs of this.obstacles.values()) {
      if (this.segmentPointDistance(from, to, obs.position) < obs.radius + safetyMargin) {
        return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Avoidance vector
  // ---------------------------------------------------------------------------

  /**
   * Computes a repulsion vector by summing inverse-square repulsive forces from
   * every nearby obstacle.  The caller adds this to the nominal travel vector.
   */
  computeAvoidanceVector(currentPos: Vector3, influenceRadius = 5.0): Vector3 {
    this.prune();
    const result: Vector3 = { x: 0, y: 0, z: 0 };

    for (const obs of this.obstacles.values()) {
      const dx = currentPos.x - obs.position.x;
      const dy = currentPos.y - obs.position.y;
      const dz = currentPos.z - obs.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < influenceRadius && dist > 0.001) {
        // Repulsive force magnitude: k / dist²
        const force = (1.0 / (dist * dist)) * obs.confidence;
        result.x += (dx / dist) * force;
        result.y += (dy / dist) * force;
        result.z += (dz / dist) * force;
      }
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Geometry helper
  // ---------------------------------------------------------------------------

  /** Minimum distance from point `p` to the line segment `a`→`b`. */
  private segmentPointDistance(a: Vector3, b: Vector3, p: Vector3): number {
    const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
    const apx = p.x - a.x, apy = p.y - a.y, apz = p.z - a.z;
    const abLen2 = abx * abx + aby * aby + abz * abz;

    if (abLen2 === 0) {
      // Degenerate segment — just point distance
      return Math.sqrt(apx * apx + apy * apy + apz * apz);
    }

    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby + apz * abz) / abLen2));
    const closestX = a.x + t * abx - p.x;
    const closestY = a.y + t * aby - p.y;
    const closestZ = a.z + t * abz - p.z;
    return Math.sqrt(closestX * closestX + closestY * closestY + closestZ * closestZ);
  }
}
