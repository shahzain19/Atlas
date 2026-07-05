import { createClient } from '../client';
import { WorldObjectRow } from '../types';

export interface BoundingBox {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export class SpatialIndex {
  async findNearby(x: number, y: number, z: number, radius: number): Promise<WorldObjectRow[]> {
    const client = createClient();
    const { data, error } = await client.from('world_objects').select();
    if (error) throw error;
    if (!data) return [];

    return data.filter((obj: WorldObjectRow) => {
      const dx = obj.position_x - x;
      const dy = obj.position_y - y;
      const dz = obj.position_z - z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) <= radius;
    });
  }

  async findInBounds(bounds: BoundingBox): Promise<WorldObjectRow[]> {
    const client = createClient();
    const { data, error } = await client.from('world_objects').select();
    if (error) throw error;
    if (!data) return [];

    return data.filter((obj: WorldObjectRow) => {
      return (
        obj.position_x >= bounds.minX &&
        obj.position_x <= bounds.maxX &&
        obj.position_y >= bounds.minY &&
        obj.position_y <= bounds.maxY &&
        obj.position_z >= bounds.minZ &&
        obj.position_z <= bounds.maxZ
      );
    });
  }

  async findNearest(x: number, y: number, z: number, type?: string): Promise<WorldObjectRow | null> {
    const client = createClient();
    let query = client.from('world_objects').select();
    if (type) {
      query = query.eq('object_type', type);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return null;

    let nearest: WorldObjectRow | null = null;
    let minDist = Infinity;

    for (const obj of data) {
      const dx = obj.position_x - x;
      const dy = obj.position_y - y;
      const dz = obj.position_z - z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        nearest = obj;
      }
    }

    return nearest;
  }

  async findFarthest(x: number, y: number, z: number, type?: string): Promise<WorldObjectRow | null> {
    const client = createClient();
    let query = client.from('world_objects').select();
    if (type) {
      query = query.eq('object_type', type);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return null;

    let farthest: WorldObjectRow | null = null;
    let maxDist = -Infinity;

    for (const obj of data) {
      const dx = obj.position_x - x;
      const dy = obj.position_y - y;
      const dz = obj.position_z - z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > maxDist) {
        maxDist = dist;
        farthest = obj;
      }
    }

    return farthest;
  }

  async getSpatialDensity(x: number, y: number, z: number, radius: number): Promise<number> {
    const nearby = await this.findNearby(x, y, z, radius);
    return nearby.length;
  }
}
