#pragma once

#include "../Real/SerialPortDriver.h"
#include <unordered_map>

namespace atlas {

static const std::unordered_map<std::string, std::string> COMMAND_MAP = {
  {"MOVE_TO", "GOTO"},
  {"STOP", "STOP"},
  {"TAKEOFF", "TAKEOFF"},
  {"LAND", "LAND"},
  {"NAVIGATE_PATH", "PATH"},
};

class SerialMotorController : public SerialPortDriver {
public:
  SerialMotorController(std::string id = "motor-001", std::string name = "SerialMotor",
                        std::unique_ptr<SerialTransport> transport = std::make_unique<MemorySerialTransport>())
    : SerialPortDriver(std::move(id), std::move(name), std::move(transport)) {}

  void executeCommand(const std::string& command,
                      const std::unordered_map<std::string, double>& params = {}) {
    auto it = COMMAND_MAP.find(command);
    std::string opcode = (it != COMMAND_MAP.end()) ? it->second : command;

    // Build simple text protocol: "CMD opcode param1=val1 param2=val2\n"
    std::string payload = opcode;
    for (const auto& [k, v] : params) {
      payload += " " + k + "=" + std::to_string(v);
    }
    payload += "\n";
    std::vector<uint8_t> frame(payload.begin(), payload.end());
    send(frame);
  }
};

} // namespace atlas
