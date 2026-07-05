import { Sensor, CapabilityType } from "../../../atlas-kernel/Hardware/Hardware";
import { seededRange } from "../../../atlas-kernel/utils/deterministic";

export class MockGPS implements Sensor {
  type = CapabilityType.SENSING;
  name = "MockGPS";
  specs = { accuracy: "1.5m", updateRate: "10Hz" };
  private readCount = 0;

  async read(): Promise<{
    lat: number;
    lng: number;
    alt: number;
    timestamp: number;
  }> {
    const seed = this.readCount++;
    return {
      lat: 45.4215 + seededRange(seed, -0.005, 0.005),
      lng: -75.6972 + seededRange(seed + 1, -0.005, 0.005),
      alt: 100 + seededRange(seed + 2, -2.5, 2.5),
      timestamp: Date.now(),
    };
  }
}
