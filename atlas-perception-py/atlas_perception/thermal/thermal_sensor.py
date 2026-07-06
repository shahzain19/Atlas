import math
import time
from typing import Callable, Optional

import numpy as np

from ..deterministic import seeded_range
from ..types import ThermalFrame


class ThermalSensor:
    def __init__(self):
        self._config = {"width": 320, "height": 240}
        self._is_running = False
        self._frame_callback: Optional[Callable[[ThermalFrame], None]] = None
        self._frame_index = 0

    async def start(self) -> None:
        self._is_running = True

    async def stop(self) -> None:
        self._is_running = False

    def capture_frame(self) -> ThermalFrame:
        width = self._config["width"]
        height = self._config["height"]
        num_pixels = width * height
        temp_data = np.zeros(num_pixels, dtype=np.float32)
        t = self._frame_index * 0.1
        horizon_y = int(height * 0.5)

        for y in range(height):
            for x in range(width):
                i = y * width + x
                seed = self._frame_index * num_pixels + i
                if y < horizon_y - 3:
                    grad = y / (horizon_y - 3) if horizon_y > 3 else 0
                    temp = -5 + grad * 10 + seeded_range(seed, -1.5, 1.5)
                    if seeded_range(seed + 1000, 0, 1) > 0.97:
                        temp += 5 + seeded_range(seed + 2000, 0, 8)
                elif y > horizon_y + 3:
                    grad = (y - horizon_y) / (height - horizon_y) if height > horizon_y else 0
                    temp = 22 + grad * 8 + seeded_range(seed, -1, 1)
                    if seeded_range(seed + 3000, 0, 1) > 0.96:
                        temp += 10 + seeded_range(seed + 4000, 0, 15)
                else:
                    temp = 15 + seeded_range(seed, -3, 3)
                hx = int(width * 0.6)
                hy = int(height * 0.25)
                dx_h = x - hx
                dy_h = y - hy
                if abs(dx_h) < 8 and abs(dy_h) < 8:
                    dist = math.hypot(dx_h, dy_h)
                    if dist < 8:
                        temp += 25 * (1 - dist / 8)
                ex = int(width * 0.3)
                ey = int(height * 0.7)
                dx_e = x - ex
                dy_e = y - ey
                if abs(dx_e) < 5 and abs(dy_e) < 12:
                    dist = math.hypot(dx_e / 5, dy_e / 12)
                    if dist < 1:
                        temp += 18 * (1 - dist)
                temp_data[i] = temp

        self._frame_index += 1
        frame = ThermalFrame(
            width=width,
            height=height,
            temperatureData=temp_data,
            timestamp=time.time(),
        )
        if self._frame_callback:
            self._frame_callback(frame)
        return frame

    def set_frame_callback(self, callback: Callable[[ThermalFrame], None]) -> None:
        self._frame_callback = callback
