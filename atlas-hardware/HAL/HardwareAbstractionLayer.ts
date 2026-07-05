/**
 * Hardware Abstraction Layer (HAL)
 * Provides uniform interface to all hardware
 */
import { BaseDriver } from "../Interfaces/BaseDriver";

export enum HardwareStatus {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error",
  INITIALIZING = "initializing",
}

export interface HardwareInfo {
  id: string;
  name: string;
  type: string;
  status: HardwareStatus;
  capabilities: string[];
}

export class HardwareAbstractionLayer {
  private drivers: Map<string, BaseDriver> = new Map();

  registerDriver(driver: BaseDriver): void {
    this.drivers.set(driver.id, driver);
  }

  unregisterDriver(id: string): void {
    this.drivers.delete(id);
  }

  getDriver<T extends BaseDriver>(id: string): T | undefined {
    return this.drivers.get(id) as T;
  }

  getDriversByType(type: string): BaseDriver[] {
    return Array.from(this.drivers.values()).filter((d) => d.type === type);
  }

  getAllDrivers(): BaseDriver[] {
    return Array.from(this.drivers.values());
  }

  getAllHardwareInfo(): HardwareInfo[] {
    return this.getAllDrivers().map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      status: d.status,
      capabilities: d.capabilities,
    }));
  }

  async initializeAll(): Promise<void> {
    await Promise.all(this.getAllDrivers().map((d) => d.initialize()));
  }

  async shutdownAll(): Promise<void> {
    await Promise.all(this.getAllDrivers().map((d) => d.shutdown()));
  }
}
