import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '../client';
import { EventRow } from '../types';

type EventHandler = (event: EventRow) => void;

export class EventBusSupabase {
  private channel: RealtimeChannel | null = null;
  private handlers: Map<string, Set<EventHandler>> = new Map();

  async subscribe(table: string = 'events'): Promise<void> {
    const client = createClient();
    this.channel = client
      .channel(`atlas-${table}-changes`)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table },
        (payload: RealtimePostgresChangesPayload<EventRow>) => {
          const event = payload.new as EventRow;
          const typeHandlers = this.handlers.get(event.type);
          if (typeHandlers) {
            typeHandlers.forEach((handler) => handler(event));
          }
          const wildcardHandlers = this.handlers.get('*');
          if (wildcardHandlers) {
            wildcardHandlers.forEach((handler) => handler(event));
          }
        }
      )
      .subscribe();
  }

  unsubscribe(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }

  on(type: string, handler: EventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  off(type: string, handler: EventHandler): void {
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      typeHandlers.delete(handler);
      if (typeHandlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }
}
