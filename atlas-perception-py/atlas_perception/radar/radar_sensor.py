import math
import time
from typing import Callable, Optional

from ..deterministic import seeded_range
from ..types import RadarPoint, RadarScan


class RadarSensor:
    def __init__(self):
        self._config = {"maxRange": 200, "scanRate": 10}
        self._is_running = False
        self._scan_callback: Optional[Callable[[RadarScan], None]] = None
        self._scan_index = 0

    async def start(self) -> None:
        self._is_running = True

    async def stop(self) -> None:
        self._is_running = False

    def capture_scan(self) -> RadarScan:
        points = []
        for i in range(100):
            seed = self._scan_index * 100 + i
            points.append(
                RadarPoint(
                    azimuth=(i / 100) * math.pi * 2,
                    elevation=seeded_range(seed, -math.pi / 2, math.pi / 2),
                    range=10 + seeded_range(seed + 1, 0, 190),
                    intensity=seeded_range(seed + 2, 0, 1),
                )
            )
        self._scan_index += 1
        scan = RadarScan(points=points, timestamp=time.time())
        if self._scan_callback:
            self._scan_callback(scan)
        return scan

    def set_scan_callback(self, callback: Callable[[RadarScan], None]) -> None:
        self._scan_callback = callback
