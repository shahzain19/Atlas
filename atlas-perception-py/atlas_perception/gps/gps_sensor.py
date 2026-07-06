import math
import time
from typing import Callable, Optional

from ..deterministic import seeded_range
from ..types import GPSData

GPSDataProvider = Callable[[], GPSData]


def default_gps_provider() -> GPSData:
    timestamp = time.time()
    elapsed = math.floor(timestamp / 100) % 10000
    t = elapsed / 10000
    base_lat = 37.7749
    base_lng = -122.4194
    radius = 0.008
    lat = base_lat + math.sin(t * math.pi * 2) * radius
    lng = base_lng + math.cos(t * math.pi * 0.7) * radius
    altitude = 10 + math.sin(t * math.pi * 4) * 3
    speed = 2 + math.sin(t * math.pi * 2) * 1.5
    heading = (math.sin(t * math.pi * 2) * 180 + 180) % 360
    ts_key = math.floor(timestamp / 200)
    return GPSData(
        latitude=lat + seeded_range(ts_key, -0.00005, 0.00005),
        longitude=lng + seeded_range(ts_key + 1, -0.00005, 0.00005),
        altitude=altitude + seeded_range(ts_key + 2, -0.2, 0.2),
        speed=max(0, speed + seeded_range(ts_key + 3, -0.3, 0.3)),
        heading=(heading + seeded_range(ts_key + 4, -2, 2)) % 360,
        accuracy=1.5 + seeded_range(ts_key + 5, 0, 1.5),
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
