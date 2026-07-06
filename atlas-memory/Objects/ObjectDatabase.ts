export { ObjectRecord } from "./ObjectRecord";
import { ObjectRecord } from "./ObjectRecord";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";

export class ObjectDatabase {
  private objects: Map<string, ObjectRecord> = new Map();

  addObject(
    record: Omit<ObjectRecord, "id" | "firstSeen" | "lastSeen" | "observationCount">
  ): ObjectRecord {
    const now = Date.now();
    const obj: ObjectRecord = {
      ...record,
      id: uuidv4(),
      firstSeen: now,
      lastSeen: now,
      observationCount: 1,
    };
    this.objects.set(obj.id, obj);
    return obj;
  }

  updateObject(id: string, updates: Partial<ObjectRecord>): ObjectRecord | undefined {
    const existing = this.objects.get(id);
    if (!existing) return undefined;

    const updated: ObjectRecord = {
      ...existing,
      ...updates,
      id: existing.id,
      firstSeen: existing.firstSeen,
      lastSeen: Date.now(),
      observationCount: existing.observationCount + 1,
    };
    this.objects.set(id, updated);
    return updated;
  }

  removeObject(id: string): boolean {
    return this.objects.delete(id);
  }

  getObject(id: string): ObjectRecord | undefined {
    return this.objects.get(id);
  }

  getAllObjects(): ObjectRecord[] {
    return Array.from(this.objects.values());
  }

  getObjectsByType(type: string): ObjectRecord[] {
    return this.getAllObjects().filter((o) => o.type === type);
  }

  getObjectsByConfidence(minConfidence: number): ObjectRecord[] {
    return this.getAllObjects().filter((o) => o.confidence >= minConfidence);
  }

  decayConfidence(decayRate: number = 0.05): void {
    for (const [id, obj] of this.objects) {
      this.objects.set(id, {
        ...obj,
        confidence: Math.max(0, obj.confidence - decayRate),
      });
    }
  }

  getObjectsNear(
    x: number,
    y: number,
    z: number,
    radius: number
  ): ObjectRecord[] {
    return this.getAllObjects().filter((o) => {
      const dx = o.position.x - x;
      const dy = o.position.y - y;
      const dz = o.position.z - z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) <= radius;
    });
  }

  getRecentlySeen(windowMs: number = 5000): ObjectRecord[] {
    const cutoff = Date.now() - windowMs;
    return this.getAllObjects().filter((o) => o.lastSeen >= cutoff);
  }

  getStatistics(): { total: number; byType: Record<string, number>; avgConfidence: number } {
    const all = this.getAllObjects();
    const byType: Record<string, number> = {};
    let totalConf = 0;
    for (const obj of all) {
      byType[obj.type] = (byType[obj.type] || 0) + 1;
      totalConf += obj.confidence;
    }
    return {
      total: all.length,
      byType,
      avgConfidence: all.length > 0 ? totalConf / all.length : 0,
    };
  }
}
