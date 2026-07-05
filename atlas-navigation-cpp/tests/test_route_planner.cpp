#include <gtest/gtest.h>
#include "atlas_navigation/Navigation/RoutePlanner.h"

using namespace atlas_navigation;
using namespace atlas_navigation::navigation;

TEST(RoutePlannerTest, PlanSimplePath) {
    RoutePlanner planner;
    Waypoint start, end;
    start.id = "start"; start.position = {0, 0, 0};
    end.id = "end"; end.position = {10, 0, 0};

    auto result = planner.planPath(start, end);
    ASSERT_EQ(result.waypoints.size(), 3);
    EXPECT_DOUBLE_EQ(result.waypoints[0].position.x, 0);
    EXPECT_DOUBLE_EQ(result.waypoints[0].position.y, 0);
    EXPECT_DOUBLE_EQ(result.waypoints[1].position.x, 5);
    EXPECT_DOUBLE_EQ(result.waypoints[1].position.y, 0);
    EXPECT_DOUBLE_EQ(result.waypoints[2].position.x, 10);
    EXPECT_DOUBLE_EQ(result.waypoints[2].position.y, 0);
}

TEST(RoutePlannerTest, PathDistance) {
    RoutePlanner planner;
    Waypoint start, end;
    start.id = "start"; start.position = {0, 0, 0};
    end.id = "end"; end.position = {3, 4, 0};

    auto result = planner.planPath(start, end);
    // 0->(1.5,2)->(3,4) = sqrt(1.5^2+2^2) * 2 = 2.5 * 2 = 5
    EXPECT_DOUBLE_EQ(result.distance, 5.0);
}

TEST(RoutePlannerTest, EstimatedTime) {
    RoutePlanner planner;
    Waypoint start, end;
    start.id = "start"; start.position = {0, 0, 0};
    end.id = "end"; end.position = {0, 5, 0};

    auto result = planner.planPath(start, end);
    EXPECT_DOUBLE_EQ(result.estimatedTime, result.distance / 1.0);
}

TEST(RoutePlannerTest, SameStartEnd) {
    RoutePlanner planner;
    Waypoint wp;
    wp.id = "wp"; wp.position = {1, 1, 0};

    auto result = planner.planPath(wp, wp);
    EXPECT_EQ(result.waypoints.size(), 3);
    EXPECT_DOUBLE_EQ(result.distance, 0);
}
