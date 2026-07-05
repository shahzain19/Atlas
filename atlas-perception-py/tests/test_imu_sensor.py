import pytest
from atlas_perception.imu.imu_sensor import IMUSensor


class TestIMUSensor:
    def test_capture_data_structure(self):
        imu = IMUSensor()
        data = imu.capture_data()
        assert "x" in data.acceleration
        assert "y" in data.acceleration
        assert "z" in data.acceleration
        assert "x" in data.gyroscope
        assert "y" in data.gyroscope
        assert "z" in data.gyroscope
        assert data.timestamp > 0

    def test_gravity_approx(self):
        imu = IMUSensor()
        data = imu.capture_data()
        assert 9.75 <= data.acceleration["z"] <= 9.87

    def test_deterministic(self):
        i1 = IMUSensor()
        i2 = IMUSensor()
        d1 = i1.capture_data()
        d2 = i2.capture_data()
        assert d1.acceleration["x"] == pytest.approx(d2.acceleration["x"])
        assert d1.acceleration["y"] == pytest.approx(d2.acceleration["y"])
        assert d1.gyroscope["x"] == pytest.approx(d2.gyroscope["x"])

    def test_start_stop(self):
        imu = IMUSensor()
        import asyncio
        asyncio.run(imu.start())
        assert imu._is_running
        asyncio.run(imu.stop())
        assert not imu._is_running

    def test_callback_invoked(self):
        imu = IMUSensor()
        results = []
        imu.set_data_callback(lambda d: results.append(d))
        data = imu.capture_data()
        assert len(results) == 1
        assert results[0] is data
