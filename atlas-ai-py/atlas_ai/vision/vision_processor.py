import json
from atlas_ai.groq_client import GroqClient


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


class VisionProcessor:
    def __init__(self):
        self.groq = GroqClient.get_instance()
        self.model_loaded = False

    async def load_detection_model(self, model_path: str):
        self.model_loaded = True

    async def detect_objects(self, frame: CameraFrame) -> list[DetectedObject]:
        if not self.model_loaded:
            await self.load_detection_model("groq-vision")

        sample = []
        for i in range(0, min(100, len(frame.data)), 3):
            if i + 2 < len(frame.data):
                sample.append({"r": frame.data[i], "g": frame.data[i + 1], "b": frame.data[i + 2]})

        desc = f"Camera frame {frame.width}x{frame.height}px. Sample pixels: {json.dumps(sample[:10])}."

        result = await self.groq.detect_objects(desc)

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
