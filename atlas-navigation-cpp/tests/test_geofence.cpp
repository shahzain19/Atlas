#include <gtest/gtest.h>
#include "atlas_navigation/Navigation/GeofenceManager.h"

using namespace atlas_navigation;
using namespace atlas_navigation::navigation;

TEST(GeofenceManagerTest, KeepInZone) {
    GeofenceManager gm;
    Geofence gf;
    gf.id = "zone1";
    gf.type = GeofenceType::KEEP_IN;
    gf.polygon = {{0, 0}, {10, 0}, {10, 10}, {0, 10}};
    gf.altitudeMin = -100;
    gf.altitudeMax = 100;
    gm.addGeofence(gf);

    EXPECT_TRUE(gm.isPointAllowed(5, 5));
    EXPECT_FALSE(gm.isPointAllowed(15, 5));
}

TEST(GeofenceManagerTest, KeepOutZone) {
    GeofenceManager gm;
    Geofence gf;
    gf.id = "zone1";
    gf.type = GeofenceType::KEEP_OUT;
    gf.polygon = {{0, 0}, {10, 0}, {10, 10}, {0, 10}};
    gm.addGeofence(gf);

    EXPECT_FALSE(gm.isPointAllowed(5, 5));
    EXPECT_TRUE(gm.isPointAllowed(15, 5));
}

TEST(GeofenceManagerTest, AltitudeConstraint) {
    GeofenceManager gm;
    Geofence gf;
    gf.id = "alt_zone";
    gf.type = GeofenceType::KEEP_IN;
    gf.polygon = {{-100, -100}, {100, -100}, {100, 100}, {-100, 100}};
    gf.altitudeMin = 0;
    gf.altitudeMax = 50;
    gm.addGeofence(gf);

    EXPECT_TRUE(gm.isPointAllowed(0, 0, 25));
    EXPECT_FALSE(gm.isPointAllowed(0, 0, -10));
    EXPECT_FALSE(gm.isPointAllowed(0, 0, 100));
}

TEST(GeofenceManagerTest, RemoveGeofence) {
    GeofenceManager gm;
    Geofence gf;
    gf.id = "zone1";
    gf.type = GeofenceType::KEEP_OUT;
    gf.polygon = {{0, 0}, {10, 0}, {10, 10}, {0, 10}};
    gm.addGeofence(gf);
    gm.removeGeofence("zone1");
    EXPECT_TRUE(gm.isPointAllowed(5, 5));
}

TEST(GeofenceManagerTest, PointInPolygonEdgeCases) {
    GeofenceManager gm;
    Geofence gf;
    gf.id = "z";
    gf.type = GeofenceType::KEEP_IN;
    gf.polygon = {{0, 0}, {10, 0}, {10, 10}};
    gm.addGeofence(gf);

    EXPECT_FALSE(gm.isPointAllowed(-1, -1));
    EXPECT_TRUE(gm.isPointAllowed(5, 2));
}
