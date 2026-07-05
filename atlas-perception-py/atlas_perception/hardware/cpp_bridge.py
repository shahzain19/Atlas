import subprocess
import json
import os
from typing import Optional, Any


class CppBridge:
    def __init__(self, daemon_path: Optional[str] = None):
        self._daemon_path = daemon_path or os.path.join(
            os.path.dirname(__file__),
            "../../../atlas-hardware-cpp/build/atlas_hardware_daemon",
        )
        self._process: Optional[subprocess.Popen] = None
        self._seq = 0

    def start(self) -> None:
        if self._process:
            return
        self._process = subprocess.Popen(
            [self._daemon_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

    def stop(self) -> None:
        if self._process:
            try:
                self._process.stdin.close()
            except Exception:
                pass
            self._process.terminate()
            try:
                self._process.wait(timeout=3)
            except Exception:
                self._process.kill()
            self._process = None

    def send(self, cmd: str, **params: Any) -> Any:
        if not self._process:
            raise RuntimeError("CppBridge not started. Call start() first.")
        self._seq += 1
        payload = json.dumps({"cmd": cmd, **params, "_seq": self._seq})
        self._process.stdin.write(payload + "\n")
        self._process.stdin.flush()
        line = self._process.stdout.readline()
        if not line:
            raise RuntimeError("C++ daemon closed connection")
        response = json.loads(line.strip())
        if not response.get("ok", False):
            raise RuntimeError(response.get("error", "unknown error"))
        return response.get("data")

    @property
    def is_running(self) -> bool:
        if not self._process:
            return False
        return self._process.poll() is None

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, *args):
        self.stop()


def create_cpp_gps_provider(bridge: CppBridge):
    def provider():
        data = bridge.send("gps_read")
        from ..types import GPSData
        return GPSData(
            latitude=data["lat"],
            longitude=data["lng"],
            altitude=data.get("alt", 0.0),
            accuracy=data.get("accuracy"),
            timestamp=data.get("timestamp", 0.0),
        )
    return provider


def create_cpp_camera_provider(bridge: CppBridge):
    def provider(config: dict):
        data = bridge.send("camera_capture")
        import numpy as np
        from ..types import CameraFrame
        w = data["width"]
        h = data["height"]
        c = data["channels"]
        frame_data = np.full(w * h * c, 128, dtype=np.uint8)
        return CameraFrame(
            width=w,
            height=h,
            channels=c,
            data=frame_data,
            timestamp=data.get("timestamp", 0.0),
        )
    return provider
