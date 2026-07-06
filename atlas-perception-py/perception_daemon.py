import asyncio
import json
import math
import os
import signal
import sys
import time

import websockets

from atlas_perception.gps.gps_sensor import GPSSensor
from atlas_perception.camera.camera_sensor import CameraSensor
from atlas_perception.lidar.lidar_sensor import LidarSensor
from atlas_perception.detection.object_detector import ObjectDetector
from atlas_perception.imu.imu_sensor import IMUSensor

WS_URL = os.environ.get("ATLAS_WS_URL", "ws://localhost:8080/api/ws")
RECONNECT_BASE = 1
RECONNECT_MAX = 15


class PerceptionDaemon:
    def __init__(self):
        self.gps = GPSSensor()
        self.camera = CameraSensor()
        self.lidar = LidarSensor()
        self.imu = IMUSensor()
        self.detector = ObjectDetector()
        self._running = False
        self._tick = {"gps": 0.0, "detect": 0.0, "imu": 0.0, "ping": 0.0}

    async def start(self):
        self._running = True
        await self.gps.start()
        await self.camera.start()
        await self.lidar.start()
        await self.imu.start()
        print("[PerceptionDaemon] Sensors started")

    async def stop(self):
        self._running = False
        await self.gps.stop()
        await self.camera.stop()
        await self.lidar.stop()
        await self.imu.stop()
        print("[PerceptionDaemon] Sensors stopped")

    async def run_cycle(self, ws):
        now = time.time()

        # GPS @ 1Hz
        if now - self._tick["gps"] >= 1.0:
            self._tick["gps"] = now
            gps = self.gps.capture_data()
            await ws.send(json.dumps({
                "type": "emit_event",
                "payload": {
                    "type": "GPS_UPDATE",
                    "source": "PythonPerception",
                    "timestamp": int(now * 1000),
                    "payload": {
                        "x": gps.latitude,
                        "y": gps.longitude,
                        "z": gps.altitude or 0.0,
                        "uncertainty": (gps.accuracy or 2.5) / 10.0,
                    },
                },
            }))

        # Detection + Camera + LiDAR @ 0.5Hz
        if now - self._tick["detect"] >= 2.0:
            self._tick["detect"] = now

            frame = self.camera.capture_frame()
            objects = await self.detector.detect(frame)

            for obj in objects:
                await ws.send(json.dumps({
                    "type": "emit_event",
                    "payload": {
                        "type": "OBJECT_DETECTED",
                        "source": "PythonPerception",
                        "timestamp": int(now * 1000),
                        "payload": {
                            "object": obj.label,
                            "confidence": obj.confidence,
                            "position": obj.position,
                            "uncertainty": 1.0 - obj.confidence,
                        },
                    },
                }))

            await ws.send(json.dumps({
                "type": "emit_event",
                "payload": {
                    "type": "IMAGE_CAPTURED",
                    "source": "PythonPerception",
                    "timestamp": int(now * 1000),
                    "payload": {"camera": "front", "objects_detected": len(objects)},
                },
            }))

            lidar = self.lidar.capture_scan()
            if lidar.points:
                closest = min(lidar.points, key=lambda p: math.hypot(p.x, p.y, p.z))
                await ws.send(json.dumps({
                    "type": "emit_event",
                    "payload": {
                        "type": "LIDAR_SCAN",
                        "source": "PythonPerception",
                        "timestamp": int(now * 1000),
                        "payload": {
                            "closest_distance": math.hypot(closest.x, closest.y, closest.z),
                            "num_points": len(lidar.points),
                        },
                    },
                }))

        # IMU @ 2Hz
        if now - self._tick["imu"] >= 0.5:
            self._tick["imu"] = now
            imu = self.imu.capture_data()
            await ws.send(json.dumps({
                "type": "emit_event",
                "payload": {
                    "type": "IMU_UPDATE",
                    "source": "PythonPerception",
                    "timestamp": int(now * 1000),
                    "payload": {
                        "acceleration": imu.acceleration,
                        "gyroscope": imu.gyroscope,
                    },
                },
            }))

        # Ping @ 5s to keep alive
        if now - self._tick["ping"] >= 5.0:
            self._tick["ping"] = now
            await ws.send(json.dumps({"type": "ping"}))

    async def connect_and_run(self):
        attempt = 0
        while self._running:
            try:
                print(f"[PerceptionDaemon] Connecting to {WS_URL} ...")
                async with websockets.connect(WS_URL) as ws:
                    print("[PerceptionDaemon] Connected to Atlas Runtime")
                    attempt = 0

                    # Request initial snapshot
                    await ws.send(json.dumps({"type": "get_snapshot"}))

                    while self._running:
                        try:
                            await self.run_cycle(ws)
                            await asyncio.sleep(0.1)

                            # Check for incoming messages
                            try:
                                msg = await asyncio.wait_for(ws.recv(), timeout=0.01)
                                if msg:
                                    data = json.loads(msg) if isinstance(msg, str) else msg
                                    if isinstance(data, dict):
                                        if data.get("type") == "pong":
                                            pass
                                        elif data.get("type") == "snapshot":
                                            snap = data.get("payload", {})
                                            status = snap.get("status", "unknown")
                                            agents = len(snap.get("agents", []))
                                            objs = len(snap.get("world", {}).get("objects", []))
                                            print(
                                                f"[PerceptionDaemon] Runtime: {status}, "
                                                f"{agents} agents, {objs} objects tracked"
                                            )
                            except asyncio.TimeoutError:
                                pass
                            except websockets.WebSocketException:
                                break

                # If we break out of the inner loop (disconnected), reconnect
                if self._running:
                    attempt += 1
                    delay = min(RECONNECT_BASE * attempt, RECONNECT_MAX)
                    print(f"[PerceptionDaemon] Disconnected, reconnecting in {delay}s ...")
                    await asyncio.sleep(delay)

            except (OSError, websockets.WebSocketException) as e:
                if self._running:
                    attempt += 1
                    delay = min(RECONNECT_BASE * attempt, RECONNECT_MAX)
                    print(f"[PerceptionDaemon] Connection failed ({e}), retry in {delay}s ...")
                    await asyncio.sleep(delay)


async def main():
    daemon = PerceptionDaemon()
    await daemon.start()

    loop = asyncio.get_running_loop()
    stop = asyncio.Event()

    def shutdown():
        if not stop.is_set():
            print("\n[PerceptionDaemon] Shutting down ...")
            stop.set()
            asyncio.ensure_future(daemon.stop())

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, shutdown)
        except NotImplementedError:
            # Windows
            pass

    # Run until stopped
    connect_task = asyncio.ensure_future(daemon.connect_and_run())
    await stop.wait()
    connect_task.cancel()
    try:
        await connect_task
    except asyncio.CancelledError:
        pass
    sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
