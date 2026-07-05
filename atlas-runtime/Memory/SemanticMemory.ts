import { Event } from "../../atlas-kernel/Event/Event";
import { Embedder, Vector } from "./Embedder";

export interface SemanticEntry {
  event: Event;
  vector: Vector;
}

export class SemanticMemory {
  private entries: SemanticEntry[] = [];
  private embedder: Embedder;

  constructor(embedder: Embedder) {
    this.embedder = embedder;
  }

  /**
   * Adds an event to semantic memory by generating an embedding for it.
   */
  async add(event: Event): Promise<void> {
    const textToEmbed = this.stringifyEvent(event);
    const vector = await this.embedder.embed(textToEmbed);
    this.entries.push({ event, vector });
  }

  /**
   * Searches for similar events based on a query string.
   */
  async search(query: string, limit: number = 5): Promise<Event[]> {
    const queryVector = await this.embedder.embed(query);
    
    const results = this.entries
      .map((entry) => ({
        event: entry.event,
        score: this.cosineSimilarity(queryVector, entry.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter((res) => res.score > 0.1); // Filter out unrelated results

    return results.map((res) => res.event);
  }

  private cosineSimilarity(v1: Vector, v2: Vector): number {
    let dotProduct = 0;
    for (let i = 0; i < v1.values.length; i++) {
      dotProduct += v1.values[i] * v2.values[i];
    }
    return dotProduct; // Assumes normalized vectors from Embedder
  }

  private stringifyEvent(event: Event): string {
    // Simple conversion of event data to a searchable string
    const payloadStr = event.payload ? JSON.stringify(event.payload) : "";
    return `${event.type} ${event.metadata?.category || ""} ${payloadStr}`.toLowerCase();
  }

  clear(): void {
    this.entries = [];
  }
}
