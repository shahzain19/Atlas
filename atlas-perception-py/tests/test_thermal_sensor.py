import numpy as np
from atlas_perception.thermal.thermal_sensor import ThermalSensor


class TestThermalSensor:
    def test_capture_frame_structure(self):
        thermal = ThermalSensor()
        frame = thermal.capture_frame()
        assert frame.width == 320
        assert frame.height == 240
        assert frame.temperatureData.shape == (320 * 240,)
        assert frame.temperatureData.dtype == np.float32
        assert frame.timestamp > 0

    def test_capture_frame_deterministic(self):
        t1 = ThermalSensor()
        t2 = ThermalSensor()
        f1 = t1.capture_frame()
        f2 = t2.capture_frame()
        assert (f1.temperatureData == f2.temperatureData).all()

    def test_temperature_range(self):
        thermal = ThermalSensor()
        frame = thermal.capture_frame()
        assert frame.temperatureData.min() >= 20
        assert frame.temperatureData.max() <= 40

    def test_start_stop(self):
        thermal = ThermalSensor()
        import asyncio
        asyncio.run(thermal.start())
        assert thermal._is_running
        asyncio.run(thermal.stop())
        assert not thermal._is_running

    def test_callback_invoked(self):
        thermal = ThermalSensor()
        results = []
        thermal.set_frame_callback(lambda f: results.append(f))
        frame = thermal.capture_frame()
        assert len(results) == 1
        assert results[0] is frame
