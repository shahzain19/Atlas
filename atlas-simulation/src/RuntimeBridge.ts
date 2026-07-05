export type RuntimeStatus = "disconnected" | "connecting" | "connected";

export class RuntimeBridge {
  private ws: WebSocket | null = null;
  private connected = false;
  private lastGpsSend = 0;
  private lastStatusSend = 0;
  private gpsInterval = 100;
  private statusInterval = 500;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string;
  private running = false;
  private _status: RuntimeStatus = "disconnected";
  onEvent?: (type: string) => void;
  onStatusChange?: (status: RuntimeStatus) => void;

  get status(): RuntimeStatus { return this._status; }

  constructor(url?: string) {
    this.url = url ?? `ws://${window.location.host}/api/ws`;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.setStatus("connecting");
    this.connect();
  }

  stop(): void {
    this.running = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.setStatus("disconnected");
  }

  private setStatus(s: RuntimeStatus): void {
    if (this._status !== s) {
      this._status = s;
      this.onStatusChange?.(s);
    }
  }

  private connect(): void {
    if (!this.running) return;
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        this.connected = true;
        this.setStatus("connected");
        this.ws?.send(JSON.stringify({ type: "start_runtime" }));
      };
      this.ws.onclose = () => {
        this.connected = false;
        this.setStatus("disconnected");
        this.scheduleReconnect();
      };
      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.setStatus("disconnected");
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.running) return;
    this.setStatus("connecting");
    this.reconnectTimer = setTimeout(() => this.connect(), 3000);
  }

  sendSimState(robot: { position: { x: number; y: number; z: number }; yaw: number; speed: number; battery: number; altitude: number }, _obstacles: unknown[], _waypoints: unknown[], now: number): void {
    if (!this.connected) return;

    if (now - this.lastGpsSend >= this.gpsInterval) {
      this.lastGpsSend = now;
      this.emit({
        type: "GPS_UPDATE",
        source: "Simulation",
        timestamp: Date.now(),
        payload: {
          x: robot.position.x,
          y: robot.position.z,
          z: robot.position.y,
          uncertainty: 0.05,
        },
      });
    }

    if (now - this.lastStatusSend >= this.statusInterval) {
      this.lastStatusSend = now;
      this.emit({
        type: "ROBOT_STATUS",
        source: "Simulation",
        timestamp: Date.now(),
        payload: {
          speed: robot.speed,
          battery: robot.battery,
          altitude: robot.altitude,
          yaw: robot.yaw,
        },
      });
    }
  }

  emitWaypointReached(index: number): void {
    this.emit({
      type: "WAYPOINT_REACHED",
      source: "Simulation",
      timestamp: Date.now(),
      payload: { waypointIndex: index },
    });
  }

  private emit(event: { type: string; source?: string; payload?: Record<string, unknown>; timestamp: number }): void {
    if (!this.connected || !this.ws) return;
    this.ws.send(JSON.stringify({ type: "emit_event", payload: event }));
    this.onEvent?.(event.type);
  }
}
