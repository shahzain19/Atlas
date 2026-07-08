/**
 * Atlas Camera Demo — real-time camera pipeline with Python vision bridge.
 *
 * CameraCapture ─► FrameProcessor ─► StreamServer
 *                       ↕
 *                 VisionBridge  ── (Unix socket) ──► vision_bridge.py (Python VisionProcessor)
 *
 * Performance design:
 *   - forced 640×480 @ 30 fps via V4L2 MJPEG passthrough
 *   - AI inference every N frames via Python bridge; never blocks stream
 *   - binary WebSocket frames (raw JPEG — no base64 overhead)
 *   - stale frame dropping instead of queue buildup
 */

import * as fs from "fs";
import * as path from "path";
import { spawn, execSync, ChildProcess } from "child_process";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as net from "net";

// ── Constants ──────────────────────────────────────────────────────────

const SOCKET_PATH = "/tmp/atlas_vision.sock";
const TARGET_W = 640;
const TARGET_H = 480;
const TARGET_FPS = 30;
const DETECT_INTERVAL = 10;

// ── Types ──────────────────────────────────────────────────────────────

interface CameraInfo {
  index: number;
  path: string;
  model: string;
  isExternal: boolean;
}

interface Detection {
  bbox: [number, number, number, number];
  score: number;
  label: string;
}

interface BridgeRequest {
  id: number;
  jpeg_b64: string;
}

interface BridgeDetection {
  label: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

interface BridgeResponse {
  id: number;
  detections?: BridgeDetection[];
  error?: string;
}

// ── Camera detection ───────────────────────────────────────────────────

function detectCameras(): CameraInfo[] {
  const devices: CameraInfo[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < 10; i++) {
    const devPath = `/dev/video${i}`;
    if (!fs.existsSync(devPath)) continue;
    let model = "";
    let isExternal = true;
    try {
      const out = execSync(`udevadm info ${devPath} 2>/dev/null`, {
        encoding: "utf-8",
        timeout: 2000,
      });
      model =
        out
          .split("\n")
          .find((l) => l.includes("ID_MODEL=") && !l.includes("ID_USB_"))
          ?.split("=")[1]
          ?.trim() || "Unknown";
      isExternal = !/(integrated|internal|built)/i.test(model);
    } catch {
      model = "Unknown";
    }
    if (seen.has(model)) continue;
    seen.add(model);
    devices.push({ index: i, path: devPath, model, isExternal });
  }
  return devices;
}

function pickCamera(devices: CameraInfo[], preferred?: number): CameraInfo | null {
  if (preferred !== undefined) {
    const match = devices.find((d) => d.index === preferred);
    if (match) return match;
  }
  const ext = devices.find((d) => d.isExternal);
  if (ext) return ext;
  return devices[0] || null;
}

// ── Vision Bridge (Python IPC) ─────────────────────────────────────────
// Connects to vision_bridge.py via Unix socket, sends 32×32 RGB frames,
// receives multi-class detections.

class VisionBridge {
  private client: net.Socket | null = null;
  private buf = "";
  private pending = new Map<number, (resp: BridgeResponse) => void>();
  private nextId = 1;
  private connected = false;
  private retries = 0;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sock = new net.Socket();
      sock.on("connect", () => {
        this.connected = true;
        this.retries = 0;
        this.client = sock;
        resolve();
      });
      sock.on("data", (data: Buffer) => {
        this.buf += data.toString();
        const lines = this.buf.split("\n");
        this.buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const resp: BridgeResponse = JSON.parse(line);
            const cb = this.pending.get(resp.id);
            if (cb) {
              this.pending.delete(resp.id);
              cb(resp);
            }
          } catch { /* ignore malformed */ }
        }
      });
      sock.on("error", (err) => {
        this.connected = false;
        if (this.pending.size === 0) reject(err);
      });
      sock.on("close", () => {
        this.connected = false;
        this.client = null;
      });
      sock.connect(SOCKET_PATH, () => {
        // Already handled in 'connect'
      });
      setTimeout(() => {
        if (!this.connected) reject(new Error("Vision bridge connect timeout"));
      }, 5000);
    });
  }

  async detect(pixelsB64: string): Promise<BridgeResponse> {
    const id = this.nextId++;
    const req: BridgeRequest = { id, jpeg_b64: pixelsB64 };
    return new Promise((resolve, reject) => {
      this.pending.set(id, resolve);
      if (this.client && this.connected) {
        this.client.write(JSON.stringify(req) + "\n");
      } else {
        this.pending.delete(id);
        reject(new Error("Vision bridge not connected"));
      }
      // Timeout
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error("Vision bridge timeout"));
        }
      }, 5000);
    });
  }

  disconnect(): void {
    this.client?.destroy();
    this.client = null;
    this.connected = false;
  }
}

// ── MJPEG frame parser ─────────────────────────────────────────────────

class MjpegParser {
  private buf = Buffer.alloc(0);
  latestFrame: Buffer | null = null;

  feed(chunk: Buffer): void {
    this.buf = Buffer.concat([this.buf, chunk]);
    const soi = 0xffd8;
    const eoi = 0xffd9;

    let lastComplete: Buffer | null = null;
    let pos = 0;

    while (true) {
      const start = this.findMarker(soi, pos);
      if (start === -1) break;
      const end = this.findMarker(eoi, start + 2);
      if (end === -1) break;
      lastComplete = this.buf.subarray(start, end + 2);
      pos = end + 2;
    }

    if (lastComplete) {
      this.latestFrame = lastComplete;
    }

    const lastSoi = this.findMarker(soi, Math.max(0, pos - 2));
    if (lastSoi > 0) {
      this.buf = this.buf.subarray(lastSoi);
    } else if (this.buf.length > 2 * 1024 * 1024) {
      this.buf = Buffer.alloc(0);
    }
  }

  private findMarker(marker: number, from: number): number {
    for (let i = from; i < this.buf.length - 1; i++) {
      if (this.buf.readUInt16BE(i) === marker) return i;
    }
    return -1;
  }
}

// ── Camera capture ─────────────────────────────────────────────────────

class CameraCapture {
  private proc: ChildProcess | null = null;
  private parser: MjpegParser;
  private retries = 0;
  private maxRetries = 3;
  private useLdPreload = false;
  path = "";
  private onFrame: (jpeg: Buffer) => void;

  constructor(parser: MjpegParser, onFrame: (jpeg: Buffer) => void) {
    this.parser = parser;
    this.onFrame = onFrame;
  }

  start(devicePath: string): void {
    this.stop();
    this.path = devicePath;
    this.retries = 0;
    this.useLdPreload = false;
    this.spawn();
  }

  stop(): void {
    if (!this.proc) return;
    const p = this.proc;
    this.proc = null;
    p.kill("SIGTERM");
    setTimeout(() => {
      try { p.kill("SIGKILL"); } catch { }
    }, 2000);
  }

  private spawn(): void {
    const args = [
      "-hide_banner",
      "-loglevel", "error",
      "-fflags", "nobuffer",
      "-flags", "low_delay",
      "-avioflags", "direct",
      "-f", "v4l2",
      "-input_format", "mjpeg",
      "-video_size", `${TARGET_W}x${TARGET_H}`,
      "-framerate", String(TARGET_FPS),
      "-i", this.path,
      "-f", "image2pipe",
      "-vcodec", "copy",
      "-",
    ];

    const env: any = { ...process.env };
    if (this.useLdPreload) {
      env.LD_PRELOAD = "/usr/lib/x86_64-linux-gnu/libv4l/v4l1compat.so";
      const idx = args.indexOf("-input_format");
      if (idx >= 0) args.splice(idx, 2);
      const vcIdx = args.indexOf("-vcodec");
      if (vcIdx >= 0) args.splice(vcIdx, 2);
      args.push("-vcodec", "mjpeg", "-q:v", "5");
    }

    this.proc = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"], env });

    this.proc.stdout!.on("data", (chunk: Buffer) => {
      this.parser.feed(chunk);
      const frame = this.parser.latestFrame;
      if (frame) {
        this.parser.latestFrame = null;
        this.onFrame(frame);
      }
    });

    this.proc.stderr!.on("data", () => { });

    this.proc.on("exit", (code) => {
      if (!this.proc) return;
      this.retries++;
      if (this.retries === 1 && code !== 0) {
        this.useLdPreload = true;
        setTimeout(() => this.spawn(), 200);
        return;
      }
      if (this.retries <= this.maxRetries + 1 && code !== 0) {
        setTimeout(() => this.spawn(), Math.min(1000 * this.retries, 5000));
        return;
      }
      if (code !== 0) {
        console.error("  Camera unavailable after retries");
      }
    });
  }
}

// ── WebSocket stream server ────────────────────────────────────────────

class StreamServer {
  private wss: WebSocketServer | null = null;
  private clients = new Set<WebSocket>();
  private lastMeta: string | null = null;

  start(port: number, onMessage: (ws: WebSocket, data: Buffer) => void): void {
    const server = createServer();
    this.wss = new WebSocketServer({ server });
    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      ws.on("close", () => this.clients.delete(ws));
      ws.on("message", (data) => {
        if (Buffer.isBuffer(data)) {
          onMessage(ws, data);
        } else {
          try { onMessage(ws, Buffer.from(data as string)); } catch { }
        }
      });
      if (this.lastMeta) ws.send(this.lastMeta);
    });
    server.listen(port, () => {
      console.log(`  WS server on ws://localhost:${port}`);
    });
  }

  stop(): void {
    this.wss?.close();
    this.wss = null;
  }

  sendMeta(obj: unknown): void {
    const payload = JSON.stringify(obj);
    this.lastMeta = payload;
    this.broadcast(payload, false);
  }

  sendFrame(jpeg: Buffer): void {
    this.broadcast(jpeg, true);
  }

  private broadcast(data: string | Buffer, binary: boolean): void {
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data, { binary });
      }
    }
  }
}

// ── Main orchestrator ──────────────────────────────────────────────────

class CameraDemo {
  private parser = new MjpegParser();
  private capture = new CameraCapture(this.parser, (jpeg) => this.onFrame(jpeg));
  private stream = new StreamServer();
  private bridge = new VisionBridge();
  private devices: CameraInfo[] = [];
  private camInfo: CameraInfo | null = null;
  private frameCount = 0;
  private fps = 0;
  private fpsCount = 0;
  private latency: number[] = [];
  private running = false;
  private deviceIndex: number;
  private bridgeReady = false;

  constructor(deviceIndex: number) {
    this.deviceIndex = deviceIndex;
  }

  async start(wsPort = 8081): Promise<void> {
    this.devices = detectCameras();
    this.camInfo = pickCamera(this.devices, this.deviceIndex);

    // Connect to Python vision bridge
    try {
      await this.bridge.connect();
      this.bridgeReady = true;
      console.log("  Vision bridge connected");
    } catch (err: any) {
      console.warn(`  Vision bridge unavailable (${err.message}) — detection disabled`);
    }

    this.stream.start(wsPort, (ws, data) => this.onWsMessage(ws, data));

    if (this.camInfo) {
      this.capture.start(this.camInfo.path);
    } else {
      console.log("  No camera found");
    }

    this.stream.sendMeta({
      type: "devices",
      devices: this.devices,
      selected: this.camInfo?.index ?? -1,
    });

    this.running = true;
    console.log("");
    this.reportStatus();

    setInterval(() => {
      this.fps = this.fpsCount;
      this.fpsCount = 0;
    }, 1000);
  }

  private async onFrame(jpeg: Buffer): Promise<void> {
    const start = Date.now();
    this.frameCount++;
    this.fpsCount++;

    // Run detection every N frames via Python bridge
    if (this.bridgeReady && this.frameCount % DETECT_INTERVAL === 0) {
      this.requestDetect(jpeg);
    }

    this.stream.sendFrame(jpeg);

    const elapsed = Date.now() - start;
    this.latency.push(elapsed);
    if (this.latency.length > 60) this.latency.shift();

    this.stream.sendMeta({
      type: "frame",
      frame_id: this.frameCount,
      width: TARGET_W,
      height: TARGET_H,
      fps: this.fps,
      latency: elapsed,
      detections: this.latestDetections,
    });
  }

  private latestDetections: Detection[] = [];
  private detectBusy = false;

  private async requestDetect(jpeg: Buffer): Promise<void> {
    if (this.detectBusy) return;
    this.detectBusy = true;
    try {
      // Send JPEG directly to the Python bridge (no resize — YOLO handles 640×480 natively)
      const jpegB64 = jpeg.toString("base64");
      const resp = await this.bridge.detect(jpegB64);

      if (resp.detections) {
        this.latestDetections = resp.detections.map((d) => ({
          label: d.label,
          score: d.confidence,
          bbox: [
            d.bbox.x,
            d.bbox.y,
            d.bbox.x + d.bbox.width,
            d.bbox.y + d.bbox.height,
          ] as [number, number, number, number],
        }));
      }
    } catch {
      // Detection failed — keep last detections
    } finally {
      this.detectBusy = false;
    }
  }

  private onWsMessage(ws: WebSocket, data: Buffer): void {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "select_device" && typeof msg.index === "number") {
        this.switchCamera(msg.index);
      }
    } catch { }
  }

  private switchCamera(index: number): void {
    const cam = this.devices.find((d) => d.index === index);
    if (!cam) return;
    this.camInfo = cam;
    this.deviceIndex = index;
    this.frameCount = 0;
    this.capture.start(cam.path);
    this.stream.sendMeta({ type: "device_switched", index });
  }

  stop(): void {
    this.running = false;
    this.capture.stop();
    this.stream.stop();
    this.bridge.disconnect();
  }

  private reportStatus(): void {
    if (this.camInfo) {
      const type = this.camInfo.isExternal ? "USB" : "INT";
      console.log(`  Camera: ${this.camInfo.path}  [${type}] ${this.camInfo.model}`);
    }
    console.log(`  Bridge: ${this.bridgeReady ? "Python vision ✓" : "N/A"}`);
  }
}

// ── Entry point ────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  let deviceIdx = -1;
  let wsPort = 8081;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--device" && i + 1 < args.length) deviceIdx = parseInt(args[++i]);
    if (args[i] === "--ws-port" && i + 1 < args.length) wsPort = parseInt(args[++i]);
  }

  console.log("");
  console.log("═".repeat(50));
  console.log("  Atlas Camera Demo");
  console.log("═".repeat(50));
  console.log(`  Studio: connect to ws://localhost:${wsPort}`);

  const demo = new CameraDemo(deviceIdx);
  demo.start(wsPort);

  process.on("SIGINT", () => { demo.stop(); process.exit(0); });
  process.on("SIGTERM", () => { demo.stop(); process.exit(0); });
}

main();
