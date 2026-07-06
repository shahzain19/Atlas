import Groq from "groq-sdk";

const API_KEY = process.env.GROQ_API_KEY || "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";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const CACHE_MAX = 256;
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  result: string;
  expiresAt: number;
}

let _instance: GroqClient | null = null;

export class GroqClient {
  private client: Groq;
  private model: string;
  private cache = new Map<string, CacheEntry>();
  private cacheKeys: string[] = [];

  constructor(apiKey?: string, model?: string) {
    this.client = new Groq({ apiKey: apiKey || API_KEY });
    this.model = model || DEFAULT_MODEL;
  }

  static getInstance(): GroqClient {
    if (!_instance) _instance = new GroqClient();
    return _instance;
  }

  private cacheKey(prompt: string, options?: Record<string, unknown>): string {
    return `${this.model}|${prompt}|${JSON.stringify(options || {})}`;
  }

  private cacheGet(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.result;
  }

  private cacheSet(key: string, result: string): void {
    if (this.cache.size >= CACHE_MAX) {
      const oldest = this.cacheKeys.shift();
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    this.cacheKeys.push(key);
  }

  setModel(model: string): void {
    this.model = model;
    this.cache.clear();
    this.cacheKeys = [];
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheKeys = [];
  }

  async generate(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    system?: string;
    noCache?: boolean;
  }): Promise<string> {
    if (!options?.noCache) {
      const key = this.cacheKey(prompt, options ? { system: options.system, temperature: options.temperature } : undefined);
      const cached = this.cacheGet(key);
      if (cached != null) return cached;
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          ...(options?.system ? [{ role: "system" as const, content: options.system }] : []),
          { role: "user" as const, content: prompt },
        ],
        max_tokens: options?.maxTokens ?? 512,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 0.9,
      });
      const result = completion.choices[0]?.message?.content || "";

      if (!options?.noCache && result) {
        const key = this.cacheKey(prompt, options ? { system: options.system, temperature: options.temperature } : undefined);
        this.cacheSet(key, result);
      }
      return result;
    } catch (err) {
      console.error("[Groq] API error:", err);
      return "";
    }
  }

  async analyze(text: string): Promise<{
    topics: string[];
    sentiment: "positive" | "negative" | "neutral";
    keywords: string[];
    entities: string[];
    confidence: number;
  }> {
    const prompt = `Analyze the following text and return a JSON object with:
- topics: array of main topics discussed
- sentiment: "positive", "negative", or "neutral"
- keywords: array of key keywords
- entities: array of named entities found
- confidence: a number between 0 and 1

Text: "${text}"

Return ONLY valid JSON.`;

    const result = await this.generate(prompt, {
      system: "You are a text analysis engine. Return only valid JSON.",
      temperature: 0.1,
    });

    try {
      const jsonStart = result.indexOf("{");
      const jsonEnd = result.lastIndexOf("}") + 1;
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        return JSON.parse(result.slice(jsonStart, jsonEnd));
      }
    } catch {}
    return { topics: [], sentiment: "neutral", keywords: [], entities: [], confidence: 0.5 };
  }

  async embed(text: string): Promise<number[]> {
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);
    if (words.length === 0) return [];

    const prompt = `Generate a semantic embedding vector (128 floats) for the text: "${text}"
Return ONLY a JSON array of 128 numbers between -1 and 1. No other text.`;

    const result = await this.generate(prompt, {
      system: "You generate embedding vectors. Return only a JSON array of 128 floats.",
      temperature: 0.1,
      maxTokens: 1024,
    });

    try {
      const arrStart = result.indexOf("[");
      const arrEnd = result.lastIndexOf("]") + 1;
      if (arrStart >= 0 && arrEnd > arrStart) {
        const parsed = JSON.parse(result.slice(arrStart, arrEnd));
        if (Array.isArray(parsed) && parsed.length === 128) return parsed;
      }
    } catch {}

    const vector = new Array(128).fill(0);
    for (let i = 0; i < Math.min(words.length, 128); i++) {
      vector[i] = (words[i].length % 20) / 20;
    }
    return vector;
  }

  async detectObjects(imageDescription: string): Promise<Array<{
    label: string;
    confidence: number;
    boundingBox: { x: number; y: number; width: number; height: number };
  }>> {
    const prompt = `Given this image description: "${imageDescription}"

Return a JSON array of detected objects. Each object must have:
- label: string (what the object is)
- confidence: number 0-1
- boundingBox: { x, y, width, height } as relative coordinates 0-1

Return ONLY a valid JSON array. No other text.`;

    const result = await this.generate(prompt, {
      system: "You are a computer vision detection system. Return only valid JSON arrays.",
      temperature: 0.1,
      maxTokens: 512,
    });

    try {
      const arrStart = result.indexOf("[");
      const arrEnd = result.lastIndexOf("]") + 1;
      if (arrStart >= 0 && arrEnd > arrStart) {
        return JSON.parse(result.slice(arrStart, arrEnd));
      }
    } catch {}
    return [];
  }

  async decide(context: string, actions: string[]): Promise<{
    action: string;
    confidence: number;
    reasoning: string;
  }> {
    const prompt = `Given the current context: "${context}"

Choose the best action from: [${actions.join(", ")}]

Return a JSON object with:
- action: the chosen action (must be one of the listed)
- confidence: number 0-1
- reasoning: short explanation

Return ONLY valid JSON.`;

    const result = await this.generate(prompt, {
      system: "You are a decision engine. Choose the best action and explain why.",
      temperature: 0.3,
      maxTokens: 256,
    });

    try {
      const jsonStart = result.indexOf("{");
      const jsonEnd = result.lastIndexOf("}") + 1;
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        return JSON.parse(result.slice(jsonStart, jsonEnd));
      }
    } catch {}
    return { action: actions[0] || "stop", confidence: 0.5, reasoning: "fallback" };
  }

  cosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}
