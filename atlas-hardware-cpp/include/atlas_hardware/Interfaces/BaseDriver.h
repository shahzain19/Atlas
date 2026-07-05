#pragma once

#include "../Types.h"

namespace atlas {

class BaseDriver {
public:
  virtual ~BaseDriver() = default;

  virtual std::string id() const = 0;
  virtual std::string name() const = 0;
  virtual std::string type() const = 0;
  virtual HardwareStatus status() const = 0;
  virtual std::vector<std::string> capabilities() const = 0;

  virtual void initialize() = 0;
  virtual void shutdown() = 0;
  virtual void reset() = 0;
  virtual HealthResult getHealth() = 0;
};

} // namespace atlas
