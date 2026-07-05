#include <gtest/gtest.h>
#include "atlas_hardware/Drivers/Real/SerialPortDriver.h"

using namespace atlas;

TEST(SerialPortDriverTest, ConnectsAndDisconnects) {
  auto transport = std::make_unique<MemorySerialTransport>();
  auto* rawTransport = transport.get();
  auto driver = SerialPortDriver("serial-1", "TestSerial", std::move(transport));

  driver.initialize();
  driver.connect("memory://0", 115200);
  EXPECT_EQ(driver.status(), HardwareStatus::CONNECTED);

  driver.disconnect();
  EXPECT_EQ(driver.status(), HardwareStatus::DISCONNECTED);
}

TEST(SerialPortDriverTest, SendsData) {
  auto transport = std::make_unique<MemorySerialTransport>();
  auto* rawTransport = transport.get();
  auto driver = SerialPortDriver("serial-1", "TestSerial", std::move(transport));

  driver.initialize();
  driver.connect("memory://0", 115200);

  std::vector<uint8_t> payload = {'A', 'T', '+', 'T', 'E', 'S', 'T', '\n'};
  driver.send(payload);

  auto written = rawTransport->getWritten();
  ASSERT_EQ(written.size(), 1);
  EXPECT_EQ(written[0].size(), 8);
  EXPECT_EQ(written[0][0], 'A');

  driver.disconnect();
}

TEST(SerialPortDriverTest, ReceivesData) {
  auto transport = std::make_unique<MemorySerialTransport>();
  auto* rawTransport = transport.get();
  auto driver = SerialPortDriver("serial-1", "TestSerial", std::move(transport));

  driver.initialize();
  driver.connect("memory://0", 115200);

  std::vector<std::vector<uint8_t>> received;
  driver.setReceiveCallback([&](const std::vector<uint8_t>& data) {
    received.push_back(data);
  });

  std::vector<uint8_t> response = {'O', 'K', '\n'};
  rawTransport->receive(response);
  ASSERT_EQ(received.size(), 1);
  EXPECT_EQ(received[0].size(), 3);

  driver.disconnect();
}

TEST(SerialPortDriverTest, FailsOnSendWhenNotConnected) {
  auto driver = SerialPortDriver("serial-1", "TestSerial");
  driver.initialize();
  EXPECT_THROW(driver.send({0x01}), std::runtime_error);
}

TEST(SerialPortDriverTest, GetHealth) {
  auto driver = SerialPortDriver("serial-1", "TestSerial");
  driver.initialize();

  auto health = driver.getHealth();
  EXPECT_EQ(health.value, 0.0);

  driver.connect("memory://0", 9600);
  health = driver.getHealth();
  EXPECT_EQ(health.value, 1.0);

  driver.disconnect();
}
