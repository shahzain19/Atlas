#pragma once

#include "../../Interfaces/BaseDriver.h"
#include <string>
#include <vector>
#include <cstdint>
#include <chrono>
#include <thread>
#include <random>
#include <cmath>
#include <cstring>
#include <algorithm>

#ifndef _GNU_SOURCE
#define _GNU_SOURCE
#endif
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <sys/mman.h>
#include <linux/videodev2.h>

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
  bool useV4l2_ = false;
  CameraFrame lastFallbackFrame_;

  void generateFallbackFrame() {
    size_t frameSize = static_cast<size_t>(width_) * height_ * 3;
    std::vector<uint8_t> buffer(frameSize);
    const int horizonY = static_cast<int>(height_ * 0.55);
    const int sunX = static_cast<int>(width_ * 0.7);
    const int sunY = static_cast<int>(height_ * 0.15);
    const int sunRadius = 12;

    for (int y = 0; y < static_cast<int>(height_); y++) {
      for (int x = 0; x < static_cast<int>(width_); x++) {
        size_t idx = (static_cast<size_t>(y) * width_ + x) * 3;
        int r, g, b;
        int seed = x * 1000 + y;
        std::mt19937 rng(seed);
        std::uniform_real_distribution<float> noise(-5, 5);

        if (y < horizonY - 2) {
          float skyGrad = static_cast<float>(y) / (horizonY - 2);
          r = static_cast<int>(60 + skyGrad * 80 + noise(rng));
          g = static_cast<int>(120 + skyGrad * 100 + noise(rng));
          b = static_cast<int>(180 + skyGrad * 75 + noise(rng));
        } else if (y > horizonY + 2) {
          float groundGrad = static_cast<float>(y - horizonY) / (height_ - horizonY);
          r = static_cast<int>(80 + groundGrad * 40 + noise(rng) * 1.6f);
          g = static_cast<int>(130 - groundGrad * 30 + noise(rng) * 1.6f);
          b = static_cast<int>(50 + groundGrad * 10 + noise(rng));
        } else {
          r = static_cast<int>(80 + noise(rng) * 2);
          g = static_cast<int>(80 + noise(rng) * 2);
          b = static_cast<int>(80 + noise(rng) * 2);
        }

        int dx = x - sunX, dy = y - sunY;
        if (std::abs(dx) < sunRadius && std::abs(dy) < sunRadius) {
          float dist = std::hypot(dx, dy);
          if (dist < sunRadius) {
            float brightness = 1.0f - dist / sunRadius;
            r = std::min(255, r + static_cast<int>(brightness * 120));
            g = std::min(255, g + static_cast<int>(brightness * 100));
            b = std::max(0, b - static_cast<int>(brightness * 40));
          }
        }

        buffer[idx] = std::max(0, std::min(255, r));
        buffer[idx + 1] = std::max(0, std::min(255, g));
        buffer[idx + 2] = std::max(0, std::min(255, b));
      }
    }

    for (int c = 0; c < 3; c++) {
      std::mt19937 crng(c * 777);
      std::uniform_real_distribution<float> cdist(0, 1);
      int cx = static_cast<int>(cdist(crng) * width_);
      int cy = static_cast<int>(cdist(crng) * horizonY * 0.6f);
      int cw = 30 + static_cast<int>(cdist(crng) * 40);
      int ch = 10 + static_cast<int>(cdist(crng) * 15);
      for (int dy = -ch; dy <= ch; dy++) {
        for (int dx = -cw; dx <= cw; dx++) {
          float dist = std::hypot(static_cast<float>(dx) / cw, static_cast<float>(dy) / ch);
          if (dist > 1.0f) continue;
          int px = cx + dx, py = cy + dy;
          if (px < 0 || px >= static_cast<int>(width_) || py < 0 || py >= static_cast<int>(height_)) continue;
          size_t idx = (static_cast<size_t>(py) * width_ + px) * 3;
          float blend = (1.0f - dist) * 0.6f;
          buffer[idx] = std::min(255, buffer[idx] + static_cast<int>(blend * 80));
          buffer[idx + 1] = std::min(255, buffer[idx + 1] + static_cast<int>(blend * 80));
          buffer[idx + 2] = std::min(255, buffer[idx + 2] + static_cast<int>(blend * 80));
        }
      }
    }

    lastFallbackFrame_.data = std::move(buffer);
    lastFallbackFrame_.width = width_;
    lastFallbackFrame_.height = height_;
    lastFallbackFrame_.channels = 3;
    lastFallbackFrame_.timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
      std::chrono::system_clock::now().time_since_epoch()).count();
  }

public:
  V4L2CameraDriver(std::string id = "camera-001",
                   std::string name = "V4L2Camera",
                   std::string devicePath = "/dev/video0")
    : id_(std::move(id)), name_(std::move(name)), devicePath_(std::move(devicePath)) {
    generateFallbackFrame();
  }

  std::string id() const override { return id_; }
  std::string name() const override { return name_; }
  std::string type() const override { return "camera"; }
  HardwareStatus status() const override { return status_; }
  std::vector<std::string> capabilities() const override {
    return {"capture", "stream"};
  }

  void initialize() override {
    status_ = HardwareStatus::INITIALIZING;
    if (openDevice()) {
      status_ = HardwareStatus::CONNECTED;
    } else {
      status_ = HardwareStatus::DISCONNECTED;
    }
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
    r.value = useV4l2_ ? 1.0 : 0.5;
    r.details["device"] = devicePath_;
    r.details["open"] = (fd_ >= 0) ? "true" : "false";
    r.details["mode"] = useV4l2_ ? "v4l2" : "simulated";
    return r;
  }

  bool openDevice() {
    if (fd_ >= 0) return true;
    fd_ = ::open(devicePath_.c_str(), O_RDWR);
    if (fd_ < 0) {
      useV4l2_ = false;
      return false;
    }

    struct v4l2_capability cap;
    if (ioctl(fd_, VIDIOC_QUERYCAP, &cap) < 0) {
      ::close(fd_);
      fd_ = -1;
      useV4l2_ = false;
      return false;
    }

    struct v4l2_format fmt;
    memset(&fmt, 0, sizeof(fmt));
    fmt.type = V4L2_BUF_TYPE_VIDEO_CAPTURE;
    fmt.fmt.pix.width = width_;
    fmt.fmt.pix.height = height_;
    fmt.fmt.pix.pixelformat = V4L2_PIX_FMT_RGB24;
    fmt.fmt.pix.field = V4L2_FIELD_INTERLACED;
    if (ioctl(fd_, VIDIOC_S_FMT, &fmt) < 0) {
      fmt.fmt.pix.pixelformat = V4L2_PIX_FMT_YUYV;
      if (ioctl(fd_, VIDIOC_S_FMT, &fmt) < 0) {
        ::close(fd_);
        fd_ = -1;
        useV4l2_ = false;
        return false;
      }
    }

    useV4l2_ = true;
    status_ = HardwareStatus::CONNECTED;
    return true;
  }

  void closeDevice() {
    if (fd_ >= 0) {
      ::close(fd_);
      fd_ = -1;
    }
    useV4l2_ = false;
  }

  CameraFrame captureFrame() {
    if (!useV4l2_ || fd_ < 0) {
      generateFallbackFrame();
      return lastFallbackFrame_;
    }

    struct v4l2_buffer buf;
    memset(&buf, 0, sizeof(buf));
    buf.type = V4L2_BUF_TYPE_VIDEO_CAPTURE;
    buf.memory = V4L2_MEMORY_MMAP;

    if (ioctl(fd_, VIDIOC_DQBUF, &buf) < 0) {
      generateFallbackFrame();
      return lastFallbackFrame_;
    }

    size_t frameSize = static_cast<size_t>(width_) * height_ * 3;
    std::vector<uint8_t> buffer(frameSize);
    memcpy(buffer.data(), (uint8_t*)buf.m.userptr + buf.m.offset, std::min<size_t>(frameSize, buf.bytesused));

    if (ioctl(fd_, VIDIOC_QBUF, &buf) < 0) {
      // buffer re-queue failed, fallback next time
    }

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
