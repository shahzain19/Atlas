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
