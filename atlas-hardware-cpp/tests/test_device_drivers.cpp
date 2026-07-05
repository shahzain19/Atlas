#include <gtest/gtest.h>
#include "atlas_hardware/Drivers/Device/NMEAGPSSensor.h"
#include "atlas_hardware/Drivers/Device/SerialMotorController.h"

using namespace atlas;

TEST(NMEAGPSSensorTest, ParsesNMEAAndReturnsFix) {
  auto gps = NMEAGPSSensor();
  gps.ingestNMEA("$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47\n");

  ASSERT_TRUE(gps.hasFix());
  auto fix = gps.readFix();
  EXPECT_NEAR(fix.lat, 48.1173, 0.001);
  EXPECT_NEAR(fix.lng, 11.5167, 0.001);
  EXPECT_NEAR(fix.alt, 545.4, 0.1);
}

TEST(NMEAGPSSensorTest, ThrowsWhenNoFix) {
  auto gps = NMEAGPSSensor();
  EXPECT_FALSE(gps.hasFix());
  EXPECT_THROW(gps.readFix(), std::runtime_error);
}

TEST(NMEAGPSSensorTest, TracksLatestFix) {
  auto gps = NMEAGPSSensor();
  gps.ingestNMEA("$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47\n");
  auto fix1 = gps.readFix();
  EXPECT_NEAR(fix1.lat, 48.1173, 0.001);

  // Second fix with different coordinates
  gps.ingestNMEA("$GPGGA,123520,4907.038,N,01231.000,E,1,06,1.2,100.0,M,,,*48\n");
  auto fix2 = gps.readFix();
  EXPECT_NEAR(fix2.lat, 49.1173, 0.001);
  EXPECT_NEAR(fix2.lng, 12.5167, 0.001);
}

TEST(NMEAGPSSensorTest, HealthAfterFix) {
  auto gps = NMEAGPSSensor();

  // No fix before ingest
  auto health = gps.getHealth();
  EXPECT_EQ(health.value, 0.0);

  // Ingest fix and re-initialize to connect
  gps.ingestNMEA("$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47\n");
  gps.initialize();
  health = gps.getHealth();
  EXPECT_EQ(health.value, 1.0);
}

TEST(SerialMotorControllerTest, SendsCommands) {
  auto transport = std::make_unique<MemorySerialTransport>();
  auto* rawTransport = transport.get();
  auto motor = SerialMotorController("motor-001", "SerialMotor", std::move(transport));

  motor.initialize();
  motor.connect("memory://motor", 115200);

  motor.executeCommand("MOVE_TO", {{"x", 10.0}, {"y", 20.0}});

  auto written = rawTransport->getWritten();
  ASSERT_EQ(written.size(), 1);
  std::string sent(written[0].begin(), written[0].end());
  EXPECT_TRUE(sent.find("GOTO") != std::string::npos);
  EXPECT_TRUE(sent.find("x=10") != std::string::npos);

  motor.disconnect();
}

TEST(SerialMotorControllerTest, MapsCommands) {
  auto transport = std::make_unique<MemorySerialTransport>();
  auto* rawTransport = transport.get();
  auto motor = SerialMotorController("motor-002", "SerialMotor2", std::move(transport));

  motor.initialize();
  motor.connect("memory://motor", 115200);

  motor.executeCommand("STOP", {});
  auto written = rawTransport->getWritten();
  ASSERT_EQ(written.size(), 1);
  std::string sent(written[0].begin(), written[0].end());
  EXPECT_EQ(sent, "STOP\n");

  motor.disconnect();
}
