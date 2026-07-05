from typing import Any


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
    def __init__(self, onnx=None):
        from atlas_ai.inference.onnx_runtime import ONNXRuntime
        self.onnx = onnx if onnx is not None else ONNXRuntime()
        self.model_loaded = False

    async def load_detection_model(self, model_path: str):
        await self.onnx.load_model(model_path)
        self.model_loaded = True

    async def preprocess(self, frame: CameraFrame) -> Tensor:
        size = frame.width * frame.height
        data = [0.0] * size
        for i in range(size):
            idx = i * 3
            data[i] = frame.data[idx] / 255.0
        return Tensor(data, [1, 1, frame.height, frame.width], "float32")

    async def postprocess(self, output: dict[str, Tensor], frame: CameraFrame) -> list[DetectedObject]:
        tensor = output.get("output")
        if tensor is None:
            return []

        detections: list[DetectedObject] = []
        block_w = max(32, frame.width // 8)
        block_h = max(32, frame.height // 8)
        data = tensor.data

        for i in range(len(data)):
            score = abs(data[i])
            if score < 0.2:
                continue

            col = i % 4
            row = i // 4
            labels = ["person", "car", "bicycle", "structure"]
            detections.append(DetectedObject(
                label=labels[i % 4],
                confidence=min(0.99, score),
                bounding_box=BoundingBox(
                    x=col * block_w,
                    y=row * block_h,
                    width=block_w,
                    height=block_h,
                ),
            ))

        return detections

    async def detect_objects(self, frame: CameraFrame) -> list[DetectedObject]:
        if not self.model_loaded:
            raise RuntimeError("Model not loaded")

        input_tensor = await self.preprocess(frame)
        output = await self.onnx.run({"input": input_tensor})
        return await self.postprocess(output, frame)
