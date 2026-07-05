#pragma once

#include "../Types.h"
#include <string>
#include <vector>

namespace atlas_navigation {
namespace navigation {

struct WaypointEntry {
    Waypoint waypoint;
    WaypointStatus status = WaypointStatus::PENDING;
};

inline WaypointEntry createWaypoint(const std::string& id, const Vector3& position,
                                     const std::string& label = "", double tolerance = 0.0) {
    Waypoint wp;
    wp.id = id;
    wp.position = position;
    wp.label = label;
    wp.tolerance = tolerance;
    return {wp, WaypointStatus::PENDING};
}

} // namespace navigation
} // namespace atlas_navigation
