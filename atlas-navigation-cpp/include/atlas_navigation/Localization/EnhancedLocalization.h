#pragma once

#include "../SLAM/SLAMTypes.h"
#include "../SLAM/FeatureExtractor.h"
#include "../SLAM/GraphOptimizer.h"
#include "../SLAM/SLAMEngine.h"
#include <memory>
#include <map>
#include <vector>
#include <string>
#include <cmath>
#include <algorithm>
#include <chrono>

namespace atlas_navigation {
namespace localization {

struct LocalizationResult {
    Pose pose;
    std::map<std::string, MapPoint> mapPoints;
    int trackedFeatures = 0;
    double processingTime = 0.0;
    std::string status = "INITIALIZING";
};

struct MapUpdateInfo {
    bool keyframeAdded = false;
    int newPointsCount = 0;
    int prunedPointsCount = 0;
    bool optimizationPerformed = false;
    bool loopClosureDetected = false;
};

class EnhancedLocalization {
public:
    explicit EnhancedLocalization(const slam::SLAMConfig& config = slam::DEFAULT_SLAM_CONFIG());

    LocalizationResult localize(const slam::SLAMObservation& observation);
    MapUpdateInfo updateMap(const slam::SLAMObservation& observation);
    Pose getPose() const;
    slam::SLAMState getState() const;
    slam::SLAMEngine* getSLAMEngine() { return &slamEngine_; }
    Pose toStateEstimate() const;

    struct MapStatistics {
        int mapPointCount = 0;
        int keyframeCount = 0;
        double averageObservations = 0.0;
        bool isInitialized = false;
    };
    MapStatistics getMapStatistics() const;
    void reset();

private:
    slam::SLAMEngine slamEngine_;
    std::unique_ptr<slam::FeatureExtractor> featureExtractor_;
    slam::PoseGraphManager poseGraphManager_;
    slam::GraphOptimizer graphOptimizer_;
    slam::SLAMState currentState_;
    Pose currentPose_;
    std::map<std::string, MapPoint> mapPoints_;
    std::vector<Keyframe> keyframes_;
    Keyframe* referenceKeyframe_ = nullptr;
    std::vector<std::vector<double>> previousDescriptors_;
    std::vector<Keypoint> previousKeypoints_;
    slam::SLAMConfig config_;
    double totalProcessingTime_ = 0.0;
    int observationCount_ = 0;
    int minMapPoints_ = 50;
    int trackingLostThreshold_ = 10;
    int sequenceNumber_ = 0;

    struct TrackFeaturesResult {
        Pose pose;
        int trackedCount = 0;
    };
    TrackFeaturesResult trackFeatures(const slam::FeatureExtractionResult& features);
    Pose estimateMotion(const std::vector<Keypoint>& prevKeypoints,
                        const std::vector<Keypoint>& currKeypoints,
                        const std::vector<slam::BFMatcher::Match>& matches) const;
    bool shouldCreateKeyframe(const slam::FeatureExtractionResult& features) const;
    void createKeyframe(const slam::FeatureExtractionResult& features, int64_t timestamp);
    void addMapPoints(const slam::FeatureExtractionResult& features);
    Vector3* triangulatePoint(const Keyframe& keyframe1, const Keypoint& keypoint2) const;
    LoopClosure detectLoopClosure() const;
    int verifyLoopClosure(const Keyframe& kf1, const Keyframe& kf2,
                          const std::vector<slam::BFMatcher::Match>& matches) const;
    void applyLoopClosure(const LoopClosure& loopClosure);
    void optimizePoseGraph();
    void updateMapPointPositions();
    void pruneMapPoints();
    Pose composePose(const Pose& base, const Pose& relative) const;
    Pose computeRelativePose(const Pose& pose1, const Pose& pose2) const;
    std::vector<std::vector<double>> createInformationMatrix(const std::string& edgeType) const;
};

} // namespace localization
} // namespace atlas_navigation
