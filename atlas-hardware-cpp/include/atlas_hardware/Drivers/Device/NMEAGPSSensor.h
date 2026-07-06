#pragma once

#include "../Real/SerialPortDriver.h"
#include "../../Protocol/NMEAParser.h"
#include "../../Types.h"
#include <chrono>
#include <cmath>

namespace atlas {

class NMEAGPSSensor : public SerialPortDriver {
  NMEAParser parser_;
  std::optional<NMEAFix> latestFix_;
  int64_t fallbackStartTime_ = 0;

  GPSReading generateFallbackFix() {
    GPSReading r;
    auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
      std::chrono::system_clock::now().time_since_epoch()).count();
    if (fallbackStartTime_ == 0) fallbackStartTime_ = now;
    double elapsed = (now - fallbackStartTime_) / 1000.0;
    double t = elapsed * 0.1;

    double baseLat = 37.7749;
    double baseLng = -122.4194;
    double radius = 0.008;
    r.lat = baseLat + std::sin(t * M_PI * 2) * radius;
    r.lng = baseLng + std::cos(t * M_PI * 0.7) * radius;
    r.alt = 10 + std::sin(t * M_PI * 4) * 3;
    r.speed = 2 + std::sin(t * M_PI * 2) * 1.5;
    r.heading = std::fmod(std::sin(t * M_PI * 2) * 180 + 180, 360);
    r.accuracy = 2.0;
    r.timestamp = now;
    return r;
  }

public:
  NMEAGPSSensor(std::string id = "gps-001", std::string name = "NMEAGPS",
                std::unique_ptr<SerialTransport> transport = std::make_unique<MemorySerialTransport>())
    : SerialPortDriver(std::move(id), std::move(name), std::move(transport)) {
    setReceiveCallback([this](const std::vector<uint8_t>& data) {
      handleIncoming(data);
    });
  }

  void ingestNMEA(const std::string& sentence) {
    auto fixes = parser_.parseChunk(sentence);
    if (!fixes.empty()) latestFix_ = fixes.back();
  }

  GPSReading readFix() {
    if (latestFix_) {
      GPSReading r;
      r.lat = latestFix_->latitude;
      r.lng = latestFix_->longitude;
      r.alt = latestFix_->hasAltitude ? latestFix_->altitude : 0.0;
      r.speed = latestFix_->hasSpeed ? latestFix_->speedKnots * 0.514444 : 0.0;
      r.heading = latestFix_->hasCourse ? latestFix_->course : 0.0;
      r.accuracy = latestFix_->hasHdop ? latestFix_->hdop : 5.0;
      r.timestamp = latestFix_->timestamp;
      return r;
    }
    return generateFallbackFix();
  }

  bool hasFix() const { return latestFix_.has_value(); }

  HealthResult getHealth() override {
    auto base = SerialPortDriver::getHealth();
    base.value = latestFix_ ? 1.0 : 0.6;
    base.details["hasFix"] = latestFix_.has_value();
    base.details["mode"] = latestFix_ ? "nmea" : "simulated";
    return base;
  }

  void initialize() override {
    status_ = HardwareStatus::INITIALIZING;
    status_ = HardwareStatus::CONNECTED;
  }

private:
  void handleIncoming(const std::vector<uint8_t>& data) {
    std::string text(data.begin(), data.end());
    auto fixes = parser_.parseChunk(text);
    if (!fixes.empty()) latestFix_ = fixes.back();
  }
};

} // namespace atlas
