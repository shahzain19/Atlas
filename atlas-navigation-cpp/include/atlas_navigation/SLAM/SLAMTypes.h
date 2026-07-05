#pragma once

#include "../Types.h"
#include <variant>
#include <optional>

namespace atlas_navigation {
namespace slam {

struct SLAMConfig {
    std::string detectorType = "ORB";
    std::string descriptorType = "ORB";
    int maxKeypoints = 2000;
    double matchRatioThreshold = 0.75;
    int64_t loopClosureInterval = 1000;
    double keyframeDistanceThreshold = 0.5;
    double minTriangulationAngle = 3.0;
    int optimizationIterations = 100;
    double mapScale = 1.0;
    bool enableLoopClosure = true;
    double maxCorrespondenceDistance = 10.0;
    int minMapPoints = 50;
    int trackingLostThreshold = 10;
};

struct SLAMState {
    Pose pose;
    std::map<std::string, MapPoint> mapPoints;
    std::vector<Keyframe> keyframes;
    int mapVersion = 0;
    int observationCount = 0;
    bool isInitialized = false;
    int64_t lastLoopClosureTime = 0;
    int loopClosureCount = 0;
    std::string status = "INITIALIZING";
};

struct Descriptor {
    std::vector<double> values;
    double distanceTo(const Descriptor& other) const;
};

struct SLAMObservation {
    struct ImageData {
        std::vector<uint8_t> data;
        int width = 0;
        int height = 0;
    };
    struct DepthData {
        std::vector<float> data;
        int width = 0;
        int height = 0;
    };
    struct IMUData {
        Vector3 omega;
        Vector3 acceleration;
    };
    struct OdometryData {
        Vector3 linear;
        Vector3 angular;
    };
    std::optional<ImageData> image;
    std::optional<DepthData> depth;
    std::optional<IMUData> imu;
    std::optional<OdometryData> odometry;
    int64_t timestamp = 0;
};

struct FeatureExtractionParams {
    int maxFeatures = 2000;
    int pyramidLevels = 4;
    double scaleFactor = 1.2;
    int fastThreshold = 20;
    double minDistance = 5.0;
};

struct FeatureExtractionResult {
    std::vector<Keypoint> keypoints;
    std::vector<std::vector<double>> descriptors;
    int64_t timestamp = 0;
};

struct OptimizationResult {
    std::map<std::string, Pose> poses;
    double initialError = 0.0;
    double finalError = 0.0;
    int iterations = 0;
    int outliersRemoved = 0;
    bool converged = false;
    double computationTime = 0.0;
};

inline constexpr SLAMConfig DEFAULT_SLAM_CONFIG() {
    return SLAMConfig{};
}

inline double Descriptor::distanceTo(const Descriptor& other) const {
    double dist = 0.0;
    size_t n = std::min(values.size(), other.values.size());
    for (size_t i = 0; i < n; ++i) {
        double diff = values[i] - other.values[i];
        dist += diff * diff;
    }
    return std::sqrt(dist);
}

} // namespace slam
} // namespace atlas_navigation
