import copy
import math
import time
from typing import Callable, Optional

import numpy as np

from ..deterministic import seeded_range
from ..types import CameraFrame

CameraConfig = dict

DEFAULT_CONFIG = {
    "width": 640,
    "height": 480,
    "fps": 30,
    "exposure": 0.1,
}


def default_frame_provider(config: dict) -> CameraFrame:
    total_pixels = config["width"] * config["height"]
    data = np.zeros(total_pixels * 3, dtype=np.uint8)
    timestamp = time.time()
    for y in range(config["height"]):
        for x in range(config["width"]):
            idx = (y * config["width"] + x) * 3
            seed = x * 1000 + y
            data[idx] = math.floor(seeded_range(seed, 0, 256))
            data[idx + 1] = math.floor(seeded_range(seed + 1, 0, 256))
            data[idx + 2] = math.floor(seeded_range(seed + 2, 0, 256))
    return CameraFrame(
        width=config["width"],
        height=config["height"],
        channels=3,
        data=data,
        timestamp=timestamp,
    )


FrameProvider = Callable[[dict], CameraFrame]


class CameraSensor:
    def __init__(
        self, config: Optional[dict] = None, frame_provider: Optional[FrameProvider] = None
    ):
        c = config or {}
        self._config = {
            "width": c.get("width", DEFAULT_CONFIG["width"]),
            "height": c.get("height", DEFAULT_CONFIG["height"]),
            "fps": c.get("fps", DEFAULT_CONFIG["fps"]),
            "exposure": c.get("exposure", DEFAULT_CONFIG["exposure"]),
        }
        self._is_running = False
        self._frame_provider = frame_provider or default_frame_provider
        self._frame_callback: Optional[Callable[[CameraFrame], None]] = None
        self._frame_count = 0

    async def start(self) -> None:
        if self._is_running:
            return
        self._is_running = True

    async def stop(self) -> None:
        if not self._is_running:
            return
        self._is_running = False

    def set_frame_callback(self, callback: Callable[[CameraFrame], None]) -> None:
        self._frame_callback = callback

    def capture_frame(self) -> CameraFrame:
        frame = self._frame_provider(self._config)
        self._frame_count += 1
        if self._frame_callback:
            self._frame_callback(frame)
        return frame

    def update_config(self, new_config: dict) -> None:
        self._config.update(new_config)

    def get_config(self) -> dict:
        return copy.deepcopy(self._config)
