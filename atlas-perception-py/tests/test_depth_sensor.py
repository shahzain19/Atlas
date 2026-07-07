import numpy as np
from atlas_perception.depth.depth_sensor import DepthSensor


class TestDepthSensor:
    def test_capture_frame_structure(self):
        depth = DepthSensor()
        frame = depth.capture_frame()
        assert frame.width == 640
        assert frame.height == 480
        assert frame.depthData.shape == (640 * 480,)
        assert frame.depthData.dtype == np.uint16
        assert frame.timestamp > 0

    def test_capture_frame_deterministic(self):
        d1 = DepthSensor()
        d2 = DepthSensor()
        f1 = d1.capture_frame()
        f2 = d2.capture_frame()
        assert (f1.depthData == f2.depthData).all()

    def test_depth_range(self):
        depth = DepthSensor()
        frame = depth.capture_frame()
        assert frame.depthData.min() >= 700
        assert frame.depthData.max() <= 10000

    def test_start_stop(self):
        depth = DepthSensor()
        import asyncio
        asyncio.run(depth.start())
        assert depth._is_running
        asyncio.run(depth.stop())
        assert not depth._is_running

    def test_callback_invoked(self):
        depth = DepthSensor()
        results = []
        depth.set_frame_callback(lambda f: results.append(f))
        frame = depth.capture_frame()
        assert len(results) == 1
        assert results[0] is frame
