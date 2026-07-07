import { seededRange } from "../../atlas-kernel/utils/deterministic";

export interface GPSData {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: number;
}

export type GPSDataProvider = () => GPSData;

function defaultGPSProvider(): GPSData {
  const timestamp = Date.now();
  const elapsed = Math.floor(timestamp / 100) % 10000;
  const t = elapsed / 10000;

  const baseLat = 37.7749;
  const baseLng = -122.4194;
  const radius = 0.008;

  const lat = baseLat + Math.sin(t * Math.PI * 2) * radius;
  const lng = baseLng + Math.cos(t * Math.PI * 0.7) * radius;

  const altitude = 10 + Math.sin(t * Math.PI * 4) * 3;
  const speed = 2 + Math.sin(t * Math.PI * 2) * 1.5;
  const heading = (Math.sin(t * Math.PI * 2) * 180 + 180) % 360;

  return {
    latitude: lat + seededRange(Math.floor(timestamp / 200), -0.00005, 0.00005),
    longitude: lng + seededRange(Math.floor(timestamp / 200) + 1, -0.00005, 0.00005),
    altitude: altitude + seededRange(Math.floor(timestamp / 200) + 2, -0.2, 0.2),
    speed: Math.max(0, speed + seededRange(Math.floor(timestamp / 200) + 3, -0.3, 0.3)),
    heading: (heading + seededRange(Math.floor(timestamp / 200) + 4, -2, 2)) % 360,
    accuracy: 1.5 + seededRange(Math.floor(timestamp / 200) + 5, 0, 1.5),
    timestamp,
  };
}

export class GPSSensor {
  private isRunning: boolean;
  private dataCallback?: (data: GPSData) => void;
  private dataProvider: GPSDataProvider;

  constructor(dataProvider?: GPSDataProvider) {
    this.isRunning = false;
    this.dataProvider = dataProvider ?? defaultGPSProvider;
  }

  async start(): Promise<void> {
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  captureData(): GPSData {
    const data = this.dataProvider();
    this.dataCallback?.(data);
    return data;
  }

  setDataCallback(callback: (data: GPSData) => void): void {
    this.dataCallback = callback;
  }
}
