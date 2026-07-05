#pragma once

#include "../../Interfaces/CANDriver.h"
#include "../../Transport/CANTransport.h"

namespace atlas {

class CANBusDriver : public CANDriver {
protected:
  HardwareStatus status_ = HardwareStatus::DISCONNECTED;

private:
  std::string id_;
  std::string name_;
  std::unique_ptr<CANTransport> transport_;
  std::function<void(const CANFrame&)> receiveCallback_;
  std::string connectedBus_;

public:
  CANBusDriver(std::string id, std::string name,
               std::unique_ptr<CANTransport> transport = std::make_unique<MemoryCANTransport>())
    : id_(std::move(id)), name_(std::move(name)), transport_(std::move(transport)) {
    transport_->onFrame([this](const CANFrame& frame) {
      if (receiveCallback_) receiveCallback_(frame);
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
    r.details["bus"] = connectedBus_.empty() ? "null" : connectedBus_;
    r.details["open"] = transport_->isOpen();
    return r;
  }

  void connect(const std::string& bus, int baudRate) override {
    status_ = HardwareStatus::INITIALIZING;
    transport_->open(bus, baudRate);
    connectedBus_ = bus;
    status_ = HardwareStatus::CONNECTED;
    (void)baudRate;
  }

  void disconnect() override {
    if (transport_->isOpen()) transport_->close();
    connectedBus_.clear();
    status_ = HardwareStatus::DISCONNECTED;
  }

  void sendFrame(const CANFrame& frame) override {
    if (status_ != HardwareStatus::CONNECTED)
      throw std::runtime_error("CAN driver " + id_ + " is not connected");
    transport_->sendFrame(frame);
  }

  void setReceiveCallback(std::function<void(const CANFrame&)> cb) override {
    receiveCallback_ = std::move(cb);
  }

  CANTransport& getTransport() { return *transport_; }
};

} // namespace atlas
