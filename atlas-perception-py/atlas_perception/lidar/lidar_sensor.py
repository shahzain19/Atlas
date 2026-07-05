import copy
import math
import time
from typing import Callable, Optional

from ..deterministic import seeded_range
from ..types import LidarPoint, LidarScan


class LidarSensor:
    def __init__(self, config: Optional[dict] = None):
        c = config or {}
        self._config = {
            "minRange": c.get("minRange", 0.1),
            "maxRange": c.get("maxRange", 100),
            "scanRate": c.get("scanRate", 10),
            "channels": c.get("channels", 1),
        }
        self._is_running = False
        self._scan_callback: Optional[Callable[[LidarScan], None]] = None
        self._scan_index = 0

    async def start(self) -> None:
        if self._is_running:
            return
        self._is_running = True

    async def stop(self) -> None:
        if not self._is_running:
            return
        self._is_running = False

    def set_scan_callback(self, callback: Callable[[LidarScan], None]) -> None:
        self._scan_callback = callback

    def capture_scan(self) -> LidarScan:
        points = []
        num_points = 360
        timestamp = time.time()
        for i in range(num_points):
            angle = (i / num_points) * math.pi * 2
            seed = self._scan_index * 1000 + i
            distance = 5 + seeded_range(seed, 0, 10)
            points.append(
                LidarPoint(
                    x=math.cos(angle) * distance,
                    y=math.sin(angle) * distance,
                    z=0.0,
                    intensity=0.5 + seeded_range(seed + 1, 0, 0.5),
                    timestamp=timestamp,
                )
            )
        self._scan_index += 1
        scan = LidarScan(points=points, timestamp=timestamp)
        if self._scan_callback:
            self._scan_callback(scan)
        return scan

    def update_config(self, new_config: dict) -> None:
        self._config.update(new_config)

    def get_config(self) -> dict:
        return copy.deepcopy(self._config)
