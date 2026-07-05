import { CapabilityType, Sensor } from "../../../atlas-kernel/Hardware/Hardware";
import { HardwareStatus } from "../../HAL/HardwareAbstractionLayer";
import { NMEAFix, NMEAParser } from "../../Protocol/NMEAParser";
import { SerialPortDriver } from "../Real/SerialPortDriver";
import { MemorySerialTransport, SerialTransport } from "../../Transport/SerialTransport";

export class NMEAGPSSensor extends SerialPortDriver {
  private parser = new NMEAParser();
  private latestFix?: NMEAFix;

  constructor(id = "gps-001", name = "NMEAGPS", transport?: SerialTransport) {
    super(id, name, transport ?? new MemorySerialTransport());
    this.setReceiveCallback((data) => this.handleIncoming(data));
  }

  private handleIncoming(data: Uint8Array): void {
    const text = new TextDecoder().decode(data);
    const fixes = this.parser.parseChunk(text);
    if (fixes.length > 0) {
      this.latestFix = fixes[fixes.length - 1];
    }
  }

  ingestNMEA(sentence: string): void {
    const fixes = this.parser.parseChunk(sentence.endsWith("\n") ? sentence : `${sentence}\n`);
    if (fixes.length > 0) this.latestFix = fixes[fixes.length - 1];
  }

  async readFix(): Promise<{
    lat: number;
    lng: number;
    alt?: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    timestamp: number;
  }> {
    if (!this.latestFix) {
      throw new Error("No GPS fix available yet");
    }

    return {
      lat: this.latestFix.latitude,
      lng: this.latestFix.longitude,
      alt: this.latestFix.altitude,
      speed: this.latestFix.speedKnots !== undefined ? this.latestFix.speedKnots * 0.514444 : undefined,
      heading: this.latestFix.course,
      accuracy: this.latestFix.hdop,
      timestamp: this.latestFix.timestamp,
    };
  }

  hasFix(): boolean {
    return Boolean(this.latestFix);
  }

  override async getHealth(): Promise<{ value: number; details: Record<string, unknown> }> {
    const base = await super.getHealth();
    return {
      value: this.latestFix ? base.value : 0,
      details: { ...base.details, hasFix: Boolean(this.latestFix) },
    };
  }

  override async initialize(): Promise<void> {
    this.status = HardwareStatus.INITIALIZING;
    this.status = this.latestFix ? HardwareStatus.CONNECTED : HardwareStatus.DISCONNECTED;
  }
}

export class NMEAGPSSensorAdapter implements Sensor {
  type = CapabilityType.SENSING;
  name: string;
  specs: Record<string, unknown>;

  constructor(private readonly driver: NMEAGPSSensor) {
    this.name = driver.name;
    this.specs = { protocol: "NMEA", driverId: driver.id };
  }

  async read(): Promise<unknown> {
    return this.driver.readFix();
  }
}
