export { WorldObject, WorldPosition } from "./WorldObject";
import { WorldObject, WorldPosition } from "./WorldObject";

export class WorldModel {
  private objects: Map<string, WorldObject> = new Map();
  private ownPosition: WorldPosition = {
    x: 0,
    y: 0,
    z: 0,
    timestamp: Date.now(),
  };

  addObject(obj: WorldObject): void {
    this.objects.set(obj.id, obj);
  }

  updateObject(id: string, updates: Partial<WorldObject>): void {
    const existing = this.objects.get(id);
    if (existing) {
      this.objects.set(id, {
        ...existing,
        ...updates,
        lastSeen: Date.now(),
      });
    }
  }

  removeObject(id: string): void {
    this.objects.delete(id);
  }

  getObject(id: string): WorldObject | undefined {
    return this.objects.get(id);
  }

  getAllObjects(): WorldObject[] {
    return Array.from(this.objects.values());
  }

  getObjectsByType(type: string): WorldObject[] {
    return this.getAllObjects().filter((o) => o.type === type);
  }

  setOwnPosition(pos: WorldPosition): void {
    this.ownPosition = pos;
  }

  getOwnPosition(): WorldPosition {
    return this.ownPosition;
  }

  getObjectsWithinRadius(radius: number): WorldObject[] {
    const own = this.ownPosition;
    return this.getAllObjects().filter((o) => {
      const dx = o.position.x - own.x;
      const dy = o.position.y - own.y;
      const dz = o.position.z - own.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance <= radius;
    });
  }
}
