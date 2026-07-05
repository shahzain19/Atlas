#include <gtest/gtest.h>
#include "atlas_navigation/Navigation/ObstacleAvoidance.h"

using namespace atlas_navigation;
using namespace atlas_navigation::navigation;

TEST(ObstacleAvoidanceTest, AddAndRemoveObstacle) {
    ObstacleAvoidance oa;
    Obstacle obs;
    obs.id = "obs1"; obs.position = {1, 1, 0}; obs.radius = 0.5; obs.confidence = 1.0; obs.timestamp = nowMs();
    oa.addOrUpdate(obs);
    EXPECT_EQ(oa.getAll().size(), 1);
    oa.remove("obs1");
    EXPECT_TRUE(oa.getAll().empty());
}

TEST(ObstacleAvoidanceTest, UpdateExistingObstacle) {
    ObstacleAvoidance oa;
    Obstacle obs;
    obs.id = "obs1"; obs.position = {1, 1, 0}; obs.radius = 0.5;
    oa.addOrUpdate(obs);
    obs.position = {2, 2, 0};
    oa.addOrUpdate(obs);
    EXPECT_EQ(oa.getAll().size(), 1);
    EXPECT_DOUBLE_EQ(oa.getAll()[0].position.x, 2);
}

TEST(ObstacleAvoidanceTest, PathBlockedDetected) {
    ObstacleAvoidance oa;
    Obstacle obs;
    obs.id = "obs1"; obs.position = {5, 5, 0}; obs.radius = 2; obs.confidence = 1.0; obs.timestamp = nowMs();
    oa.addOrUpdate(obs);

    EXPECT_TRUE(oa.pathBlocked({0, 0, 0}, {10, 10, 0}, 1.0));
    EXPECT_FALSE(oa.pathBlocked({0, 10, 0}, {10, 10, 0}, 1.0));
}

TEST(ObstacleAvoidanceTest, AvoidanceVectorInfluenceRadius) {
    ObstacleAvoidance oa;
    Obstacle obs;
    obs.id = "obs1"; obs.position = {2, 2, 0}; obs.radius = 1; obs.confidence = 1.0; obs.timestamp = nowMs();
    oa.addOrUpdate(obs);

    auto vec = oa.computeAvoidanceVector({0, 0, 0}, 5.0);
    // Vector points away from obstacle at (2,2): repulsion pushes from obstacle
    EXPECT_LT(vec.x, 0);
    EXPECT_LT(vec.y, 0);
    EXPECT_DOUBLE_EQ(vec.z, 0);
    EXPECT_GT(std::abs(vec.x), 0);
    EXPECT_GT(std::abs(vec.y), 0);
}

TEST(ObstacleAvoidanceTest, AvoidanceVectorOutsideRange) {
    ObstacleAvoidance oa;
    Obstacle obs;
    obs.id = "obs1"; obs.position = {100, 100, 0}; obs.radius = 1; obs.confidence = 1.0; obs.timestamp = nowMs();
    oa.addOrUpdate(obs);

    auto vec = oa.computeAvoidanceVector({0, 0, 0}, 5.0);
    EXPECT_DOUBLE_EQ(vec.x, 0);
    EXPECT_DOUBLE_EQ(vec.y, 0);
    EXPECT_DOUBLE_EQ(vec.z, 0);
}

TEST(ObstacleAvoidanceTest, ClearAll) {
    ObstacleAvoidance oa;
    Obstacle obs;
    obs.id = "obs1"; obs.position = {1, 1, 0}; obs.radius = 0.5;
    oa.addOrUpdate(obs);
    obs.id = "obs2";
    oa.addOrUpdate(obs);
    EXPECT_EQ(oa.getAll().size(), 2);
    oa.clear();
    EXPECT_TRUE(oa.getAll().empty());
}

TEST(ObstacleAvoidanceTest, PruneStaleObstacles) {
    ObstacleAvoidance oa(100); // 100ms TTL
    Obstacle obs;
    obs.id = "obs1"; obs.position = {1, 1, 0}; obs.radius = 0.5;
    obs.timestamp = nowMs() - 200; // older than TTL
    oa.addOrUpdate(obs);
    oa.prune();
    EXPECT_TRUE(oa.getAll().empty());
}
