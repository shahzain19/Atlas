import pytest
from atlas_perception.lidar.lidar_sensor import LidarSensor


class TestLidarSensorDefaults:
    def test_default_config(self):
        lidar = LidarSensor()
        cfg = lidar.get_config()
        assert cfg["minRange"] == 0.1
        assert cfg["maxRange"] == 100
        assert cfg["scanRate"] == 10
        assert cfg["channels"] == 1

    def test_capture_scan_structure(self):
        lidar = LidarSensor()
        scan = lidar.capture_scan()
        assert len(scan.points) == 360
        assert scan.timestamp > 0
        for pt in scan.points[:5]:
            assert hasattr(pt, "x")
            assert hasattr(pt, "y")
            assert hasattr(pt, "z")
            assert hasattr(pt, "intensity")
            assert hasattr(pt, "timestamp")
            assert pt.timestamp == scan.timestamp

    def test_capture_scan_deterministic(self):
        l1 = LidarSensor()
        l2 = LidarSensor()
        s1 = l1.capture_scan()
        s2 = l2.capture_scan()
        for p1, p2 in zip(s1.points, s2.points):
            assert p1.x == pytest.approx(p2.x)
            assert p1.y == pytest.approx(p2.y)
            assert p1.intensity == pytest.approx(p2.intensity)

    def test_start_stop(self):
        lidar = LidarSensor()
        import asyncio
        asyncio.run(lidar.start())
        assert lidar._is_running
        asyncio.run(lidar.stop())
        assert not lidar._is_running


class TestLidarSensorCustom:
    def test_custom_config(self):
        lidar = LidarSensor({"minRange": 1, "maxRange": 50, "scanRate": 5, "channels": 4})
        cfg = lidar.get_config()
        assert cfg["minRange"] == 1
        assert cfg["maxRange"] == 50
        assert cfg["scanRate"] == 5
        assert cfg["channels"] == 4

    def test_update_config(self):
        lidar = LidarSensor()
        lidar.update_config({"maxRange": 200})
        assert lidar.get_config()["maxRange"] == 200


class TestLidarSensorCallback:
    def test_callback_invoked(self):
        lidar = LidarSensor()
        results = []
        lidar.set_scan_callback(lambda s: results.append(s))
        scan = lidar.capture_scan()
        assert len(results) == 1
        assert results[0] is scan
