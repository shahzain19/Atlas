import { Transport, TransportMessage } from "./Transport";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";
import WebSocket, { WebSocketServer } from "ws";
import * as http from "http";
import { EventEmitter } from "events";

type WsPacketType = "pub" | "sub" | "unsub" | "msg" | "ping" | "pong";

interface WsPacket {
  t: WsPacketType;
  topic?: string;
  msg?: TransportMessage;
}

export class WebSocketTransport extends Transport {
  private wsUrl?: string;
  private port?: number;
  private server?: WebSocketServer;
  private httpServer?: http.Server;
  private socket?: WebSocket;
  private clientSubscriptions = new Set<string>();
  private clients = new Map<WebSocket, Set<string>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private heartbeatInterval?: NodeJS.Timeout;
  private heartbeatMs = 30000;
  private destroyed = false;
  private pendingConnectResolve?: () => void;
  private events = new EventEmitter();

  constructor(opts: { url?: string; port?: number }) {
    super();
    if (opts.url) {
      this.wsUrl = opts.url;
    }
    if (opts.port !== undefined) {
      this.port = opts.port;
    }
  }

  async connect(): Promise<void> {
    if (this.port !== undefined) {
      return this.startServer();
    }
    if (this.wsUrl) {
      return this.connectClient();
    }
    throw new Error("WebSocketTransport: provide url or port");
  }

  private async startServer(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.httpServer = http.createServer();
        this.server = new WebSocketServer({ server: this.httpServer });

        this.server.on("connection", (ws: WebSocket) => {
          const subs = new Set<string>();
          this.clients.set(ws, subs);

          ws.on("message", (raw: WebSocket.Data) => {
            let packet: WsPacket;
            try {
              packet = JSON.parse(raw.toString());
            } catch {
              return;
            }

            switch (packet.t) {
              case "pub":
                if (packet.msg) {
                  this.routeMessage(packet.msg, ws);
                }
                break;
              case "sub":
                if (packet.topic) {
                  subs.add(packet.topic);
                }
                break;
              case "unsub":
                if (packet.topic) {
                  subs.delete(packet.topic);
                }
                break;
              case "pong":
                break;
            }
          });

          ws.on("close", () => {
            this.clients.delete(ws);
          });

          ws.on("error", () => {
            this.clients.delete(ws);
          });
        });

        this.server.on("error", (err) => {
          reject(err);
        });

        this.httpServer.listen(this.port, () => {
          this.connected = true;
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  private async connectClient(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const socket = new WebSocket(this.wsUrl!);

        socket.onopen = () => {
          this.socket = socket;
          this.connected = true;
          this.reconnectAttempts = 0;
          this.resubscribeAll();
          this.startHeartbeat();
          resolve();
        };

        socket.onmessage = (event: WebSocket.MessageEvent) => {
          let packet: WsPacket;
          try {
            packet = JSON.parse(event.data.toString());
          } catch {
            return;
          }

          if (packet.t === "msg" && packet.msg) {
            this.emit(packet.msg.type, packet.msg);
          } else if (packet.t === "ping") {
            this.sendPacket({ t: "pong" });
          }
        };

        socket.onclose = () => {
          this.connected = false;
          this.socket = undefined;
          this.stopHeartbeat();
          if (!this.destroyed) {
            this.attemptReconnect();
          }
        };

        socket.onerror = () => {
          reject(new Error("WebSocket connection failed"));
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  private routeMessage(msg: TransportMessage, sender: WebSocket): void {
    for (const [ws, subs] of this.clients) {
      if (ws === sender) continue;
      if (subs.size === 0 || subs.has(msg.type)) {
        this.sendToClient(ws, { t: "msg", msg });
      }
    }
    this.emit(msg.type, msg);
  }

  private sendToClient(ws: WebSocket, packet: WsPacket): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(packet));
    }
  }

  private sendPacket(packet: WsPacket): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(packet));
    }
  }

  private resubscribeAll(): void {
    for (const topic of this.clientSubscriptions) {
      this.sendPacket({ t: "sub", topic });
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendPacket({ t: "ping" });
    }, this.heartbeatMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    await new Promise((r) => setTimeout(r, this.reconnectDelay));
    if (!this.destroyed) {
      try {
        await this.connectClient();
      } catch {
        this.attemptReconnect();
      }
    }
  }

  async disconnect(): Promise<void> {
    this.destroyed = true;
    this.stopHeartbeat();
    this.connected = false;
    this.clientSubscriptions.clear();

    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }

    if (this.server) {
      for (const [ws] of this.clients) {
        ws.close();
      }
      this.clients.clear();
      this.server.close();
      this.server = undefined;
    }

    if (this.httpServer) {
      return new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
    }
  }

  async send(msg: TransportMessage): Promise<void> {
    if (!this.connected) throw new Error("WebSocketTransport not connected");
    if (this.port !== undefined) {
      this.routeMessage(msg, null as any);
    } else if (this.socket) {
      this.sendPacket({ t: "pub", msg });
    }
  }

  subscribe(topic: string, handler: (msg: TransportMessage) => void): void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    this.handlers.get(topic)!.push(handler);
    this.clientSubscriptions.add(topic);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendPacket({ t: "sub", topic });
    }
  }

  unsubscribe(topic: string, handler?: (msg: TransportMessage) => void): void {
    if (!this.handlers.has(topic)) return;
    if (handler) {
      const arr = this.handlers.get(topic)!;
      const filtered = arr.filter((h) => h !== handler);
      if (filtered.length === 0) {
        this.handlers.delete(topic);
        this.clientSubscriptions.delete(topic);
        this.sendPacket({ t: "unsub", topic });
      } else {
        this.handlers.set(topic, filtered);
      }
    } else {
      this.handlers.delete(topic);
      this.clientSubscriptions.delete(topic);
      this.sendPacket({ t: "unsub", topic });
    }
  }

  private emit(topic: string, msg: TransportMessage): void {
    const hdls = this.handlers.get(topic);
    if (hdls) {
      for (const h of hdls) {
        try {
          h(msg);
        } catch (e) {
          console.error("Error in WebSocket handler:", e);
        }
      }
    }
  }
}
