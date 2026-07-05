#pragma once

#include "BaseDriver.h"
#include <functional>

namespace atlas {

class CANDriver : public BaseDriver {
public:
  std::string type() const override { return "can"; }
  std::vector<std::string> capabilities() const override { return {"send", "receive"}; }

  virtual void connect(const std::string& bus, int baudRate) = 0;
  virtual void disconnect() = 0;
  virtual void sendFrame(const CANFrame& frame) = 0;
  virtual void setReceiveCallback(std::function<void(const CANFrame&)> cb) = 0;
};

} // namespace atlas
