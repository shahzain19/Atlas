import {
  Capability,
  CapabilityType,
  AnyCapability,
} from "./Capability";

export class CapabilityRegistry {
  private capabilities: Map<string, AnyCapability> = new Map();

  register(capability: AnyCapability): void {
    this.capabilities.set(capability.id, capability);
  }

  unregister(capabilityId: string): void {
    this.capabilities.delete(capabilityId);
  }

  get(capabilityId: string): AnyCapability | undefined {
    return this.capabilities.get(capabilityId);
  }

  getAll(): AnyCapability[] {
    return Array.from(this.capabilities.values());
  }

  getByType(type: CapabilityType): AnyCapability[] {
    return Array.from(this.capabilities.values()).filter(
      (cap) => cap.type === type
    );
  }

  getByProvider(providerId: string): AnyCapability[] {
    return Array.from(this.capabilities.values()).filter(
      (cap) => cap.provider === providerId
    );
  }

  getHealthy(): AnyCapability[] {
    return Array.from(this.capabilities.values()).filter(
      (cap) => cap.health === "healthy"
    );
  }

  updateHealth(capabilityId: string, health: "healthy" | "degraded" | "failed"): void {
    const cap = this.capabilities.get(capabilityId);
    if (cap) {
      cap.health = health;
    }
  }

  enable(capabilityId: string): void {
    const cap = this.capabilities.get(capabilityId);
    if (cap) {
      cap.enabled = true;
    }
  }

  disable(capabilityId: string): void {
    const cap = this.capabilities.get(capabilityId);
    if (cap) {
      cap.enabled = false;
    }
  }

  clear(): void {
    this.capabilities.clear();
  }
}
