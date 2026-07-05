import { hashString, seededRange } from "../../atlas-kernel/utils/deterministic";

export interface LanguageGenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopWords?: string[];
}

export interface TextAnalysisResult {
  topics: string[];
  sentiment: "positive" | "negative" | "neutral";
  keywords: string[];
  entities: string[];
  confidence: number;
}

export interface EmbeddingResult {
  vector: number[];
  dimensions: number;
  model: string;
}

export class LanguageModel {
  private modelName: string;
  private maxTokens: number;
  private temperature: number;

  constructor(options: { modelName?: string; maxTokens?: number; temperature?: number } = {}) {
    this.modelName = options.modelName || "atlas-language-base";
    this.maxTokens = options.maxTokens || 1024;
    this.temperature = options.temperature || 0.7;
  }

  async generate(prompt: string, options?: LanguageGenerationOptions): Promise<string> {
    const maxT = options?.maxTokens || this.maxTokens;
    const temp = options?.temperature || this.temperature;
    const words = prompt.split(/\s+/).filter(Boolean);
    const responseWords = words.slice(0, Math.min(maxT, words.length + 3));
    if (responseWords.length === 0) responseWords.push("acknowledged");
    return `${responseWords.join(" ")} (temp=${temp.toFixed(2)})`;
  }

  async analyze(text: string): Promise<TextAnalysisResult> {
    const words = text.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const topics = [...new Set(words)].slice(0, 5);
    const keywords = topics.slice(0, 3);
    const lower = text.toLowerCase();
    const sentiment: "positive" | "negative" | "neutral" =
      lower.includes("good") || lower.includes("great") || lower.includes("excellent")
        ? "positive"
        : lower.includes("bad") || lower.includes("terrible") || lower.includes("awful")
        ? "negative"
        : "neutral";
    const entities = text
      .split(/\s+/)
      .filter((w) => w.length > 1 && w[0] === w[0].toUpperCase() && w[1] === w[1].toLowerCase());

    return {
      topics,
      sentiment,
      keywords,
      entities,
      confidence: 0.7 + seededRange(hashString(text), 0, 0.25),
    };
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const dimensions = 128;
    const vector: number[] = new Array(dimensions).fill(0);
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);

    for (const word of words) {
      const seed = hashString(word);
      const index = seed % dimensions;
      vector[index] += 1;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    const normalizedVector = magnitude > 0 ? vector.map((v) => v / magnitude) : vector;

    return {
      vector: normalizedVector,
      dimensions,
      model: this.modelName,
    };
  }

  cosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}
