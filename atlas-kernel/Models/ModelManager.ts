import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const ATLAS_MODELS_DIR = process.env.ATLAS_MODELS_DIR
  || path.join(os.homedir(), ".atlas", "models");

const BUILTIN_MODELS_DIR = path.resolve(
  __dirname, "..", "..", "atlas-models"
);

export interface ModelInfo {
  path: string;
  loaded: boolean;
  inputShapes: Record<string, number[]>;
  outputNames: string[];
}

export class ModelManager {
  private static instance: ModelManager;
  private sessions = new Map<string, any>();

  private constructor() {
    fs.mkdirSync(ATLAS_MODELS_DIR, { recursive: true });
  }

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  async resolveModel(modelName: string): Promise<string> {
    const builtin = path.join(BUILTIN_MODELS_DIR, modelName);
    if (fs.existsSync(builtin)) return builtin;

    const user = path.join(ATLAS_MODELS_DIR, modelName);
    if (fs.existsSync(user)) return user;

    return builtin;
  }

  async loadSession(modelName: string): Promise<any> {
    const existing = this.sessions.get(modelName);
    if (existing) return existing;

    const modelPath = await this.resolveModel(modelName);
    const ort = require("onnxruntime-node");
    const session = await ort.InferenceSession.create(modelPath);
    this.sessions.set(modelName, session);
    return session;
  }

  releaseSession(modelName: string): void {
    this.sessions.delete(modelName);
  }

  releaseAll(): void {
    this.sessions.clear();
  }

  static get BUILTIN_MODELS_DIR(): string {
    return BUILTIN_MODELS_DIR;
  }

  static get USER_MODELS_DIR(): string {
    return ATLAS_MODELS_DIR;
  }
}
