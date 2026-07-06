import json
import os
import numpy as np

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "atlas-models")


def _resolve_model(model_name: str) -> str:
    models_dir = os.environ.get("ATLAS_MODELS_DIR", MODELS_DIR)
    path = os.path.join(models_dir, model_name)
    if os.path.exists(path):
        return path
    alt = os.path.join(os.path.expanduser("~"), ".atlas", "models", model_name)
    if os.path.exists(alt):
        return alt
    return os.path.join(MODELS_DIR, model_name)


class Tensor:
    def __init__(self, data, shape: list[int], dtype: str):
        self.data = data
        self.shape = shape
        self.type = dtype


class BoundingBox:
    def __init__(self, x: float, y: float, width: float, height: float):
        self.x = x
        self.y = y
        self.width = width
        self.height = height


class DetectedObject:
    def __init__(self, label: str, confidence: float, bounding_box: BoundingBox):
        self.label = label
        self.confidence = confidence
        self.boundingBox = bounding_box


class CameraFrame:
    def __init__(self, data, width: int, height: int):
        self.data = data
        self.width = width
        self.height = height


_LABEL_MAP = ["obstacle", "surface", "structure", "open_area", "vegetation", "sky", "water", "vehicle", "person", "animal"]


class VisionProcessor:
    def __init__(self, backend: str = "auto"):
        self._model_loaded = False
        self._model_name = "cnn_vision.onnx"
        self._session = None
        self._backend = "local" if backend in ("auto", "local") else "groq"

    async def load_detection_model(self, model_name: str = None):
        if model_name:
            self._model_name = model_name
        try:
            import onnxruntime as ort
            model_path = _resolve_model(self._model_name)
            if os.path.exists(model_path):
                self._session = ort.InferenceSession(model_path)
        except ImportError:
            pass
        self._model_loaded = True

    async def detect_objects(self, frame: CameraFrame) -> list[DetectedObject]:
        if not self._model_loaded:
            await self.load_detection_model()

        if self._backend == "local" and self._session is not None:
            try:
                return await self._detect_local(frame)
            except Exception:
                pass

        return await self._detect_groq(frame)

    async def _detect_local(self, frame: CameraFrame) -> list[DetectedObject]:
        import onnxruntime as ort
        width, height = frame.width, frame.height
        input_size = 32
        resized = np.zeros((3, input_size, input_size), dtype=np.float32)

        for y in range(input_size):
            for x in range(input_size):
                sy = int((y / input_size) * height)
                sx = int((x / input_size) * width)
                src_idx = (sy * width + sx) * 3
                resized[0, y, x] = frame.data[src_idx] / 255.0
                resized[1, y, x] = frame.data[src_idx + 1] / 255.0
                resized[2, y, x] = frame.data[src_idx + 2] / 255.0

        feeds = {"input": np.expand_dims(resized, 0)}
        results = self._session.run(None, feeds)
        scores = results[0].flatten()

        detections = []
        for i, score in enumerate(scores):
            if score > 0.4:
                detections.append(DetectedObject(
                    label=_LABEL_MAP[i % len(_LABEL_MAP)],
                    confidence=min(0.99, float(score)),
                    bounding_box=BoundingBox(x=0, y=0, width=width, height=height),
                ))

        if not detections:
            detections.append(DetectedObject(
                label="scene",
                confidence=0.5,
                bounding_box=BoundingBox(x=0, y=0, width=width, height=height),
            ))
        return detections

    async def _detect_groq(self, frame: CameraFrame) -> list[DetectedObject]:
        from atlas_ai.groq_client import GroqClient
        groq = GroqClient.get_instance()

        sample = []
        for i in range(0, min(100, len(frame.data)), 3):
            if i + 2 < len(frame.data):
                sample.append({"r": frame.data[i], "g": frame.data[i + 1], "b": frame.data[i + 2]})

        desc = f"Camera frame {frame.width}x{frame.height}px. Sample pixels: {json.dumps(sample[:10])}."
        result = await groq.detect_objects(desc)

        detections = []
        for i, obj in enumerate(result):
            detections.append(DetectedObject(
                label=obj.get("label", "unknown"),
                confidence=min(0.99, obj.get("confidence", 0.5)),
                bounding_box=BoundingBox(
                    x=int(obj.get("boundingBox", {}).get("x", 0) * frame.width),
                    y=int(obj.get("boundingBox", {}).get("y", 0) * frame.height),
                    width=int(obj.get("boundingBox", {}).get("width", 0.1) * frame.width),
                    height=int(obj.get("boundingBox", {}).get("height", 0.1) * frame.height),
                ),
            ))
        return detections
