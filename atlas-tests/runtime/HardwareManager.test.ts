import { HardwareManager } from "../../atlas-runtime/HardwareManager/HardwareManager";
import { Actuator, Sensor, CapabilityType } from "../../atlas-kernel/Hardware/Hardware";

describe("HardwareManager", () => {
  let manager: HardwareManager;

  beforeEach(() => {
    manager = new HardwareManager();
  });

  it("should register and retrieve actuators", () => {
    const mockActuator: Actuator = {
      type: CapabilityType.MOTION,
      name: "TestMotor",
      specs: {},
      execute: jest.fn().mockResolvedValue(undefined),
    };

    manager.registerActuator(mockActuator);
    const motors = manager.getActuatorsByType(CapabilityType.MOTION);
    expect(motors).toContain(mockActuator);
  });

  it("should execute commands on actuators", async () => {
    const mockActuator: Actuator = {
      type: CapabilityType.MOTION,
      name: "TestMotor",
      specs: {},
      execute: jest.fn().mockResolvedValue(undefined),
    };

    manager.registerActuator(mockActuator);
    await manager.executeCommand("TestMotor", "MOVE", { speed: 10 });
    expect(mockActuator.execute).toHaveBeenCalledWith("MOVE", { speed: 10 });
  });

  it("should register and read from sensors", async () => {
    const mockSensor: Sensor = {
      type: CapabilityType.SENSING,
      name: "TestGPS",
      specs: {},
      read: jest.fn().mockResolvedValue({ lat: 10, lng: 20 }),
    };

    manager.registerSensor(mockSensor);
    const data = await manager.readSensor("TestGPS");
    expect(data).toEqual({ lat: 10, lng: 20 });
    expect(mockSensor.read).toHaveBeenCalled();
  });
});
