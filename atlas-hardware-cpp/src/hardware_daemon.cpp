#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <memory>
#include <unordered_map>
#include <functional>

#include "atlas_hardware/Drivers/Device/NMEAGPSSensor.h"
#include "atlas_hardware/Drivers/Device/SerialMotorController.h"
#include "atlas_hardware/Drivers/Device/V4L2CameraDriver.h"
#include "atlas_hardware/Drivers/Device/SharedMemoryManager.h"
#include "atlas_hardware/HAL/HardwareAbstractionLayer.h"
#include "atlas_hardware/Bridge/HardwareBridge.h"

using namespace atlas;

// ── Minimal JSON helpers ──────────────────────────────────────────

static std::string jsonStr(const std::string& s) {
  std::string out = "\"";
  for (char c : s) {
    if (c == '"') out += "\\\"";
    else if (c == '\\') out += "\\\\";
    else if (c == '\n') out += "\\n";
    else if (c == '\r') out += "\\r";
    else if (c == '\t') out += "\\t";
    else out += c;
  }
  return out + "\"";
}

template<typename T> static std::string jsonVal(T v) { return std::to_string(v); }
static std::string jsonVal(double v) { auto s = std::to_string(v); return s; }
static std::string jsonVal(bool v) { return v ? "true" : "false"; }
static std::string jsonVal(const std::string& v) { return jsonStr(v); }

static std::string jsonPair(const std::string& key, const std::string& val) {
  return jsonStr(key) + ":" + val;
}

static std::string jsonObject(const std::vector<std::string>& pairs) {
  std::string out = "{";
  for (size_t i = 0; i < pairs.size(); ++i) {
    if (i > 0) out += ",";
    out += pairs[i];
  }
  return out + "}";
}

static std::string jsonObject(std::initializer_list<std::string> list) {
  return jsonObject(std::vector<std::string>(list));
}

static std::string jsonArray(const std::vector<std::string>& items) {
  std::string out = "[";
  for (size_t i = 0; i < items.size(); ++i) {
    if (i > 0) out += ",";
    out += items[i];
  }
  return out + "]";
}

static std::string okResponse(const std::string& data) {
  return jsonObject({jsonPair("ok", "true"), jsonPair("data", data)}) + "\n";
}

static std::string errorResponse(const std::string& msg) {
  return jsonObject({jsonPair("ok", "false"), jsonPair("error", jsonStr(msg))}) + "\n";
}

static std::string okBool(bool v) {
  return okResponse(v ? "true" : "false");
}

// ── Simple command parser ─────────────────────────────────────────

static std::string extractStr(const std::string& json, const std::string& key) {
  auto pos = json.find(jsonStr(key));
  if (pos == std::string::npos) return "";
  pos = json.find(':', pos);
  if (pos == std::string::npos) return "";
  ++pos;
  while (pos < json.size() && (json[pos] == ' ' || json[pos] == '\t')) ++pos;
  if (pos < json.size() && json[pos] == '"') {
    std::string val;
    ++pos;
    while (pos < json.size() && json[pos] != '"') {
      if (json[pos] == '\\') { ++pos; if (pos < json.size()) val += json[pos]; }
      else val += json[pos];
      ++pos;
    }
    return val;
  }
  return "";
}

static std::string extractNumStr(const std::string& json, const std::string& key) {
  auto pos = json.find(jsonStr(key));
  if (pos == std::string::npos) return "";
  pos = json.find(':', pos);
  if (pos == std::string::npos) return "";
  ++pos;
  while (pos < json.size() && (json[pos] == ' ' || json[pos] == '\t')) ++pos;
  std::string val;
  while (pos < json.size() && json[pos] != ',' && json[pos] != '}' && json[pos] != '\n') {
    val += json[pos];
    ++pos;
  }
  return val;
}

static std::string extractSeq(const std::string& json) {
  return extractNumStr(json, "_seq");
}

static std::string nextResponse(const std::string& data, const std::string& seq) {
  if (seq.empty()) return data;
  auto insertPos = data.find('{');
  if (insertPos == 0) {
    return "{" + jsonPair("_seq", seq) + "," + data.substr(1);
  }
  return data;
}

// ── Daemon class ──────────────────────────────────────────────────

class HardwareDaemon {
  HardwareAbstractionLayer hal_;
  std::shared_ptr<NMEAGPSSensor> gps_;
  std::shared_ptr<SerialMotorController> motor_;
  std::shared_ptr<V4L2CameraDriver> camera_;
  std::unique_ptr<SharedMemoryManager> cameraShm_;
  size_t cameraFrameSize_ = 0;

public:
  HardwareDaemon() {
    gps_ = std::make_shared<NMEAGPSSensor>();
    motor_ = std::make_shared<SerialMotorController>();
    camera_ = std::make_shared<V4L2CameraDriver>();

    // Set up shared memory for camera frames (640x480 RGB = 921600 bytes)
    cameraFrameSize_ = static_cast<size_t>(camera_->width()) *
                       camera_->height() * 3;
    try {
      cameraShm_ = std::make_unique<SharedMemoryManager>("/atlas_camera_frame");
      cameraShm_->create(cameraFrameSize_);
      camera_->setSharedMemory(cameraShm_.get());
    } catch (const std::exception& e) {
      // Shared memory is optional — frames will be metadata-only
      std::cerr << "Camera SHM unavailable: " << e.what() << std::endl;
    }

    hal_.registerDriver(gps_);
    hal_.registerDriver(motor_);
    hal_.registerDriver(camera_);
  }

  std::string handleCommand(const std::string& cmdLine) {
    std::string seq = extractSeq(cmdLine);
    auto respond = [&](const std::string& resp) -> std::string {
      return nextResponse(resp, seq);
    };
    std::string cmd = extractStr(cmdLine, "cmd");
    if (cmd.empty()) return respond(errorResponse("missing 'cmd' field"));

    if (cmd == "ping") return respond(okResponse("\"pong\""));

    if (cmd == "list_drivers") {
      auto infos = hal_.getAllHardwareInfo();
      std::vector<std::string> items;
      for (auto& info : infos) {
        items.push_back(jsonObject({
          jsonPair("id", jsonStr(info.id)),
          jsonPair("name", jsonStr(info.name)),
          jsonPair("type", jsonStr(info.type)),
          jsonPair("status", jsonStr(hardwareStatusToString(info.status))),
          jsonPair("capabilities", jsonArray(
            [&]() { std::vector<std::string> c; for (auto& s : info.capabilities) c.push_back(jsonStr(s)); return c; }()
          ))
        }));
      }
      return respond(okResponse(jsonArray(items)));
    }

    if (cmd == "initialize_all") {
      hal_.initializeAll();
      return respond(okBool(true));
    }

    if (cmd == "shutdown_all") {
      hal_.shutdownAll();
      return respond(okBool(true));
    }

    if (cmd == "gps_read") {
      try {
        auto fix = gps_->readFix();
        return respond(okResponse(jsonObject({
          jsonPair("lat", jsonVal(fix.lat)),
          jsonPair("lng", jsonVal(fix.lng)),
          jsonPair("alt", jsonVal(fix.alt)),
          jsonPair("speed", jsonVal(fix.speed)),
          jsonPair("heading", jsonVal(fix.heading)),
          jsonPair("accuracy", jsonVal(fix.accuracy)),
          jsonPair("timestamp", jsonVal(fix.timestamp))
        })));
      } catch (const std::exception& e) {
        return respond(errorResponse(e.what()));
      }
    }

    if (cmd == "gps_ingest") {
      std::string sentence = extractStr(cmdLine, "sentence");
      if (sentence.empty()) return respond(errorResponse("missing 'sentence' field"));
      if (sentence.back() != '\n') sentence += '\n';
      gps_->ingestNMEA(sentence);
      return respond(okBool(true));
    }

    if (cmd == "motor_exec") {
      std::string command = extractStr(cmdLine, "command");
      if (command.empty()) return respond(errorResponse("missing 'command' field"));
      std::unordered_map<std::string, double> params;
      std::string paramsStr = extractStr(cmdLine, "params");
      if (!paramsStr.empty()) {
        auto p = paramsStr.find('\"');
        while (p != std::string::npos) {
          auto pe = paramsStr.find('\"', p + 1);
          if (pe == std::string::npos) break;
          std::string k = paramsStr.substr(p + 1, pe - p - 1);
          auto colon = paramsStr.find(':', pe + 1);
          if (colon == std::string::npos) break;
          ++colon;
          while (colon < paramsStr.size() && (paramsStr[colon] == ' ' || paramsStr[colon] == '\t')) ++colon;
          auto end = paramsStr.find_first_of(",}", colon);
          double v = 0;
          try { v = std::stod(paramsStr.substr(colon, end - colon)); } catch (...) {}
          params[k] = v;
          p = paramsStr.find('\"', end);
        }
      }
      try {
        motor_->executeCommand(command, params);
        return respond(okBool(true));
      } catch (const std::exception& e) {
        return respond(errorResponse(e.what()));
      }
    }

    if (cmd == "camera_capture") {
      try {
        auto frame = camera_->captureFrame();
        auto shmName = camera_->sharedMemoryName();
        std::vector<std::string> pairs = {
          jsonPair("width", jsonVal(frame.width)),
          jsonPair("height", jsonVal(frame.height)),
          jsonPair("channels", jsonVal(frame.channels)),
          jsonPair("size", jsonVal(frame.data.size())),
          jsonPair("timestamp", jsonVal(frame.timestamp))
        };
        if (!shmName.empty()) {
          pairs.push_back(jsonPair("shm_name", jsonStr(shmName)));
        }
        return respond(okResponse(jsonObject(pairs)));
      } catch (const std::exception& e) {
        return respond(errorResponse(e.what()));
      }
    }

    if (cmd == "driver_connect") {
      std::string id = extractStr(cmdLine, "id");
      auto driver = hal_.getDriver(id);
      if (!driver) return respond(errorResponse("driver not found: " + id));
      auto serialDrv = std::dynamic_pointer_cast<SerialPortDriver>(driver);
      if (serialDrv) {
        std::string port = extractStr(cmdLine, "port");
        if (port.empty()) port = "memory://" + id;
        serialDrv->connect(port, 115200);
      }
      if (auto camDrv = std::dynamic_pointer_cast<V4L2CameraDriver>(driver)) {
        camDrv->openDevice();
      }
      return respond(okBool(true));
    }

    return respond(errorResponse("unknown command: " + cmd));
  }

  void run() {
    char buf[65536];
    while (std::fgets(buf, sizeof(buf), stdin)) {
      std::string line(buf);
      // strip trailing newline
      while (!line.empty() && (line.back() == '\n' || line.back() == '\r')) line.pop_back();
      if (line.empty()) continue;
      std::string response = handleCommand(line);
      std::fputs(response.c_str(), stdout);
      std::fflush(stdout);
    }
  }
};

int main() {
  HardwareDaemon daemon;
  daemon.run();
  return 0;
}
