import { Actuator, Sensor, CapabilityType } from "../../../atlas-kernel/Hardware/Hardware";

export class MockMotor implements Actuator {
  type = CapabilityType.MOTION;
  name = "mock-motor";
  specs: Record<string, any> = {};

  commandLog: { command: string; params: Record<string, any> }[] = [];

  async execute(command: string, params: Record<string, any>): Promise<void> {
    this.commandLog.push({ command, params });
  }

  resetLog(): void {
    this.commandLog = [];
  }

  lastCommand(): { command: string; params: Record<string, any> } | undefined {
    return this.commandLog[this.commandLog.length - 1];
  }
}

export function mockGPSReading(
  lat = 37.7749,
  lng = -122.4194,
  alt = 0,
  speed = 0,
  heading = 0
): any {
  return { latitude: lat, longitude: lng, altitude: alt, speed, heading, accuracy: 1.0, timestamp: Date.now() };
}

export class MockGPS implements Sensor {
  type = CapabilityType.SENSING;
  name = "mock-gps";
  specs: Record<string, any> = {};

  private nextReading: any = mockGPSReading();
  private readingCount = 0;

  async read(): Promise<any> {
    this.readingCount++;
    return this.nextReading;
  }

  setNextReading(reading: any): void {
    this.nextReading = reading;
  }

  readingCalls(): number {
    return this.readingCount;
  }
}

export function mockCameraFrame(width = 640, height = 480): any {
  return {
    data: new Uint8Array(width * height * 3),
    width,
    height,
    channels: 3,
    timestamp: Date.now(),
  };
}

export class MockCamera implements Sensor {
  type = CapabilityType.IMAGING;
  name = "mock-camera";
  specs: Record<string, any> = {};

  private nextFrame: any = mockCameraFrame();
  private captureCount = 0;

  async read(): Promise<any> {
    this.captureCount++;
    return this.nextFrame;
  }

  setNextFrame(frame: any): void {
    this.nextFrame = frame;
  }

  captureCalls(): number {
    return this.captureCount;
  }
}
