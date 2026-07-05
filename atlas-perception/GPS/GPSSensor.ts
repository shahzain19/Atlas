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
  const seed = Math.floor(timestamp / 1000);
  return {
    latitude: 37.7749 + seededRange(seed, 0, 0.01),
    longitude: -122.4194 + seededRange(seed + 1, 0, 0.01),
    altitude: 10 + seededRange(seed + 2, 0, 5),
    accuracy: 2 + seededRange(seed + 3, 0, 3),
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
