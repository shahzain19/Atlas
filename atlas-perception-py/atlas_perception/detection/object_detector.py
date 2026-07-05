import copy
from typing import Optional

from ..types import CameraFrame, DetectedObject

LABELS = ["Object", "Structure", "Obstacle", "Marker", "Surface"]


class ObjectDetector:
    def __init__(self, config: Optional[dict] = None):
        c = config or {}
        self._config = {
            "modelName": c.get("modelName", "atlas-blob-detector"),
            "confidenceThreshold": c.get("confidenceThreshold", 0.5),
            "iouThreshold": c.get("iouThreshold", 0.5),
            "maxDetections": c.get("maxDetections", 20),
        }
        self._model_loaded = False

    async def load_model(self) -> None:
        self._model_loaded = True

    async def detect(self, frame: CameraFrame) -> list:
        if not self._model_loaded:
            await self.load_model()
        regions = self._find_bright_regions(frame)
        threshold = self._config["confidenceThreshold"]
        max_detections = self._config["maxDetections"]
        return [
            DetectedObject(
                id=f"det-{index}",
                label=LABELS[index % len(LABELS)],
                confidence=min(0.99, threshold + region["score"] * (1 - threshold)),
                boundingBox=region["box"],
                position={
                    "x": region["box"]["x"] + region["box"]["width"] / 2,
                    "y": region["box"]["y"] + region["box"]["height"] / 2,
                    "z": 0,
                },
            )
            for index, region in enumerate(regions[:max_detections])
        ]

    def _find_bright_regions(self, frame: CameraFrame) -> list:
        width, height = frame.width, frame.height
        data = frame.data
        block = 32
        regions = []
        for by in range(0, height, block):
            for bx in range(0, width, block):
                total = 0
                count = 0
                for y in range(by, min(by + block, height)):
                    for x in range(bx, min(bx + block, width)):
                        idx = (y * width + x) * 3
                        total += (int(data[idx]) + int(data[idx + 1]) + int(data[idx + 2])) / 3
                        count += 1
                avg = total / count
                if avg > 128:
                    regions.append(
                        {
                            "score": avg / 255,
                            "box": {
                                "x": bx,
                                "y": by,
                                "width": min(block, width - bx),
                                "height": min(block, height - by),
                            },
                        }
                    )
        regions.sort(key=lambda r: r["score"], reverse=True)
        return regions

    def update_config(self, new_config: dict) -> None:
        self._config.update(new_config)

    def get_config(self) -> dict:
        return copy.deepcopy(self._config)
