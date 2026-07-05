#pragma once

#include "../../Types.h"
#include <iostream>

namespace atlas {

class MockMotor {
  std::vector<std::pair<std::string, std::unordered_map<std::string, double>>> commands_;
public:
  CapabilityType type = CapabilityType::MOTION;
  std::string name = "MockMotor";

  void execute(const std::string& command, const std::unordered_map<std::string, double>& params) {
    commands_.emplace_back(command, params);
  }

  const auto& getCommands() const { return commands_; }
  void clearCommands() { commands_.clear(); }
};

} // namespace atlas
