#pragma once

#include <string>
#include <vector>
#include <map>
#include <cmath>
#include <cstdint>
#include <chrono>

namespace atlas_navigation {

inline int64_t nowMs() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::steady_clock::now().time_since_epoch()
    ).count();
}

struct Vector3 {
    double x = 0.0, y = 0.0, z = 0.0;
};

struct Quaternion {
    double x = 0.0, y = 0.0, z = 0.0, w = 1.0;
};

struct Pose {
    Vector3 position;
    Quaternion orientation;
    int64_t timestamp = 0;
    std::vector<std::vector<double>> covariance;
};

struct Waypoint {
    std::string id;
    Vector3 position;
    std::string label;
    double tolerance = 0.0;
};

enum class WaypointStatus : uint8_t {
    PENDING,
    ACTIVE,
    REACHED,
    SKIPPED
};

struct WaypointEntry {
    Waypoint waypoint;
    WaypointStatus status = WaypointStatus::PENDING;
};

struct Obstacle {
    std::string id;
    Vector3 position;
    double radius = 0.0;
    double confidence = 1.0;
    int64_t timestamp = 0;
};

struct TerrainCell {
    double elevation = 0.0;
    double roughness = 0.0;
    bool passable = true;
};

enum class GeofenceType : uint8_t {
    KEEP_IN,
    KEEP_OUT
};

struct Geofence {
    std::string id;
    GeofenceType type = GeofenceType::KEEP_IN;
    std::vector<std::pair<double, double>> polygon;
    double altitudeMin = -1e9;
    double altitudeMax = 1e9;
};

struct Route {
    std::vector<Waypoint> waypoints;
    double totalDistance = 0.0;
};

struct KeypointObservation {
    std::string keyframeId;
    int keypointIndex = 0;
    int scaleLevel = 0;
    std::string status = "PENDING";
};

struct Keypoint {
    std::pair<double, double> pixel{0, 0};
    int scaleLevel = 0;
    double response = 0.0;
    double angle = 0.0;
    double size = 7.0;
};

struct MapPoint {
    std::string id;
    Vector3 position;
    std::vector<KeypointObservation> observations;
    std::vector<double> descriptor;
    int observationCount = 0;
    double score = 0.0;
    int64_t createdAt = 0;
    int64_t lastObservedAt = 0;
};

struct KeyframeConnection {
    std::string keyframeId;
    Pose relativePose;
    std::vector<std::vector<double>> informationMatrix;
    std::string edgeType = "ODOMETRY";
};

struct Keyframe {
    std::string id;
    Pose pose;
    std::vector<Keypoint> keypoints;
    std::vector<std::vector<double>> descriptors;
    std::vector<std::string> mapPointIds;
    std::vector<KeyframeConnection> connections;
    int64_t timestamp = 0;
    int sequenceNumber = 0;
};

struct MapPointCorrespondence {
    std::string currentPointId;
    std::string previousPointId;
    double reprojectionError = 0.0;
    bool isInlier = false;
};

struct LoopClosure {
    std::string currentKeyframeId;
    std::string matchedKeyframeId;
    Pose relativePose;
    int inlierCount = 0;
    double confidence = 0.0;
    std::vector<MapPointCorrespondence> correspondences;
};

} // namespace atlas_navigation
