from atlas_perception.gps.gps_sensor import GPSSensor


class TestGPSSensor:
    def test_capture_data_structure(self):
        gps = GPSSensor()
        data = gps.capture_data()
        assert -90 <= data.latitude <= 90
        assert -180 <= data.longitude <= 180
        assert data.timestamp > 0

    def test_sf_bay_area(self):
        gps = GPSSensor()
        data = gps.capture_data()
        assert 37.77 <= data.latitude <= 37.78
        assert -122.43 <= data.longitude <= -122.41

    def test_has_altitude_accuracy(self):
        gps = GPSSensor()
        data = gps.capture_data()
        assert data.altitude is not None
        assert data.accuracy is not None

    def test_start_stop(self):
        gps = GPSSensor()
        import asyncio
        asyncio.run(gps.start())
        assert gps._is_running
        asyncio.run(gps.stop())
        assert not gps._is_running

    def test_callback_invoked(self):
        gps = GPSSensor()
        results = []
        gps.set_data_callback(lambda d: results.append(d))
        data = gps.capture_data()
        assert len(results) == 1
        assert results[0] is data

    def test_custom_data_provider(self):
        from atlas_perception.types import GPSData
        def provider():
            return GPSData(latitude=40.0, longitude=-74.0, timestamp=100.0, altitude=0.0)
        gps = GPSSensor(data_provider=provider)
        data = gps.capture_data()
        assert data.latitude == 40.0
        assert data.longitude == -74.0
        assert data.altitude == 0.0
