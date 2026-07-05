#pragma once

#include "SLAMTypes.h"
#include "FeatureExtractor.h"
#include "GraphOptimizer.h"
#include <memory>
#include <map>
#include <vector>
#include <string>
#include <cmath>
#include <chrono>
#include <algorithm>
#include <optional>

namespace atlas_navigation {
namespace slam {

struct SLAMEngineConfig {
    double resolution = 0.1;
    int maxObjects = 100;
    int64_t objectAgeThreshold = 30000;
    bool enableLoopClosure = true;
    double loopClosureThreshold = 0.8;
    double keyframeDistanceThreshold = 0.5;
    int optimizationIterations = 50;
};

struct MapObject {
    std::string id;
    std::string label;
    Vector3 position;
    double confidence = 0.0;
    int64_t lastSeen = 0;
};

struct LocalMap {
    std::string id;
    std::vector<MapObject> objects;
    double resolution = 0.1;
    int64_t timestamp = 0;
};

struct StateEstimate {
    Vector3 position{0,0,0};
    Vector3 velocity{0,0,0};
    Quaternion orientation{0,0,0,1};
    double confidence = 0.0;
    int64_t timestamp = 0;
};

struct SLAMKeyframe {
    std::string id;
    StateEstimate estimate;
    std::vector<MapObject> objects;
    int64_t timestamp = 0;
    std::vector<KeyframeConnection> connections;
};

struct LoopClosureResult {
    bool detected = false;
    std::string keyframeId;
    Pose transform;
    double confidence = 0.0;
};

struct PoseGraphResult {
    StateEstimate optimizedEstimate;
    double errorReduction = 0.0;
    int iterations = 0;
    bool converged = false;
};

struct Observation {
    std::string type;
    struct ObservationData {
        std::optional<Vector3> position;
        std::optional<Vector3> velocity;
        std::optional<Vector3> angular;
        std::optional<Quaternion> orientation;
        std::string object;
        double confidence = 0.0;
    };
    ObservationData data;
    double uncertainty = 0.0;
    int64_t timestamp = 0;
};

class SLAMEngine {
public:
    explicit SLAMEngine(const SLAMEngineConfig& config = SLAMEngineConfig{});

    LocalMap processObservation(const Observation& observation);
    LocalMap getMap() const;
    StateEstimate getEstimate() const;
    std::vector<SLAMKeyframe> getKeyframes() const;

    struct PoseGraphStats {
        int vertexCount = 0;
        int edgeCount = 0;
        int loopClosureCount = 0;
    };
    PoseGraphStats getPoseGraphStats() const;
    void clearMap();
    void reset();

private:
    LocalMap currentMap_;
    std::map<std::string, SLAMKeyframe> keyframes_;
    std::map<std::string, std::map<std::string, KeyframeConnection>> poseGraph_;
    StateEstimate currentEstimate_;
    SLAMEngineConfig config_;
    std::string lastKeyframeId_;
    int observationCount_ = 0;
    int loopClosureCount_ = 0;
    int64_t lastLoopClosureTime_ = 0;

    void updateEstimate(const Observation& observation);
    void updateMapFromDetection(const Observation& observation);
    void updateFromOdometry(const Observation& observation);
    void updateFromPose(const Observation& observation);
    bool shouldCreateKeyframe() const;
    void createKeyframe();
    LoopClosureResult detectLoopClosure() const;
    double computeLoopClosureScore(const std::vector<MapObject>& currentObjects,
                                   const std::vector<MapObject>& candidateObjects) const;
    void applyLoopClosure(const LoopClosureResult& loopClosure);
    void addPoseGraphEdge(const std::string& fromId, const std::string& toId,
                          const KeyframeConnection& connection);
    PoseGraphResult optimizePoseGraph();
    double computePoseGraphError() const;
    void adjustKeyframes();
    Pose computeRelativeTransform(const StateEstimate& from, const StateEstimate& to) const;
    void pruneObjects();
    double computeUpdateWeight(double uncertainty) const;
    double estimateDeltaTime() const;
};

} // namespace slam
} // namespace atlas_navigation
