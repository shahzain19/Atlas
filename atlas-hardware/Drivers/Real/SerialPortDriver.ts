import { SerialDriver } from "../../Interfaces/SerialDriver";
import { HardwareStatus } from "../../HAL/HardwareAbstractionLayer";
import { MemorySerialTransport, SerialTransport } from "../../Transport/SerialTransport";

export class SerialPortDriver extends SerialDriver {
  id: string;
  name: string;
  private transport: SerialTransport;
  private receiveCallback?: (data: Uint8Array) => void;
  private connectedPort?: string;

  constructor(id: string, name: string, transport?: SerialTransport) {
    super();
    this.id = id;
    this.name = name;
    this.transport = transport ?? new MemorySerialTransport();
    this.transport.onData((data) => this.receiveCallback?.(data));
  }

  async initialize(): Promise<void> {
    this.status = HardwareStatus.INITIALIZING;
    this.status = HardwareStatus.DISCONNECTED;
  }

  async shutdown(): Promise<void> {
    await this.disconnect();
    this.status = HardwareStatus.DISCONNECTED;
  }

  async reset(): Promise<void> {
    await this.shutdown();
    await this.initialize();
  }

  async getHealth(): Promise<{ value: number; details: Record<string, unknown> }> {
    return {
      value: this.status === HardwareStatus.CONNECTED ? 1 : 0,
      details: { port: this.connectedPort ?? null, open: this.transport.isOpen() },
    };
  }

  async connect(
    port: string,
    baudRate: number,
    options?: { parity: "none" | "even" | "odd" }
  ): Promise<void> {
    this.status = HardwareStatus.INITIALIZING;
    await this.transport.open(port, baudRate, options);
    this.connectedPort = port;
    this.status = HardwareStatus.CONNECTED;
  }

  async disconnect(): Promise<void> {
    if (this.transport.isOpen()) {
      await this.transport.close();
    }
    this.connectedPort = undefined;
    this.status = HardwareStatus.DISCONNECTED;
  }

  async send(data: Uint8Array): Promise<void> {
    if (this.status !== HardwareStatus.CONNECTED) {
      throw new Error(`Serial driver ${this.id} is not connected`);
    }
    await this.transport.write(data);
  }

  setReceiveCallback(callback: (data: Uint8Array) => void): void {
    this.receiveCallback = callback;
  }

  getTransport(): SerialTransport {
    return this.transport;
  }
}
