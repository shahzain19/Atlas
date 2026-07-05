#pragma once

#include "../../Interfaces/BaseDriver.h"
#include <string>
#include <vector>
#include <cstdint>
#include <chrono>
#include <thread>
#include <fcntl.h>
#include <unistd.h>

namespace atlas {

struct CameraFrame {
  std::vector<uint8_t> data;
  uint32_t width = 0;
  uint32_t height = 0;
  uint32_t channels = 3;
  int64_t timestamp = 0;
};

class V4L2CameraDriver : public BaseDriver {
  std::string id_;
  std::string name_;
  std::string devicePath_;
  int fd_ = -1;
  HardwareStatus status_ = HardwareStatus::DISCONNECTED;
  uint32_t width_ = 640;
  uint32_t height_ = 480;

public:
  V4L2CameraDriver(std::string id = "camera-001",
                   std::string name = "V4L2Camera",
                   std::string devicePath = "/dev/video0")
    : id_(std::move(id)), name_(std::move(name)), devicePath_(std::move(devicePath)) {}

  std::string id() const override { return id_; }
  std::string name() const override { return name_; }
  std::string type() const override { return "camera"; }
  HardwareStatus status() const override { return status_; }
  std::vector<std::string> capabilities() const override {
    return {"capture", "stream"};
  }

  void initialize() override {
    status_ = HardwareStatus::INITIALIZING;
    status_ = HardwareStatus::DISCONNECTED;
  }

  void shutdown() override {
    closeDevice();
    status_ = HardwareStatus::DISCONNECTED;
  }

  void reset() override {
    shutdown();
    initialize();
  }

  HealthResult getHealth() override {
    HealthResult r;
    r.value = (status_ == HardwareStatus::CONNECTED) ? 1.0 : 0.0;
    r.details["device"] = devicePath_;
    r.details["open"] = (fd_ >= 0);
    return r;
  }

  bool openDevice() {
    if (fd_ >= 0) return true;
    fd_ = ::open(devicePath_.c_str(), O_RDWR);
    if (fd_ < 0) {
      status_ = HardwareStatus::ERROR;
      return false;
    }
    status_ = HardwareStatus::CONNECTED;
    return true;
  }

  void closeDevice() {
    if (fd_ >= 0) {
      ::close(fd_);
      fd_ = -1;
    }
  }

  CameraFrame captureFrame() {
    if (fd_ < 0)
      throw std::runtime_error("V4L2 camera " + id_ + " is not open");

    size_t frameSize = static_cast<size_t>(width_) * height_ * 3;
    std::vector<uint8_t> buffer(frameSize, 128);
    CameraFrame frame;
    frame.data = std::move(buffer);
    frame.width = width_;
    frame.height = height_;
    frame.channels = 3;
    frame.timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
      std::chrono::system_clock::now().time_since_epoch()).count();
    return frame;
  }

  void setResolution(uint32_t width, uint32_t height) {
    width_ = width;
    height_ = height;
  }
};

} // namespace atlas