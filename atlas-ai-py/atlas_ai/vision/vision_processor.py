import json
import os
import math
import numpy as np

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "atlas-models")


def _resolve_model(model_name: str) -> str:
    if os.path.exists(model_name):
        return os.path.abspath(model_name)
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


# 80 COCO class labels used by YOLOv8
COCO_LABELS = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat", "traffic light",
    "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
    "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
    "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove", "skateboard", "surfboard",
    "tennis racket", "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
    "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote", "keyboard",
    "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase",
    "scissors", "teddy bear", "hair drier", "toothbrush",
]

_OLD_LABEL_MAP = ["obstacle", "surface", "structure", "open_area", "vegetation", "sky", "water", "vehicle", "person", "animal"]


# ── YOLO helpers ────────────────────────────────────────────────────────

def _letterbox(img: np.ndarray, target_w: int = 640, target_h: int = 640) -> tuple[np.ndarray, float, float, float, float]:
    h, w = img.shape[:2]
    scale = min(target_w / w, target_h / h)
    nw, nh = int(w * scale), int(h * scale)
    resized = np.empty((target_h, target_w, 3), dtype=np.uint8)
    resized.fill(114)
    top = (target_h - nh) // 2
    left = (target_w - nw) // 2
    resized[top:top + nh, left:left + nw] = np.clip(
        np.array(img).astype(np.float32) * scale, 0, 255
    ).astype(np.uint8) if False else _resize_nearest(img, nw, nh)
    return resized, scale, left, top, nw, nh


def _resize_nearest(img: np.ndarray, nw: int, nh: int) -> np.ndarray:
    h, w = img.shape[:2]
    ys = np.linspace(0, h - 1, nh, dtype=np.intp)
    xs = np.linspace(0, w - 1, nw, dtype=np.intp)
    return img[ys[:, None], xs[None, :]]


def _letterbox_frame(frame: CameraFrame, target_w: int = 640, target_h: int = 640):
    raw = bytes(frame.data) if isinstance(frame.data, list) else frame.data
    img = np.frombuffer(raw, dtype=np.uint8).reshape((frame.height, frame.width, 3))
    h, w = img.shape[:2]
    scale = min(target_w / w, target_h / h)
    nw, nh = int(w * scale), int(h * scale)
    canvas = np.full((target_h, target_w, 3), 114, dtype=np.uint8)
    resized = _resize_nearest(img, nw, nh)
    top = (target_h - nh) // 2
    left = (target_w - nw) // 2
    canvas[top:top + nh, left:left + nw] = resized
    # CHW + normalize
    blob = canvas.transpose(2, 0, 1).astype(np.float32) / 255.0
    return blob[np.newaxis, ...], scale, left, top


def _nms(boxes: list, scores: list, iou_thresh: float = 0.45) -> list:
    if not boxes:
        return []
    boxes_arr = np.array(boxes)
    scores_arr = np.array(scores)
    x1 = boxes_arr[:, 0]
    y1 = boxes_arr[:, 1]
    x2 = boxes_arr[:, 2]
    y2 = boxes_arr[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    order = scores_arr.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        inter = np.maximum(0, xx2 - xx1) * np.maximum(0, yy2 - yy1)
        iou = inter / (areas[i] + areas[order[1:]] - inter)
        order = order[1:][iou <= iou_thresh]
    return keep


# ── VisionProcessor ─────────────────────────────────────────────────────

class VisionProcessor:
    def __init__(self, backend: str = "auto"):
        self._model_loaded = False
        self._model_name = "yolov8n.onnx"
        self._session = None
        self._backend = "local" if backend in ("auto", "local") else "groq"
        self._input_size = 640
        self._is_yolo = False
        self._conf_thresh = 0.1

    async def load_detection_model(self, model_name: str = None):
        if model_name:
            self._model_name = model_name
        try:
            import onnxruntime as ort
            model_path = _resolve_model(self._model_name)
            if os.path.exists(model_path):
                self._session = ort.InferenceSession(model_path)
                self._detect_model_type()
        except ImportError:
            pass
        self._model_loaded = True

    def _detect_model_type(self):
        if not self._session:
            return
        outputs = self._session.get_outputs()
        inputs = self._session.get_inputs()
        # YOLOv8 has single output with shape like [1, 84, 8400]
        if outputs and len(outputs) == 1:
            shape = outputs[0].shape
            if len(shape) == 3 and shape[0] == 1 and shape[2] > 1000:
                self._is_yolo = True
                self._num_classes = shape[1] - 4
                # Detect input size from model
                in_shape = inputs[0].shape
                if len(in_shape) == 4:
                    self._input_size = in_shape[2]
                return
        self._is_yolo = False

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
        if self._is_yolo:
            return self._detect_yolo(frame)

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
                    label=_OLD_LABEL_MAP[i % len(_OLD_LABEL_MAP)],
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

    def _detect_yolo(self, frame: CameraFrame) -> list[DetectedObject]:
        # Preprocess: letterbox to model input size
        blob, scale, pad_left, pad_top = _letterbox_frame(frame, self._input_size, self._input_size)
        feeds = {self._session.get_inputs()[0].name: blob}
        results = self._session.run(None, feeds)

        # YOLOv8 output: [1, 4 + num_classes, num_anchors]
        out = results[0][0]
        num_classes = out.shape[0] - 4
        num_anchors = out.shape[1]

        # Transpose to [num_anchors, 4 + num_classes]
        out = out.T  # shape: [num_anchors, 84]

        # Box coords are cx, cy, w, h normalized to [0, 1] of input size
        boxes = out[:, :4]
        class_scores = out[:, 4:]

        # Get max class score and class index per anchor
        max_scores = class_scores.max(axis=1)
        class_ids = class_scores.argmax(axis=1)

        # Filter by confidence threshold
        mask = max_scores > self._conf_thresh
        if not mask.any():
            return []

        boxes = boxes[mask]
        max_scores = max_scores[mask]
        class_ids = class_ids[mask]

        # Convert cx, cy, w, h → x1, y1, x2, y2 in original image coordinates
        # YOLOv8 ONNX outputs box coords in pixel space of the model input (e.g. 640x640)
        orig_w, orig_h = frame.width, frame.height
        dets = []
        for i in range(len(boxes)):
            cx, cy, w, h = boxes[i]
            x1 = (cx - pad_left - w / 2) / scale
            y1 = (cy - pad_top - h / 2) / scale
            x2 = (cx - pad_left + w / 2) / scale
            y2 = (cy - pad_top + h / 2) / scale
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(orig_w, x2)
            y2 = min(orig_h, y2)
            if x2 <= x1 or y2 <= y1:
                continue
            class_id = int(class_ids[i])
            label = COCO_LABELS[class_id] if class_id < len(COCO_LABELS) else f"class_{class_id}"
            dets.append({
                "bbox": [x1, y1, x2, y2],
                "score": float(max_scores[i]),
                "class_id": class_id,
                "label": label,
            })

        # NMS
        if len(dets) > 1:
            boxes_list = [d["bbox"] for d in dets]
            scores_list = [d["score"] for d in dets]
            keep = _nms(boxes_list, scores_list, iou_thresh=0.45)
            dets = [dets[i] for i in keep]

        return [
            DetectedObject(
                label=d["label"],
                confidence=d["score"],
                bounding_box=BoundingBox(
                    x=d["bbox"][0],
                    y=d["bbox"][1],
                    width=d["bbox"][2] - d["bbox"][0],
                    height=d["bbox"][3] - d["bbox"][1],
                ),
            )
            for d in dets
        ]

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
        for obj in result:
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
