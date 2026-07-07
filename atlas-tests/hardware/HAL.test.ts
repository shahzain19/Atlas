import { HardwareAbstractionLayer } from "../../atlas-hardware_deprecated/HAL/HardwareAbstractionLayer";
import { BaseDriver } from "../../atlas-hardware_deprecated/Interfaces/BaseDriver";
import { HardwareStatus } from "../../atlas-hardware_deprecated/HAL/HardwareAbstractionLayer";

class MockDriver implements BaseDriver {
  id: string = "mock-001";
  name: string = "Mock Driver";
  type: string = "mock";
  status: HardwareStatus = HardwareStatus.DISCONNECTED;
  capabilities: string[] = ["test"];

  async initialize() { this.status = HardwareStatus.CONNECTED; }
  async shutdown() { this.status = HardwareStatus.DISCONNECTED; }
  async reset() { this.status = HardwareStatus.INITIALIZING; }
  async getHealth() { return { value: 1.0, details: {} }; }
}

describe("HardwareAbstractionLayer", () => {
  let hal: HardwareAbstractionLayer;

  beforeEach(() => {
    hal = new HardwareAbstractionLayer();
  });

  it("should initialize without errors", () => {
    expect(hal).toBeDefined();
  });

  it("should register and retrieve drivers", () => {
    const driver = new MockDriver();
    hal.registerDriver(driver);
    expect(hal.getDriver("mock-001")).toEqual(driver);
  });

  it("should get drivers by type", () => {
    hal.registerDriver(new MockDriver());
    const drivers = hal.getDriversByType("mock");
    expect(drivers.length).toBe(1);
  });

  it("should get all hardware info", () => {
    const driver = new MockDriver();
    hal.registerDriver(driver);
    const infos = hal.getAllHardwareInfo();
    expect(infos.length).toBe(1);
    expect(infos[0].id).toBe("mock-001");
  });

  it("should initialize and shutdown all drivers", async () => {
    const driver = new MockDriver();
    hal.registerDriver(driver);
    await hal.initializeAll();
    expect(driver.status).toBe(HardwareStatus.CONNECTED);
    await hal.shutdownAll();
    expect(driver.status).toBe(HardwareStatus.DISCONNECTED);
  });
});
