import { GPIODriver, GPIOMode, GPIOValue } from "../../Interfaces/GPIODriver";
import { HardwareStatus } from "../../HAL/HardwareAbstractionLayer";
import { GPIOBackend, MemoryGPIOBackend } from "../../Transport/GPIOBackend";

export class SysfsGPIODriver extends GPIODriver {
  id: string;
  name: string;
  private backend: GPIOBackend;
  private readonly configuredPins = new Set<number>();

  constructor(id: string, name: string, backend?: GPIOBackend) {
    super();
    this.id = id;
    this.name = name;
    this.backend = backend ?? new MemoryGPIOBackend();
  }

  async initialize(): Promise<void> {
    this.status = HardwareStatus.INITIALIZING;
    this.status = HardwareStatus.CONNECTED;
  }

  async shutdown(): Promise<void> {
    for (const pin of [...this.configuredPins]) {
      await this.backend.unexportPin(pin).catch(() => undefined);
    }
    this.configuredPins.clear();
    this.status = HardwareStatus.DISCONNECTED;
  }

  async reset(): Promise<void> {
    await this.shutdown();
    await this.initialize();
  }

  async getHealth(): Promise<{ value: number; details: Record<string, unknown> }> {
    return {
      value: this.status === HardwareStatus.CONNECTED ? 1 : 0,
      details: { pins: [...this.configuredPins] },
    };
  }

  async setMode(pin: number, mode: GPIOMode): Promise<void> {
    if (!this.configuredPins.has(pin)) {
      await this.backend.exportPin(pin);
      this.configuredPins.add(pin);
    }
    await this.backend.setDirection(pin, mode);
  }

  async write(pin: number, value: GPIOValue): Promise<void> {
    await this.backend.write(pin, value);
  }

  async read(pin: number): Promise<GPIOValue> {
    return this.backend.read(pin);
  }

  getBackend(): GPIOBackend {
    return this.backend;
  }
}
