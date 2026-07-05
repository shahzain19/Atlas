#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <functional>
#include <memory>
#include <any>
#include <stdexcept>
#include <chrono>
#include <cstdint>

namespace atlas {

enum class CapabilityType {
  MOTION,
  SENSING,
  COMMUNICATION,
  COMPUTATION,
  IMAGING,
  STORAGE,
  MANIPULATION,
  NAVIGATION
};

inline std::string capabilityTypeToString(CapabilityType t) {
  static const char* names[] = {
    "motion", "sensing", "communication", "computation",
    "imaging", "storage", "manipulation", "navigation"
  };
  int i = static_cast<int>(t);
  return (i >= 0 && i < 8) ? names[i] : "unknown";
}

struct HardwareCapability {
  CapabilityType type;
  std::string name;
  std::unordered_map<std::string, std::any> specs;
  std::string id;
  std::string provider;
  bool enabled = true;
  std::string health = "healthy";
};

enum class HardwareStatus {
  CONNECTED = 0,
  DISCONNECTED,
  ERROR,
  INITIALIZING
};

inline std::string hardwareStatusToString(HardwareStatus s) {
  switch (s) {
    case HardwareStatus::CONNECTED:    return "connected";
    case HardwareStatus::DISCONNECTED: return "disconnected";
    case HardwareStatus::ERROR:        return "error";
    case HardwareStatus::INITIALIZING: return "initializing";
  }
  return "unknown";
}

struct HardwareInfo {
  std::string id;
  std::string name;
  std::string type;
  HardwareStatus status;
  std::vector<std::string> capabilities;
};

struct HealthResult {
  double value = 0.0;
  std::unordered_map<std::string, std::any> details;
};

struct CANFrame {
  uint32_t id = 0;
  std::vector<uint8_t> data;
  int64_t timestamp = 0;
  bool extended = false;
};

enum class GPIOMode { INPUT, OUTPUT };
enum class GPIOValue { LOW = 0, HIGH = 1 };

struct NMEAFix {
  double latitude = 0.0;
  double longitude = 0.0;
  double altitude = 0.0;
  bool hasAltitude = false;
  double speedKnots = 0.0;
  bool hasSpeed = false;
  double course = 0.0;
  bool hasCourse = false;
  int fixQuality = 0;
  int satellites = 0;
  double hdop = 0.0;
  bool hasHdop = false;
  int64_t timestamp = 0;
};

struct GPSReading {
  double lat = 0.0;
  double lng = 0.0;
  double alt = 0.0;
  double speed = 0.0;
  double heading = 0.0;
  double accuracy = 0.0;
  int64_t timestamp = 0;
};

struct Pose {
  double x = 0.0, y = 0.0, z = 0.0;
};

struct MotionCommand {
  std::string command;
  std::unordered_map<std::string, double> params;
};

} // namespace atlas
