#pragma once

#include "../Types.h"
#include <functional>

namespace atlas {

class CANTransport {
public:
  virtual ~CANTransport() = default;
  virtual void open(const std::string& bus, int baudRate) = 0;
  virtual void close() = 0;
  virtual void sendFrame(const CANFrame& frame) = 0;
  virtual void onFrame(std::function<void(const CANFrame&)> cb) = 0;
  virtual bool isOpen() const = 0;
};

class MemoryCANTransport : public CANTransport {
  bool open_ = false;
  std::function<void(const CANFrame&)> callback_;
  std::vector<CANFrame> sent_;
public:
  void open(const std::string&, int) override { open_ = true; }
  void close() override { open_ = false; }
  void sendFrame(const CANFrame& frame) override {
    if (!open_) throw std::runtime_error("CAN transport is not open");
    sent_.push_back(frame);
  }
  void onFrame(std::function<void(const CANFrame&)> cb) override {
    callback_ = std::move(cb);
  }
  bool isOpen() const override { return open_; }

  void receive(const CANFrame& frame) {
    if (callback_) callback_(frame);
  }
  std::vector<CANFrame> getSentFrames() const { return sent_; }
};

} // namespace atlas
