import { createClient } from '../client';
import { WorldObjectInput, WorldObjectRow } from '../types';

const OWN_POSITION_ID = '00000000-0000-0000-0000-000000000001';

export class WorldModel {
  async addObject(obj: WorldObjectInput): Promise<WorldObjectRow> {
    const client = createClient();
    const { data, error } = await client
      .from('world_objects')
      .insert({
        object_type: obj.object_type,
        label: obj.label || null,
        position_x: obj.position_x ?? 0,
        position_y: obj.position_y ?? 0,
        position_z: obj.position_z ?? 0,
        velocity_x: obj.velocity_x ?? null,
        velocity_y: obj.velocity_y ?? null,
        velocity_z: obj.velocity_z ?? null,
        size_width: obj.size_width ?? null,
        size_height: obj.size_height ?? null,
        size_depth: obj.size_depth ?? null,
        confidence: obj.confidence ?? 1.0,
        metadata: obj.metadata || {},
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateObject(id: string, updates: Partial<WorldObjectInput>): Promise<WorldObjectRow> {
    const client = createClient();
    const updateData: Record<string, unknown> = {};
    if (updates.object_type !== undefined) updateData.object_type = updates.object_type;
    if (updates.label !== undefined) updateData.label = updates.label;
    if (updates.position_x !== undefined) updateData.position_x = updates.position_x;
    if (updates.position_y !== undefined) updateData.position_y = updates.position_y;
    if (updates.position_z !== undefined) updateData.position_z = updates.position_z;
    if (updates.velocity_x !== undefined) updateData.velocity_x = updates.velocity_x;
    if (updates.velocity_y !== undefined) updateData.velocity_y = updates.velocity_y;
    if (updates.velocity_z !== undefined) updateData.velocity_z = updates.velocity_z;
    if (updates.size_width !== undefined) updateData.size_width = updates.size_width;
    if (updates.size_height !== undefined) updateData.size_height = updates.size_height;
    if (updates.size_depth !== undefined) updateData.size_depth = updates.size_depth;
    if (updates.confidence !== undefined) updateData.confidence = updates.confidence;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { data, error } = await client
      .from('world_objects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async removeObject(id: string): Promise<void> {
    const client = createClient();
    const { error } = await client.from('world_objects').delete().eq('id', id);
    if (error) throw error;
  }

  async getObject(id: string): Promise<WorldObjectRow | null> {
    const client = createClient();
    const { data, error } = await client
      .from('world_objects')
      .select()
      .eq('id', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }

  async getAllObjects(): Promise<WorldObjectRow[]> {
    const client = createClient();
    const { data, error } = await client.from('world_objects').select();
    if (error) throw error;
    return data || [];
  }

  async getObjectsByType(type: string): Promise<WorldObjectRow[]> {
    const client = createClient();
    const { data, error } = await client
      .from('world_objects')
      .select()
      .eq('object_type', type);
    if (error) throw error;
    return data || [];
  }

  async getObjectsWithinRadius(
    x: number,
    y: number,
    z: number,
    radius: number
  ): Promise<WorldObjectRow[]> {
    const all = await this.getAllObjects();
    return all.filter((obj) => {
      const dx = obj.position_x - x;
      const dy = obj.position_y - y;
      const dz = obj.position_z - z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return dist <= radius;
    });
  }

  async setOwnPosition(x: number, y: number, z: number): Promise<void> {
    const client = createClient();
    const existing = await this.getObject(OWN_POSITION_ID);
    if (existing) {
      await this.updateObject(OWN_POSITION_ID, { position_x: x, position_y: y, position_z: z });
    } else {
      await client.from('world_objects').insert({
        id: OWN_POSITION_ID,
        object_type: 'agent',
        label: 'own_position',
        position_x: x,
        position_y: y,
        position_z: z,
      });
    }
  }

  async getOwnPosition(): Promise<{ x: number; y: number; z: number } | null> {
    const obj = await this.getObject(OWN_POSITION_ID);
    if (!obj) return null;
    return { x: obj.position_x, y: obj.position_y, z: obj.position_z };
  }
}
