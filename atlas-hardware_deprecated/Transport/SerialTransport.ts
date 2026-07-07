export interface SerialTransportOptions {
  parity?: "none" | "even" | "odd";
}

export interface SerialTransport {
  open(port: string, baudRate: number, options?: SerialTransportOptions): Promise<void>;
  close(): Promise<void>;
  write(data: Uint8Array): Promise<void>;
  onData(callback: (data: Uint8Array) => void): void;
  isOpen(): boolean;
}

export type HardwareMode = "simulation" | "real" | "hybrid";

export function createTransport(mode: HardwareMode, devicePath?: string, baudRate?: number): SerialTransport {
  if (mode === "real" || mode === "hybrid") {
    if (devicePath && devicePath.includes(":")) {
      return new TcpSerialTransport();
    }
    return new NativeSerialTransport();
  }
  return new MemorySerialTransport();
}

/**
 * In-memory serial transport for tests and simulation.
 */
export class MemorySerialTransport implements SerialTransport {
  private openState = false;
  private callback?: (data: Uint8Array) => void;
  private readonly inbox: Uint8Array[] = [];

  async open(_port: string, _baudRate: number, _options?: SerialTransportOptions): Promise<void> {
    this.openState = true;
  }

  async close(): Promise<void> {
    this.openState = false;
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.openState) throw new Error("Serial transport is not open");
    this.inbox.push(new Uint8Array(data));
  }

  onData(callback: (data: Uint8Array) => void): void {
    this.callback = callback;
  }

  isOpen(): boolean {
    return this.openState;
  }

  /** Inject bytes as if received from hardware (used in tests). */
  receive(data: Uint8Array): void {
    this.callback?.(new Uint8Array(data));
  }

  /** Read bytes written to the transport (used in tests). */
  getWritten(): Uint8Array[] {
    return [...this.inbox];
  }

  clearWritten(): void {
    this.inbox.length = 0;
  }
}

/**
 * TCP serial bridge transport for real hardware via ser2net / Ethernet serial adapters.
 */
export class TcpSerialTransport implements SerialTransport {
  private socket?: import("net").Socket;
  private callback?: (data: Uint8Array) => void;
  private openState = false;

  async open(port: string, baudRate: number, _options?: SerialTransportOptions): Promise<void> {
    const net = await import("net");
    const [host, portStr] = port.includes(":") ? port.split(":") : ["127.0.0.1", port];
    const tcpPort = Number(portStr);

    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection({ host, port: tcpPort }, () => {
        this.openState = true;
        resolve();
      });
      socket.on("data", (chunk: Buffer) => {
        this.callback?.(new Uint8Array(chunk));
      });
      socket.on("error", reject);
      this.socket = socket;
    });

    void baudRate;
  }

  async close(): Promise<void> {
    this.socket?.destroy();
    this.socket = undefined;
    this.openState = false;
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.socket || !this.openState) throw new Error("Serial transport is not open");
    await new Promise<void>((resolve, reject) => {
      this.socket!.write(Buffer.from(data), (err) => (err ? reject(err) : resolve()));
    });
  }

  onData(callback: (data: Uint8Array) => void): void {
    this.callback = callback;
  }

  isOpen(): boolean {
    return this.openState;
  }
}

/**
 * Native Linux serial transport using /dev/tty* with stty for baud rate config.
 * Falls back to MemorySerialTransport if the device cannot be opened.
 */
export class NativeSerialTransport implements SerialTransport {
  private fd?: number;
  private callback?: (data: Uint8Array) => void;
  private openState = false;
  private readStream?: import("fs").ReadStream;

  async open(port: string, baudRate: number, _options?: SerialTransportOptions): Promise<void> {
    try {
      const { open } = await import("fs/promises");
      const { execSync } = await import("child_process");
      try {
        execSync(`stty -F "${port}" ${baudRate} raw -echo 2>/dev/null`);
      } catch {
        // stty may fail if not on Linux or port not available; continue anyway
      }
      this.fd = await open(port, "r+") as unknown as number;
      const fs = await import("fs");
      this.readStream = fs.createReadStream(port, { fd: this.fd });
      this.readStream.on("data", (chunk: Buffer) => {
        this.callback?.(new Uint8Array(chunk));
      });
      this.openState = true;
    } catch {
      throw new Error(`Cannot open serial port: ${port}`);
    }
  }

  async close(): Promise<void> {
    this.readStream?.close();
    this.readStream = undefined;
    this.fd = undefined;
    this.openState = false;
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.openState || this.fd === undefined) throw new Error("Serial transport is not open");
    const fs = await import("fs");
    await new Promise<void>((resolve, reject) => {
      const buf = Buffer.from(data);
      fs.write(this.fd!, buf, 0, buf.length, undefined, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }

  onData(callback: (data: Uint8Array) => void): void {
    this.callback = callback;
  }

  isOpen(): boolean {
    return this.openState;
  }
}
