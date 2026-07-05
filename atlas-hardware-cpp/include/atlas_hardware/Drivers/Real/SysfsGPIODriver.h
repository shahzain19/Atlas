#pragma once

#include "../../Interfaces/GPIODriver.h"
#include "../../Transport/GPIOBackend.h"

namespace atlas {

class SysfsGPIODriver : public GPIODriver {
protected:
  HardwareStatus status_ = HardwareStatus::DISCONNECTED;

private:
  std::string id_;
  std::string name_;
  std::unique_ptr<GPIOBackend> backend_;
  std::set<int> configuredPins_;

public:

public:
  SysfsGPIODriver(std::string id, std::string name,
                  std::unique_ptr<GPIOBackend> backend = std::make_unique<MemoryGPIOBackend>())
    : id_(std::move(id)), name_(std::move(name)), backend_(std::move(backend)) {}

  std::string id() const override { return id_; }
  std::string name() const override { return name_; }
  HardwareStatus status() const override { return status_; }

  void initialize() override {
    status_ = HardwareStatus::INITIALIZING;
    status_ = HardwareStatus::CONNECTED;
  }

  void shutdown() override {
    for (int pin : configuredPins_) {
      try { backend_->unexportPin(pin); } catch (...) {}
    }
    configuredPins_.clear();
    status_ = HardwareStatus::DISCONNECTED;
  }

  void reset() override {
    shutdown();
    initialize();
  }

  HealthResult getHealth() override {
    HealthResult r;
    r.value = (status_ == HardwareStatus::CONNECTED) ? 1.0 : 0.0;
    std::vector<int> pins(configuredPins_.begin(), configuredPins_.end());
    r.details["pins"] = std::move(pins);
    return r;
  }

  void setMode(int pin, GPIOMode mode) override {
    if (!configuredPins_.count(pin)) {
      backend_->exportPin(pin);
      configuredPins_.insert(pin);
    }
    backend_->setDirection(pin, mode);
  }

  void write(int pin, GPIOValue value) override {
    backend_->write(pin, value);
  }

  GPIOValue read(int pin) override {
    return backend_->read(pin);
  }

  GPIOBackend& getBackend() { return *backend_; }
};

} // namespace atlas
