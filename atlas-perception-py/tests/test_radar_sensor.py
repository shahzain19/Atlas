import math

import pytest
from atlas_perception.radar.radar_sensor import RadarSensor


class TestRadarSensor:
    def test_capture_scan_structure(self):
        radar = RadarSensor()
        scan = radar.capture_scan()
        assert len(scan.points) == 100
        assert scan.timestamp > 0
        for pt in scan.points[:5]:
            assert hasattr(pt, "azimuth")
            assert hasattr(pt, "elevation")
            assert hasattr(pt, "range")
            assert hasattr(pt, "intensity")

    def test_capture_scan_deterministic(self):
        r1 = RadarSensor()
        r2 = RadarSensor()
        s1 = r1.capture_scan()
        s2 = r2.capture_scan()
        for p1, p2 in zip(s1.points, s2.points):
            assert p1.azimuth == p2.azimuth
            assert p1.elevation == pytest.approx(p2.elevation)
            assert p1.range == pytest.approx(p2.range)

    def test_azimuth_range(self):
        radar = RadarSensor()
        scan = radar.capture_scan()
        for pt in scan.points:
            assert 0 <= pt.azimuth <= 2 * math.pi

    def test_start_stop(self):
        radar = RadarSensor()
        import asyncio
        asyncio.run(radar.start())
        assert radar._is_running
        asyncio.run(radar.stop())
        assert not radar._is_running

    def test_callback_invoked(self):
        radar = RadarSensor()
        results = []
        radar.set_scan_callback(lambda s: results.append(s))
        scan = radar.capture_scan()
        assert len(results) == 1
        assert results[0] is scan
