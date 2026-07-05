#include <gtest/gtest.h>
#include "atlas_hardware/Drivers/Real/CANBusDriver.h"

using namespace atlas;

TEST(CANBusDriverTest, ConnectsAndDisconnects) {
  auto transport = std::make_unique<MemoryCANTransport>();
  auto* rawTransport = transport.get();
  auto driver = CANBusDriver("can-1", "TestCAN", std::move(transport));

  driver.initialize();
  driver.connect("vcan0", 500000);
  EXPECT_EQ(driver.status(), HardwareStatus::CONNECTED);

  driver.disconnect();
  EXPECT_EQ(driver.status(), HardwareStatus::DISCONNECTED);
}

TEST(CANBusDriverTest, SendsCANFrames) {
  auto transport = std::make_unique<MemoryCANTransport>();
  auto* rawTransport = transport.get();
  auto driver = CANBusDriver("can-1", "TestCAN", std::move(transport));

  driver.initialize();
  driver.connect("vcan0", 500000);

  CANFrame frame;
  frame.id = 0x123;
  frame.data = {1, 2, 3, 4};
  frame.timestamp = 1000;
  driver.sendFrame(frame);

  auto sent = rawTransport->getSentFrames();
  ASSERT_EQ(sent.size(), 1);
  EXPECT_EQ(sent[0].id, 0x123);
  EXPECT_EQ(sent[0].data.size(), 4);
  EXPECT_EQ(sent[0].data[0], 1);
  EXPECT_EQ(sent[0].data[3], 4);

  driver.disconnect();
}

TEST(CANBusDriverTest, ReceivesCANFrames) {
  auto transport = std::make_unique<MemoryCANTransport>();
  auto* rawTransport = transport.get();
  auto driver = CANBusDriver("can-1", "TestCAN", std::move(transport));

  driver.initialize();
  driver.connect("vcan0", 500000);

  std::vector<CANFrame> received;
  driver.setReceiveCallback([&](const CANFrame& frame) {
    received.push_back(frame);
  });

  CANFrame incoming;
  incoming.id = 0x456;
  incoming.data = {9, 8, 7};
  incoming.timestamp = 2000;
  rawTransport->receive(incoming);

  ASSERT_EQ(received.size(), 1);
  EXPECT_EQ(received[0].id, 0x456);
  EXPECT_EQ(received[0].data[0], 9);

  driver.disconnect();
}

TEST(CANBusDriverTest, FailsOnSendWhenNotConnected) {
  auto driver = CANBusDriver("can-1", "TestCAN");
  driver.initialize();
  CANFrame frame;
  frame.id = 0x1;
  EXPECT_THROW(driver.sendFrame(frame), std::runtime_error);
}

TEST(CANBusDriverTest, Reset) {
  auto driver = CANBusDriver("can-1", "TestCAN");
  driver.initialize();
  driver.connect("vcan0", 500000);
  EXPECT_EQ(driver.status(), HardwareStatus::CONNECTED);

  driver.reset();
  EXPECT_EQ(driver.status(), HardwareStatus::DISCONNECTED);
}
