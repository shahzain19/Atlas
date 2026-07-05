import { CANBusDriver } from "../../atlas-hardware/Drivers/Real/CANBusDriver";
import { MemoryCANTransport } from "../../atlas-hardware/Transport/CANTransport";
import { HardwareStatus } from "../../atlas-hardware/HAL/HardwareAbstractionLayer";

describe("CANBusDriver", () => {
  it("sends and receives CAN frames", async () => {
    const transport = new MemoryCANTransport();
    const driver = new CANBusDriver("can-1", "TestCAN", transport);

    await driver.initialize();
    await driver.connect("vcan0", 500000);

    const frames: unknown[] = [];
    driver.setReceiveCallback((frame) => frames.push(frame));

    await driver.sendFrame({
      id: 0x123,
      data: new Uint8Array([1, 2, 3, 4]),
      timestamp: Date.now(),
    });

    expect(transport.getSentFrames()).toHaveLength(1);
    expect(driver.status).toBe(HardwareStatus.CONNECTED);

    transport.receive({
      id: 0x456,
      data: new Uint8Array([9, 8, 7]),
      timestamp: Date.now(),
    });
    expect(frames).toHaveLength(1);

    await driver.disconnect();
  });
});
