#pragma once

#include "../Real/SerialPortDriver.h"
#include "../../Protocol/NMEAParser.h"

namespace atlas {

class NMEAGPSSensor : public SerialPortDriver {
  NMEAParser parser_;
  std::optional<NMEAFix> latestFix_;

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
    if (!latestFix_)
      throw std::runtime_error("No GPS fix available yet");

    GPSReading r;
    r.lat = latestFix_->latitude;
    r.lng = latestFix_->longitude;
    r.alt = latestFix_->hasAltitude ? latestFix_->altitude : 0.0;
    r.speed = latestFix_->hasSpeed ? latestFix_->speedKnots * 0.514444 : 0.0;
    r.heading = latestFix_->hasCourse ? latestFix_->course : 0.0;
    r.accuracy = latestFix_->hasHdop ? latestFix_->hdop : 0.0;
    r.timestamp = latestFix_->timestamp;
    return r;
  }

  bool hasFix() const { return latestFix_.has_value(); }

  HealthResult getHealth() override {
    auto base = SerialPortDriver::getHealth();
    base.value = latestFix_ ? base.value : 0.0;
    base.details["hasFix"] = latestFix_.has_value();
    return base;
  }

  void initialize() override {
    status_ = HardwareStatus::INITIALIZING;
    status_ = latestFix_ ? HardwareStatus::CONNECTED : HardwareStatus::DISCONNECTED;
  }

private:
  void handleIncoming(const std::vector<uint8_t>& data) {
    std::string text(data.begin(), data.end());
    auto fixes = parser_.parseChunk(text);
    if (!fixes.empty()) latestFix_ = fixes.back();
  }
};

} // namespace atlas
