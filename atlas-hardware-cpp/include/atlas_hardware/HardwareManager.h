#pragma once

#include "Types.h"
#include <unordered_map>
#include <functional>
#include <iostream>

namespace atlas {

class HardwareManager {
public:
  void registerActuator(const std::string& name, CapabilityType type,
                        std::function<void(const std::string&, const std::unordered_map<std::string, double>&)> execFn) {
    actuatorsByName_[name] = execFn;
    actuatorsByType_[type].push_back(name);
  }

  void registerSensor(const std::string& name, CapabilityType type,
                      std::function<GPSReading()> readFn) {
    sensorsByName_[name] = readFn;
    sensorsByType_[type].push_back(name);
  }

  GPSReading readSensor(const std::string& name) {
    auto it = sensorsByName_.find(name);
    if (it == sensorsByName_.end())
      throw std::runtime_error("Sensor not found: " + name);
    return it->second();
  }

  void executeCommand(const std::string& name, const std::string& command,
                      const std::unordered_map<std::string, double>& params = {}) {
    auto it = actuatorsByName_.find(name);
    if (it == actuatorsByName_.end())
      throw std::runtime_error("Actuator not found: " + name);
    it->second(command, params);
  }

  void dispatchCapabilityCommand(CapabilityType type, const std::string& command,
                                  const std::unordered_map<std::string, double>& params = {}) {
    auto it = actuatorsByType_.find(type);
    if (it == actuatorsByType_.end() || it->second.empty())
      throw std::runtime_error("No actuators found for capability: " + capabilityTypeToString(type));
    executeCommand(it->second[0], command, params);
  }

  std::vector<std::string> getActuatorsByType(CapabilityType type) const {
    auto it = actuatorsByType_.find(type);
    return it != actuatorsByType_.end() ? it->second : std::vector<std::string>{};
  }

  std::vector<std::string> getSensorsByType(CapabilityType type) const {
    auto it = sensorsByType_.find(type);
    return it != sensorsByType_.end() ? it->second : std::vector<std::string>{};
  }

private:
  std::unordered_map<std::string, std::function<void(const std::string&, const std::unordered_map<std::string, double>&)>> actuatorsByName_;
  std::unordered_map<std::string, std::function<GPSReading()>> sensorsByName_;
  std::unordered_map<CapabilityType, std::vector<std::string>> actuatorsByType_;
  std::unordered_map<CapabilityType, std::vector<std::string>> sensorsByType_;
};

} // namespace atlas
