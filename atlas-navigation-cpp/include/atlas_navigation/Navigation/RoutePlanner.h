#pragma once

#include "../Types.h"
#include <vector>
#include <cmath>

namespace atlas_navigation {
namespace navigation {

class RoutePlanner {
public:
    struct PlanResult {
        std::vector<Waypoint> waypoints;
        double distance = 0.0;
        double estimatedTime = 0.0;
    };

    PlanResult planPath(const Waypoint& start, const Waypoint& end,
                        const std::vector<Waypoint>& obstacles = {}) const;
};

inline RoutePlanner::PlanResult RoutePlanner::planPath(
    const Waypoint& start, const Waypoint& end,
    const std::vector<Waypoint>& /*obstacles*/) const {
    PlanResult result;

    Waypoint mid;
    mid.id = start.id + "_to_" + end.id + "_mid";
    mid.position.x = (start.position.x + end.position.x) / 2.0;
    mid.position.y = (start.position.y + end.position.y) / 2.0;
    mid.position.z = start.position.z;

    result.waypoints.push_back(start);
    result.waypoints.push_back(mid);
    result.waypoints.push_back(end);

    result.distance = 0.0;
    for (size_t i = 1; i < result.waypoints.size(); ++i) {
        double dx = result.waypoints[i].position.x - result.waypoints[i-1].position.x;
        double dy = result.waypoints[i].position.y - result.waypoints[i-1].position.y;
        result.distance += std::sqrt(dx*dx + dy*dy);
    }

    result.estimatedTime = result.distance / 1.0;
    return result;
}

} // namespace navigation
} // namespace atlas_navigation
