import * as http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { AtlasRuntime } from "../Lifecycle/AtlasRuntime";
import { StudioBridge } from "./StudioBridge";
import { STUDIO_WS_PATH, StudioServerMessage } from "../../atlas-kernel/Studio/StudioProtocol";
import { SystemAgent } from "../../atlas-agents/SystemAgent/SystemAgent";
import { TaskAgent } from "../../atlas-agents/TaskAgent/TaskAgent";
import { VisionAgent } from "../../atlas-agents/VisionAgent/VisionAgent";
import { NavigationAgent } from "../../atlas-agents/NavigationAgent/NavigationAgent";
import { MockMotor } from "../../atlas-hardware/Drivers/Mock/MockMotor";
import { MockCamera } from "../../atlas-hardware/Drivers/Mock/MockCamera";

export interface StudioServerOptions {
  port?: number;
  host?: string;
  runtime?: AtlasRuntime;
}

export class StudioServer {
  private readonly runtime: AtlasRuntime;
  private readonly bridge: StudioBridge;
  private httpServer?: http.Server;
  private wss?: WebSocketServer;
  private clients = new Set<WebSocket>();
  private broadcastTimer?: NodeJS.Timeout;

  constructor(options: StudioServerOptions = {}) {
    this.runtime = options.runtime ?? StudioServer.createDefaultRuntime();
    this.bridge = new StudioBridge(this.runtime, {
      onBroadcast: (message) => this.broadcast(message),
    });
    void options;
  }

  static createDefaultRuntime(): AtlasRuntime {
    const atlas = new AtlasRuntime();
    atlas.agents.register(new SystemAgent());
    atlas.agents.register(new TaskAgent(atlas));
    atlas.agents.register(new VisionAgent(atlas));
    atlas.agents.register(new NavigationAgent(atlas));
    atlas.hardware.registerActuator(new MockMotor());
    atlas.hardware.registerActuator(new MockCamera());
    return atlas;
  }

  getBridge(): StudioBridge {
    return this.bridge;
  }

  getRuntime(): AtlasRuntime {
    return this.runtime;
  }

  async start(options: StudioServerOptions = {}): Promise<void> {
    const port = options.port ?? 8080;
    const host = options.host ?? "0.0.0.0";

    this.httpServer = http.createServer((req, res) => {
      if (req.url === "/api/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", running: this.bridge.isRunning() }));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    this.wss = new WebSocketServer({ server: this.httpServer, path: STUDIO_WS_PATH });

    this.wss.on("connection", (socket) => {
      this.clients.add(socket);
      this.send(socket, { type: "snapshot", payload: this.bridge.getSnapshot() });

      socket.on("message", async (data) => {
        const response = await this.bridge.handleMessage(data.toString());
        if (response) this.send(socket, response);

        if (response?.type === "snapshot" || response?.type === "event") {
          this.broadcastSnapshot();
        }
      });

      socket.on("close", () => {
        this.clients.delete(socket);
      });
    });

    await new Promise<void>((resolve) => {
      this.httpServer!.listen(port, host, () => resolve());
    });

    this.broadcastTimer = setInterval(() => {
      if (this.clients.size > 0 && this.bridge.isRunning()) {
        this.broadcastSnapshot();
      }
    }, 1000);

    console.log(`Atlas Studio server listening on http://${host}:${port}`);
    console.log(`WebSocket endpoint: ws://${host === "0.0.0.0" ? "localhost" : host}:${port}${STUDIO_WS_PATH}`);
  }

  async stop(): Promise<void> {
    if (this.broadcastTimer) clearInterval(this.broadcastTimer);
    this.bridge.stop();

    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();

    await new Promise<void>((resolve) => {
      this.wss?.close(() => resolve());
    });

    await new Promise<void>((resolve) => {
      this.httpServer?.close(() => resolve());
    });
  }

  private broadcastSnapshot(): void {
    this.broadcast({ type: "snapshot", payload: this.bridge.getSnapshot() });
  }

  private broadcast(message: StudioServerMessage): void {
    for (const client of this.clients) {
      this.send(client, message);
    }
  }

  private send(socket: WebSocket, message: StudioServerMessage): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
}
