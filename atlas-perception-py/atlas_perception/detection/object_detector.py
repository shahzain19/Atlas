import copy
import json
import os
import math
from typing import Optional

import numpy as np

from ..types import CameraFrame, DetectedObject

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "atlas-models")

LABELS = [
    "obstacle", "surface", "structure", "open_area", "vegetation",
    "sky", "water", "vehicle", "person", "animal", "object", "blob",
]


def _resolve_model(model_name: str) -> str:
    models_dir = os.environ.get("ATLAS_MODELS_DIR", MODELS_DIR)
    path = os.path.join(models_dir, model_name)
    if os.path.exists(path):
        return path
    alt = os.path.join(os.path.expanduser("~"), ".atlas", "models", model_name)
    if os.path.exists(alt):
        return alt
    return os.path.join(MODELS_DIR, model_name)


class ObjectDetector:
    def __init__(self, config: Optional[dict] = None):
        c = config or {}
        self._config = {
            "modelName": c.get("modelName", "atlas-blob-detector"),
            "confidenceThreshold": c.get("confidenceThreshold", 0.3),
            "iouThreshold": c.get("iouThreshold", 0.5),
            "maxDetections": c.get("maxDetections", 20),
            "backend": c.get("backend", "local"),
        }
        self._model_loaded = False
        self._session = None
        self._backend = self._config["backend"]
        if self._backend == "auto":
            self._backend = "local"

    async def load_model(self) -> None:
        try:
            import onnxruntime as ort
            model_path = _resolve_model(self._config["modelName"])
            if os.path.exists(model_path):
                self._session = ort.InferenceSession(model_path)
        except ImportError:
            pass
        self._model_loaded = True

    async def detect(self, frame: CameraFrame) -> list:
        if not self._model_loaded:
            await self.load_model()

        if self._backend == "local" and self._session is not None:
            try:
                return await self._detect_local(frame)
            except Exception:
                pass

        try:
            return await self._detect_groq(frame)
        except ImportError:
            return self._detect_simulated(frame)

    async def _detect_local(self, frame: CameraFrame) -> list:
        import onnxruntime as ort
        width, height = frame.width, frame.height
        input_size = 64
        resized = np.zeros((3, input_size, input_size), dtype=np.float32)

        for y in range(input_size):
            for x in range(input_size):
                sy = int((y / input_size) * height)
                sx = int((x / input_size) * width)
                src_idx = (sy * width + sx) * 3
                resized[0, y, x] = frame.data[src_idx] / 255.0
                resized[1, y, x] = frame.data[src_idx + 1] / 255.0
                resized[2, y, x] = frame.data[src_idx + 2] / 255.0

        feeds = {"input": np.expand_dims(resized, 0).astype(np.float32)}
        results = self._session.run(None, feeds)
        result_map = {}
        for i, name in enumerate([o.name for o in self._session.get_outputs()]):
            result_map[name] = results[i]

        bbox_key = "bbox" if "bbox" in result_map else list(result_map.keys())[0]
        scores_key = "scores" if "scores" in result_map else list(result_map.keys())[1] if len(result_map) > 1 else bbox_key

        bbox_arr = result_map[bbox_key].flatten()
        scores_arr = result_map[scores_key].flatten()

        threshold = self._config["confidenceThreshold"]
        max_detections = self._config["maxDetections"]
        detections = []
        num_det = min(len(bbox_arr) // 4, len(scores_arr))

        for i in range(num_det):
            confidence = float(scores_arr[i])
            if confidence < threshold:
                continue
            rx = max(0, min(1, float(bbox_arr[i * 4])))
            ry = max(0, min(1, float(bbox_arr[i * 4 + 1])))
            rw = max(0, min(1 - rx, float(bbox_arr[i * 4 + 2])))
            rh = max(0, min(1 - ry, float(bbox_arr[i * 4 + 3])))

            detections.append(DetectedObject(
                id=f"det-{i}",
                label="object" if confidence > 0.7 else "blob",
                confidence=min(0.99, confidence),
                boundingBox={"x": int(rx * width), "y": int(ry * height), "width": int(rw * width), "height": int(rh * height)},
                position={"x": (rx + rw / 2) * width, "y": (ry + rh / 2) * height, "z": 0},
            ))
            if len(detections) >= max_detections:
                break

        return detections

    async def _detect_groq(self, frame: CameraFrame) -> list:
        from atlas_ai.groq_client import GroqClient
        groq = GroqClient.get_instance()

        sample = []
        for i in range(0, min(60, len(frame.data)), 3):
            if i + 2 < len(frame.data):
                sample.append({"r": int(frame.data[i]), "g": int(frame.data[i + 1]), "b": int(frame.data[i + 2])})

        desc = f"Camera {frame.width}x{frame.height}px. Sample pixel data (RGB): {json.dumps(sample)}."
        result = await groq.detect_objects(desc)

        threshold = self._config["confidenceThreshold"]
        max_detections = self._config["maxDetections"]

        detections = []
        count = 0
        for obj in result:
            if obj.get("confidence", 0) < threshold:
                continue
            if count >= max_detections:
                break
            bb = obj.get("boundingBox", {})
            detections.append(DetectedObject(
                id=f"det-{count}",
                label=obj.get("label", "unknown"),
                confidence=min(0.99, obj.get("confidence", 0.5)),
                boundingBox={
                    "x": int(bb.get("x", 0) * frame.width),
                    "y": int(bb.get("y", 0) * frame.height),
                    "width": int(bb.get("width", 0.1) * frame.width),
                    "height": int(bb.get("height", 0.1) * frame.height),
                },
                position={
                    "x": bb.get("x", 0) * frame.width + (bb.get("width", 0.1) * frame.width) / 2,
                    "y": bb.get("y", 0) * frame.height + (bb.get("height", 0.1) * frame.height) / 2,
                    "z": 0,
                },
            ))
            count += 1

        return detections

    def _detect_simulated(self, frame: CameraFrame) -> list:
        mean_brightness = float(np.mean(frame.data))
        threshold = self._config["confidenceThreshold"]
        max_detections = self._config["maxDetections"]
        detections = []
        if mean_brightness > 100:
            for i in range(min(3, max_detections)):
                confidence = max(0.5, min(0.99, 0.5 + (mean_brightness - 100) / 200))
                detections.append(DetectedObject(
                    id=f"det-{i}",
                    label=LABELS[i % len(LABELS)],
                    confidence=confidence,
                    boundingBox={"x": i * 20, "y": i * 10, "width": 30, "height": 40},
                    position={"x": float(i * 20 + 15), "y": float(i * 10 + 20), "z": 0},
                ))
        return detections

    def update_config(self, new_config: dict) -> None:
        self._config.update(new_config)
        if "backend" in new_config:
            self._backend = "local" if new_config["backend"] == "auto" else new_config["backend"]

    def get_config(self) -> dict:
        return copy.deepcopy(self._config)
