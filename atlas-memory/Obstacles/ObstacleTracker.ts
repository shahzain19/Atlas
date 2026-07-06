export { Obstacle } from "./Obstacle";
import { Obstacle } from "./Obstacle";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";

export class ObstacleTracker {
  private obstacles: Map<string, Obstacle> = new Map();

  addObstacle(obstacle: Omit<Obstacle, "id" | "lastObserved">): Obstacle {
    const newObstacle: Obstacle = {
      ...obstacle,
      id: uuidv4(),
      lastObserved: Date.now(),
    };
    this.obstacles.set(newObstacle.id, newObstacle);
    return newObstacle;
  }

  updateObstacle(id: string, updates: Partial<Obstacle>): Obstacle | undefined {
    const existing = this.obstacles.get(id);
    if (!existing) return undefined;
    const updated: Obstacle = {
      ...existing,
      ...updates,
      id: existing.id,
      lastObserved: Date.now(),
    };
    this.obstacles.set(id, updated);
    return updated;
  }

  removeObstacle(id: string): boolean {
    return this.obstacles.delete(id);
  }

  getObstacle(id: string): Obstacle | undefined {
    return this.obstacles.get(id);
  }

  getAllObstacles(): Obstacle[] {
    return Array.from(this.obstacles.values());
  }

  getDynamicObstacles(velocityThreshold: number = 0.1): Obstacle[] {
    return this.getAllObstacles().filter((o) => {
      if (!o.velocity) return false;
      const magnitude = Math.sqrt(
        o.velocity.x ** 2 + o.velocity.y ** 2 + o.velocity.z ** 2
      );
      return magnitude > velocityThreshold;
    });
  }

  getStaticObstacles(velocityThreshold: number = 0.1): Obstacle[] {
    return this.getAllObstacles().filter((o) => {
      if (!o.velocity) return true;
      const magnitude = Math.sqrt(
        o.velocity.x ** 2 + o.velocity.y ** 2 + o.velocity.z ** 2
      );
      return magnitude <= velocityThreshold;
    });
  }

  getObstaclesWithinRadius(
    x: number,
    y: number,
    z: number,
    radius: number
  ): Obstacle[] {
    return this.getAllObstacles().filter((o) => {
      const dx = o.position.x - x;
      const dy = o.position.y - y;
      const dz = o.position.z - z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) <= radius;
    });
  }

  predictPosition(id: string, deltaTime: number): { x: number; y: number; z: number } | undefined {
    const obs = this.obstacles.get(id);
    if (!obs || !obs.velocity) return undefined;
    return {
      x: obs.position.x + obs.velocity.x * deltaTime,
      y: obs.position.y + obs.velocity.y * deltaTime,
      z: obs.position.z + obs.velocity.z * deltaTime,
    };
  }

  getDangerLevel(id: string): number | undefined {
    return this.obstacles.get(id)?.dangerLevel;
  }

  getAllSortedByDanger(): Obstacle[] {
    return this.getAllObstacles().sort((a, b) => b.dangerLevel - a.dangerLevel);
  }
}
