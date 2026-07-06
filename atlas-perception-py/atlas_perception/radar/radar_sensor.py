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
        self._targets = [
            {"azimuth": 0.3, "elevation": 0.1, "range": 80, "velocity": 15, "rc": 10},
            {"azimuth": -0.5, "elevation": -0.05, "range": 120, "velocity": -5, "rc": 5},
            {"azimuth": 1.2, "elevation": 0.15, "range": 50, "velocity": 0, "rc": 20},
            {"azimuth": -1.0, "elevation": -0.1, "range": 150, "velocity": 8, "rc": 3},
            {"azimuth": 0.8, "elevation": -0.2, "range": 35, "velocity": -2, "rc": 8},
        ]

    async def start(self) -> None:
        self._is_running = True

    async def stop(self) -> None:
        self._is_running = False

    def capture_scan(self) -> RadarScan:
        points = []
        timestamp = time.time()
        max_range = self._config["maxRange"]
        t = self._scan_index * 0.1

        for target in self._targets:
            drift_az = math.sin(t * 0.2 + target["azimuth"] * 2) * 0.05
            drift_range = math.sin(t * 0.3 + target["range"] * 0.01) * 3
            rcs_fluctuation = 0.7 + math.sin(t * 0.5 + target["rc"]) * 0.3
            pt_range = target["range"] + drift_range + seeded_range(self._scan_index * 10 + 2, -0.5, 0.5)
            if pt_range > 0 and pt_range < max_range:
                points.append(
                    RadarPoint(
                        azimuth=target["azimuth"] + drift_az + seeded_range(self._scan_index * 10 + 0, -0.005, 0.005),
                        elevation=target["elevation"] + seeded_range(self._scan_index * 10 + 1, -0.005, 0.005),
                        range=pt_range,
                        velocity=target["velocity"] + seeded_range(self._scan_index * 10 + 3, -0.5, 0.5),
                        intensity=max(0.05, rcs_fluctuation + seeded_range(self._scan_index * 10 + 4, -0.1, 0.1)),
                    )
                )

        for i in range(15):
            seed = self._scan_index * 100 + i * 7
            points.append(
                RadarPoint(
                    azimuth=seeded_range(seed, -math.pi, math.pi),
                    elevation=seeded_range(seed + 1, -0.3, 0.3),
                    range=10 + seeded_range(seed + 2, 0, max_range - 10),
                    velocity=seeded_range(seed + 3, -20, 20),
                    intensity=seeded_range(seed + 4, 0.02, 0.15),
                )
            )

        self._scan_index += 1
        scan = RadarScan(points=points, timestamp=timestamp)
        if self._scan_callback:
            self._scan_callback(scan)
        return scan

    def set_scan_callback(self, callback: Callable[[RadarScan], None]) -> None:
        self._scan_callback = callback
