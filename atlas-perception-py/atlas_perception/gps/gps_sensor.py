import math
import time
from typing import Callable, Optional

from ..deterministic import seeded_range
from ..types import GPSData

GPSDataProvider = Callable[[], GPSData]


def default_gps_provider() -> GPSData:
    timestamp = time.time()
    seed = math.floor(timestamp / 1000)
    return GPSData(
        latitude=37.7749 + seeded_range(seed, 0, 0.01),
        longitude=-122.4194 + seeded_range(seed + 1, 0, 0.01),
        altitude=10 + seeded_range(seed + 2, 0, 5),
        accuracy=2 + seeded_range(seed + 3, 0, 3),
        timestamp=timestamp,
    )


class GPSSensor:
    def __init__(self, data_provider: Optional[GPSDataProvider] = None):
        self._is_running = False
        self._data_provider = data_provider or default_gps_provider
        self._data_callback: Optional[Callable[[GPSData], None]] = None

    async def start(self) -> None:
        self._is_running = True

    async def stop(self) -> None:
        self._is_running = False

    def capture_data(self) -> GPSData:
        data = self._data_provider()
        if self._data_callback:
            self._data_callback(data)
        return data

    def set_data_callback(self, callback: Callable[[GPSData], None]) -> None:
        self._data_callback = callback
