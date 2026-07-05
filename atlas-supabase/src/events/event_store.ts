import { createClient } from '../client';
import { EventInput, EventRow } from '../types';

export class EventStore {
  async append(event: EventInput): Promise<EventRow> {
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

  async getStream(type?: string, since?: string, limit?: number): Promise<EventRow[]> {
    const client = createClient();
    let query = client.from('events').select();

    if (type) {
      query = query.eq('type', type);
    }
    if (since) {
      query = query.gte('created_at', since);
    }
    if (limit) {
      query = query.limit(limit);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async replay(from: string, to: string): Promise<EventRow[]> {
    const client = createClient();
    const { data, error } = await client
      .from('events')
      .select()
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async getLatest(): Promise<EventRow | null> {
    const client = createClient();
    const { data, error } = await client
      .from('events')
      .select()
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }
}
