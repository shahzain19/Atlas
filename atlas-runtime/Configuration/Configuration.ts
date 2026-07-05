export interface ConfigOptions {
  path?: string;
  defaults?: Record<string, any>;
}

export class Configuration {
  private config: Record<string, any> = {};
  private configPath: string;

  constructor(options: ConfigOptions = {}) {
    this.configPath = options.path || "config.json";
    this.config = { ...(options.defaults || {}) };
    this.load();
  }

  private load(): void {
    try {
      const fs = require("fs");
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, "utf8");
        this.config = { ...this.config, ...JSON.parse(data) };
      }
    } catch (err) {
      console.warn(`[Config] Could not load config: ${err}`);
    }
  }

  save(): void {
    try {
      const fs = require("fs");
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (err) {
      console.error(`[Config] Could not save config: ${err}`);
    }
  }

  get<T = any>(key: string, defaultValue?: T): T {
    const keys = key.split(".");
    let current: any = this.config;
    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        return defaultValue as T;
      }
    }
    return current as T;
  }

  set(key: string, value: any): void {
    const keys = key.split(".");
    let current: any = this.config;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== "object") {
        current[k] = {};
      }
      current = current[k];
    }
    current[keys[keys.length - 1]] = value;
  }

  has(key: string): boolean {
    const keys = key.split(".");
    let current: any = this.config;
    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        return false;
      }
    }
    return true;
  }

  getAll(): Record<string, any> {
    return { ...this.config };
  }

  reset(): void {
    this.config = {};
  }
}
