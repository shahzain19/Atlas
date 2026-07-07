import { SysfsGPIODriver } from "../../atlas-hardware_deprecated/Drivers/Real/SysfsGPIODriver";
import { MemoryGPIOBackend } from "../../atlas-hardware_deprecated/Transport/GPIOBackend";
import { GPIOMode, GPIOValue } from "../../atlas-hardware_deprecated/Interfaces/GPIODriver";

describe("SysfsGPIODriver", () => {
  it("reads and writes GPIO pins", async () => {
    const backend = new MemoryGPIOBackend();
    const driver = new SysfsGPIODriver("gpio-1", "TestGPIO", backend);

    await driver.initialize();
    await driver.setMode(17, GPIOMode.OUTPUT);
    await driver.write(17, GPIOValue.HIGH);
    expect(await driver.read(17)).toBe(GPIOValue.HIGH);

    await driver.setMode(27, GPIOMode.OUTPUT);
    await driver.write(27, GPIOValue.LOW);
    expect(await driver.read(27)).toBe(GPIOValue.LOW);

    await driver.shutdown();
  });
});
