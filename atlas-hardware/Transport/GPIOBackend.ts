import { GPIOMode, GPIOValue } from "../Interfaces/GPIODriver";

export interface GPIOBackend {
  exportPin(pin: number): Promise<void>;
  unexportPin(pin: number): Promise<void>;
  setDirection(pin: number, mode: GPIOMode): Promise<void>;
  write(pin: number, value: GPIOValue): Promise<void>;
  read(pin: number): Promise<GPIOValue>;
}

/**
 * In-memory GPIO backend for tests and simulation.
 */
export class MemoryGPIOBackend implements GPIOBackend {
  private readonly directions = new Map<number, GPIOMode>();
  private readonly values = new Map<number, GPIOValue>();
  private readonly exported = new Set<number>();

  async exportPin(pin: number): Promise<void> {
    this.exported.add(pin);
    if (!this.directions.has(pin)) this.directions.set(pin, GPIOMode.INPUT);
    if (!this.values.has(pin)) this.values.set(pin, GPIOValue.LOW);
  }

  async unexportPin(pin: number): Promise<void> {
    this.exported.delete(pin);
    this.directions.delete(pin);
    this.values.delete(pin);
  }

  async setDirection(pin: number, mode: GPIOMode): Promise<void> {
    if (!this.exported.has(pin)) throw new Error(`GPIO pin ${pin} is not exported`);
    this.directions.set(pin, mode);
  }

  async write(pin: number, value: GPIOValue): Promise<void> {
    if (!this.exported.has(pin)) throw new Error(`GPIO pin ${pin} is not exported`);
    if (this.directions.get(pin) !== GPIOMode.OUTPUT) {
      throw new Error(`GPIO pin ${pin} is not configured as output`);
    }
    this.values.set(pin, value);
  }

  async read(pin: number): Promise<GPIOValue> {
    if (!this.exported.has(pin)) throw new Error(`GPIO pin ${pin} is not exported`);
    return this.values.get(pin) ?? GPIOValue.LOW;
  }
}

/**
 * Linux sysfs GPIO backend (/sys/class/gpio).
 */
export class SysfsGPIOBackend implements GPIOBackend {
  private readonly exported = new Set<number>();
  private readonly basePath = "/sys/class/gpio";

  async exportPin(pin: number): Promise<void> {
    const fs = await import("fs/promises");
    if (this.exported.has(pin)) return;
    try {
      await fs.writeFile(`${this.basePath}/export`, String(pin));
      this.exported.add(pin);
    } catch (err) {
      throw new Error(`Failed to export GPIO pin ${pin}: ${(err as Error).message}`);
    }
  }

  async unexportPin(pin: number): Promise<void> {
    const fs = await import("fs/promises");
    if (!this.exported.has(pin)) return;
    try {
      await fs.writeFile(`${this.basePath}/unexport`, String(pin));
      this.exported.delete(pin);
    } catch (err) {
      throw new Error(`Failed to unexport GPIO pin ${pin}: ${(err as Error).message}`);
    }
  }

  async setDirection(pin: number, mode: GPIOMode): Promise<void> {
    const fs = await import("fs/promises");
    await fs.writeFile(`${this.basePath}/gpio${pin}/direction`, mode);
  }

  async write(pin: number, value: GPIOValue): Promise<void> {
    const fs = await import("fs/promises");
    await fs.writeFile(`${this.basePath}/gpio${pin}/value`, String(value));
  }

  async read(pin: number): Promise<GPIOValue> {
    const fs = await import("fs/promises");
    const raw = await fs.readFile(`${this.basePath}/gpio${pin}/value`, "utf8");
    return raw.trim() === "1" ? GPIOValue.HIGH : GPIOValue.LOW;
  }
}
