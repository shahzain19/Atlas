import { createClient } from '../client';
import { EventInput, EventRow } from '../types';

export interface EventFilters {
  type?: string;
  category?: string;
  minPriority?: number;
  maxPriority?: number;
  minImportance?: number;
  maxImportance?: number;
  tags?: string[];
  since?: string;
  until?: string;
}

export class LongTermMemory {
  async logEvent(event: EventInput): Promise<EventRow> {
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

  async getEvents(filters?: EventFilters): Promise<EventRow[]> {
    const client = createClient();
    let query = client.from('events').select();

    if (filters) {
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.minPriority !== undefined) {
        query = query.gte('priority', filters.minPriority);
      }
      if (filters.maxPriority !== undefined) {
        query = query.lte('priority', filters.maxPriority);
      }
      if (filters.minImportance !== undefined) {
        query = query.gte('importance', filters.minImportance);
      }
      if (filters.maxImportance !== undefined) {
        query = query.lte('importance', filters.maxImportance);
      }
      if (filters.since) {
        query = query.gte('created_at', filters.since);
      }
      if (filters.until) {
        query = query.lte('created_at', filters.until);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.in('tags', filters.tags);
      }
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async findEventsByType(type: string): Promise<EventRow[]> {
    return this.getEvents({ type });
  }

  async clear(): Promise<void> {
    const client = createClient();
    const { error } = await client.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  }
}
