import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as readline from "readline";
import { Sensor, Actuator, CapabilityType } from "../../atlas-kernel/Hardware/Hardware";

interface JsonResponse {
  ok: boolean;
  data?: any;
  error?: string;
}

interface DriverInfo {
  id: string;
  name: string;
  type: string;
  status: string;
  capabilities: string[];
}

export class CppBridgeDaemon {
  private process: ChildProcess | null = null;
  private rl: readline.ReadLine | null = null;
  private pending = new Map<string, { resolve: (v: JsonResponse) => void; timer: NodeJS.Timeout }>();
  private seq = 0;
  private ready = false;

  private daemonPath: string;

  constructor(daemonPath?: string) {
    this.daemonPath = daemonPath
      ?? process.env.ATLAS_DAEMON_PATH
      ?? path.resolve(__dirname, "../../atlas-hardware-cpp/build/atlas_hardware_daemon");
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn(this.daemonPath, [], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.rl = readline.createInterface({
        input: this.process.stdout!,
        crlfDelay: Infinity,
      });

      this.process.stderr!.on("data", (data: Buffer) => {
        console.error(`[CppBridge] ${data.toString().trim()}`);
      });

      this.process.on("exit", (code) => {
        console.error(`[CppBridge] Daemon exited with code ${code}`);
        this.process = null;
        this.ready = false;
      });

      this.process.on("error", (err) => {
        reject(err);
      });

      this.rl.on("line", (line: string) => {
        line = line.trim();
        if (!line) return;
        try {
          const parsed = JSON.parse(line);
          const seqKey = parsed._seq?.toString();
          if (seqKey && this.pending.has(seqKey)) {
            const entry = this.pending.get(seqKey)!;
            clearTimeout(entry.timer);
            this.pending.delete(seqKey);
            entry.resolve(parsed);
          }
        } catch { }
      });

      this.ready = true;
      resolve();
    });
  }

  async sendCommand(cmd: string, params: Record<string, any> = {}): Promise<JsonResponse> {
    if (!this.process || !this.process.stdin) {
      return { ok: false, error: "Daemon not running" };
    }
    const seq = ++this.seq;
    const payload = JSON.stringify({ cmd, ...params, _seq: seq }) + "\n";
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(seq.toString());
        resolve({ ok: false, error: "Command timed out" });
      }, 5000);
      this.pending.set(seq.toString(), { resolve, timer });
      this.process!.stdin!.write(payload);
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.stdin?.end();
      this.process.kill();
      this.process = null;
    }
    this.ready = false;
  }
}

export class CppGPSSensor implements Sensor {
  type = CapabilityType.SENSING;
  name = "CppGPS";
  specs = { protocol: "NMEA", bridge: "cpp" };

  constructor(private daemon: CppBridgeDaemon) { }

  async read(): Promise<{ lat: number; lng: number; alt: number; timestamp: number }> {
    const res = await this.daemon.sendCommand("gps_read");
    if (!res.ok) throw new Error(`C++ GPS error: ${res.error}`);
    return {
      lat: res.data.lat,
      lng: res.data.lng,
      alt: res.data.alt ?? 0,
      timestamp: res.data.timestamp ?? Date.now(),
    };
  }
}

export class CppMotorActuator implements Actuator {
  type = CapabilityType.MOTION;
  name = "CppMotor";
  specs = { protocol: "serial", bridge: "cpp" };

  constructor(private daemon: CppBridgeDaemon) { }

  async execute(command: string, params: Record<string, any>): Promise<void> {
    const res = await this.daemon.sendCommand("motor_exec", { command, params });
    if (!res.ok) throw new Error(`C++ Motor error: ${res.error}`);
  }
}

export class CppCameraSensor implements Sensor {
  type = CapabilityType.IMAGING;
  name = "CppCamera";
  specs = { protocol: "V4L2", bridge: "cpp" };

  constructor(private daemon: CppBridgeDaemon) { }

  async read(): Promise<{ width: number; height: number; channels: number; timestamp: number; pixels?: Uint8Array }> {
    const res = await this.daemon.sendCommand("camera_capture");
    if (!res.ok) throw new Error(`C++ Camera error: ${res.error}`);

    let pixels: Uint8Array | undefined;
    if (res.data.shm_name) {
      try {
        const fs = await import("fs");
        const buf = fs.readFileSync(`/dev/shm${res.data.shm_name}`);
        pixels = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      } catch {
        // SHM read failed — return metadata only
      }
    }

    return {
      width: res.data.width,
      height: res.data.height,
      channels: res.data.channels,
      timestamp: res.data.timestamp,
      pixels,
    };
  }
}
