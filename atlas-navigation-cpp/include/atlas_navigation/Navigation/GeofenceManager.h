#pragma once

#include "../Types.h"
#include <map>
#include <string>
#include <vector>

namespace atlas_navigation {
namespace navigation {

class GeofenceManager {
public:
    void addGeofence(const Geofence& geofence);
    void removeGeofence(const std::string& id);
    bool isPointAllowed(double x, double y, double z = 0.0) const;

private:
    std::map<std::string, Geofence> geofences_;
    bool pointInPolygon(double x, double y, const std::vector<std::pair<double, double>>& polygon) const;
};

inline void GeofenceManager::addGeofence(const Geofence& geofence) {
    geofences_[geofence.id] = geofence;
}

inline void GeofenceManager::removeGeofence(const std::string& id) {
    geofences_.erase(id);
}

inline bool GeofenceManager::isPointAllowed(double x, double y, double z) const {
    for (const auto& [_, geofence] : geofences_) {
        bool inPolygon = pointInPolygon(x, y, geofence.polygon);

        if (geofence.type == GeofenceType::KEEP_IN) {
            if (!inPolygon) return false;
        } else if (geofence.type == GeofenceType::KEEP_OUT) {
            if (inPolygon) return false;
        }

        if (z < geofence.altitudeMin || z > geofence.altitudeMax) {
            return false;
        }
    }
    return true;
}

inline bool GeofenceManager::pointInPolygon(
    double x, double y,
    const std::vector<std::pair<double, double>>& polygon) const {
    bool inside = false;
    size_t n = polygon.size();
    for (size_t i = 0, j = n - 1; i < n; j = i++) {
        double xi = polygon[i].first, yi = polygon[i].second;
        double xj = polygon[j].first, yj = polygon[j].second;
        if (((yi > y) != (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

} // namespace navigation
} // namespace atlas_navigation
