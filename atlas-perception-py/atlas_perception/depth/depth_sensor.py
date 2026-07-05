import math
import time
from typing import Callable, Optional

import numpy as np

from ..deterministic import seeded_range
from ..types import DepthFrame


class DepthSensor:
    def __init__(self):
        self._config = {"width": 640, "height": 480}
        self._is_running = False
        self._frame_callback: Optional[Callable[[DepthFrame], None]] = None
        self._frame_index = 0

    async def start(self) -> None:
        self._is_running = True

    async def stop(self) -> None:
        self._is_running = False

    def capture_frame(self) -> DepthFrame:
        num_pixels = self._config["width"] * self._config["height"]
        depth_data = np.zeros(num_pixels, dtype=np.uint16)
        for i in range(num_pixels):
            depth_data[i] = 1000 + math.floor(
                seeded_range(self._frame_index * num_pixels + i, 0, 4000)
            )
        self._frame_index += 1
        frame = DepthFrame(
            width=self._config["width"],
            height=self._config["height"],
            depthData=depth_data,
            timestamp=time.time(),
        )
        if self._frame_callback:
            self._frame_callback(frame)
        return frame

    def set_frame_callback(self, callback: Callable[[DepthFrame], None]) -> None:
        self._frame_callback = callback
