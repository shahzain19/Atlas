#include <gtest/gtest.h>
#include "atlas_navigation/Localization/EnhancedLocalization.h"

using namespace atlas_navigation;
using namespace atlas_navigation::localization;
using namespace atlas_navigation::slam;

TEST(EnhancedLocalizationTest, InitialState) {
    EnhancedLocalization loc;
    auto pose = loc.getPose();
    EXPECT_DOUBLE_EQ(pose.position.x, 0);
    EXPECT_DOUBLE_EQ(pose.position.y, 0);
    auto state = loc.getState();
    EXPECT_EQ(state.status, "INITIALIZING");
}

TEST(EnhancedLocalizationTest, LocalizeWithoutImageFails) {
    EnhancedLocalization loc;
    SLAMObservation obs;
    obs.timestamp = 1000;
    EXPECT_THROW(loc.localize(obs), std::logic_error);
}

TEST(EnhancedLocalizationTest, LocalizeWithImage) {
    EnhancedLocalization loc;
    SLAMObservation obs;
    obs.image = SLAMObservation::ImageData{};
    obs.image->data = std::vector<uint8_t>(64 * 64, 128);
    obs.image->width = 64;
    obs.image->height = 64;
    for (size_t i = 0; i < obs.image->data.size(); ++i)
        obs.image->data[i] = static_cast<uint8_t>((i * 7 + 13) % 256);
    obs.timestamp = 1000;

    auto result = loc.localize(obs);
    EXPECT_GT(result.trackedFeatures, 0);
    EXPECT_EQ(result.status, "SUCCESS");
}

TEST(EnhancedLocalizationTest, MultipleLocalizations) {
    EnhancedLocalization loc;
    for (int t = 0; t < 3; ++t) {
        SLAMObservation obs;
        obs.image = SLAMObservation::ImageData{};
        obs.image->data = std::vector<uint8_t>(64 * 64, 128);
        obs.image->width = 64;
        obs.image->height = 64;
        for (size_t i = 0; i < obs.image->data.size(); ++i)
            obs.image->data[i] = static_cast<uint8_t>((i * 7 + t * 3 + 13) % 256);
        obs.timestamp = 1000 + t * 100;
        EXPECT_NO_THROW(loc.localize(obs));
    }
    auto stats = loc.getMapStatistics();
    EXPECT_GE(stats.keyframeCount, 0);
}

TEST(EnhancedLocalizationTest, UpdateMap) {
    EnhancedLocalization loc;
    SLAMObservation obs;
    obs.image = SLAMObservation::ImageData{};
    obs.image->data = std::vector<uint8_t>(64 * 64, 128);
    obs.image->width = 64;
    obs.image->height = 64;
    for (size_t i = 0; i < obs.image->data.size(); ++i)
        obs.image->data[i] = static_cast<uint8_t>((i * 7) % 256);
    obs.timestamp = 1000;

    auto info = loc.updateMap(obs);
    EXPECT_TRUE(info.keyframeAdded || !info.keyframeAdded);
}

TEST(EnhancedLocalizationTest, MapStatistics) {
    EnhancedLocalization loc;
    auto stats = loc.getMapStatistics();
    EXPECT_EQ(stats.mapPointCount, 0);
    EXPECT_EQ(stats.keyframeCount, 0);
    EXPECT_FALSE(stats.isInitialized);
}

TEST(EnhancedLocalizationTest, Reset) {
    EnhancedLocalization loc;
    SLAMObservation obs;
    obs.image = SLAMObservation::ImageData{};
    obs.image->data = std::vector<uint8_t>(64 * 64, 128);
    obs.image->width = 64;
    obs.image->height = 64;
    for (size_t i = 0; i < obs.image->data.size(); ++i)
        obs.image->data[i] = static_cast<uint8_t>((i * 7) % 256);
    obs.timestamp = 1000;
    loc.localize(obs);
    loc.reset();

    auto pose = loc.getPose();
    EXPECT_DOUBLE_EQ(pose.position.x, 0);
    EXPECT_DOUBLE_EQ(pose.position.y, 0);
    EXPECT_DOUBLE_EQ(pose.position.z, 0);
}

TEST(EnhancedLocalizationTest, ToStateEstimate) {
    EnhancedLocalization loc;
    auto est = loc.toStateEstimate();
    EXPECT_DOUBLE_EQ(est.position.x, 0);
    EXPECT_DOUBLE_EQ(est.position.y, 0);
}

TEST(EnhancedLocalizationTest, GetSLAMEngine) {
    EnhancedLocalization loc;
    auto* engine = loc.getSLAMEngine();
    EXPECT_NE(engine, nullptr);
}
