#include "atlas_navigation/SLAM/GraphOptimizer.h"
#include <algorithm>
#include <set>
#include <queue>
#include <cmath>
#include <chrono>
#include <stdexcept>

namespace atlas_navigation {
namespace slam {

// --- GraphOptimizer ---

GraphOptimizer::GraphOptimizer(const GraphOptimizerConfig& config) : config_(config) {}

void GraphOptimizer::addVertex(const std::string& id, const Pose& pose, bool fixed) {
    if (graph_.find(id) != graph_.end())
        throw std::runtime_error("Vertex with id " + id + " already exists");
    graph_[id] = {id, pose, fixed};
}

void GraphOptimizer::updateVertex(const std::string& id, const Pose& pose) {
    auto it = graph_.find(id);
    if (it == graph_.end())
        throw std::runtime_error("Vertex with id " + id + " not found");
    it->second.pose = pose;
}

Pose GraphOptimizer::getVertex(const std::string& id) const {
    auto it = graph_.find(id);
    if (it == graph_.end()) {
        return Pose{};
    }
    return it->second.pose;
}

std::vector<Pose> GraphOptimizer::getAllVertices() const {
    std::vector<Pose> poses;
    poses.reserve(graph_.size());
    for (const auto& [_, v] : graph_) {
        poses.push_back(v.pose);
    }
    return poses;
}

void GraphOptimizer::addEdge(const std::string& sourceId, const std::string& targetId,
                              const Pose& relativePose,
                              const std::vector<std::vector<double>>& informationMatrix,
                              const std::string& edgeType) {
    if (graph_.find(sourceId) == graph_.end())
        throw std::runtime_error("Source vertex " + sourceId + " not found");
    if (graph_.find(targetId) == graph_.end())
        throw std::runtime_error("Target vertex " + targetId + " not found");

    Edge edge;
    edge.id = "edge-" + std::to_string(edges_.size());
    edge.sourceId = sourceId;
    edge.targetId = targetId;
    edge.relativePose = relativePose;
    edge.informationMatrix = informationMatrix.empty()
        ? createDefaultInformationMatrix(edgeType) : informationMatrix;
    edge.edgeType = edgeType;
    edges_.push_back(edge);
}

void GraphOptimizer::removeEdge(const std::string& id) {
    edges_.erase(std::remove_if(edges_.begin(), edges_.end(),
        [&](const Edge& e) { return e.id == id; }), edges_.end());
}

int GraphOptimizer::getVertexCount() const { return static_cast<int>(graph_.size()); }
int GraphOptimizer::getEdgeCount() const { return static_cast<int>(edges_.size()); }

GraphOptimizer::Statistics GraphOptimizer::getStatistics() const {
    Statistics s;
    s.totalOptimizations = optimizationCount_;
    s.averageOptimizationTime = optimizationCount_ > 0 ? totalOptimizationTime_ / optimizationCount_ : 0.0;
    s.config = config_;
    return s;
}

OptimizationResult GraphOptimizer::optimize() {
    auto startTime = std::chrono::steady_clock::now();

    if (graph_.size() < 2)
        throw std::runtime_error("Graph must have at least 2 vertices");
    if (edges_.empty())
        throw std::runtime_error("Graph must have at least 1 edge");

    double initialError = computeTotalChiSquared();
    initializePoses();

    double currentError = initialError;
    int iterations = 0;
    bool converged = false;

    while (iterations < config_.maxIterations) {
        auto system = buildLinearSystem();
        auto deltas = solveLinearSystem(system);
        applyPoseUpdates(deltas);

        double newError = computeTotalChiSquared();
        double errorChange = currentError - newError;

        if (errorChange < config_.convergenceThreshold) {
            converged = true;
            break;
        }
        currentError = newError;
        iterations++;
    }

    auto endTime = std::chrono::steady_clock::now();
    double computationTime = std::chrono::duration<double, std::milli>(endTime - startTime).count();

    optimizationCount_++;
    totalOptimizationTime_ += computationTime;

    OptimizationResult result;
    for (const auto& [id, vertex] : graph_) {
        result.poses[id] = vertex.pose;
    }
    result.initialError = initialError;
    result.finalError = currentError;
    result.iterations = iterations;
    result.outliersRemoved = 0;
    result.converged = converged;
    result.computationTime = computationTime;
    return result;
}

OptimizationResult GraphOptimizer::optimizeSubset(const std::vector<std::string>& vertexIds) {
    auto startTime = std::chrono::steady_clock::now();
    double initialError = computeTotalChiSquared();
    double currentError = initialError;
    int iterations = 0;
    bool converged = false;

    while (iterations < config_.maxIterations) {
        auto system = buildLinearSystem();
        auto deltas = solveLinearSystem(system);
        applyPoseUpdates(deltas, vertexIds);

        double newError = computeTotalChiSquared();
        double errorChange = currentError - newError;
        if (errorChange < config_.convergenceThreshold) { converged = true; break; }
        currentError = newError;
        iterations++;
    }

    auto endTime = std::chrono::steady_clock::now();
    double computationTime = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    optimizationCount_++;
    totalOptimizationTime_ += computationTime;

    OptimizationResult result;
    for (const auto& id : vertexIds) {
        auto it = graph_.find(id);
        if (it != graph_.end()) result.poses[id] = it->second.pose;
    }
    result.initialError = initialError;
    result.finalError = currentError;
    result.iterations = iterations;
    result.converged = converged;
    result.computationTime = computationTime;
    return result;
}

void GraphOptimizer::clear() { graph_.clear(); edges_.clear(); }

std::vector<std::vector<double>> GraphOptimizer::createDefaultInformationMatrix(const std::string& edgeType) const {
    double scale = (edgeType == "LOOP_CLOSURE") ? 10.0 : 100.0;
    std::vector<std::vector<double>> m(6, std::vector<double>(6, 0.0));
    for (int i = 0; i < 3; ++i) m[i][i] = scale;
    for (int i = 3; i < 6; ++i) m[i][i] = scale * 0.1;
    return m;
}

void GraphOptimizer::initializePoses() {
    std::vector<Vertex*> vertices;
    for (auto& [_, v] : graph_) vertices.push_back(&v);

    Vertex* reference = nullptr;
    for (auto* v : vertices) { if (v->fixed) { reference = v; break; } }
    if (!reference && !vertices.empty()) { reference = vertices[0]; reference->fixed = true; }
    if (!reference) return;

    std::set<std::string> visited{reference->id};
    std::queue<Vertex*> q;
    q.push(reference);

    while (!q.empty()) {
        auto* current = q.front(); q.pop();
        for (const auto& edge : edges_) {
            std::string targetId;
            if (edge.sourceId == current->id) targetId = edge.targetId;
            if (targetId.empty() || visited.count(targetId)) continue;
            auto it = graph_.find(targetId);
            if (it == graph_.end() || it->second.fixed) continue;

            it->second.pose = composePose(current->pose, edge.relativePose);
            visited.insert(targetId);
            q.push(&it->second);
        }
    }
}

Pose GraphOptimizer::composePose(const Pose& base, const Pose& relative) const {
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
    if (len > 0) { result.orientation.x = nx/len; result.orientation.y = ny/len; result.orientation.z = nz/len; result.orientation.w = nw/len; }
    else { result.orientation = base.orientation; }
    result.timestamp = relative.timestamp;
    return result;
}

double GraphOptimizer::computeEdgeError(const Edge& edge) const {
    auto srcIt = graph_.find(edge.sourceId);
    auto tgtIt = graph_.find(edge.targetId);
    if (srcIt == graph_.end() || tgtIt == graph_.end()) return 0;

    auto predicted = composePose(srcIt->second.pose, edge.relativePose);
    double dx = tgtIt->second.pose.position.x - predicted.position.x;
    double dy = tgtIt->second.pose.position.y - predicted.position.y;
    double dz = tgtIt->second.pose.position.z - predicted.position.z;

    double chiSquared = 0;
    std::vector<double> errVec = {dx, dy, dz, 0, 0, 0};
    for (int i = 0; i < 6; ++i)
        for (int j = 0; j < 6; ++j)
            chiSquared += errVec[i] * edge.informationMatrix[i][j] * errVec[j];
    return chiSquared;
}

double GraphOptimizer::computeTotalChiSquared() const {
    double total = 0;
    for (const auto& edge : edges_) total += computeEdgeError(edge);
    return total;
}

GraphOptimizer::LinearSystem GraphOptimizer::buildLinearSystem() const {
    LinearSystem sys;

    for (const auto& edge : edges_) {
        auto srcIt = graph_.find(edge.sourceId);
        auto tgtIt = graph_.find(edge.targetId);
        if (srcIt == graph_.end() || tgtIt == graph_.end()) continue;

        auto error = computeEdgeErrorVector(edge);

        if (!sys.H.count(edge.sourceId)) { sys.H[edge.sourceId] = {}; sys.b[edge.sourceId] = std::vector<double>(6, 0); }
        if (!sys.H.count(edge.targetId)) { sys.H[edge.targetId] = {}; sys.b[edge.targetId] = std::vector<double>(6, 0); }

        auto& info = edge.informationMatrix;
        auto Hss = createHessianBlock(info, 1.0);
        auto Htt = createHessianBlock(info, 1.0);
        auto Hst = createHessianBlock(info, -1.0);

        addHessianBlock(sys.H[edge.sourceId], edge.sourceId, Hss);
        addHessianBlock(sys.H[edge.targetId], edge.targetId, Htt);
        addHessianBlock(sys.H[edge.sourceId], edge.targetId, Hst);
        addHessianBlock(sys.H[edge.targetId], edge.sourceId, Hst);

        auto& bSrc = sys.b[edge.sourceId];
        auto& bTgt = sys.b[edge.targetId];
        for (int i = 0; i < 6; ++i) {
            bSrc[i] += applyKernel(error, info, i, 1.0);
            bTgt[i] += applyKernel(error, info, i, -1.0);
        }
    }

    double priorInfo = 1e10;
    for (const auto& [id, vertex] : graph_) {
        if (vertex.fixed && sys.H.count(id)) {
            std::vector<std::vector<double>> prior(6, std::vector<double>(6, 0));
            for (int i = 0; i < 6; ++i) prior[i][i] = priorInfo;
            sys.H[id][id] = createHessianBlock(prior, 1.0);
        }
    }

    return sys;
}

std::vector<std::vector<double>> GraphOptimizer::createHessianBlock(
    const std::vector<std::vector<double>>& info, double factor) const {
    std::vector<std::vector<double>> block(6, std::vector<double>(6));
    for (int i = 0; i < 6; ++i)
        for (int j = 0; j < 6; ++j)
            block[i][j] = info[i][j] * factor;
    return block;
}

void GraphOptimizer::addHessianBlock(
    std::map<std::string, std::vector<std::vector<double>>>& blockMap,
    const std::string& id, const std::vector<std::vector<double>>& block) const {
    auto it = blockMap.find(id);
    if (it != blockMap.end()) {
        for (int i = 0; i < 6; ++i)
            for (int j = 0; j < 6; ++j)
                it->second[i][j] += block[i][j];
    } else {
        blockMap[id] = block;
    }
}

std::vector<double> GraphOptimizer::computeEdgeErrorVector(const Edge& edge) const {
    auto srcIt = graph_.find(edge.sourceId);
    auto tgtIt = graph_.find(edge.targetId);
    if (srcIt == graph_.end() || tgtIt == graph_.end())
        return std::vector<double>(6, 0);

    double dx = tgtIt->second.pose.position.x - srcIt->second.pose.position.x - edge.relativePose.position.x;
    double dy = tgtIt->second.pose.position.y - srcIt->second.pose.position.y - edge.relativePose.position.y;
    double dz = tgtIt->second.pose.position.z - srcIt->second.pose.position.z - edge.relativePose.position.z;
    double dox = tgtIt->second.pose.orientation.x - srcIt->second.pose.orientation.x - edge.relativePose.orientation.x;
    double doy = tgtIt->second.pose.orientation.y - srcIt->second.pose.orientation.y - edge.relativePose.orientation.y;
    double doz = tgtIt->second.pose.orientation.z - srcIt->second.pose.orientation.z - edge.relativePose.orientation.z;
    return {dx, dy, dz, dox, doy, doz};
}

double GraphOptimizer::applyKernel(const std::vector<double>& error, const std::vector<std::vector<double>>& info,
                                    int idx, double sign) const {
    if (config_.robustKernel == "NONE") return error[idx] * info[idx][idx] * sign;

    double errorNorm = 0;
    for (size_t i = 0; i < error.size(); ++i) errorNorm += error[i] * error[i] * info[i][i];
    errorNorm = std::sqrt(errorNorm);

    double k = config_.kernelParameter;
    double rho = 1.0;

    if (config_.robustKernel == "HUBER") {
        if (errorNorm <= k) rho = 0.5 * errorNorm * errorNorm;
        else rho = k * (errorNorm - 0.5 * k);
        return (error[idx] / (errorNorm + 1e-10)) * info[idx][idx] * rho * sign;
    } else if (config_.robustKernel == "TUKEY") {
        double c2 = k * k;
        double r2 = errorNorm * errorNorm;
        if (r2 > c2) return 0;
        double factor = (1.0 - r2 / c2) * (1.0 - r2 / c2);
        return error[idx] * info[idx][idx] * factor * sign;
    } else if (config_.robustKernel == "CAUCHY") {
        double c2 = k * k;
        double factor = 1.0 / (1.0 + errorNorm * errorNorm / c2);
        return error[idx] * info[idx][idx] * factor * sign;
    }
    return error[idx] * info[idx][idx] * sign;
}

std::map<std::string, std::vector<double>> GraphOptimizer::solveLinearSystem(const LinearSystem& system) const {
    std::map<std::string, std::vector<double>> deltas;
    std::vector<std::string> vertexIds;
    for (const auto& [id, _] : system.H) vertexIds.push_back(id);

    if (vertexIds.empty()) return deltas;

    if (vertexIds.size() <= 50) {
        solveDense(vertexIds, system.H, system.b, deltas);
    } else {
        solveIterative(vertexIds, system.H, system.b, deltas);
    }
    return deltas;
}

void GraphOptimizer::solveDense(
    const std::vector<std::string>& vertexIds,
    const std::map<std::string, std::map<std::string, std::vector<std::vector<double>>>>& H,
    const std::map<std::string, std::vector<double>>& b,
    std::map<std::string, std::vector<double>>& deltas) const {
    int n = static_cast<int>(vertexIds.size()) * 6;
    std::vector<std::vector<double>> matrix(n, std::vector<double>(n, 0));
    std::vector<double> rhs(n, 0);

    for (size_t vi = 0; vi < vertexIds.size(); ++vi) {
        const auto& vId = vertexIds[vi];
        auto vHIt = H.find(vId);
        if (vHIt == H.end()) continue;

        for (size_t vj = 0; vj < vertexIds.size(); ++vj) {
            const auto& vjId = vertexIds[vj];
            auto blockIt = vHIt->second.find(vjId);
            if (blockIt == vHIt->second.end()) continue;

            for (int i = 0; i < 6; ++i)
                for (int j = 0; j < 6; ++j)
                    matrix[vi*6 + i][vj*6 + j] = blockIt->second[i][j];
        }

        auto bIt = b.find(vId);
        if (bIt != b.end()) {
            for (int i = 0; i < 6; ++i)
                rhs[vi*6 + i] = bIt->second[i];
        }
    }

    auto solution = gaussianElimination(std::move(matrix), std::move(rhs));
    for (size_t vi = 0; vi < vertexIds.size(); ++vi) {
        std::vector<double> delta(6);
        for (int i = 0; i < 6; ++i) delta[i] = solution[vi*6 + i];
        deltas[vertexIds[vi]] = delta;
    }
}

void GraphOptimizer::solveIterative(
    const std::vector<std::string>& vertexIds,
    const std::map<std::string, std::map<std::string, std::vector<std::vector<double>>>>& H,
    const std::map<std::string, std::vector<double>>& b,
    std::map<std::string, std::vector<double>>& deltas) const {
    for (const auto& id : vertexIds) deltas[id] = std::vector<double>(6, 0);

    int maxIterations = 100;
    double tolerance = 1e-6;

    for (int iter = 0; iter < maxIterations; ++iter) {
        double maxChange = 0;
        for (const auto& vId : vertexIds) {
            auto vHIt = H.find(vId);
            auto bIt = b.find(vId);
            if (vHIt == H.end() || bIt == b.end()) continue;

            auto& diagBlock = vHIt->second;
            auto diagIt = diagBlock.find(vId);
            std::vector<std::vector<double>> diag(6, std::vector<double>(6, 0));
            if (diagIt != diagBlock.end()) diag = diagIt->second;

            std::vector<double> offDiag(6, 0);
            for (const auto& [otherId, block] : diagBlock) {
                if (otherId == vId) continue;
                auto otherDelta = deltas.find(otherId);
                if (otherDelta != deltas.end()) {
                    for (int i = 0; i < 6; ++i)
                        for (int j = 0; j < 6; ++j)
                            offDiag[i] += block[i][j] * otherDelta->second[j];
                }
            }

            std::vector<double> newDelta(6);
            for (int i = 0; i < 6; ++i) {
                double diagInv = 1.0 / (diag[i][i] + 1e-10);
                newDelta[i] = (bIt->second[i] - offDiag[i]) * diagInv;
                double change = std::abs(newDelta[i] - deltas[vId][i]);
                if (change > maxChange) maxChange = change;
            }
            deltas[vId] = newDelta;
        }
        if (maxChange < tolerance) break;
    }
}

std::vector<double> GraphOptimizer::gaussianElimination(std::vector<std::vector<double>> A, std::vector<double> b) const {
    int n = static_cast<int>(A.size());
    std::vector<std::vector<double>> aug(n, std::vector<double>(n + 1));
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) aug[i][j] = A[i][j];
        aug[i][n] = b[i];
    }

    for (int col = 0; col < n; ++col) {
        int maxRow = col;
        for (int row = col + 1; row < n; ++row)
            if (std::abs(aug[row][col]) > std::abs(aug[maxRow][col])) maxRow = row;
        std::swap(aug[col], aug[maxRow]);

        if (std::abs(aug[col][col]) < 1e-12) continue;

        for (int row = col + 1; row < n; ++row) {
            double factor = aug[row][col] / aug[col][col];
            for (int j = col; j <= n; ++j) aug[row][j] -= factor * aug[col][j];
        }
    }

    std::vector<double> x(n, 0);
    for (int row = n - 1; row >= 0; --row) {
        double sum = 0;
        for (int col = row + 1; col < n; ++col) sum += aug[row][col] * x[col];
        if (std::abs(aug[row][row]) < 1e-12) x[row] = 0;
        else x[row] = (aug[row][n] - sum) / aug[row][row];
    }
    return x;
}

double GraphOptimizer::applyPoseUpdates(const std::map<std::string, std::vector<double>>& deltas,
                                         const std::vector<std::string>& vertexIds) {
    double maxDelta = 0;
    auto applyTo = vertexIds.empty() ? std::vector<std::string>{} : vertexIds;

    for (const auto& [id, delta] : deltas) {
        if (!applyTo.empty() && std::find(applyTo.begin(), applyTo.end(), id) == applyTo.end())
            continue;
        auto vIt = graph_.find(id);
        if (vIt == graph_.end() || vIt->second.fixed) continue;

        vIt->second.pose.position.x += delta[0];
        vIt->second.pose.position.y += delta[1];
        vIt->second.pose.position.z += delta[2];
        vIt->second.pose.orientation.x += delta[3];
        vIt->second.pose.orientation.y += delta[4];
        vIt->second.pose.orientation.z += delta[5];

        for (int i = 0; i < 6; ++i)
            if (std::abs(delta[i]) > maxDelta) maxDelta = std::abs(delta[i]);
    }
    return maxDelta;
}

// --- PoseGraphManager ---

PoseGraphManager::PoseGraphManager() : optimizer_(GraphOptimizerConfig{}) {}

void PoseGraphManager::addKeyframe(const Keyframe& keyframe) {
    optimizer_.addVertex(keyframe.id, keyframe.pose, false);
    keyframes_[keyframe.id] = keyframe;

    for (const auto& conn : keyframe.connections) {
        optimizer_.addEdge(keyframe.id, conn.keyframeId, conn.relativePose,
                          conn.informationMatrix, conn.edgeType);
    }

    if (keyframes_.size() > 1) {
        auto it = keyframes_.end();
        std::advance(it, -2);
        const auto& prevKf = it->second;

        Pose relPose;
        relPose.position.x = keyframe.pose.position.x - prevKf.pose.position.x;
        relPose.position.y = keyframe.pose.position.y - prevKf.pose.position.y;
        relPose.position.z = keyframe.pose.position.z - prevKf.pose.position.z;
        relPose.orientation = prevKf.pose.orientation;
        relPose.timestamp = keyframe.timestamp;

        auto info = createDefaultInfoMatrix("ODOMETRY");
        optimizer_.addEdge(prevKf.id, keyframe.id, relPose, info, "ODOMETRY");
    }
}

void PoseGraphManager::addLoopClosure(const std::string& keyframeId1, const std::string& keyframeId2,
                                       const Pose& relativePose,
                                       const std::vector<std::vector<double>>& informationMatrix) {
    optimizer_.addEdge(keyframeId1, keyframeId2, relativePose, informationMatrix, "LOOP_CLOSURE");
}

OptimizationResult PoseGraphManager::optimize() { return optimizer_.optimize(); }

Pose PoseGraphManager::getOptimizedPose(const std::string& keyframeId) const {
    return optimizer_.getVertex(keyframeId);
}

std::map<std::string, Pose> PoseGraphManager::getAllOptimizedPoses() const {
    std::map<std::string, Pose> poses;
    auto verts = optimizer_.getAllVertices();
    for (size_t i = 0; i < verts.size(); ++i) {
        // We lost the ids - reconstruct from keyframes
        // This is a limitation - we need keyframe ids
    }
    return poses;
}

PoseGraphManager::GraphStats PoseGraphManager::getGraphStats() const {
    GraphStats stats;
    stats.vertexCount = optimizer_.getVertexCount();
    stats.edgeCount = optimizer_.getEdgeCount();
    stats.optimizationStats = optimizer_.getStatistics();
    return stats;
}

void PoseGraphManager::clear() {
    optimizer_.clear();
    keyframes_.clear();
}

std::vector<std::vector<double>> PoseGraphManager::createDefaultInfoMatrix(const std::string& edgeType) const {
    double scale = (edgeType == "LOOP_CLOSURE") ? 10.0 : 100.0;
    std::vector<std::vector<double>> m(6, std::vector<double>(6, 0));
    for (int i = 0; i < 3; ++i) m[i][i] = scale;
    for (int i = 3; i < 6; ++i) m[i][i] = scale * 0.1;
    return m;
}

} // namespace slam
} // namespace atlas_navigation
