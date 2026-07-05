#include <gtest/gtest.h>
#include "atlas_hardware/HardwareManager.h"

using namespace atlas;

TEST(HardwareManagerTest, RegistersAndReadsSensor) {
  HardwareManager mgr;
  mgr.registerSensor("TestGPS", CapabilityType::SENSING,
    []() -> GPSReading { return GPSReading{45.0, -75.0, 100.0, 0, 0, 1.0, 0}; });

  auto reading = mgr.readSensor("TestGPS");
  EXPECT_NEAR(reading.lat, 45.0, 0.001);
  EXPECT_NEAR(reading.lng, -75.0, 0.001);
}

TEST(HardwareManagerTest, RegistersAndExecutesActuator) {
  HardwareManager mgr;
  bool executed = false;

  mgr.registerActuator("TestMotor", CapabilityType::MOTION,
    [&](const std::string& cmd, const std::unordered_map<std::string, double>& params) {
      executed = true;
      EXPECT_EQ(cmd, "MOVE_TO");
    });

  mgr.executeCommand("TestMotor", "MOVE_TO", {{"x", 10.0}});
  EXPECT_TRUE(executed);
}

TEST(HardwareManagerTest, DispatchCapabilityCommand) {
  HardwareManager mgr;
  bool executed = false;

  mgr.registerActuator("Motor1", CapabilityType::MOTION,
    [&](const std::string& cmd, const std::unordered_map<std::string, double>&) {
      executed = true;
      EXPECT_EQ(cmd, "STOP");
    });

  mgr.dispatchCapabilityCommand(CapabilityType::MOTION, "STOP");
  EXPECT_TRUE(executed);
}

TEST(HardwareManagerTest, ThrowsOnMissingSensor) {
  HardwareManager mgr;
  EXPECT_THROW(mgr.readSensor("NoSuchSensor"), std::runtime_error);
}

TEST(HardwareManagerTest, ThrowsOnMissingActuator) {
  HardwareManager mgr;
  EXPECT_THROW(mgr.executeCommand("NoSuchActuator", "STOP"), std::runtime_error);
}

TEST(HardwareManagerTest, ThrowsOnNoCapabilityActuator) {
  HardwareManager mgr;
  EXPECT_THROW(mgr.dispatchCapabilityCommand(CapabilityType::IMAGING, "CAPTURE"),
               std::runtime_error);
}

TEST(HardwareManagerTest, GetActuatorsByType) {
  HardwareManager mgr;
  mgr.registerActuator("Motor1", CapabilityType::MOTION, [](auto, auto) {});
  mgr.registerActuator("Motor2", CapabilityType::MOTION, [](auto, auto) {});

  auto motors = mgr.getActuatorsByType(CapabilityType::MOTION);
  EXPECT_EQ(motors.size(), 2);

  auto sensors = mgr.getSensorsByType(CapabilityType::SENSING);
  EXPECT_TRUE(sensors.empty());
}
