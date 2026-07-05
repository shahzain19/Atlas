import pytest
from atlas_perception.camera.camera_sensor import CameraSensor, DEFAULT_CONFIG


class TestCameraSensorDefaults:
    def test_default_config(self):
        cam = CameraSensor()
        cfg = cam.get_config()
        assert cfg["width"] == 640
        assert cfg["height"] == 480
        assert cfg["fps"] == 30
        assert cfg["exposure"] == 0.1

    def test_capture_frame_structure(self):
        cam = CameraSensor()
        frame = cam.capture_frame()
        assert frame.width == 640
        assert frame.height == 480
        assert frame.channels == 3
        assert len(frame.data) == 640 * 480 * 3
        assert frame.timestamp > 0

    def test_capture_frame_deterministic(self):
        cam1 = CameraSensor()
        cam2 = CameraSensor()
        f1 = cam1.capture_frame()
        f2 = cam2.capture_frame()
        assert (f1.data == f2.data).all()

    def test_start_stop(self):
        cam = CameraSensor()
        import asyncio
        asyncio.run(cam.start())
        assert cam._is_running
        asyncio.run(cam.stop())
        assert not cam._is_running

    def test_idempotent_start_stop(self):
        cam = CameraSensor()
        import asyncio
        asyncio.run(cam.start())
        asyncio.run(cam.start())
        assert cam._is_running
        asyncio.run(cam.stop())
        asyncio.run(cam.stop())
        assert not cam._is_running


class TestCameraSensorCustom:
    def test_custom_config(self):
        cam = CameraSensor({"width": 320, "height": 240, "fps": 15, "exposure": 0.05})
        cfg = cam.get_config()
        assert cfg["width"] == 320
        assert cfg["height"] == 240
        assert cfg["fps"] == 15
        assert cfg["exposure"] == 0.05

    def test_capture_frame_custom_size(self):
        cam = CameraSensor({"width": 10, "height": 10})
        frame = cam.capture_frame()
        assert len(frame.data) == 10 * 10 * 3

    def test_update_config(self):
        cam = CameraSensor()
        cam.update_config({"width": 800, "exposure": 0.2})
        cfg = cam.get_config()
        assert cfg["width"] == 800
        assert cfg["exposure"] == 0.2
        assert cfg["height"] == 480


class TestCameraSensorCallback:
    def test_callback_invoked(self):
        cam = CameraSensor()
        results = []
        cam.set_frame_callback(lambda f: results.append(f))
        frame = cam.capture_frame()
        assert len(results) == 1
        assert results[0] is frame

    def test_multiple_callbacks(self):
        cam = CameraSensor()
        count = [0]
        cam.set_frame_callback(lambda f: count.__setitem__(0, count[0] + 1))
        cam.capture_frame()
        cam.capture_frame()
        assert count[0] == 2


class TestCameraSensorFrameProvider:
    def test_custom_frame_provider(self):
        def provider(config):
            from atlas_perception.types import CameraFrame
            import numpy as np
            return CameraFrame(
                width=config["width"],
                height=config["height"],
                channels=3,
                data=np.full(config["width"] * config["height"] * 3, 128, dtype=np.uint8),
                timestamp=123.0,
            )
        cam = CameraSensor(frame_provider=provider)
        frame = cam.capture_frame()
        assert (frame.data == 128).all()
        assert frame.timestamp == 123.0
