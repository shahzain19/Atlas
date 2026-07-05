import { LidarSensor } from "../../atlas-perception/Lidar/LidarSensor";

describe("LidarSensor", () => {
  let lidar: LidarSensor;

  beforeEach(() => {
    lidar = new LidarSensor();
  });

  it("should initialize with default config", () => {
    const config = lidar.getConfig();
    expect(config.minRange).toBe(0.1);
    expect(config.maxRange).toBe(100);
  });

  it("should capture a scan with points", () => {
    const scan = lidar.captureScan();
    expect(scan.points.length).toBeGreaterThan(0);
    expect(scan.points[0]).toHaveProperty("x");
    expect(scan.points[0]).toHaveProperty("y");
  });

  it("should allow updating config", () => {
    lidar.updateConfig({ maxRange: 200 });
    expect(lidar.getConfig().maxRange).toBe(200);
  });
});
