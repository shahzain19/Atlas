#include <gtest/gtest.h>
#include "atlas_navigation/Navigation/Waypoint.h"

using namespace atlas_navigation;
using namespace atlas_navigation::navigation;

TEST(WaypointTest, CreateWaypoint) {
    auto entry = createWaypoint("wp1", {1.0, 2.0, 3.0}, "test", 0.5);
    EXPECT_EQ(entry.waypoint.id, "wp1");
    EXPECT_DOUBLE_EQ(entry.waypoint.position.x, 1.0);
    EXPECT_DOUBLE_EQ(entry.waypoint.position.y, 2.0);
    EXPECT_DOUBLE_EQ(entry.waypoint.position.z, 3.0);
    EXPECT_EQ(entry.waypoint.label, "test");
    EXPECT_DOUBLE_EQ(entry.waypoint.tolerance, 0.5);
    EXPECT_EQ(entry.status, WaypointStatus::PENDING);
}

TEST(WaypointTest, CreateWaypointDefaultValues) {
    auto entry = createWaypoint("wp2", {0, 0, 0});
    EXPECT_EQ(entry.waypoint.id, "wp2");
    EXPECT_TRUE(entry.waypoint.label.empty());
    EXPECT_DOUBLE_EQ(entry.waypoint.tolerance, 0.0);
    EXPECT_EQ(entry.status, WaypointStatus::PENDING);
}

TEST(WaypointTest, StatusEnumValues) {
    EXPECT_NE(static_cast<int>(WaypointStatus::PENDING), static_cast<int>(WaypointStatus::ACTIVE));
    EXPECT_NE(static_cast<int>(WaypointStatus::ACTIVE), static_cast<int>(WaypointStatus::REACHED));
    EXPECT_NE(static_cast<int>(WaypointStatus::REACHED), static_cast<int>(WaypointStatus::SKIPPED));
}
