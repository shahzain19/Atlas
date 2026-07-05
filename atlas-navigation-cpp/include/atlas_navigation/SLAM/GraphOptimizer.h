#pragma once

#include "SLAMTypes.h"
#include <map>
#include <vector>
#include <string>
#include <cmath>
#include <limits>

namespace atlas_navigation {
namespace slam {

struct GraphOptimizerConfig {
    int maxIterations = 100;
    double convergenceThreshold = 1e-6;
    std::string robustKernel = "HUBER";
    double kernelParameter = 1.0;
    bool enableParallel = true;
    double maxSolverTime = 5.0;
};

class GraphOptimizer {
public:
    explicit GraphOptimizer(const GraphOptimizerConfig& config = GraphOptimizerConfig{});

    void addVertex(const std::string& id, const Pose& pose, bool fixed = false);
    void updateVertex(const std::string& id, const Pose& pose);
    Pose getVertex(const std::string& id) const;
    std::vector<Pose> getAllVertices() const;

    void addEdge(const std::string& sourceId, const std::string& targetId,
                 const Pose& relativePose,
                 const std::vector<std::vector<double>>& informationMatrix = {},
                 const std::string& edgeType = "ODOMETRY");
    void removeEdge(const std::string& id);

    OptimizationResult optimize();
    OptimizationResult optimizeSubset(const std::vector<std::string>& vertexIds);

    void clear();
    int getVertexCount() const;
    int getEdgeCount() const;

    struct Statistics {
        int totalOptimizations = 0;
        double averageOptimizationTime = 0.0;
        GraphOptimizerConfig config;
    };
    Statistics getStatistics() const;

private:
    struct Vertex { std::string id; Pose pose; bool fixed = false; };
    struct Edge {
        std::string id; std::string sourceId; std::string targetId;
        Pose relativePose;
        std::vector<std::vector<double>> informationMatrix;
        std::string edgeType = "ODOMETRY";
    };

    std::map<std::string, Vertex> graph_;
    std::vector<Edge> edges_;
    GraphOptimizerConfig config_;
    int optimizationCount_ = 0;
    double totalOptimizationTime_ = 0.0;

    std::vector<std::vector<double>> createDefaultInformationMatrix(const std::string& edgeType) const;
    void initializePoses();
    Pose composePose(const Pose& base, const Pose& relative) const;
    double computeEdgeError(const Edge& edge) const;
    double computeTotalChiSquared() const;

    struct LinearSystem {
        std::map<std::string, std::map<std::string, std::vector<std::vector<double>>>> H;
        std::map<std::string, std::vector<double>> b;
    };
    LinearSystem buildLinearSystem() const;
    std::vector<std::vector<double>> createHessianBlock(const std::vector<std::vector<double>>& info, double factor) const;
    void addHessianBlock(std::map<std::string, std::vector<std::vector<double>>>& blockMap,
                         const std::string& id, const std::vector<std::vector<double>>& block) const;
    std::vector<double> computeEdgeErrorVector(const Edge& edge) const;
    double applyKernel(const std::vector<double>& error, const std::vector<std::vector<double>>& info,
                       int idx, double sign) const;
    std::map<std::string, std::vector<double>> solveLinearSystem(const LinearSystem& system) const;
    void solveDense(const std::vector<std::string>& vertexIds,
                    const std::map<std::string, std::map<std::string, std::vector<std::vector<double>>>>& H,
                    const std::map<std::string, std::vector<double>>& b,
                    std::map<std::string, std::vector<double>>& deltas) const;
    void solveIterative(const std::vector<std::string>& vertexIds,
                        const std::map<std::string, std::map<std::string, std::vector<std::vector<double>>>>& H,
                        const std::map<std::string, std::vector<double>>& b,
                        std::map<std::string, std::vector<double>>& deltas) const;
    std::vector<double> gaussianElimination(std::vector<std::vector<double>> A, std::vector<double> b) const;
    double applyPoseUpdates(const std::map<std::string, std::vector<double>>& deltas,
                            const std::vector<std::string>& vertexIds = {});
};

class PoseGraphManager {
public:
    PoseGraphManager();
    void addKeyframe(const Keyframe& keyframe);
    void addLoopClosure(const std::string& keyframeId1, const std::string& keyframeId2,
                        const Pose& relativePose,
                        const std::vector<std::vector<double>>& informationMatrix = {});
    OptimizationResult optimize();
    Pose getOptimizedPose(const std::string& keyframeId) const;
    std::map<std::string, Pose> getAllOptimizedPoses() const;
    struct GraphStats { int vertexCount = 0; int edgeCount = 0; GraphOptimizer::Statistics optimizationStats; };
    GraphStats getGraphStats() const;
    void clear();
private:
    GraphOptimizer optimizer_;
    std::map<std::string, Keyframe> keyframes_;
    std::vector<std::vector<double>> createDefaultInfoMatrix(const std::string& edgeType) const;
};

} // namespace slam
} // namespace atlas_navigation
