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
        width = self._config["width"]
        height = self._config["height"]
        num_pixels = width * height
        depth_data = np.zeros(num_pixels, dtype=np.uint16)
        confidence = np.zeros(num_pixels, dtype=np.uint8)
        t = self._frame_index

        for y in range(height):
            for x in range(width):
                i = y * width + x
                cx = x / width - 0.5
                cy = y / height - 0.5
                wall_dist = 2000 + abs(cx) * 6000
                floor_dist = 1500 + abs(cy) * 4000
                min_dist = min(wall_dist, floor_dist)
                depth = min(10000, max(200, min_dist * seeded_range(t * 1000 + i, 0.95, 1.05)))
                obj_dist = math.hypot(cx - 0.2, cy + 0.1)
                if obj_dist < 0.08:
                    depth_data[i] = 800 + int(seeded_range(t * 1000 + i, -50, 50))
                    confidence[i] = 200
                else:
                    obj2_dist = math.hypot(cx + 0.15, cy - 0.05)
                    if obj2_dist < 0.06:
                        depth_data[i] = 1200 + int(seeded_range(t * 1000 + i + 1, -80, 80))
                        confidence[i] = 180
                    else:
                        depth_data[i] = int(depth)
                        confidence[i] = max(0, min(255, 200 - int(depth / 100)))

        self._frame_index += 1
        frame = DepthFrame(
            width=width,
            height=height,
            depthData=depth_data,
            confidence=confidence,
            timestamp=time.time(),
        )
        if self._frame_callback:
            self._frame_callback(frame)
        return frame

    def set_frame_callback(self, callback: Callable[[DepthFrame], None]) -> None:
        self._frame_callback = callback
