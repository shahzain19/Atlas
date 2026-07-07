import { GroqClient } from "../../atlas-kernel/Groq/GroqClient";

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
  private groq: GroqClient;
  private maxTokens: number;
  private temperature: number;
  private modelName: string;

  constructor(options: { modelName?: string; maxTokens?: number; temperature?: number } = {}) {
    this.groq = GroqClient.getInstance();
    this.modelName = options.modelName || "llama-3.3-70b-versatile";
    this.maxTokens = options.maxTokens || 1024;
    this.temperature = options.temperature || 0.7;
  }

  async generate(prompt: string, options?: LanguageGenerationOptions): Promise<string> {
    return this.groq.generate(prompt, {
      maxTokens: options?.maxTokens || this.maxTokens,
      temperature: options?.temperature || this.temperature,
      topP: options?.topP,
    });
  }

  async analyze(text: string): Promise<TextAnalysisResult> {
    return this.groq.analyze(text);
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const vector = await this.groq.embed(text);
    return {
      vector,
      dimensions: vector.length,
      model: this.modelName,
    };
  }

  cosineSimilarity(a: number[], b: number[]): number {
    return this.groq.cosineSimilarity(a, b);
  }
}
