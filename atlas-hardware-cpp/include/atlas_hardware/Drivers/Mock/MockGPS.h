#pragma once

#include "../../Types.h"

namespace atlas {

class MockGPS {
  int readCount_ = 0;

public:
  CapabilityType type = CapabilityType::SENSING;
  std::string name = "MockGPS";

  GPSReading read() {
    // Deterministic-ish offset based on read count
    double baseLat = 45.4215;
    double baseLng = -75.6972;
    double offsetLat = (readCount_ % 100) * 0.0001;
    double offsetLng = ((readCount_ + 1) % 100) * 0.0001;
    readCount_++;
    return GPSReading{
      baseLat + offsetLat, baseLng + offsetLng, 100.0,
      0.0, 0.0, 1.5,
      std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count()
    };
  }

  int readCount() const { return readCount_; }
};

} // namespace atlas
