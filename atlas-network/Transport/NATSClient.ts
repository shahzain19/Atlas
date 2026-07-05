import { NATSTransport } from "./NATSTransport";
import { TransportMessage } from "./Transport";

export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
}

export class NATSClient {
  private transport: NATSTransport;
  private servers: string[] = [];
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private subscriptionCounter = 0;
  private subscriptions = new Map<number, { subject: string; handler: (msg: TransportMessage) => void }>();

  constructor() {
    this.transport = new NATSTransport([]);
  }

  get connectionState(): ConnectionState {
    return this.state;
  }

  async connect(servers: string[]): Promise<void> {
    this.servers = servers;
    this.state = ConnectionState.CONNECTING;
    try {
      this.transport = new NATSTransport(servers);
      await this.transport.connect();
      this.state = ConnectionState.CONNECTED;
    } catch (e) {
      this.state = ConnectionState.DISCONNECTED;
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    this.state = ConnectionState.DISCONNECTED;
    this.subscriptions.clear();
    await this.transport.disconnect();
  }

  async publish(subject: string, data: unknown): Promise<void> {
    this.ensureConnected();
    await this.transport.send({
      id: this.makeId(),
      type: subject,
      source: "nats-client",
      payload: data,
      timestamp: Date.now(),
    });
  }

  subscribe(subject: string, callback: (msg: TransportMessage) => void): number {
    this.ensureConnected();
    const id = ++this.subscriptionCounter;
    this.subscriptions.set(id, { subject, handler: callback });
    this.transport.subscribe(subject, callback);
    return id;
  }

  unsubscribe(subjectOrId: string | number): void {
    this.ensureConnected();
    if (typeof subjectOrId === "number") {
      const sub = this.subscriptions.get(subjectOrId);
      if (sub) {
        this.transport.unsubscribe(sub.subject, sub.handler);
        this.subscriptions.delete(subjectOrId);
      }
    } else {
      this.transport.unsubscribe(subjectOrId);
      for (const [id, sub] of this.subscriptions) {
        if (sub.subject === subjectOrId) {
          this.subscriptions.delete(id);
        }
      }
    }
  }

  async request(subject: string, data: unknown, timeoutMs: number = 5000): Promise<TransportMessage> {
    this.ensureConnected();
    return this.transport.request(subject, data, timeoutMs);
  }

  replyTo(msg: TransportMessage, data: unknown): void {
    this.ensureConnected();
    this.transport.replyTo(msg, data);
  }

  async flush(): Promise<void> {
    return this.transport.flush();
  }

  private ensureConnected(): void {
    if (this.state !== ConnectionState.CONNECTED) {
      throw new Error("NATSClient not connected");
    }
  }

  private makeId(): string {
    return `cli-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
