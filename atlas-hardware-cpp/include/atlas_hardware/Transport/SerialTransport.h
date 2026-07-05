#pragma once

#include "../Types.h"
#include <functional>

namespace atlas {

struct SerialTransportOptions {
  std::string parity = "none";
};

class SerialTransport {
public:
  virtual ~SerialTransport() = default;
  virtual void open(const std::string& port, int baudRate,
                    const SerialTransportOptions& opts = {}) = 0;
  virtual void close() = 0;
  virtual void write(const std::vector<uint8_t>& data) = 0;
  virtual void onData(std::function<void(const std::vector<uint8_t>&)> cb) = 0;
  virtual bool isOpen() const = 0;
};

class MemorySerialTransport : public SerialTransport {
  bool open_ = false;
  std::function<void(const std::vector<uint8_t>&)> callback_;
  std::vector<std::vector<uint8_t>> written_;
public:
  void open(const std::string&, int, const SerialTransportOptions& = {}) override {
    open_ = true;
  }
  void close() override { open_ = false; }
  void write(const std::vector<uint8_t>& data) override {
    if (!open_) throw std::runtime_error("Serial transport is not open");
    written_.push_back(data);
  }
  void onData(std::function<void(const std::vector<uint8_t>&)> cb) override {
    callback_ = std::move(cb);
  }
  bool isOpen() const override { return open_; }

  void receive(const std::vector<uint8_t>& data) {
    if (callback_) callback_(data);
  }
  std::vector<std::vector<uint8_t>> getWritten() const { return written_; }
  void clearWritten() { written_.clear(); }
};

} // namespace atlas
