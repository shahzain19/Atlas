#pragma once

#include "../Types.h"
#include <map>
#include <vector>
#include <string>
#include <cmath>
#include <chrono>

namespace atlas_navigation {
namespace navigation {

class ObstacleAvoidance {
public:
    explicit ObstacleAvoidance(int64_t staleTtlMs = 5000);

    void addOrUpdate(const Obstacle& obstacle);
    void remove(const std::string& id);
    void prune();
    std::vector<Obstacle> getAll() const;
    void clear();

    bool pathBlocked(const Vector3& from, const Vector3& to, double safetyMargin = 1.0);
    Vector3 computeAvoidanceVector(const Vector3& currentPos, double influenceRadius = 5.0);

private:
    std::map<std::string, Obstacle> obstacles_;
    int64_t staleTtl_;

    double segmentPointDistance(const Vector3& a, const Vector3& b, const Vector3& p) const;
};

inline ObstacleAvoidance::ObstacleAvoidance(int64_t staleTtlMs) : staleTtl_(staleTtlMs) {}

inline void ObstacleAvoidance::addOrUpdate(const Obstacle& obstacle) {
    obstacles_[obstacle.id] = obstacle;
}

inline void ObstacleAvoidance::remove(const std::string& id) {
    obstacles_.erase(id);
}

inline void ObstacleAvoidance::prune() {
    int64_t now = nowMs();
    for (auto it = obstacles_.begin(); it != obstacles_.end(); ) {
        if (now - it->second.timestamp > staleTtl_) {
            it = obstacles_.erase(it);
        } else {
            ++it;
        }
    }
}

inline std::vector<Obstacle> ObstacleAvoidance::getAll() const {
    std::vector<Obstacle> result;
    result.reserve(obstacles_.size());
    for (const auto& [_, obs] : obstacles_) {
        result.push_back(obs);
    }
    return result;
}

inline void ObstacleAvoidance::clear() {
    obstacles_.clear();
}

inline bool ObstacleAvoidance::pathBlocked(const Vector3& from, const Vector3& to, double safetyMargin) {
    prune();
    for (const auto& [_, obs] : obstacles_) {
        if (segmentPointDistance(from, to, obs.position) < obs.radius + safetyMargin) {
            return true;
        }
    }
    return false;
}

inline Vector3 ObstacleAvoidance::computeAvoidanceVector(const Vector3& currentPos, double influenceRadius) {
    prune();
    Vector3 result{0, 0, 0};
    for (const auto& [_, obs] : obstacles_) {
        double dx = currentPos.x - obs.position.x;
        double dy = currentPos.y - obs.position.y;
        double dz = currentPos.z - obs.position.z;
        double dist = std::sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < influenceRadius && dist > 0.001) {
            double force = (1.0 / (dist * dist)) * obs.confidence;
            result.x += (dx / dist) * force;
            result.y += (dy / dist) * force;
            result.z += (dz / dist) * force;
        }
    }
    return result;
}

inline double ObstacleAvoidance::segmentPointDistance(const Vector3& a, const Vector3& b, const Vector3& p) const {
    double abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
    double apx = p.x - a.x, apy = p.y - a.y, apz = p.z - a.z;
    double abLen2 = abx*abx + aby*aby + abz*abz;
    if (abLen2 == 0) {
        return std::sqrt(apx*apx + apy*apy + apz*apz);
    }
    double t = std::max(0.0, std::min(1.0, (apx*abx + apy*aby + apz*abz) / abLen2));
    double cx = a.x + t*abx - p.x;
    double cy = a.y + t*aby - p.y;
    double cz = a.z + t*abz - p.z;
    return std::sqrt(cx*cx + cy*cy + cz*cz);
}

} // namespace navigation
} // namespace atlas_navigation
