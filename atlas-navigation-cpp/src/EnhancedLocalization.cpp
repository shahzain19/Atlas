#include "atlas_navigation/Localization/EnhancedLocalization.h"
#include <algorithm>
#include <chrono>
#include <cmath>
#include <limits>

namespace atlas_navigation {
namespace localization {

using namespace atlas_navigation::slam;

EnhancedLocalization::EnhancedLocalization(const SLAMConfig& config)
    : config_(config)
    , slamEngine_()
    , graphOptimizer_(GraphOptimizerConfig{})
    , minMapPoints_(config_.minMapPoints)
    , trackingLostThreshold_(config_.trackingLostThreshold)
{
    auto detector = std::make_unique<ORBDetector>();
    auto descriptorExtractor = std::make_unique<ORBDescriptorExtractor>();
    FeatureExtractionParams params;
    params.maxFeatures = config_.maxKeypoints;
    featureExtractor_ = std::make_unique<FeatureExtractor>(std::move(detector), std::move(descriptorExtractor), params);

    currentPose_.timestamp = nowMs();
    currentState_.pose = currentPose_;
    currentState_.status = "INITIALIZING";
}

LocalizationResult EnhancedLocalization::localize(const SLAMObservation& observation) {
    auto startTime = std::chrono::steady_clock::now();

    auto features = featureExtractor_->extract(observation);
    auto trackingResult = trackFeatures(features);
    currentPose_ = trackingResult.pose;

    bool keyframeAdded = false;
    if (shouldCreateKeyframe(features)) {
        createKeyframe(features, observation.timestamp);
        keyframeAdded = true;
    }

    currentState_.pose = currentPose_;
    currentState_.mapPoints.clear();
    for (const auto& [id, mp] : mapPoints_) currentState_.mapPoints[id] = mp;
    currentState_.keyframes = keyframes_;
    currentState_.mapVersion += (keyframeAdded ? 1 : 0);
    currentState_.observationCount++;
    currentState_.isInitialized = currentState_.isInitialized || mapPoints_.size() >= static_cast<size_t>(minMapPoints_);
    currentState_.status = trackingResult.trackedCount >= trackingLostThreshold_ ? "TRACKING" : "LOST";

    auto endTime = std::chrono::steady_clock::now();
    double elapsed = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    totalProcessingTime_ += elapsed;
    observationCount_++;

    LocalizationResult result;
    result.pose = currentPose_;
    result.mapPoints = mapPoints_;
    result.trackedFeatures = trackingResult.trackedCount;
    result.processingTime = elapsed;
    result.status = trackingResult.trackedCount >= trackingLostThreshold_ ? "SUCCESS" : "LOST";
    return result;
}

EnhancedLocalization::TrackFeaturesResult EnhancedLocalization::trackFeatures(const FeatureExtractionResult& features) {
    TrackFeaturesResult result;
    result.pose = currentPose_;

    if (!referenceKeyframe_ || previousKeypoints_.empty()) {
        previousKeypoints_ = features.keypoints;
        previousDescriptors_ = features.descriptors;
        result.trackedCount = static_cast<int>(features.keypoints.size());
        return result;
    }

    BFMatcher matcher(BFMatcher::HAMMING);
    auto matches = matcher.matchWithRatio(previousDescriptors_, features.descriptors, config_.matchRatioThreshold);

    auto trackedPose = estimateMotion(previousKeypoints_, features.keypoints, matches);
    currentPose_ = composePose(currentPose_, trackedPose);

    previousKeypoints_ = features.keypoints;
    previousDescriptors_ = features.descriptors;

    result.pose = currentPose_;
    result.trackedCount = static_cast<int>(matches.size());
    return result;
}

Pose EnhancedLocalization::estimateMotion(
    const std::vector<Keypoint>& prevKeypoints,
    const std::vector<Keypoint>& currKeypoints,
    const std::vector<BFMatcher::Match>& matches) const {
    double totalDx = 0, totalDy = 0, totalDz = 0;

    for (const auto& match : matches) {
        double dx = currKeypoints[match.trainIdx].pixel.first - prevKeypoints[match.queryIdx].pixel.first;
        double dy = currKeypoints[match.trainIdx].pixel.second - prevKeypoints[match.queryIdx].pixel.second;
        totalDx += dx * 0.01;
        totalDy += dy * 0.01;
    }

    double avgTranslation = matches.empty() ? 1.0 : 1.0 / matches.size();

    Pose pose;
    pose.position.x = totalDx * avgTranslation;
    pose.position.y = totalDy * avgTranslation;
    pose.position.z = totalDz * avgTranslation;
    pose.orientation = {0, 0, 0, 1};
    pose.timestamp = nowMs();
    return pose;
}

bool EnhancedLocalization::shouldCreateKeyframe(const FeatureExtractionResult& /*features*/) const {
    if (!referenceKeyframe_) return true;

    double dx = currentPose_.position.x - referenceKeyframe_->pose.position.x;
    double dy = currentPose_.position.y - referenceKeyframe_->pose.position.y;
    double dz = currentPose_.position.z - referenceKeyframe_->pose.position.z;
    return std::sqrt(dx*dx + dy*dy + dz*dz) > config_.keyframeDistanceThreshold;
}

void EnhancedLocalization::createKeyframe(const FeatureExtractionResult& features, int64_t timestamp) {
    Keyframe kf;
    kf.id = "kf-" + std::to_string(sequenceNumber_++);
    kf.pose = currentPose_;
    kf.keypoints = features.keypoints;
    kf.descriptors = features.descriptors;
    kf.timestamp = timestamp;
    kf.sequenceNumber = sequenceNumber_;

    keyframes_.push_back(kf);
    referenceKeyframe_ = &keyframes_.back();

    if (keyframes_.size() > 1) {
        auto& prevKf = keyframes_[keyframes_.size() - 2];
        auto relPose = computeRelativePose(prevKf.pose, kf.pose);

        KeyframeConnection conn;
        conn.keyframeId = prevKf.id;
        conn.relativePose = relPose;
        conn.informationMatrix = createInformationMatrix("ODOMETRY");
        conn.edgeType = "ODOMETRY";
        kf.connections.push_back(conn);

        poseGraphManager_.addKeyframe(kf);

        if (keyframes_.size() % 10 == 0) {
            optimizePoseGraph();
        }
    }

    addMapPoints(features);
}

void EnhancedLocalization::addMapPoints(const FeatureExtractionResult& features) {
    for (size_t i = 0; i < features.keypoints.size(); ++i) {
        std::string pointId = "mp-" + std::to_string(mapPoints_.size() + 1);
        Vector3* pos = triangulatePoint(*referenceKeyframe_, features.keypoints[i]);
        if (pos) {
            MapPoint mp;
            mp.id = pointId;
            mp.position = *pos;
            mp.descriptor = features.descriptors[i];
            mp.observationCount = 1;
            mp.score = features.keypoints[i].response;
            mp.createdAt = nowMs();
            mp.lastObservedAt = nowMs();
            mapPoints_[pointId] = mp;
            delete pos;
        }
    }
}

Vector3* EnhancedLocalization::triangulatePoint(const Keyframe& keyframe1, const Keypoint& keypoint2) const {
    double baseline = 0.1;
    double depth = keypoint2.size * baseline;
    if (depth < 0.1 || depth > 100) return nullptr;

    auto* pos = new Vector3;
    pos->x = keyframe1.pose.position.x + keypoint2.pixel.first * 0.01;
    pos->y = keyframe1.pose.position.y + keypoint2.pixel.second * 0.01;
    pos->z = keyframe1.pose.position.z + depth;
    return pos;
}

MapUpdateInfo EnhancedLocalization::updateMap(const SLAMObservation& observation) {
    localize(observation);

    int beforeCount = static_cast<int>(mapPoints_.size());
    bool loopClosureDetected = false;

    if (config_.enableLoopClosure) {
        auto loopClosure = detectLoopClosure();
        if (!loopClosure.currentKeyframeId.empty()) {
            applyLoopClosure(loopClosure);
            loopClosureDetected = true;
        }
    }

    pruneMapPoints();
    int prunedCount = beforeCount - static_cast<int>(mapPoints_.size());

    MapUpdateInfo info;
    info.keyframeAdded = shouldCreateKeyframe(featureExtractor_->extract(observation));
    info.newPointsCount = 0;
    info.prunedPointsCount = prunedCount;
    info.optimizationPerformed = false;
    info.loopClosureDetected = loopClosureDetected;
    return info;
}

LoopClosure EnhancedLocalization::detectLoopClosure() const {
    LoopClosure lc;
    int64_t now = nowMs();
    if (now - currentState_.lastLoopClosureTime < config_.loopClosureInterval) return lc;
    if (keyframes_.size() < 10) return lc;

    const auto& currentKf = keyframes_.back();

    for (size_t i = 0; i < keyframes_.size() - 10; ++i) {
        const auto& candidateKf = keyframes_[i];

        BFMatcher matcher(BFMatcher::HAMMING);
        auto matches = matcher.matchWithRatio(currentKf.descriptors, candidateKf.descriptors, config_.matchRatioThreshold);

        const int minLoopClosureMatches = 20;
        if (static_cast<int>(matches.size()) >= minLoopClosureMatches) {
            auto relPose = computeRelativePose(candidateKf.pose, currentKf.pose);
            int inlierCount = verifyLoopClosure(currentKf, candidateKf, matches);

            if (inlierCount >= minLoopClosureMatches / 2) {
                lc.currentKeyframeId = currentKf.id;
                lc.matchedKeyframeId = candidateKf.id;
                lc.relativePose = relPose;
                lc.inlierCount = inlierCount;
                lc.confidence = static_cast<double>(inlierCount) / matches.size();
                return lc;
            }
        }
    }
    return lc;
}

int EnhancedLocalization::verifyLoopClosure(
    const Keyframe& kf1, const Keyframe& kf2,
    const std::vector<BFMatcher::Match>& matches) const {
    int inlierCount = 0;
    for (const auto& match : matches) {
        double relX = kf2.keypoints[match.trainIdx].pixel.first - kf1.keypoints[match.queryIdx].pixel.first;
        double relY = kf2.keypoints[match.trainIdx].pixel.second - kf1.keypoints[match.queryIdx].pixel.second;
        double dx = kf2.pose.position.x - kf1.pose.position.x;
        double dy = kf2.pose.position.y - kf1.pose.position.y;
        double expectedRelX = dx * 100;
        double expectedRelY = dy * 100;
        double error = std::sqrt((relX - expectedRelX)*(relX - expectedRelX) + (relY - expectedRelY)*(relY - expectedRelY));
        if (error < config_.maxCorrespondenceDistance) inlierCount++;
    }
    return inlierCount;
}

void EnhancedLocalization::applyLoopClosure(const LoopClosure& loopClosure) {
    poseGraphManager_.addLoopClosure(loopClosure.matchedKeyframeId, loopClosure.currentKeyframeId, loopClosure.relativePose);
    optimizePoseGraph();
    currentState_.lastLoopClosureTime = nowMs();
    currentState_.loopClosureCount++;
    updateMapPointPositions();
}

void EnhancedLocalization::optimizePoseGraph() {
    auto result = poseGraphManager_.optimize();
    if (result.converged) {
        for (auto& [id, pose] : result.poses) {
            for (auto& kf : keyframes_) {
                if (kf.id == id) {
                    kf.pose = pose;
                    break;
                }
            }
        }
        if (!keyframes_.empty()) {
            currentPose_ = keyframes_.back().pose;
        }
    }
}

void EnhancedLocalization::updateMapPointPositions() {
    if (keyframes_.empty()) return;
    const auto& lastPose = keyframes_.back().pose;
    for (auto& [id, mp] : mapPoints_) {
        mp.position.x += (lastPose.position.x - currentPose_.position.x) * 0.1;
        mp.position.y += (lastPose.position.y - currentPose_.position.y) * 0.1;
        mp.position.z += (lastPose.position.z - currentPose_.position.z) * 0.1;
    }
}

void EnhancedLocalization::pruneMapPoints() {
    int64_t now = nowMs();
    int64_t maxAge = 5000;
    int minObservations = 3;
    double minScore = 0.01;

    for (auto it = mapPoints_.begin(); it != mapPoints_.end(); ) {
        int64_t age = now - it->second.lastObservedAt;
        if (age > maxAge || it->second.observationCount < minObservations || it->second.score < minScore) {
            it = mapPoints_.erase(it);
        } else {
            ++it;
        }
    }

    int maxMapPoints = 1000;
    if (static_cast<int>(mapPoints_.size()) > maxMapPoints) {
        std::vector<std::pair<double, std::string>> scored;
        for (const auto& [id, mp] : mapPoints_) {
            scored.emplace_back(mp.score, id);
        }
        std::sort(scored.begin(), scored.end());
        int toRemove = static_cast<int>(mapPoints_.size()) - maxMapPoints;
        for (int i = 0; i < toRemove; ++i) {
            mapPoints_.erase(scored[i].second);
        }
    }
}

Pose EnhancedLocalization::getPose() const { return currentPose_; }
SLAMState EnhancedLocalization::getState() const { return currentState_; }

Pose EnhancedLocalization::toStateEstimate() const {
    Pose est;
    est.position = currentPose_.position;
    est.orientation = currentPose_.orientation;
    est.timestamp = currentPose_.timestamp;
    return est;
}

EnhancedLocalization::MapStatistics EnhancedLocalization::getMapStatistics() const {
    MapStatistics stats;
    stats.mapPointCount = static_cast<int>(mapPoints_.size());
    stats.keyframeCount = static_cast<int>(keyframes_.size());
    int totalObs = 0;
    for (const auto& [_, mp] : mapPoints_) totalObs += mp.observationCount;
    stats.averageObservations = mapPoints_.empty() ? 0.0 : static_cast<double>(totalObs) / mapPoints_.size();
    stats.isInitialized = currentState_.isInitialized;
    return stats;
}

void EnhancedLocalization::reset() {
    currentPose_ = Pose{};
    currentPose_.orientation.w = 1.0;
    currentPose_.timestamp = nowMs();

    currentState_ = SLAMState{};
    currentState_.pose = currentPose_;
    currentState_.status = "INITIALIZING";

    mapPoints_.clear();
    keyframes_.clear();
    referenceKeyframe_ = nullptr;
    previousDescriptors_.clear();
    previousKeypoints_.clear();
    sequenceNumber_ = 0;
    poseGraphManager_.clear();
}

Pose EnhancedLocalization::composePose(const Pose& base, const Pose& relative) const {
    Pose result;
    result.position.x = base.position.x + relative.position.x;
    result.position.y = base.position.y + relative.position.y;
    result.position.z = base.position.z + relative.position.z;

    double nx = base.orientation.w * relative.orientation.x
              + base.orientation.x * relative.orientation.w
              + base.orientation.y * relative.orientation.z
              - base.orientation.z * relative.orientation.y;
    double ny = base.orientation.w * relative.orientation.y
              - base.orientation.x * relative.orientation.z
              + base.orientation.y * relative.orientation.w
              + base.orientation.z * relative.orientation.x;
    double nz = base.orientation.w * relative.orientation.z
              + base.orientation.x * relative.orientation.y
              - base.orientation.y * relative.orientation.x
              + base.orientation.z * relative.orientation.w;
    double nw = base.orientation.w * relative.orientation.w
              - base.orientation.x * relative.orientation.x
              - base.orientation.y * relative.orientation.y
              - base.orientation.z * relative.orientation.z;
    double len = std::sqrt(nx*nx + ny*ny + nz*nz + nw*nw);
    if (len > 0) {
        result.orientation.x = nx/len; result.orientation.y = ny/len;
        result.orientation.z = nz/len; result.orientation.w = nw/len;
    } else {
        result.orientation = base.orientation;
    }
    result.timestamp = relative.timestamp;
    return result;
}

Pose EnhancedLocalization::computeRelativePose(const Pose& pose1, const Pose& pose2) const {
    Pose result;
    result.position.x = pose2.position.x - pose1.position.x;
    result.position.y = pose2.position.y - pose1.position.y;
    result.position.z = pose2.position.z - pose1.position.z;
    result.orientation.x = pose2.orientation.x - pose1.orientation.x;
    result.orientation.y = pose2.orientation.y - pose1.orientation.y;
    result.orientation.z = pose2.orientation.z - pose1.orientation.z;
    result.orientation.w = pose2.orientation.w;
    result.timestamp = pose2.timestamp;
    return result;
}

std::vector<std::vector<double>> EnhancedLocalization::createInformationMatrix(const std::string& edgeType) const {
    double scale = (edgeType == "LOOP_CLOSURE") ? 10.0 : 100.0;
    std::vector<std::vector<double>> m(6, std::vector<double>(6, 0));
    for (int i = 0; i < 3; ++i) m[i][i] = scale;
    for (int i = 3; i < 6; ++i) m[i][i] = scale * 0.1;
    return m;
}

} // namespace localization
} // namespace atlas_navigation
