export interface Plugin {
  name: string;
  version: string;
  author?: string;
  description?: string;
  dependencies?: string[];

  initialize(runtime: any): Promise<void>;
  start?(): Promise<void>;
  stop?(): Promise<void>;
  destroy?(): Promise<void>;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private runtime: any;

  constructor(runtime: any) {
    this.runtime = runtime;
  }

  async register(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin ${plugin.name} requires dependency ${dep}`);
        }
      }
    }

    await plugin.initialize(this.runtime);
    this.plugins.set(plugin.name, plugin);
  }

  async unregister(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) return;

    if (plugin.stop) {
      await plugin.stop();
    }
    if (plugin.destroy) {
      await plugin.destroy();
    }
    this.plugins.delete(pluginName);
  }

  get(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName);
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  async startAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.start) {
        await plugin.start();
      }
    }
  }

  async stopAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.stop) {
        await plugin.stop();
      }
    }
  }

  has(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }

  clear(): void {
    this.plugins.clear();
  }
}
