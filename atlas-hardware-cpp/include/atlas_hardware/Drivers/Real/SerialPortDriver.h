#pragma once

#include "../../Interfaces/SerialDriver.h"
#include "../../Transport/SerialTransport.h"

namespace atlas {

class SerialPortDriver : public SerialDriver {
protected:
  HardwareStatus status_ = HardwareStatus::DISCONNECTED;

private:
  std::string id_;
  std::string name_;
  std::unique_ptr<SerialTransport> transport_;
  std::function<void(const std::vector<uint8_t>&)> receiveCallback_;
  std::string connectedPort_;

public:
  SerialPortDriver(std::string id, std::string name,
                   std::unique_ptr<SerialTransport> transport = std::make_unique<MemorySerialTransport>())
    : id_(std::move(id)), name_(std::move(name)), transport_(std::move(transport)) {
    transport_->onData([this](const std::vector<uint8_t>& data) {
      if (receiveCallback_) receiveCallback_(data);
    });
  }

  std::string id() const override { return id_; }
  std::string name() const override { return name_; }
  HardwareStatus status() const override { return status_; }

  void initialize() override {
    status_ = HardwareStatus::INITIALIZING;
    status_ = HardwareStatus::DISCONNECTED;
  }

  void shutdown() override {
    disconnect();
    status_ = HardwareStatus::DISCONNECTED;
  }

  void reset() override {
    shutdown();
    initialize();
  }

  HealthResult getHealth() override {
    HealthResult r;
    r.value = (status_ == HardwareStatus::CONNECTED) ? 1.0 : 0.0;
    r.details["port"] = connectedPort_.empty() ? "null" : connectedPort_;
    r.details["open"] = transport_->isOpen();
    return r;
  }

  void connect(const std::string& port, int baudRate,
               const std::string& parity = "none") override {
    status_ = HardwareStatus::INITIALIZING;
    SerialTransportOptions opts;
    opts.parity = parity;
    transport_->open(port, baudRate, opts);
    connectedPort_ = port;
    status_ = HardwareStatus::CONNECTED;
    (void)baudRate;
  }

  void disconnect() override {
    if (transport_->isOpen()) transport_->close();
    connectedPort_.clear();
    status_ = HardwareStatus::DISCONNECTED;
  }

  void send(const std::vector<uint8_t>& data) override {
    if (status_ != HardwareStatus::CONNECTED)
      throw std::runtime_error("Serial driver " + id_ + " is not connected");
    transport_->write(data);
  }

  void setReceiveCallback(std::function<void(const std::vector<uint8_t>&)> cb) override {
    receiveCallback_ = std::move(cb);
  }

  SerialTransport& getTransport() { return *transport_; }
};

} // namespace atlas
