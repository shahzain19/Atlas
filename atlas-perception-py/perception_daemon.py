import asyncio
import json
import math
import time
import signal
import sys

import websockets

from atlas_perception.gps.gps_sensor import GPSSensor
from atlas_perception.camera.camera_sensor import CameraSensor
from atlas_perception.lidar.lidar_sensor import LidarSensor
from atlas_perception.detection.object_detector import ObjectDetector
from atlas_perception.imu.imu_sensor import IMUSensor

import os

WS_URL = os.environ.get("ATLAS_WS_URL", "ws://localhost:8080/api/ws")
RECONNECT_DELAY = 3


class PerceptionDaemon:
    def __init__(self):
        self.gps = GPSSensor()
        self.camera = CameraSensor()
        self.lidar = LidarSensor()
        self.imu = IMUSensor()
        self.detector = ObjectDetector()
        self._running = False
        self._last_gps_time = 0.0
        self._last_detect_time = 0.0
        self._last_imu_time = 0.0

    async def start(self):
        self._running = True
        await self.gps.start()
        await self.camera.start()
        await self.lidar.start()
        await self.imu.start()

    async def stop(self):
        self._running = False
        await self.gps.stop()
        await self.camera.stop()
        await self.lidar.stop()
        await self.imu.stop()

    async def run_cycle(self, ws):
        now = time.time()

        if now - self._last_gps_time >= 1.0:
            self._last_gps_time = now
            gps_data = self.gps.capture_data()
            await ws.send(json.dumps({
                "type": "emit_event",
                "payload": {
                    "type": "GPS_UPDATE",
                    "source": "PythonPerception",
                    "timestamp": int(now * 1000),
                    "payload": {
                        "x": gps_data.latitude,
                        "y": gps_data.longitude,
                        "z": gps_data.altitude or 0.0,
                        "uncertainty": (gps_data.accuracy or 2.5) / 10.0,
                    },
                },
            }))

        if now - self._last_detect_time >= 2.0:
            self._last_detect_time = now
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

            lidar_scan = self.lidar.capture_scan()
            if lidar_scan.points:
                closest = min(lidar_scan.points, key=lambda p: math.hypot(p.x, p.y, p.z))
                await ws.send(json.dumps({
                    "type": "emit_event",
                    "payload": {
                        "type": "LIDAR_SCAN",
                        "source": "PythonPerception",
                        "timestamp": int(now * 1000),
                        "payload": {
                            "closest_distance": math.hypot(closest.x, closest.y, closest.z),
                            "num_points": len(lidar_scan.points),
                        },
                    },
                }))

        if now - self._last_imu_time >= 0.5:
            self._last_imu_time = now
            imu_data = self.imu.capture_data()
            await ws.send(json.dumps({
                "type": "emit_event",
                "payload": {
                    "type": "IMU_UPDATE",
                    "source": "PythonPerception",
                    "timestamp": int(now * 1000),
                    "payload": {
                        "acceleration": imu_data.acceleration,
                        "gyroscope": imu_data.gyroscope,
                    },
                },
            }))

    async def connect_and_run(self):
        while self._running:
            try:
                print(f"[PerceptionDaemon] Connecting to {WS_URL} ...")
                async with websockets.connect(WS_URL) as ws:
                    print("[PerceptionDaemon] Connected to Atlas Runtime")
                    while self._running:
                        await self.run_cycle(ws)
                        await asyncio.sleep(0.1)
            except (OSError, websockets.WebSocketException) as e:
                if self._running:
                    print(f"[PerceptionDaemon] Connection error: {e}")
                    print(f"[PerceptionDaemon] Reconnecting in {RECONNECT_DELAY}s ...")
                    await asyncio.sleep(RECONNECT_DELAY)


async def main():
    daemon = PerceptionDaemon()
    await daemon.start()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(shutdown(daemon)))

    await daemon.connect_and_run()


async def shutdown(daemon: PerceptionDaemon):
    print("\n[PerceptionDaemon] Shutting down ...")
    await daemon.stop()
    sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
