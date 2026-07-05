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
        num_pixels = self._config["width"] * self._config["height"]
        temp_data = np.zeros(num_pixels, dtype=np.float32)
        for i in range(num_pixels):
            temp_data[i] = 20 + seeded_range(self._frame_index * num_pixels + i, 0, 20)
        self._frame_index += 1
        frame = ThermalFrame(
            width=self._config["width"],
            height=self._config["height"],
            temperatureData=temp_data,
            timestamp=time.time(),
        )
        if self._frame_callback:
            self._frame_callback(frame)
        return frame

    def set_frame_callback(self, callback: Callable[[ThermalFrame], None]) -> None:
        self._frame_callback = callback
