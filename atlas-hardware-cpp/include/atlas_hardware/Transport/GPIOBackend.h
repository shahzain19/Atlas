#pragma once

#include "../Types.h"
#include <unordered_map>
#include <set>

namespace atlas {

class GPIOBackend {
public:
  virtual ~GPIOBackend() = default;
  virtual void exportPin(int pin) = 0;
  virtual void unexportPin(int pin) = 0;
  virtual void setDirection(int pin, GPIOMode mode) = 0;
  virtual void write(int pin, GPIOValue value) = 0;
  virtual GPIOValue read(int pin) = 0;
};

class MemoryGPIOBackend : public GPIOBackend {
  std::set<int> exported_;
  std::unordered_map<int, GPIOMode> directions_;
  std::unordered_map<int, GPIOValue> values_;
public:
  void exportPin(int pin) override {
    exported_.insert(pin);
    if (!directions_.count(pin)) directions_[pin] = GPIOMode::INPUT;
    if (!values_.count(pin)) values_[pin] = GPIOValue::LOW;
  }
  void unexportPin(int pin) override {
    exported_.erase(pin);
    directions_.erase(pin);
    values_.erase(pin);
  }
  void setDirection(int pin, GPIOMode mode) override {
    if (!exported_.count(pin))
      throw std::runtime_error("GPIO pin " + std::to_string(pin) + " is not exported");
    directions_[pin] = mode;
  }
  void write(int pin, GPIOValue value) override {
    if (!exported_.count(pin))
      throw std::runtime_error("GPIO pin " + std::to_string(pin) + " is not exported");
    if (directions_[pin] != GPIOMode::OUTPUT)
      throw std::runtime_error("GPIO pin " + std::to_string(pin) + " is not configured as output");
    values_[pin] = value;
  }
  GPIOValue read(int pin) override {
    if (!exported_.count(pin))
      throw std::runtime_error("GPIO pin " + std::to_string(pin) + " is not exported");
    auto it = values_.find(pin);
    return it != values_.end() ? it->second : GPIOValue::LOW;
  }

  bool isExported(int pin) const { return exported_.count(pin) > 0; }
  GPIOMode getDirection(int pin) const {
    auto it = directions_.find(pin);
    return it != directions_.end() ? it->second : GPIOMode::INPUT;
  }
  GPIOValue getValue(int pin) const {
    auto it = values_.find(pin);
    return it != values_.end() ? it->second : GPIOValue::LOW;
  }
};

} // namespace atlas
