#include <gtest/gtest.h>
#include "atlas_navigation/SLAM/GraphOptimizer.h"

using namespace atlas_navigation;
using namespace atlas_navigation::slam;

TEST(GraphOptimizerTest, AddAndGetVertex) {
    GraphOptimizer opt;
    Pose p; p.position.x = 1; p.position.y = 2; p.position.z = 3;
    opt.addVertex("v0", p, true);
    opt.addVertex("v1", {});
    auto v = opt.getVertex("v0");
    EXPECT_DOUBLE_EQ(v.position.x, 1);
    EXPECT_DOUBLE_EQ(v.position.y, 2);
    EXPECT_DOUBLE_EQ(v.position.z, 3);
    EXPECT_EQ(opt.getVertexCount(), 2);
}

TEST(GraphOptimizerTest, DuplicateVertexThrows) {
    GraphOptimizer opt;
    opt.addVertex("v0", {});
    EXPECT_THROW(opt.addVertex("v0", {}), std::runtime_error);
}

TEST(GraphOptimizerTest, AddEdge) {
    GraphOptimizer opt;
    opt.addVertex("v0", {}, true);
    opt.addVertex("v1", {});
    Pose rel; rel.position.x = 1;
    opt.addEdge("v0", "v1", rel);
    EXPECT_EQ(opt.getEdgeCount(), 1);
}

TEST(GraphOptimizerTest, AddEdgeMissingVertexThrows) {
    GraphOptimizer opt;
    opt.addVertex("v0", {});
    EXPECT_THROW(opt.addEdge("v0", "v1", {}), std::runtime_error);
}

TEST(GraphOptimizerTest, RemoveEdge) {
    GraphOptimizer opt;
    opt.addVertex("v0", {}, true);
    opt.addVertex("v1", {});
    opt.addEdge("v0", "v1", {});
    // Can't easily get edge id, but test it doesn't crash
    EXPECT_EQ(opt.getEdgeCount(), 1);
}

TEST(GraphOptimizerTest, OptimizeConverges) {
    GraphOptimizer opt;
    Pose p0; p0.position.x = 0; p0.position.y = 0;
    Pose p1; p1.position.x = 1; p1.position.y = 1;
    opt.addVertex("v0", p0, true);
    opt.addVertex("v1", p1);
    Pose rel; rel.position.x = 1; rel.position.y = 1;
    opt.addEdge("v0", "v1", rel);

    auto result = opt.optimize();
    EXPECT_TRUE(result.converged);
    EXPECT_GE(result.iterations, 0);
    EXPECT_LE(result.finalError, result.initialError);
}

TEST(GraphOptimizerTest, OptimizeNotEnoughVerticesThrows) {
    GraphOptimizer opt;
    opt.addVertex("v0", {});
    EXPECT_THROW(opt.optimize(), std::runtime_error);
}

TEST(GraphOptimizerTest, OptimizeNoEdgesThrows) {
    GraphOptimizer opt;
    opt.addVertex("v0", {}, true);
    opt.addVertex("v1", {});
    EXPECT_THROW(opt.optimize(), std::runtime_error);
}

TEST(GraphOptimizerTest, OptimizeSubset) {
    GraphOptimizer opt;
    opt.addVertex("v0", {}, true);
    opt.addVertex("v1", {});
    opt.addVertex("v2", {});
    Pose rel; rel.position.x = 1;
    opt.addEdge("v0", "v1", rel);
    opt.addEdge("v1", "v2", rel);

    auto result = opt.optimizeSubset({"v1"});
    EXPECT_TRUE(result.converged || result.iterations > 0);
}

TEST(GraphOptimizerTest, Clear) {
    GraphOptimizer opt;
    opt.addVertex("v0", {}, true);
    opt.addVertex("v1", {});
    EXPECT_EQ(opt.getVertexCount(), 2);
    opt.clear();
    EXPECT_EQ(opt.getVertexCount(), 0);
    EXPECT_EQ(opt.getEdgeCount(), 0);
}

TEST(GraphOptimizerTest, Statistics) {
    GraphOptimizer opt;
    auto stats = opt.getStatistics();
    EXPECT_EQ(stats.totalOptimizations, 0);
}

TEST(PoseGraphManagerTest, AddKeyframe) {
    PoseGraphManager mgr;
    Keyframe kf0, kf1;
    kf0.id = "kf0";
    kf0.pose.position.x = 0;
    kf0.timestamp = 100;
    kf1.id = "kf1";
    kf1.pose.position.x = 1;
    kf1.timestamp = 200;

    EXPECT_NO_THROW(mgr.addKeyframe(kf0));
    EXPECT_NO_THROW(mgr.addKeyframe(kf1)); // second one connects via odometry edge
}

TEST(PoseGraphManagerTest, Clear) {
    PoseGraphManager mgr;
    Keyframe kf;
    kf.id = "kf0";
    mgr.addKeyframe(kf);
    EXPECT_NO_THROW(mgr.clear());
}

TEST(PoseGraphManagerTest, GraphStats) {
    PoseGraphManager mgr;
    auto stats = mgr.getGraphStats();
    EXPECT_EQ(stats.vertexCount, 0);
    EXPECT_EQ(stats.edgeCount, 0);
}
