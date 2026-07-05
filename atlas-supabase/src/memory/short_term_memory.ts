import { createClient } from '../client';
import { EventInput, EventRow } from '../types';

export class ShortTermMemory {
  private defaultLimit = 50;

  async remember(event: EventInput): Promise<EventRow> {
    const client = createClient();
    const { data, error } = await client
      .from('events')
      .insert({
        type: event.type,
        source: event.source || null,
        payload: event.payload || {},
        priority: event.priority ?? 0,
        category: event.category || null,
        importance: event.importance ?? 0.0,
        tags: event.tags || [],
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getRecentEvents(limit: number = this.defaultLimit): Promise<EventRow[]> {
    const client = createClient();
    const { data, error } = await client
      .from('events')
      .select()
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  async findRecentByType(type: string, limit: number = this.defaultLimit): Promise<EventRow[]> {
    const client = createClient();
    const { data, error } = await client
      .from('events')
      .select()
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  async clear(): Promise<void> {
    const client = createClient();
    const { error } = await client.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  }
}
