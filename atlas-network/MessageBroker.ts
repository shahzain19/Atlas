import { NATSTransport } from "./Transport/NATSTransport";
import { Transport, TransportMessage } from "./Transport/Transport";
import { WebSocketTransport } from "./Transport/WebSocketTransport";

export enum BrokerPattern {
  PUB_SUB = "pub_sub",
  REQUEST_REPLY = "request_reply",
  WORK_QUEUE = "work_queue",
}

export interface PublishOptions {
  replyTo?: string;
}

export interface SubscribeOptions {
  queueGroup?: string;
}

export class MessageBroker {
  private transport: Transport & { publish?: (subject: string, data: unknown, replyTo?: string) => TransportMessage; request?: (subject: string, data: unknown, timeoutMs?: number) => Promise<TransportMessage>; replyTo?: (msg: TransportMessage, data: unknown) => void; flush?: () => Promise<void> };
  private handlers = new Map<string, Array<(msg: TransportMessage) => void>>();

  constructor(transport: Transport) {
    this.transport = transport;
  }

  static createNATSBroker(): MessageBroker {
    const nats = new NATSTransport(["nats://localhost:4222"]);
    return new MessageBroker(nats);
  }

  static createWebSocketBroker(url: string): MessageBroker {
    const ws = new WebSocketTransport({ url });
    return new MessageBroker(ws);
  }

  async connect(): Promise<void> {
    await this.transport.connect();
  }

  async disconnect(): Promise<void> {
    await this.transport.disconnect();
  }

  isConnected(): boolean {
    return this.transport.isConnected();
  }

  async publish(subject: string, data: unknown, options?: PublishOptions): Promise<void> {
    const msg: TransportMessage = {
      id: this.makeId(),
      type: subject,
      source: "broker",
      payload: data,
      timestamp: Date.now(),
    };
    if (options?.replyTo) {
      msg.replyTo = options.replyTo;
    }
    await this.transport.send(msg);
  }

  subscribe(subject: string, handler: (msg: TransportMessage) => void, options?: SubscribeOptions): void {
    const wrappedHandler = (msg: TransportMessage) => {
      try {
        handler(msg);
      } catch (e) {
        console.error("Error in broker handler:", e);
      }
    };

    if (!this.handlers.has(subject)) {
      this.handlers.set(subject, []);
    }
    this.handlers.get(subject)!.push(handler);

    this.transport.subscribe(subject, wrappedHandler);
  }

  unsubscribe(subject: string, handler?: (msg: TransportMessage) => void): void {
    this.transport.unsubscribe(subject);
    if (handler) {
      const arr = this.handlers.get(subject);
      if (arr) {
        const filtered = arr.filter((h) => h !== handler);
        if (filtered.length === 0) {
          this.handlers.delete(subject);
        } else {
          this.handlers.set(subject, filtered);
        }
      }
    } else {
      this.handlers.delete(subject);
    }
  }

  async request<T = unknown>(subject: string, data: unknown, timeoutMs: number = 5000): Promise<T> {
    if (typeof (this.transport as any).request === "function") {
      const reply = await (this.transport as any).request(subject, data, timeoutMs);
      return reply.payload as T;
    }

    const replyTo = `_REPLY.${this.makeId()}`;
    const msg: TransportMessage = {
      id: this.makeId(),
      type: subject,
      source: "broker",
      payload: data,
      replyTo,
      timestamp: Date.now(),
    };

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.transport.unsubscribe(replyTo);
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.transport.subscribe(replyTo, (replyMsg) => {
        clearTimeout(timer);
        this.transport.unsubscribe(replyTo);
        resolve(replyMsg.payload as T);
      });

      this.transport.send(msg).catch(reject);
    });
  }

  async flush(): Promise<void> {
    if (typeof (this.transport as any).flush === "function") {
      await (this.transport as any).flush();
    }
  }

  private makeId(): string {
    return `brk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
