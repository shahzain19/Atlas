import { createClient } from '../client';
import { MemoryEntryInput, MemoryEntryRow } from '../types';

function tokenize(text: string): Map<string, number> {
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return freq;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, val] of a) {
    normA += val * val;
    const bVal = b.get(key) || 0;
    dot += val * bVal;
  }

  for (const val of b.values()) {
    normB += val * val;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export class SemanticMemory {
  async add(input: MemoryEntryInput): Promise<MemoryEntryRow> {
    const client = createClient();
    const { data, error } = await client
      .from('memory_entries')
      .insert({
        content: input.content,
        embedding: [],
        metadata: input.metadata || {},
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async search(query: string, limit: number = 10): Promise<Array<MemoryEntryRow & { similarity: number }>> {
    const client = createClient();
    const { data, error } = await client
      .from('memory_entries')
      .select()
      .limit(1000);
    if (error) throw error;
    if (!data || data.length === 0) return [];

    const queryVec = tokenize(query);

    const scored = data.map((entry: MemoryEntryRow) => {
      const entryVec = tokenize(entry.content);
      const similarity = cosineSimilarity(queryVec, entryVec);
      return { ...entry, similarity };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, limit);
  }

  async clear(): Promise<void> {
    const client = createClient();
    const { error } = await client.from('memory_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  }
}
