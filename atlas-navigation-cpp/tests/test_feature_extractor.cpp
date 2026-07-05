#include <gtest/gtest.h>
#include "atlas_navigation/SLAM/FeatureExtractor.h"

using namespace atlas_navigation;
using namespace atlas_navigation::slam;

TEST(ORBDetectorTest, DetectsKeypoints) {
    ORBDetector detector(10, 2, 1.2);
    std::vector<uint8_t> image(64 * 64, 128);
    for (int i = 0; i < 64 * 64; ++i) image[i] = static_cast<uint8_t>((i * 7 + 13) % 256);
    auto kps = detector.detect(image, 64, 64);
    EXPECT_GT(kps.size(), 0);
    EXPECT_LE(kps.size(), 10000);
}

TEST(ORBDetectorTest, HandlesEmptyImage) {
    ORBDetector detector;
    std::vector<uint8_t> image(16 * 16, 0);
    auto kps = detector.detect(image, 16, 16);
    EXPECT_TRUE(kps.empty());
}

TEST(ORBDescriptorExtractorTest, ComputesDescriptors) {
    ORBDescriptorExtractor extractor;
    std::vector<uint8_t> image(64 * 64, 128);
    for (size_t i = 0; i < image.size(); ++i) image[i] = static_cast<uint8_t>((i * 7) % 256);

    std::vector<Keypoint> kps;
    Keypoint kp;
    kp.pixel = {32, 32}; kp.angle = 45; kp.response = 100; kp.scaleLevel = 0; kp.size = 7;
    kps.push_back(kp);

    auto descs = extractor.compute(image, 64, 64, kps);
    ASSERT_EQ(descs.size(), 1);
    EXPECT_EQ(descs[0].size(), 16);
}

TEST(ORBDescriptorExtractorTest, HandlesNoKeypoints) {
    ORBDescriptorExtractor extractor;
    std::vector<uint8_t> image(64, 0);
    auto descs = extractor.compute(image, 8, 8, {});
    EXPECT_TRUE(descs.empty());
}

TEST(BFMatcherTest, MatchDescriptors) {
    BFMatcher matcher(BFMatcher::HAMMING);
    std::vector<std::vector<double>> d1 = {{1, 0, 1, 0}, {0, 1, 0, 1}};
    std::vector<std::vector<double>> d2 = {{1, 0, 1, 0}, {1, 1, 0, 0}};
    auto matches = matcher.match(d1, d2);
    ASSERT_EQ(matches.size(), 2);
    EXPECT_EQ(matches[0].trainIdx, 0);
    EXPECT_EQ(matches[0].distance, 0);
}

TEST(BFMatcherTest, MatchWithRatio) {
    BFMatcher matcher(BFMatcher::L2);
    std::vector<std::vector<double>> d1 = {{1, 0, 0, 0}};
    std::vector<std::vector<double>> d2 = {{1, 0, 0, 0}, {0, 1, 0, 0}};
    auto matches = matcher.matchWithRatio(d1, d2, 0.75);
    ASSERT_EQ(matches.size(), 1);
    EXPECT_EQ(matches[0].trainIdx, 0);
}

TEST(BFMatcherTest, EmptyDescriptors) {
    BFMatcher matcher;
    auto m1 = matcher.match({}, {});
    EXPECT_TRUE(m1.empty());
    auto m2 = matcher.matchWithRatio({}, {});
    EXPECT_TRUE(m2.empty());
}

TEST(FeatureExtractorTest, ExtractThrowsOnNoImage) {
    auto detector = std::make_unique<ORBDetector>();
    auto extractor = std::make_unique<ORBDescriptorExtractor>();
    FeatureExtractor fe(std::move(detector), std::move(extractor));
    SLAMObservation obs;
    obs.timestamp = 1000;
    EXPECT_THROW(fe.extract(obs), std::logic_error);
}

TEST(FeatureExtractorTest, Statistics) {
    auto detector = std::make_unique<ORBDetector>();
    auto extractor = std::make_unique<ORBDescriptorExtractor>();
    FeatureExtractor fe(std::move(detector), std::move(extractor));
    auto stats = fe.getStatistics();
    EXPECT_EQ(stats.totalFeaturesExtracted, 0);
    EXPECT_EQ(stats.params.maxFeatures, 2000);

    fe.resetStatistics();
    stats = fe.getStatistics();
    EXPECT_EQ(stats.totalFeaturesExtracted, 0);
}

TEST(FeatureExtractorTest, GetDetectorAndDescriptor) {
    auto detector = std::make_unique<ORBDetector>(15);
    auto extractor = std::make_unique<ORBDescriptorExtractor>();
    auto* detPtr = detector.get();
    auto* descPtr = extractor.get();
    FeatureExtractor fe(std::move(detector), std::move(extractor));
    EXPECT_EQ(fe.getDetector(), detPtr);
    EXPECT_EQ(fe.getDescriptorExtractor(), descPtr);
}
