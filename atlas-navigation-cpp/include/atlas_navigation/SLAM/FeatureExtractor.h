#pragma once

#include "SLAMTypes.h"
#include <memory>
#include <vector>
#include <cmath>
#include <limits>

namespace atlas_navigation {
namespace slam {

class Detector {
public:
    virtual ~Detector() = default;
    virtual std::vector<Keypoint> detect(const std::vector<uint8_t>& image, int width, int height) = 0;
};

class DescriptorExtractor {
public:
    virtual ~DescriptorExtractor() = default;
    virtual std::vector<std::vector<double>> compute(
        const std::vector<uint8_t>& image, int width, int height,
        const std::vector<Keypoint>& keypoints) = 0;
};

class ORBDetector : public Detector {
public:
    ORBDetector(int fastThreshold = 20, int pyramidLevels = 4, double scaleFactor = 1.2);
    std::vector<Keypoint> detect(const std::vector<uint8_t>& image, int width, int height) override;

private:
    int fastThreshold_;
    int pyramidLevels_;
    double scaleFactor_;
    double computeCornerResponse(const std::vector<uint8_t>& image, int width, int height,
                                 int cx, int cy, int bytesPerPixel) const;
    int estimateScaleLevel(double cornerScore) const;
    double computeOrientation(const std::vector<uint8_t>& image, int width, int height,
                              int cx, int cy, int bytesPerPixel) const;
};

class ORBDescriptorExtractor : public DescriptorExtractor {
public:
    ORBDescriptorExtractor();
    std::vector<std::vector<double>> compute(
        const std::vector<uint8_t>& image, int width, int height,
        const std::vector<Keypoint>& keypoints) override;
private:
    std::vector<double> computeDescriptor(const std::vector<uint8_t>& image, int width, int height,
                                           const Keypoint& keypoint) const;
};

class BFMatcher {
public:
    enum NormType { HAMMING, L2 };
    explicit BFMatcher(NormType normType = HAMMING);

    struct Match {
        int queryIdx = 0;
        int trainIdx = 0;
        double distance = 0.0;
    };

    std::vector<Match> match(const std::vector<std::vector<double>>& descriptors1,
                              const std::vector<std::vector<double>>& descriptors2) const;
    std::vector<Match> matchWithRatio(const std::vector<std::vector<double>>& descriptors1,
                                       const std::vector<std::vector<double>>& descriptors2,
                                       double ratioThreshold = 0.75) const;
private:
    NormType normType_;
    double computeDistance(const std::vector<double>& d1, const std::vector<double>& d2) const;
};

class FeatureExtractor {
public:
    FeatureExtractor(std::unique_ptr<Detector> detector,
                     std::unique_ptr<DescriptorExtractor> descriptorExtractor,
                     const FeatureExtractionParams& params = FeatureExtractionParams{});

    FeatureExtractionResult extract(const SLAMObservation& observation);
    std::vector<Keypoint> detectKeypoints(const std::vector<uint8_t>& image, int width, int height);
    std::vector<std::vector<double>> computeDescriptors(const std::vector<uint8_t>& image, int width, int height,
                                                         const std::vector<Keypoint>& keypoints);
    Detector* getDetector() const { return detector_.get(); }
    DescriptorExtractor* getDescriptorExtractor() const { return descriptorExtractor_.get(); }

    struct Statistics {
        int totalFeaturesExtracted = 0;
        double averageExtractionTime = 0.0;
        FeatureExtractionParams params;
    };
    Statistics getStatistics() const;
    void resetStatistics();

private:
    std::unique_ptr<Detector> detector_;
    std::unique_ptr<DescriptorExtractor> descriptorExtractor_;
    FeatureExtractionParams params_;
    int featureCount_ = 0;
    double totalExtractionTime_ = 0.0;
    std::vector<Keypoint> filterKeypoints(const std::vector<Keypoint>& keypoints) const;
};

} // namespace slam
} // namespace atlas_navigation
