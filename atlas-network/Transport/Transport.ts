export interface TransportMessage {
  id: string;
  type: string;
  source: string;
  target?: string;
  replyTo?: string;
  payload: unknown;
  timestamp: number;
}

export abstract class Transport {
  protected connected = false;
  protected handlers = new Map<string, Array<(msg: TransportMessage) => void>>();

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(msg: TransportMessage): Promise<void>;
  abstract subscribe(topic: string, handler: (msg: TransportMessage) => void): void;
  abstract unsubscribe(topic: string, handler?: (msg: TransportMessage) => void): void;

  isConnected(): boolean {
    return this.connected;
  }
}
