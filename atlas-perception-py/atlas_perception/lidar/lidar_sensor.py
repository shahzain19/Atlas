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
        self._walls = [
            {"angle": 0, "dist": 30, "width": math.pi / 6},
            {"angle": math.pi / 2, "dist": 20, "width": math.pi / 4},
            {"angle": math.pi, "dist": 40, "width": math.pi / 3},
            {"angle": -math.pi / 2, "dist": 25, "width": math.pi / 5},
        ]

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
        max_range = 100

        for i in range(num_points):
            angle = (i / num_points) * math.pi * 2
            seed = self._scan_index * 1000 + i
            min_dist = max_range

            for wall in self._walls:
                da = math.atan2(math.sin(angle - wall["angle"]), math.cos(angle - wall["angle"]))
                if abs(da) < wall["width"] / 2:
                    wall_dist = wall["dist"] / math.cos(da) if abs(math.cos(da)) > 0.01 else max_range
                    if 0 < wall_dist < min_dist:
                        min_dist = wall_dist

            if i % 8 == 0:
                scatter_dist = 1 + seeded_range(seed + 100, 0, max_range - 1)
                min_dist = min(min_dist, scatter_dist)

            noise = seeded_range(seed, -0.05, 0.05)
            distance = min_dist * (1 + noise)
            intensity = 0.9 if distance < 5 else max(0.1, 0.5 - (distance / max_range) * 0.4)

            points.append(
                LidarPoint(
                    x=math.cos(angle) * distance,
                    y=math.sin(angle) * distance,
                    z=seeded_range(seed + 1, -0.1, 0.1),
                    intensity=intensity + seeded_range(seed + 2, -0.05, 0.05),
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
