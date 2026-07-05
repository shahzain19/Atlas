import { LocalizationAgent, Pose } from "../../atlas-agents/LocalizationAgent/LocalizationAgent";
import { GPSData } from "../../atlas-perception/GPS/GPSSensor";
import { IMUData } from "../../atlas-perception/IMU/IMUSensor";

describe("LocalizationAgent", () => {
  it("should initialize with zero pose", () => {
    const agent = new LocalizationAgent();
    const pose = agent.getPose();
    expect(pose.x).toBe(0);
    expect(pose.y).toBe(0);
    expect(pose.z).toBe(0);
    expect(pose.roll).toBe(0);
    expect(pose.pitch).toBe(0);
    expect(pose.yaw).toBe(0);
    expect(typeof pose.timestamp).toBe("number");
  });

  it("updateFromGPS should set x/y from lon/lat", () => {
    const agent = new LocalizationAgent();
    const gps: GPSData = {
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: 1000,
    };
    agent.updateFromGPS(gps);
    const pose = agent.getPose();
    expect(pose.x).toBe(-122.4194 * 100000);
    expect(pose.y).toBe(37.7749 * 100000);
    expect(pose.timestamp).toBe(1000);
  });

  it("updateFromGPS with altitude should not affect z", () => {
    const agent = new LocalizationAgent();
    const gps: GPSData = {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 50,
      timestamp: 2000,
    };
    agent.updateFromGPS(gps);
    const pose = agent.getPose();
    expect(pose.z).toBe(0);
  });

  it("updateFromIMU should update timestamp", () => {
    const agent = new LocalizationAgent();
    const imu: IMUData = {
      acceleration: { x: 0.1, y: 0.2, z: 9.81 },
      gyroscope: { x: 0.01, y: 0.02, z: 0.03 },
      timestamp: 5000,
    };
    agent.updateFromIMU(imu);
    const pose = agent.getPose();
    expect(pose.timestamp).toBe(5000);
  });

  it("getPose returns a copy (not reference)", () => {
    const agent = new LocalizationAgent();
    const pose1 = agent.getPose();
    const pose2 = agent.getPose();
    pose1.x = 999;
    pose2.y = 888;
    const pose3 = agent.getPose();
    expect(pose3.x).toBe(0);
    expect(pose3.y).toBe(0);
  });

  it("setPose updates the pose", () => {
    const agent = new LocalizationAgent();
    const newPose: Pose = {
      x: 100,
      y: 200,
      z: 10,
      roll: 0.5,
      pitch: 0.1,
      yaw: 1.57,
      timestamp: 9999,
    };
    agent.setPose(newPose);
    const pose = agent.getPose();
    expect(pose.x).toBe(100);
    expect(pose.y).toBe(200);
    expect(pose.z).toBe(10);
    expect(pose.roll).toBe(0.5);
    expect(pose.pitch).toBe(0.1);
    expect(pose.yaw).toBe(1.57);
    expect(pose.timestamp).toBe(9999);
  });

  it("setPose stores a copy, not a reference", () => {
    const agent = new LocalizationAgent();
    const newPose: Pose = {
      x: 100,
      y: 200,
      z: 0,
      roll: 0,
      pitch: 0,
      yaw: 0,
      timestamp: 1234,
    };
    agent.setPose(newPose);
    newPose.x = 999;
    expect(agent.getPose().x).toBe(100);
  });
});
