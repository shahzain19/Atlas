#pragma once

#include "BaseDriver.h"

namespace atlas {

class GPIODriver : public BaseDriver {
public:
  std::string type() const override { return "gpio"; }
  std::vector<std::string> capabilities() const override { return {"read", "write"}; }

  virtual void setMode(int pin, GPIOMode mode) = 0;
  virtual void write(int pin, GPIOValue value) = 0;
  virtual GPIOValue read(int pin) = 0;
};

} // namespace atlas
