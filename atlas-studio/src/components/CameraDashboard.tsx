import { useEffect, useRef, useState, useCallback } from "react";

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

interface FrameMeta {
  type: "frame";
  frame_id: number;
  width: number;
  height: number;
  fps: number;
  latency: number;
  detections: Detection[];
}

interface DeviceList {
  type: "devices";
  devices: CameraInfo[];
  selected: number;
}

interface DeviceSwitched {
  type: "device_switched";
  index: number;
}

type MetaMessage = FrameMeta | DeviceList | DeviceSwitched;

function useCameraStream(
  url: string,
  onBinary: (blob: Blob) => void,
  onMeta: (msg: MetaMessage) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState(-1);
  const onBinaryRef = useRef(onBinary);
  onBinaryRef.current = onBinary;
  const onMetaRef = useRef(onMeta);
  onMetaRef.current = onMeta;

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const ws = new WebSocket(url);
      ws.binaryType = "blob";
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        if (event.data instanceof Blob) {
          onBinaryRef.current(event.data);
          return;
        }
        try {
          const msg = JSON.parse(event.data) as MetaMessage;
          if (msg.type === "frame") {
            onMetaRef.current(msg);
          } else if (msg.type === "devices") {
            setCameras(msg.devices);
            setSelectedCamera(msg.selected);
          } else if (msg.type === "device_switched") {
            setSelectedCamera(msg.index);
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [url]);

  const selectCamera = useCallback((index: number) => {
    wsRef.current?.send(JSON.stringify({ type: "select_device", index }));
  }, []);

  return { connected, cameras, selectedCamera, selectCamera };
}

export default function CameraDashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const metaRef = useRef<FrameMeta | null>(null);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [frameSize, setFrameSize] = useState({ w: 640, h: 480 });
  const [hasFrame, setHasFrame] = useState(false);

  const onBinary = useCallback((blob: Blob) => {
    setHasFrame(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    createImageBitmap(blob).then((bmp) => {
      const meta = metaRef.current;
      const w = meta?.width ?? bmp.width;
      const h = meta?.height ?? bmp.height;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(bmp, 0, 0);
      bmp.close();

      if (!meta) return;
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.font = "14px monospace";
      for (const d of meta.detections) {
        const [x1, y1, x2, y2] = d.bbox;
        const rx = x1 * w;
        const ry = y1 * h;
        const rw = (x2 - x1) * w;
        const rh = (y2 - y1) * h;
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.fillStyle = "rgba(0,255,0,0.2)";
        ctx.fillRect(rx, ry, rw, rh);
        ctx.fillStyle = "#00ff00";
        ctx.fillText(`${d.label} ${(d.score * 100).toFixed(0)}%`, rx + 4, ry - 6);
      }
    }).catch(() => {});
  }, []);

  const onMeta = useCallback((msg: MetaMessage) => {
    if (msg.type === "frame") {
      metaRef.current = msg;
      setFps(msg.fps);
      setLatency(msg.latency);
      setDetections(msg.detections);
      setFrameSize({ w: msg.width, h: msg.height });
    }
  }, []);

  const { connected, cameras, selectedCamera, selectCamera } = useCameraStream(
    "ws://localhost:8081",
    onBinary,
    onMeta
  );

  const avgLat = latency > 0 ? `${latency}ms` : "—";
  const statusClass = connected ? "cam-status-ok" : "cam-status-off";

  return (
    <div className="tab-content">
      <h2>Camera</h2>

      <div className="cam-toolbar">
        <div className="cam-selector">
          <label>Source:</label>
          <select
            value={selectedCamera}
            onChange={(e) => selectCamera(Number(e.target.value))}
          >
            {cameras.map((c) => (
              <option key={c.index} value={c.index}>
                {c.path} — {c.model} {c.isExternal ? "[USB]" : "[INT]"}
              </option>
            ))}
          </select>
        </div>

        <div className="cam-stats">
          <span className={`cam-status-dot ${statusClass}`} />
          <span className="cam-stat">FPS: <strong>{fps}</strong></span>
          <span className="cam-stat">Latency: <strong>{avgLat}</strong></span>
          <span className="cam-stat">Frame: <strong>{frameSize.w}&times;{frameSize.h}</strong></span>
        </div>
      </div>

      <div className="cam-viewport">
        <canvas ref={canvasRef} className="cam-canvas" />
        {!connected && (
          <div className="cam-overlay">
            <div className="cam-spinner" />
            <p>Connecting to camera server...</p>
          </div>
        )}
        {connected && !hasFrame && (
          <div className="cam-overlay">
            <p>Waiting for camera feed...</p>
          </div>
        )}
      </div>

      <div className="cam-bottom">
        <div className="cam-detections">
          <h4>Detections</h4>
          {detections.length === 0 && <p className="cam-empty">No objects detected</p>}
          {detections.map((d, i) => (
            <div key={i} className="cam-detection-item">
              <span className="cam-detection-label">{d.label}</span>
              <span className="cam-detection-score">{(d.score * 100).toFixed(0)}%</span>
              <span className="cam-detection-bbox">
                [{d.bbox.map((v) => v.toFixed(2)).join(", ")}]
              </span>
            </div>
          ))}
        </div>

        <div className="cam-health">
          <h4>Sensor Health</h4>
          <div className="cam-health-row">
            <span>Status</span>
            <span className={statusClass}>{connected ? "Connected" : "Disconnected"}</span>
          </div>
          <div className="cam-health-row">
            <span>Resolution</span>
            <span>{frameSize.w}&times;{frameSize.h}</span>
          </div>
          <div className="cam-health-row">
            <span>Avg Latency</span>
            <span>{avgLat}</span>
          </div>
          <div className="cam-health-row">
            <span>Detections</span>
            <span>{detections.length}</span>
          </div>
          <div className="cam-health-bar-container">
            <div
              className="cam-health-bar"
              style={{
                width: `${Math.min(100, connected ? 80 : 10)}%`,
                background: connected
                  ? latency > 100 ? "#d29922" : "#3fb950"
                  : "#f85149",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
