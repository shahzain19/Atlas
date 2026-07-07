/**
 * Feature Extractor - Extracts features from observations for SLAM
 */

import {
  Keypoint,
  Descriptor,
  FeatureExtractionParams,
  SLAMObservation,
} from "./SLAMTypes";

/**
 * Feature detector interface
 */
export interface Detector {
  detect(image: Uint8Array, width: number, height: number): Keypoint[];
}

/**
 * Descriptor extractor interface
 */
export interface DescriptorExtractor {
  compute(
    image: Uint8Array,
    width: number,
    height: number,
    keypoints: Keypoint[]
  ): number[][];
}

/**
 * Feature extraction result
 */
export interface FeatureExtractionResult {
  /** Detected keypoints */
  keypoints: Keypoint[];
  /** Computed descriptors */
  descriptors: number[][];
  /** Processing timestamp */
  timestamp: number;
}

/**
 * FeatureExtractor class for extracting features from observations
 */
export class FeatureExtractor {
  /** Feature detector instance */
  private detector: Detector;
  /** Descriptor extractor instance */
  private descriptorExtractor: DescriptorExtractor;
  /** Extraction parameters */
  private params: FeatureExtractionParams;
  /** Number of features extracted */
  private featureCount: number;
  /** Total extraction time accumulator */
  private totalExtractionTime: number;

  constructor(
    detector: Detector,
    descriptorExtractor: DescriptorExtractor,
    params?: Partial<FeatureExtractionParams>
  ) {
    this.detector = detector;
    this.descriptorExtractor = descriptorExtractor;
    this.params = {
      maxFeatures: params?.maxFeatures ?? 2000,
      pyramidLevels: params?.pyramidLevels ?? 4,
      scaleFactor: params?.scaleFactor ?? 1.2,
      fastThreshold: params?.fastThreshold ?? 20,
      minDistance: params?.minDistance ?? 5.0,
    };
    this.featureCount = 0;
    this.totalExtractionTime = 0;
  }

  /**
   * Extract features from an observation
   */
  extract(observation: SLAMObservation): FeatureExtractionResult {
    if (!observation.image) {
      throw new Error("Observation must contain image data for feature extraction");
    }

    const startTime = performance.now();

    // Detect keypoints
    const keypoints = this.detector.detect(
      observation.image.data,
      observation.image.width,
      observation.image.height
    );

    // Filter and refine keypoints
    const filteredKeypoints = this.filterKeypoints(keypoints);

    // Limit to max features
    const limitedKeypoints = filteredKeypoints.slice(0, this.params.maxFeatures);

    // Compute descriptors
    const descriptors = this.descriptorExtractor.compute(
      observation.image.data,
      observation.image.width,
      observation.image.height,
      limitedKeypoints
    );

    const endTime = performance.now();
    this.totalExtractionTime += endTime - startTime;
    this.featureCount += limitedKeypoints.length;

    return {
      keypoints: limitedKeypoints,
      descriptors,
      timestamp: observation.timestamp,
    };
  }

  /**
   * Detect keypoints in an image
   */
  detectKeypoints(image: Uint8Array, width: number, height: number): Keypoint[] {
    return this.detector.detect(image, width, height);
  }

  /**
   * Compute descriptors for given keypoints
   */
  computeDescriptors(
    image: Uint8Array,
    width: number,
    height: number,
    keypoints: Keypoint[]
  ): number[][] {
    return this.descriptorExtractor.compute(image, width, height, keypoints);
  }

  /**
   * Filter keypoints based on quality and minimum distance
   */
  private filterKeypoints(keypoints: Keypoint[]): Keypoint[] {
    // Sort by response strength (stronger features first)
    const sorted = [...keypoints].sort((a, b) => b.response - a.response);

    const result: Keypoint[] = [];

    for (const kp of sorted) {
      // Filter by minimum response
      if (kp.response < 1.0) {
        continue;
      }

      // Check minimum distance to existing keypoints
      let isFarEnough = true;
      for (const existing of result) {
        const dx = kp.pixel.x - existing.pixel.x;
        const dy = kp.pixel.y - existing.pixel.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.params.minDistance) {
          isFarEnough = false;
          break;
        }
      }

      if (isFarEnough) {
        result.push(kp);
      }

      // Early exit if we have enough features
      if (result.length >= this.params.maxFeatures * 1.5) {
        break;
      }
    }

    return result;
  }

  /**
   * Get the detector instance
   */
  getDetector(): Detector {
    return this.detector;
  }

  /**
   * Get the descriptor extractor instance
   */
  getDescriptorExtractor(): DescriptorExtractor {
    return this.descriptorExtractor;
  }

  /**
   * Get feature extraction statistics
   */
  getStatistics(): {
    totalFeaturesExtracted: number;
    averageExtractionTime: number;
    params: FeatureExtractionParams;
  } {
    return {
      totalFeaturesExtracted: this.featureCount,
      averageExtractionTime:
        this.featureCount > 0 ? this.totalExtractionTime / this.featureCount : 0,
      params: this.params,
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.featureCount = 0;
    this.totalExtractionTime = 0;
  }
}

/**
 * ORB detector implementation
 */
export class ORBDetector implements Detector {
  private fastThreshold: number;
  private pyramidLevels: number;
  private scaleFactor: number;

  constructor(
    fastThreshold: number = 20,
    pyramidLevels: number = 4,
    scaleFactor: number = 1.2
  ) {
    this.fastThreshold = fastThreshold;
    this.pyramidLevels = pyramidLevels;
    this.scaleFactor = scaleFactor;
  }

  detect(image: Uint8Array, width: number, height: number): Keypoint[] {
    // Simplified ORB detection using FAST corner detection
    // In a real implementation, this would use native libraries or WASM modules
    const keypoints: Keypoint[] = [];
    const bytesPerPixel = image.length / (width * height);

    for (let y = 8; y < height - 8; y += 4) {
      for (let x = 8; x < width - 8; x += 4) {
        // Simplified FAST-like corner response
        const cornerScore = this.computeCornerResponse(image, width, height, x, y, bytesPerPixel);

        if (cornerScore > this.fastThreshold) {
          // Estimate scale level from corner response
          const scaleLevel = this.estimateScaleLevel(cornerScore);

          // Compute orientation
          const angle = this.computeOrientation(image, width, height, x, y, bytesPerPixel);

          keypoints.push({
            pixel: { x, y },
            scaleLevel,
            response: cornerScore,
            angle,
            size: 7,
          });
        }
      }
    }

    // Limit keypoints if too many
    return keypoints.slice(0, 10000);
  }

  private computeCornerResponse(
    image: Uint8Array,
    width: number,
    height: number,
    cx: number,
    cy: number,
    bytesPerPixel: number
  ): number {
    // Simplified FAST-9 corner detector
    const centerIdx = (cy * width + cx) * bytesPerPixel;
    const intensity = image[centerIdx];

    let brighter = 0;
    let darker = 0;
    const circleOffsets = [
      [-3, 0],
      [-2, 2],
      [0, 3],
      [2, 2],
      [3, 0],
      [2, -2],
      [0, -3],
      [-2, -2],
    ];

    for (const [dx, dy] of circleOffsets) {
      const idx = ((cy + dy) * width + (cx + dx)) * bytesPerPixel;
      const diff = image[idx] - intensity;

      if (diff > 10) brighter++;
      else if (diff < -10) darker++;
    }

    // Return corner score based on consecutive pixels
    if (brighter >= 7) return 255 - intensity;
    if (darker >= 7) return intensity;

    return 0;
  }

  private estimateScaleLevel(cornerScore: number): number {
    // Map corner score to pyramid level
    return Math.floor(Math.log2(255 - cornerScore + 1)) % 4;
  }

  private computeOrientation(
    image: Uint8Array,
    width: number,
    height: number,
    cx: number,
    cy: number,
    bytesPerPixel: number
  ): number {
    // Compute first moments for orientation
    let m01 = 0;
    let m10 = 0;
    let m00 = 0;

    const patchSize = 7;

    for (let dy = -patchSize; dy <= patchSize; dy++) {
      for (let dx = -patchSize; dx <= patchSize; dx++) {
        const x = cx + dx;
        const y = cy + dy;

        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = (y * width + x) * bytesPerPixel;
          const intensity = image[idx];

          m10 += intensity * dx;
          m01 += intensity * dy;
          m00 += intensity;
        }
      }
    }

    if (m00 === 0) return 0;

    // Compute angle
    return (Math.atan2(m01, m10) * 180) / Math.PI;
  }
}

/**
 * ORB descriptor extractor implementation
 */
export class ORBDescriptorExtractor implements DescriptorExtractor {
  private bytesPerDescriptor: number;

  constructor() {
    // ORB uses 256-bit (32 bytes) descriptors
    this.bytesPerDescriptor = 32;
  }

  compute(
    image: Uint8Array,
    width: number,
    height: number,
    keypoints: Keypoint[]
  ): number[][] {
    const descriptors: number[][] = [];

    for (const kp of keypoints) {
      const descriptor = this.computeDescriptor(image, width, height, kp);
      descriptors.push(descriptor);
    }

    return descriptors;
  }

  private computeDescriptor(
    image: Uint8Array,
    width: number,
    height: number,
    keypoint: Keypoint
  ): number[] {
    // Simplified ORB descriptor using BRIEF-like pattern
    const descriptor: number[] = [];
    const { x, y } = keypoint.pixel;
    const angleRad = (keypoint.angle * Math.PI) / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    // BRIEF pattern pairs (simplified)
    const patternPairs = [
      [8, -7],
      [5, 5],
      [-2, 9],
      [-11, -2],
      [9, 4],
      [-6, -3],
      [7, -8],
      [3, -11],
      [0, 8],
      [-7, 3],
      [11, 0],
      [3, 7],
      [-8, -5],
      [6, 2],
      [-5, -9],
      [2, 10],
    ];

    for (const [dx1, dy1] of patternPairs) {
      // Rotate pattern by keypoint orientation
      const rx1 = Math.round(dx1 * cosA - dy1 * sinA);
      const ry1 = Math.round(dx1 * sinA + dy1 * cosA);

      const dx2 = dx1 + 1;
      const dy2 = dy1 + 1;
      const rx2 = Math.round(dx2 * cosA - dy2 * sinA);
      const ry2 = Math.round(dx2 * cosA + dy2 * sinA);

      // Sample intensities
      const x1 = Math.max(0, Math.min(width - 1, Math.round(x + rx1)));
      const y1 = Math.max(0, Math.min(height - 1, Math.round(y + ry1)));
      const x2 = Math.max(0, Math.min(width - 1, Math.round(x + rx2)));
      const y2 = Math.max(0, Math.min(height - 1, Math.round(y + ry2)));

      const idx1 = y1 * width + x1;
      const idx2 = y2 * width + x2;

      descriptor.push(image[idx1] < image[idx2] ? 1 : 0);
    }

    return descriptor;
  }
}

/**
 * Brute-force descriptor matcher
 */
export class BFMatcher {
  private normType: "HAMMING" | "L2";

  constructor(normType: "HAMMING" | "L2" = "HAMMING") {
    this.normType = normType;
  }

  /**
   * Match descriptors using brute-force
   */
  match(
    descriptors1: number[][],
    descriptors2: number[][]
  ): { queryIdx: number; trainIdx: number; distance: number }[] {
    const matches: { queryIdx: number; trainIdx: number; distance: number }[] = [];

    for (let i = 0; i < descriptors1.length; i++) {
      let minDist = Infinity;
      let minIdx = -1;

      for (let j = 0; j < descriptors2.length; j++) {
        const dist = this.computeDistance(descriptors1[i], descriptors2[j]);

        if (dist < minDist) {
          minDist = dist;
          minIdx = j;
        }
      }

      if (minIdx >= 0) {
        matches.push({ queryIdx: i, trainIdx: minIdx, distance: minDist });
      }
    }

    return matches;
  }

  /**
   * Match with ratio test (Lowe's ratio test)
   */
  matchWithRatio(
    descriptors1: number[][],
    descriptors2: number[][],
    ratioThreshold: number = 0.75
  ): { queryIdx: number; trainIdx: number; distance: number }[] {
    const matches: { queryIdx: number; trainIdx: number; distance: number }[] = [];

    for (let i = 0; i < descriptors1.length; i++) {
      // Find two nearest neighbors
      let bestDist = Infinity;
      let secondBestDist = Infinity;
      let bestIdx = -1;

      for (let j = 0; j < descriptors2.length; j++) {
        const dist = this.computeDistance(descriptors1[i], descriptors2[j]);

        if (dist < bestDist) {
          secondBestDist = bestDist;
          bestDist = dist;
          bestIdx = j;
        } else if (dist < secondBestDist) {
          secondBestDist = dist;
        }
      }

      // Apply ratio test
      if (bestIdx >= 0 && bestDist < secondBestDist * ratioThreshold) {
        matches.push({ queryIdx: i, trainIdx: bestIdx, distance: bestDist });
      }
    }

    return matches;
  }

  /**
   * Compute distance between two descriptors
   */
  private computeDistance(d1: number[], d2: number[]): number {
    if (this.normType === "HAMMING") {
      // Hamming distance for binary descriptors
      let dist = 0;
      for (let i = 0; i < d1.length && i < d2.length; i++) {
        if (d1[i] !== d2[i]) dist++;
      }
      return dist;
    } else {
      // Euclidean distance for float descriptors
      let dist = 0;
      for (let i = 0; i < d1.length && i < d2.length; i++) {
        const diff = d1[i] - d2[i];
        dist += diff * diff;
      }
      return Math.sqrt(dist);
    }
  }
}