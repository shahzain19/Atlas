#include <gtest/gtest.h>
#include "atlas_hardware/HAL/HardwareAbstractionLayer.h"
#include "atlas_hardware/Drivers/Device/NMEAGPSSensor.h"
#include "atlas_hardware/Bridge/HardwareBridge.h"

using namespace atlas;

TEST(HardwareBridgeTest, RegistersBundles) {
  auto hal = std::make_shared<HardwareAbstractionLayer>();
  auto bridge = HardwareBridge(hal);

  auto gps = std::make_shared<NMEAGPSSensor>("gps-test", "TestGPS");
  gps->ingestNMEA("$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47\n");

  DeviceBundle bundle;
  bundle.driver = gps;
  bundle.sensorRead = [gps]() { return gps->readFix(); };
  bridge.registerBundle(bundle);

  auto reading = bridge.readSensor("TestGPS");
  EXPECT_NEAR(reading.lat, 48.1173, 0.001);
  EXPECT_NEAR(reading.lng, 11.5167, 0.001);
}

TEST(HardwareBridgeTest, InitializeAndShutdown) {
  auto hal = std::make_shared<HardwareAbstractionLayer>();
  auto bridge = HardwareBridge(hal);
  auto driver = std::make_shared<NMEAGPSSensor>("gps-init", "InitGPS");

  DeviceBundle bundle;
  bundle.driver = driver;
  bridge.registerBundle(bundle);

  bridge.initializeAll();
  // Expect no crash/exception
}

TEST(HardwareBridgeTest, ActuatorCommand) {
  auto hal = std::make_shared<HardwareAbstractionLayer>();
  auto bridge = HardwareBridge(hal);

  bool executed = false;
  bridge.registerActuator("TestMotor",
    [&](const std::string& cmd, const std::unordered_map<std::string, double>& params) {
      executed = true;
      EXPECT_EQ(cmd, "MOVE_TO");
    });

  bridge.executeCommand("TestMotor", "MOVE_TO", {{"x", 100.0}});
  EXPECT_TRUE(executed);
}

TEST(HardwareBridgeTest, SensorNotFound) {
  auto hal = std::make_shared<HardwareAbstractionLayer>();
  auto bridge = HardwareBridge(hal);
  EXPECT_THROW(bridge.readSensor("nonexistent"), std::runtime_error);
}

TEST(HardwareBridgeTest, ActuatorNotFound) {
  auto hal = std::make_shared<HardwareAbstractionLayer>();
  auto bridge = HardwareBridge(hal);
  EXPECT_THROW(bridge.executeCommand("nonexistent", "STOP"), std::runtime_error);
}
