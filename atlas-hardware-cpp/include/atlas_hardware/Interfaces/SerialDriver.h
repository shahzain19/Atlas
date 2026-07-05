#pragma once

#include "BaseDriver.h"
#include <functional>

namespace atlas {

class SerialDriver : public BaseDriver {
public:
  std::string type() const override { return "serial"; }
  std::vector<std::string> capabilities() const override { return {"send", "receive"}; }

  virtual void connect(const std::string& port, int baudRate,
                       const std::string& parity = "none") = 0;
  virtual void disconnect() = 0;
  virtual void send(const std::vector<uint8_t>& data) = 0;
  virtual void setReceiveCallback(std::function<void(const std::vector<uint8_t>&)> cb) = 0;
};

} // namespace atlas
