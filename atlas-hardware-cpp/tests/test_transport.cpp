#include <gtest/gtest.h>
#include "atlas_hardware/Transport/SerialTransport.h"
#include "atlas_hardware/Transport/CANTransport.h"
#include "atlas_hardware/Transport/GPIOBackend.h"

using namespace atlas;

// ---- Serial Transport ----
TEST(MemorySerialTransportTest, OpenClose) {
  MemorySerialTransport t;
  EXPECT_FALSE(t.isOpen());
  t.open("mem://1", 9600);
  EXPECT_TRUE(t.isOpen());
  t.close();
  EXPECT_FALSE(t.isOpen());
}

TEST(MemorySerialTransportTest, WriteAndRetrieve) {
  MemorySerialTransport t;
  t.open("mem://1", 9600);
  t.write({0x01, 0x02, 0x03});
  auto written = t.getWritten();
  ASSERT_EQ(written.size(), 1);
  EXPECT_EQ(written[0][0], 0x01);
  EXPECT_EQ(written[0][2], 0x03);
}

TEST(MemorySerialTransportTest, ReceiveCallback) {
  MemorySerialTransport t;
  t.open("mem://1", 9600);
  std::vector<uint8_t> received;
  t.onData([&](const std::vector<uint8_t>& data) { received = data; });
  t.receive({0xAA, 0xBB});
  ASSERT_EQ(received.size(), 2);
  EXPECT_EQ(received[0], 0xAA);
}

TEST(MemorySerialTransportTest, WriteFailsWhenClosed) {
  MemorySerialTransport t;
  EXPECT_THROW(t.write({0x00}), std::runtime_error);
}

TEST(MemorySerialTransportTest, ClearWritten) {
  MemorySerialTransport t;
  t.open("mem://1", 9600);
  t.write({0x01});
  t.clearWritten();
  EXPECT_TRUE(t.getWritten().empty());
}

// ---- CAN Transport ----
TEST(MemoryCANTransportTest, OpenClose) {
  MemoryCANTransport t;
  EXPECT_FALSE(t.isOpen());
  t.open("vcan0", 500000);
  EXPECT_TRUE(t.isOpen());
  t.close();
  EXPECT_FALSE(t.isOpen());
}

TEST(MemoryCANTransportTest, SendFrame) {
  MemoryCANTransport t;
  t.open("vcan0", 500000);

  CANFrame f;
  f.id = 0x123;
  f.data = {1, 2, 3};
  t.sendFrame(f);

  auto sent = t.getSentFrames();
  ASSERT_EQ(sent.size(), 1);
  EXPECT_EQ(sent[0].id, 0x123);
}

TEST(MemoryCANTransportTest, ReceiveFrame) {
  MemoryCANTransport t;
  t.open("vcan0", 500000);

  std::vector<CANFrame> received;
  t.onFrame([&](const CANFrame& frame) { received.push_back(frame); });

  CANFrame f;
  f.id = 0x456;
  f.data = {9, 8, 7};
  t.receive(f);

  ASSERT_EQ(received.size(), 1);
  EXPECT_EQ(received[0].id, 0x456);
}

// ---- GPIO Backend ----
TEST(MemoryGPIOBackendTest, ExportAndUnexport) {
  MemoryGPIOBackend b;
  b.exportPin(17);
  EXPECT_TRUE(b.isExported(17));
  b.unexportPin(17);
  EXPECT_FALSE(b.isExported(17));
}

TEST(MemoryGPIOBackendTest, SetDirection) {
  MemoryGPIOBackend b;
  b.exportPin(17);
  b.setDirection(17, GPIOMode::OUTPUT);
  EXPECT_EQ(b.getDirection(17), GPIOMode::OUTPUT);
}

TEST(MemoryGPIOBackendTest, WriteThenRead) {
  MemoryGPIOBackend b;
  b.exportPin(17);
  b.setDirection(17, GPIOMode::OUTPUT);
  b.write(17, GPIOValue::HIGH);
  EXPECT_EQ(b.getValue(17), GPIOValue::HIGH);
  EXPECT_EQ(b.read(17), GPIOValue::HIGH);
}
