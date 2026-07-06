import copy
import math
import time
from typing import Callable, Optional

import numpy as np

from ..deterministic import seeded_range
from ..types import CameraFrame

CameraConfig = dict

DEFAULT_CONFIG = {
    "width": 640,
    "height": 480,
    "fps": 30,
    "exposure": 0.1,
}


def default_frame_provider(config: dict) -> CameraFrame:
    width = config["width"]
    height = config["height"]
    data = np.zeros(width * height * 3, dtype=np.uint8)
    timestamp = time.time()
    horizon_y = int(height * 0.55)
    sun_x = int(width * 0.7)
    sun_y = int(height * 0.15)
    sun_radius = 12

    for y in range(height):
        for x in range(width):
            idx = (y * width + x) * 3
            seed = x * 1000 + y

            if y < horizon_y - 2:
                sky_grad = y / (horizon_y - 2) if horizon_y > 2 else 0
                r = int(60 + sky_grad * 80 + seeded_range(seed, -5, 5))
                g = int(120 + sky_grad * 100 + seeded_range(seed + 1, -5, 5))
                b = int(180 + sky_grad * 75 + seeded_range(seed + 2, -5, 5))
            elif y > horizon_y + 2:
                ground_grad = (y - horizon_y) / (height - horizon_y) if height > horizon_y else 0
                r = int(80 + ground_grad * 40 + seeded_range(seed, -8, 8))
                g = int(130 - ground_grad * 30 + seeded_range(seed + 1, -8, 8))
                b = int(50 + ground_grad * 10 + seeded_range(seed + 2, -5, 5))
            else:
                r = int(80 + seeded_range(seed, -10, 10))
                g = int(80 + seeded_range(seed + 1, -10, 10))
                b = int(80 + seeded_range(seed + 2, -10, 10))

            dx_sun = x - sun_x
            dy_sun = y - sun_y
            if abs(dx_sun) < sun_radius and abs(dy_sun) < sun_radius:
                dist = math.hypot(dx_sun, dy_sun)
                if dist < sun_radius:
                    brightness = 1 - dist / sun_radius
                    r = min(255, r + int(brightness * 120))
                    g = min(255, g + int(brightness * 100))
                    b = max(0, b - int(brightness * 40))

            data[idx] = max(0, min(255, r))
            data[idx + 1] = max(0, min(255, g))
            data[idx + 2] = max(0, min(255, b))

    num_clouds = 3
    for c in range(num_clouds):
        cx = int(seeded_range(c * 777, 0, width))
        cy = int(seeded_range(c * 777 + 1, 0, max(1, int(horizon_y * 0.6))))
        cw = 30 + int(seeded_range(c * 777 + 2, 0, 40))
        ch = 10 + int(seeded_range(c * 777 + 3, 0, 15))
        for dy in range(-ch, ch + 1):
            for dx in range(-cw, cw + 1):
                dist = math.hypot(dx / cw if cw else 0, dy / ch if ch else 0)
                if dist > 1:
                    continue
                px = cx + dx
                py = cy + dy
                if px < 0 or px >= width or py < 0 or py >= height:
                    continue
                idx = (py * width + px) * 3
                blend = (1 - dist) * 0.6
                data[idx] = min(255, data[idx] + int(blend * 80))
                data[idx + 1] = min(255, data[idx + 1] + int(blend * 80))
                data[idx + 2] = min(255, data[idx + 2] + int(blend * 80))

    num_trees = 4
    for t in range(num_trees):
        tx = int(seeded_range(t * 333 + 100, 0, width))
        ty = horizon_y + 5 + int(seeded_range(t * 333 + 101, 0, 20))
        trunk_h = 8 + int(seeded_range(t * 333 + 102, 0, 8))
        crown_r = 10 + int(seeded_range(t * 333 + 103, 0, 12))
        for dy in range(-trunk_h - crown_r, crown_r + 1):
            for dx in range(-crown_r, crown_r + 1):
                px = tx + dx
                py = ty + dy
                if px < 0 or px >= width or py < 0 or py >= height:
                    continue
                idx = (py * width + px) * 3
                dist = math.hypot(dx, dy)
                if dy > 0 and abs(dx) < 3 and dist < trunk_h + 2:
                    data[idx] = 60
                    data[idx + 1] = 40
                    data[idx + 2] = 20
                elif dist < crown_r:
                    shade = 1 - dist / crown_r if crown_r else 0
                    data[idx] = min(255, int(30 + shade * 40))
                    data[idx + 1] = min(255, int(80 + shade * 60))
                    data[idx + 2] = min(255, int(25 + shade * 20))

    return CameraFrame(
        width=width,
        height=height,
        channels=3,
        data=data,
        timestamp=timestamp,
    )


FrameProvider = Callable[[dict], CameraFrame]


class CameraSensor:
    def __init__(
        self, config: Optional[dict] = None, frame_provider: Optional[FrameProvider] = None
    ):
        c = config or {}
        self._config = {
            "width": c.get("width", DEFAULT_CONFIG["width"]),
            "height": c.get("height", DEFAULT_CONFIG["height"]),
            "fps": c.get("fps", DEFAULT_CONFIG["fps"]),
            "exposure": c.get("exposure", DEFAULT_CONFIG["exposure"]),
        }
        self._is_running = False
        self._frame_provider = frame_provider or default_frame_provider
        self._frame_callback: Optional[Callable[[CameraFrame], None]] = None
        self._frame_count = 0

    async def start(self) -> None:
        if self._is_running:
            return
        self._is_running = True

    async def stop(self) -> None:
        if not self._is_running:
            return
        self._is_running = False

    def set_frame_callback(self, callback: Callable[[CameraFrame], None]) -> None:
        self._frame_callback = callback

    def capture_frame(self) -> CameraFrame:
        frame = self._frame_provider(self._config)
        self._frame_count += 1
        if self._frame_callback:
            self._frame_callback(frame)
        return frame

    def update_config(self, new_config: dict) -> None:
        self._config.update(new_config)

    def get_config(self) -> dict:
        return copy.deepcopy(self._config)
