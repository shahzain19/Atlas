import { Transport, TransportMessage } from "./Transport";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";

interface Subscription {
  handler: (msg: TransportMessage) => void;
  queueGroup?: string;
}

function matchSubject(subject: string, pattern: string): boolean {
  if (pattern === ">") return true;
  const subjectTokens = subject.split(".");
  const patternTokens = pattern.split(".");
  let si = 0, pi = 0;
  while (si < subjectTokens.length && pi < patternTokens.length) {
    if (patternTokens[pi] === ">") return true;
    if (patternTokens[pi] !== "*" && patternTokens[pi] !== subjectTokens[si]) return false;
    si++; pi++;
  }
  return si === subjectTokens.length && pi === patternTokens.length;
}

export class NATSTransport extends Transport {
  private subscriptions = new Map<string, Subscription[]>();
  private pendingFlush: Array<() => void> = [];
  private requestSubs = new Map<string, (msg: TransportMessage) => void>();
  private queueGroupCounters = new Map<string, number>();

  constructor(private servers?: string[]) {
    super();
  }

  async connect(): Promise<void> {
    const serverList = this.servers || ["nats://localhost:4222"];
    for (const server of serverList) {
      try {
        const ws = new WebSocket(server);
        await new Promise<void>((resolve, reject) => {
          ws.onopen = () => {
            console.log(`[NATSTransport] Connected to ${server}`);
            this.connected = true;
            resolve();
          };
          ws.onerror = () => reject(new Error(`Failed to connect to ${server}`));
          setTimeout(() => reject(new Error(`Timeout connecting to ${server}`)), 3000);
        });
        return;
      } catch {
        console.warn(`[NATSTransport] Could not connect to ${server}, trying next...`);
      }
    }
    console.warn("[NATSTransport] No NATS server available, running in local mode");
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.subscriptions.clear();
    this.requestSubs.clear();
    this.pendingFlush = [];
    this.queueGroupCounters.clear();
  }

  publish(subject: string, data: unknown, replyTo?: string): TransportMessage {
    const msg: TransportMessage = {
      id: uuidv4(), type: subject, source: "nats",
      payload: data, timestamp: Date.now(),
    };
    if (replyTo) msg.replyTo = replyTo;
    this.dispatch(msg);
    return msg;
  }

  subscribe(subject: string, handler: (msg: TransportMessage) => void, queueGroup?: string): void {
    const subs = this.subscriptions.get(subject) || [];
    subs.push({ handler, queueGroup });
    this.subscriptions.set(subject, subs);
  }

  unsubscribe(subject: string, handler?: (msg: TransportMessage) => void): void {
    if (!this.subscriptions.has(subject)) return;
    if (handler) {
      const subs = this.subscriptions.get(subject)!;
      const filtered = subs.filter((s) => s.handler !== handler);
      if (filtered.length === 0) this.subscriptions.delete(subject);
      else this.subscriptions.set(subject, filtered);
    } else {
      this.subscriptions.delete(subject);
    }
  }

  async send(msg: TransportMessage): Promise<void> {
    if (!this.connected) throw new Error("NATSTransport not connected");
    this.dispatch(msg);
  }

  async request(subject: string, data: unknown, timeoutMs: number = 5000): Promise<TransportMessage> {
    const replyTo = `_INBOX.${uuidv4()}`;
    return new Promise<TransportMessage>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.requestSubs.delete(replyTo);
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      const replyHandler = (msg: TransportMessage) => {
        clearTimeout(timer);
        this.requestSubs.delete(replyTo);
        resolve(msg);
      };
      this.requestSubs.set(replyTo, replyHandler);
      const internalSub: Subscription = {
        handler: (msg: TransportMessage) => {
          const handler = this.requestSubs.get(msg.type);
          if (handler) handler(msg);
        },
      };
      this.subscriptions.set(replyTo, [internalSub]);
      this.publish(subject, data, replyTo);
    });
  }

  replyTo(msg: TransportMessage, data: unknown): void {
    if (!msg.replyTo) throw new Error("No replyTo subject in message");
    this.publish(msg.replyTo, data);
  }

  async flush(): Promise<void> {
    if (this.pendingFlush.length === 0) return;
    return new Promise<void>((resolve) => { this.pendingFlush.push(resolve); });
  }

  private dispatch(msg: TransportMessage): void {
    const flushResolvers = this.pendingFlush;
    this.pendingFlush = [];
    for (const [pattern, subs] of this.subscriptions.entries()) {
      if (!matchSubject(msg.type, pattern)) continue;
      const groups = new Map<string, Subscription[]>();
      const noGroup: Subscription[] = [];
      for (const sub of subs) {
        if (sub.queueGroup) {
          const arr = groups.get(sub.queueGroup) || [];
          arr.push(sub);
          groups.set(sub.queueGroup, arr);
        } else {
          noGroup.push(sub);
        }
      }
      for (const sub of noGroup) {
        try { sub.handler(msg); } catch (e) { console.error("Error in subscription handler:", e); }
      }
      for (const [groupName, groupSubs] of groups) {
        const counter = this.queueGroupCounters.get(groupName) || 0;
        const idx = counter % groupSubs.length;
        this.queueGroupCounters.set(groupName, counter + 1);
        try { groupSubs[idx].handler(msg); } catch (e) { console.error("Error in queue group handler:", e); }
      }
    }
    for (const resolve of flushResolvers) resolve();
  }
}
