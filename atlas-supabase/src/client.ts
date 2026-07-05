import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient(config.supabaseUrl, config.supabaseKey);
  }
  return client;
}

export function setClient(newClient: SupabaseClient): void {
  client = newClient;
}

export function resetClient(): void {
  client = null;
}
