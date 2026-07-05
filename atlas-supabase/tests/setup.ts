import { createClient } from '../src/client';

const client = createClient();

export async function cleanupTables(): Promise<void> {
  const tables = ['events', 'world_objects', 'graph_nodes', 'graph_edges', 'memory_entries'];
  for (const table of tables) {
    await client.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
}

export { client as testClient };
