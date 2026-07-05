#include <gtest/gtest.h>
#include "atlas_hardware/Drivers/Real/SysfsGPIODriver.h"
#include "atlas_hardware/Transport/GPIOBackend.h"

using namespace atlas;

TEST(SysfsGPIODriverTest, ReadsAndWritesPins) {
  auto backend = std::make_unique<MemoryGPIOBackend>();
  auto* rawBackend = backend.get();
  auto driver = SysfsGPIODriver("gpio-1", "TestGPIO", std::move(backend));

  driver.initialize();

  driver.setMode(17, GPIOMode::OUTPUT);
  driver.write(17, GPIOValue::HIGH);
  EXPECT_EQ(driver.read(17), GPIOValue::HIGH);

  driver.write(17, GPIOValue::LOW);
  EXPECT_EQ(driver.read(17), GPIOValue::LOW);

  driver.setMode(27, GPIOMode::OUTPUT);
  driver.write(27, GPIOValue::HIGH);
  EXPECT_EQ(driver.read(27), GPIOValue::HIGH);

  driver.shutdown();
}

TEST(SysfsGPIODriverTest, PinRemembersDirection) {
  auto driver = SysfsGPIODriver("gpio-2", "TestGPIO2");
  driver.initialize();
  driver.setMode(4, GPIOMode::OUTPUT);
  driver.write(4, GPIOValue::HIGH);
  EXPECT_EQ(driver.read(4), GPIOValue::HIGH);
  driver.shutdown();
}

TEST(SysfsGPIODriverTest, ShutdownCleansUp) {
  auto backend = std::make_unique<MemoryGPIOBackend>();
  auto* rawBackend = backend.get();
  auto driver = SysfsGPIODriver("gpio-3", "TestGPIO3", std::move(backend));

  driver.initialize();
  driver.setMode(22, GPIOMode::OUTPUT);
  driver.write(22, GPIOValue::HIGH);

  driver.shutdown();

  // After shutdown, reading should throw
  EXPECT_THROW(rawBackend->read(22), std::runtime_error);
}

TEST(SysfsGPIODriverTest, HealthReport) {
  auto driver = SysfsGPIODriver("gpio-4", "TestGPIO4");
  auto health = driver.getHealth();
  EXPECT_EQ(health.value, 0.0);

  driver.initialize();
  health = driver.getHealth();
  EXPECT_EQ(health.value, 1.0);
}

TEST(GPIOBackendTest, MemoryBackend) {
  MemoryGPIOBackend backend;
  backend.exportPin(18);
  backend.setDirection(18, GPIOMode::OUTPUT);
  backend.write(18, GPIOValue::HIGH);
  EXPECT_EQ(backend.read(18), GPIOValue::HIGH);

  backend.write(18, GPIOValue::LOW);
  EXPECT_EQ(backend.read(18), GPIOValue::LOW);
}

TEST(GPIOBackendTest, WriteToInputPinFails) {
  MemoryGPIOBackend backend;
  backend.exportPin(18);
  backend.setDirection(18, GPIOMode::INPUT);
  EXPECT_THROW(backend.write(18, GPIOValue::HIGH), std::runtime_error);
}

TEST(GPIOBackendTest, ReadUnexportedPinFails) {
  MemoryGPIOBackend backend;
  EXPECT_THROW(backend.read(99), std::runtime_error);
}
