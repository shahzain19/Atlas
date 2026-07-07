import { CANFrame, CANDriver } from "../../Interfaces/CANDriver";
import { HardwareStatus } from "../../HAL/HardwareAbstractionLayer";
import { CANTransport, MemoryCANTransport } from "../../Transport/CANTransport";

export class CANBusDriver extends CANDriver {
  id: string;
  name: string;
  private transport: CANTransport;
  private receiveCallback?: (frame: CANFrame) => void;
  private connectedBus?: string;

  constructor(id: string, name: string, transport?: CANTransport) {
    super();
    this.id = id;
    this.name = name;
    this.transport = transport ?? new MemoryCANTransport();
    this.transport.onFrame((frame) => this.receiveCallback?.(frame));
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
      details: { bus: this.connectedBus ?? null, open: this.transport.isOpen() },
    };
  }

  async connect(bus: string, baudRate: number): Promise<void> {
    this.status = HardwareStatus.INITIALIZING;
    await this.transport.open(bus, baudRate);
    this.connectedBus = bus;
    this.status = HardwareStatus.CONNECTED;
  }

  async disconnect(): Promise<void> {
    if (this.transport.isOpen()) {
      await this.transport.close();
    }
    this.connectedBus = undefined;
    this.status = HardwareStatus.DISCONNECTED;
  }

  async sendFrame(frame: CANFrame): Promise<void> {
    if (this.status !== HardwareStatus.CONNECTED) {
      throw new Error(`CAN driver ${this.id} is not connected`);
    }
    await this.transport.sendFrame({
      ...frame,
      timestamp: frame.timestamp ?? Date.now(),
    });
  }

  setReceiveCallback(callback: (frame: CANFrame) => void): void {
    this.receiveCallback = callback;
  }

  getTransport(): CANTransport {
    return this.transport;
  }
}
