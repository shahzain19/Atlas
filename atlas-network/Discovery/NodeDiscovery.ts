import { Transport, TransportMessage } from "../Transport/Transport";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";
import { EventEmitter } from "events";

export interface NodeInfo {
  id: string;
  name: string;
  address: string;
  capabilities: string[];
  version: string;
  uptime: number;
  lastSeen: number;
}

export enum DiscoveryEvent {
  NODE_DISCOVERED = "node_discovered",
  NODE_LOST = "node_lost",
  NODE_UPDATED = "node_updated",
}

export class NodeDiscovery {
  private transport: Transport;
  private nodes = new Map<string, NodeInfo>();
  private broadcastInterval?: NodeJS.Timeout;
  private expiryInterval?: NodeJS.Timeout;
  private startTime = Date.now();
  private emitter = new EventEmitter();
  private nodeId: string;
  private nodeName: string;
  private nodeAddress: string;
  private nodeCapabilities: string[];
  private nodeVersion: string;

  constructor(
    transport: Transport,
    opts?: {
      nodeId?: string;
      nodeName?: string;
      nodeAddress?: string;
      capabilities?: string[];
      version?: string;
    },
  ) {
    this.transport = transport;
    this.nodeId = opts?.nodeId || `node-${uuidv4().slice(0, 8)}`;
    this.nodeName = opts?.nodeName || "Atlas Node";
    this.nodeAddress = opts?.nodeAddress || "localhost";
    this.nodeCapabilities = opts?.capabilities || ["core", "runtime"];
    this.nodeVersion = opts?.version || "1.0.0";
  }

  get nodeInfo(): NodeInfo {
    return {
      id: this.nodeId,
      name: this.nodeName,
      address: this.nodeAddress,
      capabilities: this.nodeCapabilities,
      version: this.nodeVersion,
      uptime: Date.now() - this.startTime,
      lastSeen: Date.now(),
    };
  }

  on(event: DiscoveryEvent, listener: (node: NodeInfo) => void): void {
    this.emitter.on(event, listener);
  }

  off(event: DiscoveryEvent, listener: (node: NodeInfo) => void): void {
    this.emitter.off(event, listener);
  }

  async start(
    broadcastIntervalMs: number = 5000,
    nodeTtlMs: number = 15000,
  ): Promise<void> {
    this.transport.subscribe("discovery:hello", this.handleHello.bind(this));
    this.transport.subscribe("discovery:info", this.handleInfoRequest.bind(this));

    this.broadcastHello();

    this.broadcastInterval = setInterval(() => {
      this.broadcastHello();
    }, broadcastIntervalMs);

    this.expiryInterval = setInterval(() => {
      this.evictExpiredNodes(nodeTtlMs);
    }, Math.min(broadcastIntervalMs, nodeTtlMs / 2));
  }

  async stop(): Promise<void> {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = undefined;
    }
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
      this.expiryInterval = undefined;
    }
    this.transport.unsubscribe("discovery:hello");
    this.transport.unsubscribe("discovery:info");
  }

  getDiscoveredNodes(): NodeInfo[] {
    return Array.from(this.nodes.values());
  }

  getNode(id: string): NodeInfo | undefined {
    return this.nodes.get(id);
  }

  private async broadcastHello(): Promise<void> {
    const info = this.nodeInfo;
    await this.transport.send({
      id: uuidv4(),
      type: "discovery:hello",
      source: this.nodeId,
      payload: info,
      timestamp: Date.now(),
    });
  }

  private handleHello(msg: TransportMessage): void {
    const node = msg.payload as NodeInfo;
    if (node.id === this.nodeId) return;

    const existing = this.nodes.get(node.id);
    const now = Date.now();
    const updated = { ...node, lastSeen: now };
    this.nodes.set(node.id, updated);

    if (!existing) {
      this.emitter.emit(DiscoveryEvent.NODE_DISCOVERED, updated);
    } else {
      this.emitter.emit(DiscoveryEvent.NODE_UPDATED, updated);
    }
  }

  private handleInfoRequest(msg: TransportMessage): void {
    if (msg.replyTo) {
      const info = this.nodeInfo;
      this.transport.send({
        id: uuidv4(),
        type: msg.replyTo,
        source: this.nodeId,
        payload: info,
        timestamp: Date.now(),
      });
    }
  }

  private evictExpiredNodes(ttlMs: number): void {
    const now = Date.now();
    for (const [id, node] of this.nodes) {
      if (now - node.lastSeen > ttlMs) {
        this.nodes.delete(id);
        this.emitter.emit(DiscoveryEvent.NODE_LOST, node);
      }
    }
  }
}
