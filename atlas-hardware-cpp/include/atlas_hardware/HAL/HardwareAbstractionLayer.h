#pragma once

#include "../Interfaces/BaseDriver.h"
#include <unordered_map>
#include <memory>
#include <vector>

namespace atlas {

class HardwareAbstractionLayer {
  std::unordered_map<std::string, std::shared_ptr<BaseDriver>> drivers_;

public:
  void registerDriver(std::shared_ptr<BaseDriver> driver) {
    drivers_[driver->id()] = std::move(driver);
  }

  void unregisterDriver(const std::string& id) {
    drivers_.erase(id);
  }

  template<typename T = BaseDriver>
  std::shared_ptr<T> getDriver(const std::string& id) const {
    auto it = drivers_.find(id);
    if (it != drivers_.end()) return std::dynamic_pointer_cast<T>(it->second);
    return nullptr;
  }

  std::vector<std::shared_ptr<BaseDriver>> getDriversByType(const std::string& type) const {
    std::vector<std::shared_ptr<BaseDriver>> result;
    for (const auto& [id, d] : drivers_) {
      if (d->type() == type) result.push_back(d);
    }
    return result;
  }

  std::vector<std::shared_ptr<BaseDriver>> getAllDrivers() const {
    std::vector<std::shared_ptr<BaseDriver>> result;
    for (const auto& [id, d] : drivers_) result.push_back(d);
    return result;
  }

  std::vector<HardwareInfo> getAllHardwareInfo() const {
    std::vector<HardwareInfo> infos;
    for (const auto& [id, d] : drivers_) {
      infos.push_back({d->id(), d->name(), d->type(), d->status(), d->capabilities()});
    }
    return infos;
  }

  void initializeAll() {
    for (auto& [id, d] : drivers_) d->initialize();
  }

  void shutdownAll() {
    for (auto& [id, d] : drivers_) d->shutdown();
  }
};

} // namespace atlas
