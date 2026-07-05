import numpy as np
from atlas_perception.detection.object_detector import ObjectDetector, LABELS
from atlas_perception.types import CameraFrame


def make_test_frame(width=64, height=64, value=200):
    data = np.full(width * height * 3, value, dtype=np.uint8)
    return CameraFrame(width=width, height=height, channels=3, data=data, timestamp=1.0)


class TestObjectDetectorDefaults:
    def test_default_config(self):
        det = ObjectDetector()
        cfg = det.get_config()
        assert cfg["modelName"] == "atlas-blob-detector"
        assert cfg["confidenceThreshold"] == 0.5
        assert cfg["iouThreshold"] == 0.5
        assert cfg["maxDetections"] == 20

    def test_model_not_loaded_initially(self):
        det = ObjectDetector()
        assert not det._model_loaded

    def test_load_model(self):
        det = ObjectDetector()
        import asyncio
        asyncio.run(det.load_model())
        assert det._model_loaded


class TestObjectDetectorDetection:
    def test_bright_frame_finds_detections(self):
        det = ObjectDetector()
        import asyncio
        frame = make_test_frame(value=200)
        objs = asyncio.run(det.detect(frame))
        assert len(objs) > 0

    def test_dark_frame_no_detections(self):
        det = ObjectDetector()
        import asyncio
        frame = make_test_frame(value=50)
        objs = asyncio.run(det.detect(frame))
        assert len(objs) == 0

    def test_detection_structure(self):
        det = ObjectDetector()
        import asyncio
        frame = make_test_frame(value=200)
        objs = asyncio.run(det.detect(frame))
        obj = objs[0]
        assert obj.id.startswith("det-")
        assert obj.label in LABELS
        assert 0 <= obj.confidence <= 1
        assert "x" in obj.boundingBox
        assert "y" in obj.boundingBox
        assert "width" in obj.boundingBox
        assert "height" in obj.boundingBox
        assert "x" in obj.position
        assert "y" in obj.position
        assert "z" in obj.position

    def test_max_detections(self):
        det = ObjectDetector({"maxDetections": 3})
        import asyncio
        frame = make_test_frame(value=200)
        objs = asyncio.run(det.detect(frame))
        assert len(objs) <= 3

    def test_sorted_by_confidence(self):
        det = ObjectDetector()
        import asyncio
        frame = make_test_frame(value=200)
        objs = asyncio.run(det.detect(frame))
        confidences = [o.confidence for o in objs]
        assert confidences == sorted(confidences, reverse=True)

    def test_auto_loads_model(self):
        det = ObjectDetector()
        assert not det._model_loaded
        import asyncio
        frame = make_test_frame(value=200)
        asyncio.run(det.detect(frame))
        assert det._model_loaded


class TestObjectDetectorConfig:
    def test_custom_config(self):
        det = ObjectDetector({
            "modelName": "custom-model",
            "confidenceThreshold": 0.8,
            "maxDetections": 5,
        })
        cfg = det.get_config()
        assert cfg["modelName"] == "custom-model"
        assert cfg["confidenceThreshold"] == 0.8
        assert cfg["maxDetections"] == 5

    def test_update_config(self):
        det = ObjectDetector()
        det.update_config({"confidenceThreshold": 0.9})
        assert det.get_config()["confidenceThreshold"] == 0.9
