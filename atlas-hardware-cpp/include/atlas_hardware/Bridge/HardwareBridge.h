#pragma once

#include "../HAL/HardwareAbstractionLayer.h"
#include "../Types.h"
#include <functional>
#include <unordered_map>

namespace atlas {

struct DeviceBundle {
  std::shared_ptr<BaseDriver> driver;
  std::function<GPSReading()> sensorRead;
  std::function<void(const std::string&, const std::unordered_map<std::string, double>&)> actuatorExec;
};

class HardwareBridge {
  std::shared_ptr<HardwareAbstractionLayer> hal_;
  std::unordered_map<std::string, std::function<GPSReading()>> sensors_;
  std::unordered_map<std::string, std::function<void(const std::string&, const std::unordered_map<std::string, double>&)>> actuators_;

public:
  explicit HardwareBridge(std::shared_ptr<HardwareAbstractionLayer> hal)
    : hal_(std::move(hal)) {}

  void registerBundle(const DeviceBundle& bundle) {
    hal_->registerDriver(bundle.driver);
    if (bundle.sensorRead) sensors_[bundle.driver->name()] = bundle.sensorRead;
    if (bundle.actuatorExec) actuators_[bundle.driver->name()] = bundle.actuatorExec;
  }

  void registerDriver(std::shared_ptr<BaseDriver> driver) {
    hal_->registerDriver(std::move(driver));
  }

  void registerSensor(const std::string& name, std::function<GPSReading()> readFn) {
    sensors_[name] = std::move(readFn);
  }

  void registerActuator(const std::string& name,
                        std::function<void(const std::string&, const std::unordered_map<std::string, double>&)> execFn) {
    actuators_[name] = std::move(execFn);
  }

  GPSReading readSensor(const std::string& name) {
    auto it = sensors_.find(name);
    if (it == sensors_.end()) throw std::runtime_error("Sensor not found: " + name);
    return it->second();
  }

  void executeCommand(const std::string& name, const std::string& command,
                      const std::unordered_map<std::string, double>& params = {}) {
    auto it = actuators_.find(name);
    if (it == actuators_.end()) throw std::runtime_error("Actuator not found: " + name);
    it->second(command, params);
  }

  void initializeAll() { hal_->initializeAll(); }
  void shutdownAll() { hal_->shutdownAll(); }
  std::shared_ptr<HardwareAbstractionLayer> getHAL() const { return hal_; }
};

} // namespace atlas
