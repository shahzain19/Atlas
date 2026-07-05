import { NMEAGPSSensor, NMEAGPSSensorAdapter } from "../../atlas-hardware/Drivers/Devices/NMEAGPSSensor";
import { HardwareManager } from "../../atlas-runtime/HardwareManager/HardwareManager";
import { HardwareBridge } from "../../atlas-hardware/Bridge/HardwareBridge";
import { HardwareAbstractionLayer } from "../../atlas-hardware/HAL/HardwareAbstractionLayer";

describe("NMEAGPSSensor", () => {
  it("parses NMEA and exposes sensor reads", async () => {
    const gps = new NMEAGPSSensor();
    gps.ingestNMEA("$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47");

    const fix = await gps.readFix();
    expect(fix.lat).toBeCloseTo(48.1173, 3);
    expect(fix.lng).toBeCloseTo(11.5167, 3);
  });
});

describe("HardwareBridge", () => {
  it("registers HAL drivers with HardwareManager", async () => {
    const hal = new HardwareAbstractionLayer();
    const manager = new HardwareManager();
    const bridge = new HardwareBridge(hal, manager);

    const gps = new NMEAGPSSensor("gps-test", "TestGPS");
    const sensor = new NMEAGPSSensorAdapter(gps);
    bridge.registerBundle({ driver: gps, sensor: sensor });

    gps.ingestNMEA("$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47");
    const reading = await manager.readSensor("TestGPS");
    expect(reading.lat).toBeCloseTo(48.1173, 3);
  });
});
