import { Event } from "../../atlas-kernel/Event/Event";

export interface Vector {
  values: number[];
}

export interface Embedder {
  embed(text: string): Promise<Vector>;
}

/**
 * A simple hash-based embedder for demonstration.
 * In a production environment, this would be replaced by an LLM or local model (e.g., Transformers.js).
 */
export class LocalEmbedder implements Embedder {
  private readonly dimensions: number;

  constructor(dimensions: number = 32) {
    this.dimensions = dimensions;
  }

  async embed(text: string): Promise<Vector> {
    const values = new Array(this.dimensions).fill(0);
    const words = text.toLowerCase().split(/\W+/);

    for (const word of words) {
      if (!word) continue;
      // Simple hash function to distribute words across dimensions
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      const index = Math.abs(hash) % this.dimensions;
      values[index] += 1;
    }

    // Normalize the vector
    const magnitude = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
    const normalized = magnitude > 0 ? values.map((v) => v / magnitude) : values;

    return { values: normalized };
  }
}
