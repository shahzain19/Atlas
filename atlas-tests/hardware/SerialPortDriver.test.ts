import { SerialPortDriver } from "../../atlas-hardware_deprecated/Drivers/Real/SerialPortDriver";
import { MemorySerialTransport } from "../../atlas-hardware_deprecated/Transport/SerialTransport";
import { HardwareStatus } from "../../atlas-hardware_deprecated/HAL/HardwareAbstractionLayer";

describe("SerialPortDriver", () => {
  it("connects, sends, and receives data", async () => {
    const transport = new MemorySerialTransport();
    const driver = new SerialPortDriver("serial-1", "TestSerial", transport);

    await driver.initialize();
    await driver.connect("memory://0", 115200);
    expect(driver.status).toBe(HardwareStatus.CONNECTED);

    const received: Uint8Array[] = [];
    driver.setReceiveCallback((data) => received.push(data));

    const payload = new TextEncoder().encode("AT+TEST\n");
    await driver.send(payload);
    expect(transport.getWritten()).toHaveLength(1);

    transport.receive(new TextEncoder().encode("OK\n"));
    expect(received).toHaveLength(1);

    await driver.disconnect();
    expect(driver.status).toBe(HardwareStatus.DISCONNECTED);
  });
});
