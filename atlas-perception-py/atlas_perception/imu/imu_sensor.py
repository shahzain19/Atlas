import time
from typing import Callable, Optional

from ..deterministic import seeded_range
from ..types import IMUData


class IMUSensor:
    def __init__(self):
        self._is_running = False
        self._data_callback: Optional[Callable[[IMUData], None]] = None
        self._sample_index = 0

    async def start(self) -> None:
        self._is_running = True

    async def stop(self) -> None:
        self._is_running = False

    def capture_data(self) -> IMUData:
        seed = self._sample_index
        self._sample_index += 1
        data = IMUData(
            acceleration={
                "x": seeded_range(seed, -0.05, 0.05),
                "y": seeded_range(seed + 1, -0.05, 0.05),
                "z": 9.81 + seeded_range(seed + 2, -0.05, 0.05),
            },
            gyroscope={
                "x": seeded_range(seed + 3, -0.005, 0.005),
                "y": seeded_range(seed + 4, -0.005, 0.005),
                "z": seeded_range(seed + 5, -0.005, 0.005),
            },
            timestamp=time.time(),
        )
        if self._data_callback:
            self._data_callback(data)
        return data

    def set_data_callback(self, callback: Callable[[IMUData], None]) -> None:
        self._data_callback = callback
