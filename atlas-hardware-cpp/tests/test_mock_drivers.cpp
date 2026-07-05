#include <gtest/gtest.h>
#include "atlas_hardware/Drivers/Mock/MockMotor.h"
#include "atlas_hardware/Drivers/Mock/MockGPS.h"
#include "atlas_hardware/Drivers/Mock/MockCamera.h"

using namespace atlas;

TEST(MockMotorTest, ExecutesCommand) {
  MockMotor motor;
  motor.execute("MOVE_TO", {{"x", 10.0}, {"y", 20.0}});

  ASSERT_EQ(motor.getCommands().size(), 1);
  EXPECT_EQ(motor.getCommands()[0].first, "MOVE_TO");
  EXPECT_EQ(motor.getCommands()[0].second.at("x"), 10.0);
  EXPECT_EQ(motor.getCommands()[0].second.at("y"), 20.0);
}

TEST(MockMotorTest, TracksMultipleCommands) {
  MockMotor motor;
  motor.execute("STOP", {});
  motor.execute("MOVE_TO", {{"x", 5.0}});
  ASSERT_EQ(motor.getCommands().size(), 2);
}

TEST(MockMotorTest, ClearsCommands) {
  MockMotor motor;
  motor.execute("MOVE_TO", {{"x", 1.0}});
  motor.clearCommands();
  EXPECT_TRUE(motor.getCommands().empty());
}

TEST(MockGPSTest, ReturnsReading) {
  MockGPS gps;
  auto reading = gps.read();
  EXPECT_NEAR(reading.lat, 45.4215, 0.01);
  EXPECT_NEAR(reading.lng, -75.6972, 0.01);
  EXPECT_EQ(reading.alt, 100.0);
}

TEST(MockGPSTest, ReturnsDifferentReadingsEachCall) {
  MockGPS gps;
  auto r1 = gps.read();
  auto r2 = gps.read();
  EXPECT_NE(r1.lat, r2.lat);
  EXPECT_NE(r1.lng, r2.lng);
}

TEST(MockCameraTest, ExecutesCommand) {
  MockCamera camera;
  camera.execute("CAPTURE", {{"resolution", 4.0}});
  ASSERT_EQ(camera.getCommands().size(), 1);
  EXPECT_EQ(camera.getCommands()[0].first, "CAPTURE");
}
