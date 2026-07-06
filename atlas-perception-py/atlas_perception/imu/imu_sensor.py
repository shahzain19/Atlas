import math
import time
from typing import Callable, Optional

from ..deterministic import seeded_range
from ..types import IMUData


class IMUSensor:
    def __init__(self):
        self._is_running = False
        self._data_callback: Optional[Callable[[IMUData], None]] = None
        self._sample_index = 0
        self._velocity = {"x": 0, "y": 0, "z": 0}
        self._orientation = {"roll": 0, "pitch": 0, "yaw": 0}

    async def start(self) -> None:
        self._is_running = True

    async def stop(self) -> None:
        self._is_running = False

    def capture_data(self) -> IMUData:
        seed = self._sample_index
        self._sample_index += 1
        t = self._sample_index * 0.01
        accel_x = math.sin(t * 1.3) * 0.3 + seeded_range(seed, -0.02, 0.02)
        accel_y = math.cos(t * 0.7) * 0.2 + seeded_range(seed + 1, -0.02, 0.02)
        accel_z = 9.81 + math.sin(t * 2.1) * 0.1 + seeded_range(seed + 2, -0.01, 0.01)
        self._velocity["x"] += accel_x * 0.01
        self._velocity["y"] += accel_y * 0.01
        gyro_x = math.sin(t * 1.3) * 0.003 + seeded_range(seed + 3, -0.001, 0.001)
        gyro_y = math.cos(t * 0.9) * 0.002 + seeded_range(seed + 4, -0.001, 0.001)
        gyro_z = math.sin(t * 0.5) * 0.004 + seeded_range(seed + 5, -0.001, 0.001)
        mag_x = math.cos(t * 0.3) * 30 + seeded_range(seed + 6, -1, 1)
        mag_y = math.sin(t * 0.3) * 30 + seeded_range(seed + 7, -1, 1)
        mag_z = 40 + math.sin(t * 0.2) * 5 + seeded_range(seed + 8, -1, 1)
        data = IMUData(
            acceleration={"x": accel_x, "y": accel_y, "z": accel_z},
            gyroscope={"x": gyro_x, "y": gyro_y, "z": gyro_z},
            magnetometer={"x": mag_x, "y": mag_y, "z": mag_z},
            timestamp=time.time(),
        )
        if self._data_callback:
            self._data_callback(data)
        return data

    def set_data_callback(self, callback: Callable[[IMUData], None]) -> None:
        self._data_callback = callback
