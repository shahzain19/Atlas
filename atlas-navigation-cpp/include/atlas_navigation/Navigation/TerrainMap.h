#pragma once

#include "../Types.h"
#include <map>
#include <string>
#include <cmath>

namespace atlas_navigation {
namespace navigation {

class TerrainMap {
public:
    explicit TerrainMap(double cellSize = 1.0);

    void setCell(double x, double y, const TerrainCell& cell);
    TerrainCell getCell(double x, double y) const;
    double getElevation(double x, double y) const;
    bool isPassable(double x, double y) const;

private:
    std::map<std::string, TerrainCell> cells_;
    double cellSize_;
    std::string getKey(double x, double y) const;
};

inline TerrainMap::TerrainMap(double cellSize) : cellSize_(cellSize) {}

inline std::string TerrainMap::getKey(double x, double y) const {
    int gx = static_cast<int>(std::floor(x / cellSize_));
    int gy = static_cast<int>(std::floor(y / cellSize_));
    return std::to_string(gx) + "," + std::to_string(gy);
}

inline void TerrainMap::setCell(double x, double y, const TerrainCell& cell) {
    cells_[getKey(x, y)] = cell;
}

inline TerrainCell TerrainMap::getCell(double x, double y) const {
    auto it = cells_.find(getKey(x, y));
    if (it != cells_.end()) return it->second;
    return TerrainCell{};
}

inline double TerrainMap::getElevation(double x, double y) const {
    auto it = cells_.find(getKey(x, y));
    return (it != cells_.end()) ? it->second.elevation : 0.0;
}

inline bool TerrainMap::isPassable(double x, double y) const {
    auto it = cells_.find(getKey(x, y));
    return (it != cells_.end()) ? it->second.passable : true;
}

} // namespace navigation
} // namespace atlas_navigation
