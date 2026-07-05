#include "atlas_navigation/SLAM/SLAMEngine.h"
#include <algorithm>
#include <cmath>
#include <chrono>

namespace atlas_navigation {
namespace slam {

SLAMEngine::SLAMEngine(const SLAMEngineConfig& config) : config_(config) {
    currentMap_.id = "map-" + std::to_string(nowMs());
    currentMap_.resolution = config_.resolution;
    currentMap_.timestamp = nowMs();
    currentEstimate_.timestamp = nowMs();
}

LocalMap SLAMEngine::processObservation(const Observation& observation) {
    observationCount_++;
    updateEstimate(observation);

    if (observation.type == "OBJECT_DETECTED") updateMapFromDetection(observation);
    else if (observation.type == "ODOMETRY") updateFromOdometry(observation);
    else if (observation.type == "POSE") updateFromPose(observation);

    if (shouldCreateKeyframe()) createKeyframe();

    if (config_.enableLoopClosure) {
        auto loopClosure = detectLoopClosure();
        if (loopClosure.detected) applyLoopClosure(loopClosure);
    }

    pruneObjects();
    currentMap_.timestamp = nowMs();
    return currentMap_;
}

void SLAMEngine::updateEstimate(const Observation& observation) {
    if (observation.type == "POSE" || observation.type == "ODOMETRY") {
        double alpha = computeUpdateWeight(observation.uncertainty);
        if (observation.data.position.has_value()) {
            auto pos = observation.data.position.value();
            currentEstimate_.position.x = currentEstimate_.position.x * (1 - alpha) + pos.x * alpha;
            currentEstimate_.position.y = currentEstimate_.position.y * (1 - alpha) + pos.y * alpha;
            currentEstimate_.position.z = currentEstimate_.position.z * (1 - alpha) + pos.z * alpha;
        }
        if (observation.data.orientation.has_value()) {
            currentEstimate_.orientation = observation.data.orientation.value();
        }
        if (observation.data.velocity.has_value()) {
            double dt = estimateDeltaTime();
            auto vel = observation.data.velocity.value();
            currentEstimate_.position.x += vel.x * dt;
            currentEstimate_.position.y += vel.y * dt;
            currentEstimate_.position.z += vel.z * dt;
            currentEstimate_.velocity = vel;
        }
        currentEstimate_.timestamp = observation.timestamp;
        currentEstimate_.confidence = std::max(0.0, std::min(1.0, 1.0 - observation.uncertainty));
    }
}

void SLAMEngine::updateMapFromDetection(const Observation& observation) {
    auto pos = observation.data.position.value_or(Vector3{0, 0, 0});
    auto it = std::find_if(currentMap_.objects.begin(), currentMap_.objects.end(),
        [&](const MapObject& obj) { return obj.label == observation.data.object; });

    if (it != currentMap_.objects.end()) {
        double k = observation.data.confidence;
        it->position.x = it->position.x * (1 - k) + pos.x * k;
        it->position.y = it->position.y * (1 - k) + pos.y * k;
        it->position.z = it->position.z * (1 - k) + pos.z * k;
        it->confidence = std::max(it->confidence, observation.data.confidence);
        it->lastSeen = nowMs();
    } else {
        MapObject obj;
        obj.id = "obj-" + std::to_string(currentMap_.objects.size() + 1);
        obj.label = observation.data.object;
        obj.position = pos;
        obj.confidence = observation.data.confidence;
        obj.lastSeen = nowMs();
        currentMap_.objects.push_back(obj);
    }
}

void SLAMEngine::updateFromOdometry(const Observation& observation) {
    double dt = estimateDeltaTime();
    if (observation.data.velocity.has_value()) {
        auto vel = observation.data.velocity.value();
        currentEstimate_.position.x += vel.x * dt;
        currentEstimate_.position.y += vel.y * dt;
        currentEstimate_.position.z += vel.z * dt;
        currentEstimate_.velocity = vel;
    }
    currentEstimate_.timestamp = observation.timestamp;
}

void SLAMEngine::updateFromPose(const Observation& observation) {
    if (observation.data.position.has_value()) {
        currentEstimate_.position = observation.data.position.value();
    }
    if (observation.data.orientation.has_value()) {
        currentEstimate_.orientation = observation.data.orientation.value();
    }
    if (observation.data.velocity.has_value()) {
        currentEstimate_.velocity = observation.data.velocity.value();
    }
    currentEstimate_.timestamp = observation.timestamp;
}

bool SLAMEngine::shouldCreateKeyframe() const {
    if (lastKeyframeId_.empty()) return true;
    auto it = keyframes_.find(lastKeyframeId_);
    if (it == keyframes_.end()) return true;

    double dx = currentEstimate_.position.x - it->second.estimate.position.x;
    double dy = currentEstimate_.position.y - it->second.estimate.position.y;
    double dz = currentEstimate_.position.z - it->second.estimate.position.z;
    return std::sqrt(dx*dx + dy*dy + dz*dz) > config_.keyframeDistanceThreshold;
}

void SLAMEngine::createKeyframe() {
    SLAMKeyframe kf;
    kf.id = "kf-" + std::to_string(observationCount_);
    kf.estimate = currentEstimate_;
    kf.objects = currentMap_.objects;
    kf.timestamp = nowMs();

    if (!lastKeyframeId_.empty()) {
        auto prevIt = keyframes_.find(lastKeyframeId_);
        if (prevIt != keyframes_.end()) {
            auto relTransform = computeRelativeTransform(prevIt->second.estimate, currentEstimate_);
            KeyframeConnection conn;
            conn.keyframeId = lastKeyframeId_;
            conn.relativePose = relTransform;
            conn.edgeType = "ODOMETRY";
            // Create default info matrix
            auto info = std::vector<std::vector<double>>(6, std::vector<double>(6, 0));
            for (int i = 0; i < 3; ++i) info[i][i] = 100.0;
            for (int i = 3; i < 6; ++i) info[i][i] = 10.0;
            conn.informationMatrix = info;
            kf.connections.push_back(conn);
            addPoseGraphEdge(lastKeyframeId_, kf.id, conn);
        }
    }

    keyframes_[kf.id] = kf;
    lastKeyframeId_ = kf.id;
}

LoopClosureResult SLAMEngine::detectLoopClosure() const {
    LoopClosureResult result;
    if (keyframes_.size() < 5) return result;

    auto currentIt = keyframes_.find(lastKeyframeId_);
    if (currentIt == keyframes_.end()) return result;

    std::vector<SLAMKeyframe> kfArray;
    for (const auto& [_, kf] : keyframes_) kfArray.push_back(kf);
    int searchWindow = std::min(10, static_cast<int>(kfArray.size()) - 1);

    for (int i = 0; i < searchWindow; ++i) {
        const auto& candidate = kfArray[kfArray.size() - 2 - i];
        if (candidate.id == lastKeyframeId_) continue;

        double score = computeLoopClosureScore(currentIt->second.objects, candidate.objects);
        if (score >= config_.loopClosureThreshold) {
            result.detected = true;
            result.keyframeId = candidate.id;
            result.transform = computeRelativeTransform(candidate.estimate, currentEstimate_);
            result.confidence = score;
            return result;
        }
    }
    return result;
}

double SLAMEngine::computeLoopClosureScore(
    const std::vector<MapObject>& currentObjects,
    const std::vector<MapObject>& candidateObjects) const {
    if (currentObjects.empty() || candidateObjects.empty()) return 0;

    int matches = 0;
    for (const auto& curObj : currentObjects) {
        for (const auto& candObj : candidateObjects) {
            if (curObj.label == candObj.label) {
                double dx = curObj.position.x - candObj.position.x;
                double dy = curObj.position.y - candObj.position.y;
                double dz = curObj.position.z - candObj.position.z;
                if (std::sqrt(dx*dx + dy*dy + dz*dz) < config_.resolution * 5) {
                    matches++;
                    break;
                }
            }
        }
    }
    return static_cast<double>(matches) / std::max(currentObjects.size(), candidateObjects.size());
}

void SLAMEngine::applyLoopClosure(const LoopClosureResult& loopClosure) {
    KeyframeConnection conn;
    conn.keyframeId = loopClosure.keyframeId;
    conn.relativePose = loopClosure.transform;
    conn.edgeType = "LOOP_CLOSURE";
    auto info = std::vector<std::vector<double>>(6, std::vector<double>(6, 0));
    for (int i = 0; i < 3; ++i) info[i][i] = 10.0;
    for (int i = 3; i < 6; ++i) info[i][i] = 1.0;
    conn.informationMatrix = info;

    auto currentIt = keyframes_.find(lastKeyframeId_);
    if (currentIt != keyframes_.end()) {
        currentIt->second.connections.push_back(conn);
    }

    addPoseGraphEdge(loopClosure.keyframeId, lastKeyframeId_, conn);
    optimizePoseGraph();
    loopClosureCount_++;
    lastLoopClosureTime_ = nowMs();
}

void SLAMEngine::addPoseGraphEdge(const std::string& fromId, const std::string& toId,
                                   const KeyframeConnection& connection) {
    poseGraph_[fromId][toId] = connection;
}

PoseGraphResult SLAMEngine::optimizePoseGraph() {
    if (keyframes_.size() < 3) {
        PoseGraphResult r;
        r.optimizedEstimate = currentEstimate_;
        r.converged = true;
        return r;
    }

    double startError = computePoseGraphError();
    int iterations = 0;
    bool converged = false;

    for (int i = 0; i < config_.optimizationIterations; ++i) {
        double error = computePoseGraphError();
        if (error < 0.001) { converged = true; break; }
        adjustKeyframes();
        iterations++;
    }

    double endError = computePoseGraphError();
    if (!lastKeyframeId_.empty()) {
        auto it = keyframes_.find(lastKeyframeId_);
        if (it != keyframes_.end()) currentEstimate_ = it->second.estimate;
    }

    PoseGraphResult r;
    r.optimizedEstimate = currentEstimate_;
    r.errorReduction = startError - endError;
    r.iterations = iterations;
    r.converged = converged;
    return r;
}

double SLAMEngine::computePoseGraphError() const {
    double totalError = 0;
    for (const auto& [fromId, connections] : poseGraph_) {
        auto fromIt = keyframes_.find(fromId);
        if (fromIt == keyframes_.end()) continue;
        for (const auto& [toId, conn] : connections) {
            auto toIt = keyframes_.find(toId);
            if (toIt == keyframes_.end()) continue;
            auto expected = computeRelativeTransform(fromIt->second.estimate, toIt->second.estimate);
            double dx = expected.position.x - conn.relativePose.position.x;
            double dy = expected.position.y - conn.relativePose.position.y;
            double dz = expected.position.z - conn.relativePose.position.z;
            totalError += dx*dx + dy*dy + dz*dz;
        }
    }
    return totalError;
}

void SLAMEngine::adjustKeyframes() {
    for (auto& [kfId, kf] : keyframes_) {
        auto connIt = poseGraph_.find(kfId);
        if (connIt == poseGraph_.end()) continue;

        double totalDx = 0, totalDy = 0, totalDz = 0, weightSum = 0;

        for (const auto& [toId, conn] : connIt->second) {
            auto toIt = keyframes_.find(toId);
            if (toIt == keyframes_.end()) continue;

            auto expected = computeRelativeTransform(kf.estimate, toIt->second.estimate);
            double dx = conn.relativePose.position.x - expected.position.x;
            double dy = conn.relativePose.position.y - expected.position.y;
            double dz = conn.relativePose.position.z - expected.position.z;

            // Use a default weight
            double weight = 1.0;
            totalDx += dx * weight;
            totalDy += dy * weight;
            totalDz += dz * weight;
            weightSum += weight;
        }

        if (weightSum > 0) {
            double scale = 0.1;
            kf.estimate.position.x += totalDx * scale / weightSum;
            kf.estimate.position.y += totalDy * scale / weightSum;
            kf.estimate.position.z += totalDz * scale / weightSum;
        }
    }
}

Pose SLAMEngine::computeRelativeTransform(const StateEstimate& from, const StateEstimate& to) const {
    Pose result;
    result.position.x = to.position.x - from.position.x;
    result.position.y = to.position.y - from.position.y;
    result.position.z = to.position.z - from.position.z;
    result.orientation = from.orientation;
    return result;
}

void SLAMEngine::pruneObjects() {
    int64_t now = nowMs();
    int64_t maxAge = config_.objectAgeThreshold;

    currentMap_.objects.erase(
        std::remove_if(currentMap_.objects.begin(), currentMap_.objects.end(),
            [&](const MapObject& obj) { return now - obj.lastSeen > maxAge; }),
        currentMap_.objects.end());

    if (static_cast<int>(currentMap_.objects.size()) > config_.maxObjects) {
        std::sort(currentMap_.objects.begin(), currentMap_.objects.end(),
            [](const MapObject& a, const MapObject& b) { return a.confidence < b.confidence; });
        currentMap_.objects.resize(static_cast<size_t>(config_.maxObjects));
    }
}

double SLAMEngine::computeUpdateWeight(double uncertainty) const {
    return std::max(0.01, std::min(0.99, 1.0 / (uncertainty + 1.0)));
}

double SLAMEngine::estimateDeltaTime() const {
    int64_t now = nowMs();
    return static_cast<double>(now - currentEstimate_.timestamp) / 1000.0;
}

LocalMap SLAMEngine::getMap() const { return currentMap_; }
StateEstimate SLAMEngine::getEstimate() const { return currentEstimate_; }

std::vector<SLAMKeyframe> SLAMEngine::getKeyframes() const {
    std::vector<SLAMKeyframe> result;
    for (const auto& [_, kf] : keyframes_) result.push_back(kf);
    return result;
}

SLAMEngine::PoseGraphStats SLAMEngine::getPoseGraphStats() const {
    PoseGraphStats stats;
    stats.vertexCount = static_cast<int>(keyframes_.size());
    int edgeCount = 0;
    for (const auto& [_, conns] : poseGraph_) edgeCount += static_cast<int>(conns.size());
    stats.edgeCount = edgeCount;
    stats.loopClosureCount = loopClosureCount_;
    return stats;
}

void SLAMEngine::clearMap() { currentMap_.objects.clear(); currentMap_.timestamp = nowMs(); }

void SLAMEngine::reset() {
    clearMap();
    keyframes_.clear();
    poseGraph_.clear();
    currentEstimate_ = StateEstimate{};
    currentEstimate_.timestamp = nowMs();
    lastKeyframeId_.clear();
    observationCount_ = 0;
    loopClosureCount_ = 0;
    lastLoopClosureTime_ = 0;
}

} // namespace slam
} // namespace atlas_navigation
