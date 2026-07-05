#pragma once

#include "../Types.h"
#include <string>
#include <vector>
#include <cmath>
#include <charconv>

namespace atlas {

class NMEAParser {
  std::string buffer_;

public:
  std::vector<NMEAFix> parseChunk(const std::string& chunk) {
    buffer_ += chunk;
    std::vector<NMEAFix> fixes;
    size_t pos;
    while ((pos = buffer_.find('\n')) != std::string::npos) {
      std::string line = buffer_.substr(0, pos);
      // trim \r
      if (!line.empty() && line.back() == '\r') line.pop_back();
      buffer_.erase(0, pos + 1);
      auto fix = parseSentence(line);
      if (fix) fixes.push_back(*fix);
    }
    return fixes;
  }

  std::optional<NMEAFix> parseSentence(const std::string& sentence) const {
    if (sentence.empty() || sentence[0] != '$') return std::nullopt;
    // Extract body (before *)
    auto starPos = sentence.find('*');
    std::string body = sentence.substr(1, starPos != std::string::npos ? starPos - 1 : std::string::npos);
    auto parts = split(body, ',');

    if (parts.empty()) return std::nullopt;
    const std::string& type = parts[0];

    if (type.size() >= 3 && type.substr(type.size() - 3) == "GGA") {
      return parseGGA(parts);
    }
    if (type.size() >= 3 && type.substr(type.size() - 3) == "RMC") {
      return parseRMC(parts);
    }
    return std::nullopt;
  }

private:
  static std::vector<std::string> split(const std::string& s, char delim) {
    std::vector<std::string> result;
    size_t start = 0, end;
    while ((end = s.find(delim, start)) != std::string::npos) {
      result.push_back(s.substr(start, end - start));
      start = end + 1;
    }
    result.push_back(s.substr(start));
    return result;
  }

  static double parseCoord(const std::string& value, const std::string& hemi) {
    if (value.empty() || hemi.empty() || value.size() < 4) return std::numeric_limits<double>::quiet_NaN();
    auto dotPos = value.find('.');
    if (dotPos == std::string::npos) return std::numeric_limits<double>::quiet_NaN();

    int degDigits = static_cast<int>(dotPos) - 2;
    double degrees = 0.0, minutes = 0.0;
    std::from_chars(value.data(), value.data() + degDigits, degrees);
    std::from_chars(value.data() + degDigits, value.data() + value.size(), minutes);

    double decimal = degrees + minutes / 60.0;
    if (hemi == "S" || hemi == "W") decimal = -decimal;
    return decimal;
  }

  static double parseDouble(const std::string& s) {
    if (s.empty()) return std::numeric_limits<double>::quiet_NaN();
    double v;
    auto [p, ec] = std::from_chars(s.data(), s.data() + s.size(), v);
    if (ec != std::errc()) return std::numeric_limits<double>::quiet_NaN();
    return v;
  }

  static int parseInt(const std::string& s) {
    if (s.empty()) return -1;
    int v;
    auto [p, ec] = std::from_chars(s.data(), s.data() + s.size(), v);
    return (ec == std::errc()) ? v : -1;
  }

  static std::optional<NMEAFix> parseGGA(const std::vector<std::string>& parts) {
    if (parts.size() < 10) return std::nullopt;
    double lat = parseCoord(parts.size() > 2 ? parts[2] : "", parts.size() > 3 ? parts[3] : "");
    double lon = parseCoord(parts.size() > 4 ? parts[4] : "", parts.size() > 5 ? parts[5] : "");
    if (std::isnan(lat) || std::isnan(lon)) return std::nullopt;

    NMEAFix fix;
    fix.latitude = lat;
    fix.longitude = lon;
    if (!parts[9].empty()) { fix.altitude = parseDouble(parts[9]); fix.hasAltitude = true; }
    if (parts.size() > 6 && !parts[6].empty()) fix.fixQuality = parseInt(parts[6]);
    if (parts.size() > 7 && !parts[7].empty()) fix.satellites = parseInt(parts[7]);
    if (parts.size() > 8 && !parts[8].empty()) {
      fix.hdop = parseDouble(parts[8]);
      fix.hasHdop = true;
    }
    fix.timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
      std::chrono::system_clock::now().time_since_epoch()).count();
    return fix;
  }

  static std::optional<NMEAFix> parseRMC(const std::vector<std::string>& parts) {
    if (parts.size() < 7) return std::nullopt;
    if (parts.size() < 3 || parts[2] != "A") return std::nullopt;

    double lat = parseCoord(parts.size() > 3 ? parts[3] : "", parts.size() > 4 ? parts[4] : "");
    double lon = parseCoord(parts.size() > 5 ? parts[5] : "", parts.size() > 6 ? parts[6] : "");
    if (std::isnan(lat) || std::isnan(lon)) return std::nullopt;

    NMEAFix fix;
    fix.latitude = lat;
    fix.longitude = lon;
    if (parts.size() > 7 && !parts[7].empty()) {
      fix.speedKnots = parseDouble(parts[7]);
      fix.hasSpeed = true;
    }
    if (parts.size() > 8 && !parts[8].empty()) {
      fix.course = parseDouble(parts[8]);
      fix.hasCourse = true;
    }
    fix.timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
      std::chrono::system_clock::now().time_since_epoch()).count();
    return fix;
  }
};

} // namespace atlas
