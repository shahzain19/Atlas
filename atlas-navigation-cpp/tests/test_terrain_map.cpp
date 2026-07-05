#include <gtest/gtest.h>
#include "atlas_navigation/Navigation/TerrainMap.h"

using namespace atlas_navigation;
using namespace atlas_navigation::navigation;

TEST(TerrainMapTest, SetAndGetCell) {
    TerrainMap tm(1.0);
    tm.setCell(1.5, 2.5, {10.0, 0.3, true});
    auto cell = tm.getCell(1.5, 2.5);
    EXPECT_DOUBLE_EQ(cell.elevation, 10.0);
    EXPECT_DOUBLE_EQ(cell.roughness, 0.3);
    EXPECT_TRUE(cell.passable);
}

TEST(TerrainMapTest, GetElevation) {
    TerrainMap tm(1.0);
    tm.setCell(0, 0, {5.0, 0.1, true});
    EXPECT_DOUBLE_EQ(tm.getElevation(0, 0), 5.0);
    EXPECT_DOUBLE_EQ(tm.getElevation(100, 100), 0.0);
}

TEST(TerrainMapTest, IsPassable) {
    TerrainMap tm(1.0);
    tm.setCell(0, 0, {0, 0, false});
    EXPECT_FALSE(tm.isPassable(0, 0));
    EXPECT_TRUE(tm.isPassable(10, 10));
}

TEST(TerrainMapTest, GridKeyConsistency) {
    TerrainMap tm(2.0);
    tm.setCell(2.9, 3.1, {1, 0, true});
    auto c1 = tm.getCell(2.9, 3.1);
    auto c2 = tm.getCell(3.1, 3.1);
    EXPECT_DOUBLE_EQ(c1.elevation, c2.elevation); // same cell
}

TEST(TerrainMapTest, DefaultCellValues) {
    TerrainMap tm;
    auto cell = tm.getCell(42, 42);
    EXPECT_DOUBLE_EQ(cell.elevation, 0);
    EXPECT_DOUBLE_EQ(cell.roughness, 0);
    EXPECT_TRUE(cell.passable);
}
