import { CANFrame } from "../Interfaces/CANDriver";

export interface CANTransport {
  open(bus: string, baudRate: number): Promise<void>;
  close(): Promise<void>;
  sendFrame(frame: CANFrame): Promise<void>;
  onFrame(callback: (frame: CANFrame) => void): void;
  isOpen(): boolean;
}

/**
 * In-memory CAN transport for tests and simulation.
 */
export class MemoryCANTransport implements CANTransport {
  private openState = false;
  private callback?: (frame: CANFrame) => void;
  private readonly sent: CANFrame[] = [];

  async open(_bus: string, _baudRate: number): Promise<void> {
    this.openState = true;
  }

  async close(): Promise<void> {
    this.openState = false;
  }

  async sendFrame(frame: CANFrame): Promise<void> {
    if (!this.openState) throw new Error("CAN transport is not open");
    this.sent.push({ ...frame, data: new Uint8Array(frame.data) });
  }

  onFrame(callback: (frame: CANFrame) => void): void {
    this.callback = callback;
  }

  isOpen(): boolean {
    return this.openState;
  }

  receive(frame: CANFrame): void {
    this.callback?.({
      ...frame,
      data: new Uint8Array(frame.data),
      timestamp: frame.timestamp ?? Date.now(),
    });
  }

  getSentFrames(): CANFrame[] {
    return [...this.sent];
  }
}

/**
 * SocketCAN transport using Linux cansend/candump utilities when available.
 */
export class SocketCANTransport implements CANTransport {
  private openState = false;
  private bus = "can0";
  private callback?: (frame: CANFrame) => void;
  private pollTimer?: NodeJS.Timeout;

  async open(bus: string, _baudRate: number): Promise<void> {
    this.bus = bus;
    this.openState = true;
  }

  async close(): Promise<void> {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = undefined;
    this.openState = false;
  }

  async sendFrame(frame: CANFrame): Promise<void> {
    if (!this.openState) throw new Error("CAN transport is not open");
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const exec = promisify(execFile);
    const hex = Array.from(frame.data)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(".");
    const id = frame.extended ? `${frame.id.toString(16)}` : `${frame.id.toString(16)}`;
    try {
      await exec("cansend", [`${this.bus}`, `${id}#${hex}`]);
    } catch {
      throw new Error(`Failed to send CAN frame on ${this.bus}. Ensure SocketCAN is configured.`);
    }
  }

  onFrame(callback: (frame: CANFrame) => void): void {
    this.callback = callback;
  }

  isOpen(): boolean {
    return this.openState;
  }

  /** Deliver a frame to subscribers (used when integrating candump parsers). */
  deliver(frame: CANFrame): void {
    this.callback?.(frame);
  }
}
