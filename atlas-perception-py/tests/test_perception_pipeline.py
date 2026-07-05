import numpy as np
import pytest
from atlas_perception.camera.camera_sensor import CameraSensor
from atlas_perception.lidar.lidar_sensor import LidarSensor
from atlas_perception.detection.object_detector import ObjectDetector
from atlas_perception.pipeline.perception_pipeline import PerceptionPipeline
from atlas_perception.types import CameraFrame


def _bright_frame_provider(config):
    data = np.full(config["width"] * config["height"] * 3, 200, dtype=np.uint8)
    return CameraFrame(
        width=config["width"], height=config["height"], channels=3,
        data=data, timestamp=123.0,
    )


class TestPerceptionPipeline:
    def test_initial_state(self):
        pipe = PerceptionPipeline()
        state = pipe.get_state()
        assert state.cameraFrame is None
        assert state.lidarScan is None
        assert state.detectedObjects == []
        assert state.timestamp > 0

    def test_attach_components(self):
        pipe = PerceptionPipeline()
        cam = CameraSensor()
        lidar = LidarSensor()
        det = ObjectDetector()
        pipe.attach_camera(cam)
        pipe.attach_lidar(lidar)
        pipe.attach_object_detector(det)
        assert pipe._camera is cam
        assert pipe._lidar is lidar
        assert pipe._object_detector is det

    def test_capture_all_integration(self):
        import asyncio
        pipe = PerceptionPipeline()
        cam = CameraSensor({"width": 64, "height": 64}, frame_provider=_bright_frame_provider)
        lidar = LidarSensor()
        det = ObjectDetector()
        pipe.attach_camera(cam)
        pipe.attach_lidar(lidar)
        pipe.attach_object_detector(det)
        state = asyncio.run(pipe.capture_all())
        assert state.cameraFrame is not None
        assert state.lidarScan is not None
        assert len(state.detectedObjects) > 0
        assert state.cameraFrame.width == 64
        assert state.cameraFrame.height == 64
        assert len(state.lidarScan.points) == 360

    def test_capture_all_no_detector(self):
        import asyncio
        pipe = PerceptionPipeline()
        cam = CameraSensor({"width": 32, "height": 32})
        lidar = LidarSensor()
        pipe.attach_camera(cam)
        pipe.attach_lidar(lidar)
        state = asyncio.run(pipe.capture_all())
        assert state.cameraFrame is not None
        assert state.lidarScan is not None
        assert state.detectedObjects == []

    def test_capture_all_no_components(self):
        import asyncio
        pipe = PerceptionPipeline()
        state = asyncio.run(pipe.capture_all())
        assert state.cameraFrame is None
        assert state.lidarScan is None
        assert state.detectedObjects == []

    def test_callbacks_wired(self):
        import asyncio
        pipe = PerceptionPipeline()
        cam = CameraSensor({"width": 16, "height": 16})
        lidar = LidarSensor()
        det = ObjectDetector()
        pipe.attach_camera(cam)
        pipe.attach_lidar(lidar)
        pipe.attach_object_detector(det)
        asyncio.run(pipe.capture_all())
        state = pipe.get_state()
        assert state.cameraFrame is not None
        assert state.lidarScan is not None

    def test_state_independence(self):
        import asyncio
        pipe = PerceptionPipeline()
        cam = CameraSensor({"width": 16, "height": 16})
        lidar = LidarSensor()
        det = ObjectDetector()
        pipe.attach_camera(cam)
        pipe.attach_lidar(lidar)
        pipe.attach_object_detector(det)
        state1 = asyncio.run(pipe.capture_all())
        state2 = pipe.get_state()
        assert state2.cameraFrame is not None
        assert state2.lidarScan is not None
