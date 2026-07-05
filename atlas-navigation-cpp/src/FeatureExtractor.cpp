#include "atlas_navigation/SLAM/FeatureExtractor.h"
#include <algorithm>
#include <cmath>
#include <chrono>

namespace atlas_navigation {
namespace slam {

// --- ORBDetector ---

ORBDetector::ORBDetector(int fastThreshold, int pyramidLevels, double scaleFactor)
    : fastThreshold_(fastThreshold), pyramidLevels_(pyramidLevels), scaleFactor_(scaleFactor) {}

std::vector<Keypoint> ORBDetector::detect(const std::vector<uint8_t>& image, int width, int height) {
    std::vector<Keypoint> keypoints;
    int bytesPerPixel = static_cast<int>(image.size()) / (width * height);

    for (int y = 8; y < height - 8; y += 4) {
        for (int x = 8; x < width - 8; x += 4) {
            double cornerScore = computeCornerResponse(image, width, height, x, y, bytesPerPixel);
            if (cornerScore > fastThreshold_) {
                int scaleLevel = estimateScaleLevel(cornerScore);
                double angle = computeOrientation(image, width, height, x, y, bytesPerPixel);
                Keypoint kp;
                kp.pixel = {static_cast<double>(x), static_cast<double>(y)};
                kp.scaleLevel = scaleLevel;
                kp.response = cornerScore;
                kp.angle = angle;
                kp.size = 7.0;
                keypoints.push_back(kp);
            }
        }
    }

    if (keypoints.size() > 10000)
        keypoints.resize(10000);
    return keypoints;
}

double ORBDetector::computeCornerResponse(const std::vector<uint8_t>& image, int width, int height,
                                           int cx, int cy, int bytesPerPixel) const {
    int centerIdx = (cy * width + cx) * bytesPerPixel;
    uint8_t intensity = image[static_cast<size_t>(centerIdx)];
    int brighter = 0, darker = 0;
    const int circleOffsets[8][2] = {{-3,0},{-2,2},{0,3},{2,2},{3,0},{2,-2},{0,-3},{-2,-2}};

    for (auto& off : circleOffsets) {
        int idx = ((cy + off[1]) * width + (cx + off[0])) * bytesPerPixel;
        if (idx >= 0 && idx < static_cast<int>(image.size())) {
            int diff = static_cast<int>(image[static_cast<size_t>(idx)]) - intensity;
            if (diff > 10) brighter++;
            else if (diff < -10) darker++;
        }
    }

    if (brighter >= 7) return 255.0 - intensity;
    if (darker >= 7) return static_cast<double>(intensity);
    return 0.0;
}

int ORBDetector::estimateScaleLevel(double cornerScore) const {
    return static_cast<int>(std::log2(255.0 - cornerScore + 1.0)) % 4;
}

double ORBDetector::computeOrientation(const std::vector<uint8_t>& image, int width, int height,
                                        int cx, int cy, int bytesPerPixel) const {
    double m01 = 0, m10 = 0, m00 = 0;
    int patchSize = 7;

    for (int dy = -patchSize; dy <= patchSize; ++dy) {
        for (int dx = -patchSize; dx <= patchSize; ++dx) {
            int x = cx + dx, y = cy + dy;
            if (x >= 0 && x < width && y >= 0 && y < height) {
                size_t idx = static_cast<size_t>((y * width + x) * bytesPerPixel);
                double intensity = image[idx];
                m10 += intensity * dx;
                m01 += intensity * dy;
                m00 += intensity;
            }
        }
    }

    if (m00 == 0) return 0;
    return std::atan2(m01, m10) * 180.0 / M_PI;
}

// --- ORBDescriptorExtractor ---

ORBDescriptorExtractor::ORBDescriptorExtractor() = default;

std::vector<std::vector<double>> ORBDescriptorExtractor::compute(
    const std::vector<uint8_t>& image, int width, int height,
    const std::vector<Keypoint>& keypoints) {
    std::vector<std::vector<double>> descriptors;
    descriptors.reserve(keypoints.size());
    for (const auto& kp : keypoints) {
        descriptors.push_back(computeDescriptor(image, width, height, kp));
    }
    return descriptors;
}

std::vector<double> ORBDescriptorExtractor::computeDescriptor(
    const std::vector<uint8_t>& image, int width, int height,
    const Keypoint& keypoint) const {
    std::vector<double> descriptor;
    double x = keypoint.pixel.first, y = keypoint.pixel.second;
    double angleRad = keypoint.angle * M_PI / 180.0;
    double cosA = std::cos(angleRad), sinA = std::sin(angleRad);

    const int patternPairs[16][2] = {
        {8,-7},{5,5},{-2,9},{-11,-2},{9,4},{-6,-3},{7,-8},{3,-11},
        {0,8},{-7,3},{11,0},{3,7},{-8,-5},{6,2},{-5,-9},{2,10}
    };

    for (auto& pp : patternPairs) {
        int rx1 = static_cast<int>(std::round(pp[0] * cosA - pp[1] * sinA));
        int ry1 = static_cast<int>(std::round(pp[0] * sinA + pp[1] * cosA));
        int rx2 = static_cast<int>(std::round((pp[0]+1) * cosA - (pp[1]+1) * sinA));
        int ry2 = static_cast<int>(std::round((pp[0]+1) * sinA + (pp[1]+1) * cosA));

        int x1 = std::max(0, std::min(width - 1, static_cast<int>(std::round(x + rx1))));
        int y1 = std::max(0, std::min(height - 1, static_cast<int>(std::round(y + ry1))));
        int x2 = std::max(0, std::min(width - 1, static_cast<int>(std::round(x + rx2))));
        int y2 = std::max(0, std::min(height - 1, static_cast<int>(std::round(y + ry2))));

        uint8_t v1 = image[static_cast<size_t>(y1 * width + x1)];
        uint8_t v2 = image[static_cast<size_t>(y2 * width + x2)];
        descriptor.push_back(v1 < v2 ? 1.0 : 0.0);
    }
    return descriptor;
}

// --- BFMatcher ---

BFMatcher::BFMatcher(NormType normType) : normType_(normType) {}

std::vector<BFMatcher::Match> BFMatcher::match(
    const std::vector<std::vector<double>>& descriptors1,
    const std::vector<std::vector<double>>& descriptors2) const {
    std::vector<Match> matches;
    for (size_t i = 0; i < descriptors1.size(); ++i) {
        double minDist = std::numeric_limits<double>::max();
        int minIdx = -1;
        for (size_t j = 0; j < descriptors2.size(); ++j) {
            double dist = computeDistance(descriptors1[i], descriptors2[j]);
            if (dist < minDist) { minDist = dist; minIdx = static_cast<int>(j); }
        }
        if (minIdx >= 0) matches.push_back({static_cast<int>(i), minIdx, minDist});
    }
    return matches;
}

std::vector<BFMatcher::Match> BFMatcher::matchWithRatio(
    const std::vector<std::vector<double>>& descriptors1,
    const std::vector<std::vector<double>>& descriptors2,
    double ratioThreshold) const {
    std::vector<Match> matches;
    for (size_t i = 0; i < descriptors1.size(); ++i) {
        double bestDist = std::numeric_limits<double>::max();
        double secondBestDist = std::numeric_limits<double>::max();
        int bestIdx = -1;
        for (size_t j = 0; j < descriptors2.size(); ++j) {
            double dist = computeDistance(descriptors1[i], descriptors2[j]);
            if (dist < bestDist) { secondBestDist = bestDist; bestDist = dist; bestIdx = static_cast<int>(j); }
            else if (dist < secondBestDist) { secondBestDist = dist; }
        }
        if (bestIdx >= 0 && bestDist < secondBestDist * ratioThreshold) {
            matches.push_back({static_cast<int>(i), bestIdx, bestDist});
        }
    }
    return matches;
}

double BFMatcher::computeDistance(const std::vector<double>& d1, const std::vector<double>& d2) const {
    if (normType_ == HAMMING) {
        double dist = 0;
        size_t n = std::min(d1.size(), d2.size());
        for (size_t i = 0; i < n; ++i) {
            if (d1[i] != d2[i]) dist++;
        }
        return dist;
    } else {
        double dist = 0;
        size_t n = std::min(d1.size(), d2.size());
        for (size_t i = 0; i < n; ++i) {
            double diff = d1[i] - d2[i];
            dist += diff * diff;
        }
        return std::sqrt(dist);
    }
}

// --- FeatureExtractor ---

FeatureExtractor::FeatureExtractor(std::unique_ptr<Detector> detector,
                                     std::unique_ptr<DescriptorExtractor> descriptorExtractor,
                                     const FeatureExtractionParams& params)
    : detector_(std::move(detector)), descriptorExtractor_(std::move(descriptorExtractor)), params_(params) {}

FeatureExtractionResult FeatureExtractor::extract(const SLAMObservation& observation) {
    if (!observation.image.has_value()) {
        // Throw logic_error instead
        throw std::logic_error("Observation must contain image data for feature extraction");
    }

    auto startTime = std::chrono::steady_clock::now();
    const auto& img = observation.image.value();

    auto keypoints = detector_->detect(img.data, img.width, img.height);
    auto filtered = filterKeypoints(keypoints);

    if (static_cast<int>(filtered.size()) > params_.maxFeatures)
        filtered.resize(static_cast<size_t>(params_.maxFeatures));

    auto descriptors = descriptorExtractor_->compute(img.data, img.width, img.height, filtered);

    auto endTime = std::chrono::steady_clock::now();
    double elapsed = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    totalExtractionTime_ += elapsed;
    featureCount_ += static_cast<int>(filtered.size());

    FeatureExtractionResult result;
    result.keypoints = std::move(filtered);
    result.descriptors = std::move(descriptors);
    result.timestamp = observation.timestamp;
    return result;
}

std::vector<Keypoint> FeatureExtractor::detectKeypoints(const std::vector<uint8_t>& image, int width, int height) {
    return detector_->detect(image, width, height);
}

std::vector<std::vector<double>> FeatureExtractor::computeDescriptors(
    const std::vector<uint8_t>& image, int width, int height,
    const std::vector<Keypoint>& keypoints) {
    return descriptorExtractor_->compute(image, width, height, keypoints);
}

std::vector<Keypoint> FeatureExtractor::filterKeypoints(const std::vector<Keypoint>& keypoints) const {
    auto sorted = keypoints;
    std::sort(sorted.begin(), sorted.end(), [](const Keypoint& a, const Keypoint& b) {
        return a.response > b.response;
    });

    std::vector<Keypoint> result;
    for (const auto& kp : sorted) {
        if (kp.response < 1.0) continue;
        bool isFarEnough = true;
        for (const auto& existing : result) {
            double dx = kp.pixel.first - existing.pixel.first;
            double dy = kp.pixel.second - existing.pixel.second;
            if (std::sqrt(dx*dx + dy*dy) < params_.minDistance) {
                isFarEnough = false;
                break;
            }
        }
        if (isFarEnough) {
            result.push_back(kp);
        }
        if (static_cast<int>(result.size()) >= static_cast<int>(params_.maxFeatures * 1.5))
            break;
    }
    return result;
}

FeatureExtractor::Statistics FeatureExtractor::getStatistics() const {
    Statistics s;
    s.totalFeaturesExtracted = featureCount_;
    s.averageExtractionTime = featureCount_ > 0 ? totalExtractionTime_ / featureCount_ : 0.0;
    s.params = params_;
    return s;
}

void FeatureExtractor::resetStatistics() {
    featureCount_ = 0;
    totalExtractionTime_ = 0.0;
}

} // namespace slam
} // namespace atlas_navigation
