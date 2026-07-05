import { CapabilityRegistry } from "../../atlas-kernel/Capability/CapabilityRegistry";
import {
  CapabilityType,
  MotionCapability,
  SensingCapability,
} from "../../atlas-kernel/Capability/Capability";

describe("CapabilityRegistry", () => {
  let registry: CapabilityRegistry;

  beforeEach(() => {
    registry = new CapabilityRegistry();
  });

  test("should register and retrieve a capability", () => {
    const cap: MotionCapability = {
      id: "test-motion",
      type: CapabilityType.MOTION,
      name: "Test Motion",
      provider: "test-provider",
      specs: { maxSpeed: 10, maxAcceleration: 5, degreesOfFreedom: 3 },
      enabled: true,
      health: "healthy",
      moveTo: jest.fn(),
      rotateTo: jest.fn(),
      stop: jest.fn(),
    };

    registry.register(cap);
    const retrieved = registry.get("test-motion");
    expect(retrieved).toEqual(cap);
  });

  test("should unregister a capability", () => {
    const cap: MotionCapability = {
      id: "test-motion",
      type: CapabilityType.MOTION,
      name: "Test Motion",
      provider: "test-provider",
      specs: { maxSpeed: 10, maxAcceleration: 5, degreesOfFreedom: 3 },
      enabled: true,
      health: "healthy",
      moveTo: jest.fn(),
      rotateTo: jest.fn(),
      stop: jest.fn(),
    };

    registry.register(cap);
    registry.unregister("test-motion");
    expect(registry.get("test-motion")).toBeUndefined();
  });

  test("should get capabilities by type", () => {
    const cap1: MotionCapability = {
      id: "test-motion-1",
      type: CapabilityType.MOTION,
      name: "Test Motion 1",
      provider: "test-provider",
      specs: { maxSpeed: 10, maxAcceleration: 5, degreesOfFreedom: 3 },
      enabled: true,
      health: "healthy",
      moveTo: jest.fn(),
      rotateTo: jest.fn(),
      stop: jest.fn(),
    };

    const cap2: SensingCapability = {
      id: "test-sensing-1",
      type: CapabilityType.SENSING,
      name: "Test Sensing",
      provider: "test-provider",
      specs: { sensorType: "gps", updateRate: 10, range: { min: 0, max: 100 } },
      enabled: true,
      health: "healthy",
      read: jest.fn(),
    };

    registry.register(cap1);
    registry.register(cap2);

    const motionCaps = registry.getByType(CapabilityType.MOTION);
    expect(motionCaps.length).toBe(1);
    expect(motionCaps[0].id).toBe("test-motion-1");
  });

  test("should get capabilities by provider", () => {
    const cap1: MotionCapability = {
      id: "test-motion-1",
      type: CapabilityType.MOTION,
      name: "Test Motion 1",
      provider: "provider-1",
      specs: { maxSpeed: 10, maxAcceleration: 5, degreesOfFreedom: 3 },
      enabled: true,
      health: "healthy",
      moveTo: jest.fn(),
      rotateTo: jest.fn(),
      stop: jest.fn(),
    };

    const cap2: MotionCapability = {
      id: "test-motion-2",
      type: CapabilityType.MOTION,
      name: "Test Motion 2",
      provider: "provider-2",
      specs: { maxSpeed: 10, maxAcceleration: 5, degreesOfFreedom: 3 },
      enabled: true,
      health: "healthy",
      moveTo: jest.fn(),
      rotateTo: jest.fn(),
      stop: jest.fn(),
    };

    registry.register(cap1);
    registry.register(cap2);

    const providerCaps = registry.getByProvider("provider-1");
    expect(providerCaps.length).toBe(1);
    expect(providerCaps[0].id).toBe("test-motion-1");
  });

  test("should update health status", () => {
    const cap: MotionCapability = {
      id: "test-motion",
      type: CapabilityType.MOTION,
      name: "Test Motion",
      provider: "test-provider",
      specs: { maxSpeed: 10, maxAcceleration: 5, degreesOfFreedom: 3 },
      enabled: true,
      health: "healthy",
      moveTo: jest.fn(),
      rotateTo: jest.fn(),
      stop: jest.fn(),
    };

    registry.register(cap);
    registry.updateHealth("test-motion", "failed");
    expect(registry.get("test-motion")?.health).toBe("failed");
  });

  test("should enable and disable capabilities", () => {
    const cap: MotionCapability = {
      id: "test-motion",
      type: CapabilityType.MOTION,
      name: "Test Motion",
      provider: "test-provider",
      specs: { maxSpeed: 10, maxAcceleration: 5, degreesOfFreedom: 3 },
      enabled: true,
      health: "healthy",
      moveTo: jest.fn(),
      rotateTo: jest.fn(),
      stop: jest.fn(),
    };

    registry.register(cap);
    registry.disable("test-motion");
    expect(registry.get("test-motion")?.enabled).toBe(false);
    registry.enable("test-motion");
    expect(registry.get("test-motion")?.enabled).toBe(true);
  });

  test("should get all healthy capabilities", () => {
    const cap1: MotionCapability = {
      id: "test-motion-1",
      type: CapabilityType.MOTION,
      name: "Test Motion 1",
      provider: "test-provider",
      specs: { maxSpeed: 10, maxAcceleration: 5, degreesOfFreedom: 3 },
      enabled: true,
      health: "healthy",
      moveTo: jest.fn(),
      rotateTo: jest.fn(),
      stop: jest.fn(),
    };

    const cap2: MotionCapability = {
      id: "test-motion-2",
      type: CapabilityType.MOTION,
      name: "Test Motion 2",
      provider: "test-provider",
      specs: { maxSpeed: 10, maxAcceleration: 5, degreesOfFreedom: 3 },
      enabled: true,
      health: "failed",
      moveTo: jest.fn(),
      rotateTo: jest.fn(),
      stop: jest.fn(),
    };

    registry.register(cap1);
    registry.register(cap2);

    const healthy = registry.getHealthy();
    expect(healthy.length).toBe(1);
    expect(healthy[0].id).toBe("test-motion-1");
  });

  test("should clear all capabilities", () => {
    const cap1: MotionCapability = {
      id: "test-motion-1",
      type: CapabilityType.MOTION,
      name: "Test Motion 1",
      provider: "test-provider",
      specs: { maxSpeed: 10, maxAcceleration: 5, degreesOfFreedom: 3 },
      enabled: true,
      health: "healthy",
      moveTo: jest.fn(),
      rotateTo: jest.fn(),
      stop: jest.fn(),
    };

    const cap2: SensingCapability = {
      id: "test-sensing-1",
      type: CapabilityType.SENSING,
      name: "Test Sensing",
      provider: "test-provider",
      specs: { sensorType: "gps", updateRate: 10, range: { min: 0, max: 100 } },
      enabled: true,
      health: "healthy",
      read: jest.fn(),
    };

    registry.register(cap1);
    registry.register(cap2);

    registry.clear();
    expect(registry.getAll().length).toBe(0);
  });
});
