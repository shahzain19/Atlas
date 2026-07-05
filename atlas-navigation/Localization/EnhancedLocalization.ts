/**
 * Enhanced Localization - SLAM-based localization system
 */

import {
  SLAMConfig,
  SLAMState,
  Pose,
  MapPoint,
  Keyframe,
  LoopClosure,
  SLAMObservation,
  KeyframeConnection,
  DEFAULT_SLAM_CONFIG,
} from "../SLAM/SLAMTypes";
import { FeatureExtractor, ORBDetector, ORBDescriptorExtractor, BFMatcher, FeatureExtractionResult } from "../SLAM/FeatureExtractor";
import { GraphOptimizer, PoseGraphManager, GraphOptimizerConfig } from "../SLAM/GraphOptimizer";
import { Vector3, Quaternion, StateEstimate } from "../../atlas-kernel/Perception/StateEstimate";
import { SLAMEngine } from "../../atlas-runtime/Perception/SLAMEngine";

/**
 * Localization result
 */
export interface LocalizationResult {
  /** Current pose estimate */
  pose: Pose;
  /** Map of tracked points */
  mapPoints: Map<string, MapPoint>;
  /** Number of tracked features */
  trackedFeatures: number;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Status of localization */
  status: "SUCCESS" | "LOST" | "INITIALIZING" | "RELOCALIZING";
}

/**
 * Map update information
 */
export interface MapUpdateInfo {
  /** New keyframe added */
  keyframeAdded: boolean;
  /** Number of new map points */
  newPointsCount: number;
  /** Number of map points pruned */
  prunedPointsCount: number;
  /** Optimization performed */
  optimizationPerformed: boolean;
  /** Loop closure detected */
  loopClosureDetected: boolean;
}

/**
 * EnhancedLocalization class that uses SLAM for localization
 */
export class EnhancedLocalization {
  /** SLAM engine for pose estimation */
  private slamEngine: SLAMEngine;
  /** Feature extractor */
  private featureExtractor: FeatureExtractor;
  /** Pose graph manager */
  private poseGraphManager: PoseGraphManager;
  /** Graph optimizer */
  private graphOptimizer: GraphOptimizer;
  /** Current SLAM state */
  private currentState: SLAMState;
  /** Current pose estimate */
  private currentPose: Pose;
  /** Map of all map points */
  private mapPoints: Map<string, MapPoint>;
  /** Keyframes for tracking */
  private keyframes: Keyframe[];
  /** Reference keyframe for tracking */
  private referenceKeyframe: Keyframe | null;
  /** Previous feature descriptors for tracking */
  private previousDescriptors: number[][];
  /** Previous keypoints for tracking */
  private previousKeypoints: Keypoint[];
  /** Configuration */
  private config: SLAMConfig;
  /** Total processing time */
  private totalProcessingTime: number;
  /** Total observations processed */
  private observationCount: number;
  /** Minimum map points required */
  private minMapPoints: number;
  /** Tracking lost threshold */
  private trackingLostThreshold: number;
  /** Sequence number for keyframes */
  private sequenceNumber: number;

  constructor(config?: Partial<SLAMConfig>) {
    this.config = { ...DEFAULT_SLAM_CONFIG, ...config };

    // Initialize feature extractor
    const detector = new ORBDetector();
    const descriptorExtractor = new ORBDescriptorExtractor();
    this.featureExtractor = new FeatureExtractor(detector, descriptorExtractor, {
      maxFeatures: this.config.maxKeypoints,
    });

    // Initialize graph optimizer
    const optimizerConfig: Partial<GraphOptimizerConfig> = {
      maxIterations: this.config.optimizationIterations,
      robustKernel: "HUBER",
    };
    this.graphOptimizer = new GraphOptimizer(optimizerConfig);
    this.poseGraphManager = new PoseGraphManager();

    // Initialize SLAM engine
    this.slamEngine = new SLAMEngine();

    // Initialize state
    this.currentPose = {
      position: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };

    this.currentState = {
      pose: { ...this.currentPose },
      mapPoints: new Map(),
      keyframes: [],
      mapVersion: 0,
      observationCount: 0,
      isInitialized: false,
      lastLoopClosureTime: 0,
      loopClosureCount: 0,
      status: "INITIALIZING",
    };

    this.mapPoints = new Map();
    this.keyframes = [];
    this.referenceKeyframe = null;
    this.previousDescriptors = [];
    this.previousKeypoints = [];
    this.totalProcessingTime = 0;
    this.observationCount = 0;
    this.minMapPoints = this.config.minMapPoints;
    this.trackingLostThreshold = this.config.trackingLostThreshold;
    this.sequenceNumber = 0;
  }

  /**
   * Localize the robot given an observation
   */
  localize(observation: SLAMObservation): LocalizationResult {
    const startTime = performance.now();

    // Extract features
    const features = this.featureExtractor.extract(observation);

    // Update tracking
    const trackingResult = this.trackFeatures(features);

    // Update current pose
    this.currentPose = trackingResult.pose;

    // Create keyframe if needed
    let keyframeAdded = false;
    if (this.shouldCreateKeyframe(features)) {
      this.createKeyframe(features, observation.timestamp);
      keyframeAdded = true;
    }

    // Update state
    this.currentState = {
      pose: { ...this.currentPose },
      mapPoints: new Map(this.mapPoints),
      keyframes: [...this.keyframes],
      mapVersion: this.currentState.mapVersion + (keyframeAdded ? 1 : 0),
      observationCount: this.currentState.observationCount + 1,
      isInitialized: this.currentState.isInitialized || this.mapPoints.size >= this.minMapPoints,
      lastLoopClosureTime: this.currentState.lastLoopClosureTime,
      loopClosureCount: this.currentState.loopClosureCount,
      status: trackingResult.trackedCount >= this.trackingLostThreshold ? "TRACKING" : "LOST",
    };

    const endTime = performance.now();
    this.totalProcessingTime += endTime - startTime;
    this.observationCount++;

    return {
      pose: { ...this.currentPose },
      mapPoints: new Map(this.mapPoints),
      trackedFeatures: trackingResult.trackedCount,
      processingTime: endTime - startTime,
      status: trackingResult.trackedCount >= this.trackingLostThreshold ? "SUCCESS" : "LOST",
    };
  }

  /**
   * Track features between frames
   */
  private trackFeatures(features: FeatureExtractionResult): {
    pose: Pose;
    trackedCount: number;
  } {
    if (!this.referenceKeyframe || this.previousKeypoints.length === 0) {
      // First frame - just set up tracking
      this.previousKeypoints = features.keypoints;
      this.previousDescriptors = features.descriptors;

      return {
        pose: this.currentPose,
        trackedCount: features.keypoints.length,
      };
    }

    // Match features
    const matcher = new BFMatcher("HAMMING");
    const matches = matcher.matchWithRatio(
      this.previousDescriptors,
      features.descriptors,
      this.config.matchRatioThreshold
    );

    // Estimate motion from matched features
    const trackedPose = this.estimateMotion(
      this.previousKeypoints,
      features.keypoints,
      matches
    );

    // Update pose
    this.currentPose = this.composePose(this.currentPose, trackedPose);

    // Update tracking data
    this.previousKeypoints = features.keypoints;
    this.previousDescriptors = features.descriptors;

    return {
      pose: this.currentPose,
      trackedCount: matches.length,
    };
  }

  /**
   * Estimate motion between two frames
   */
  private estimateMotion(
    prevKeypoints: Keypoint[],
    currKeypoints: Keypoint[],
    matches: { queryIdx: number; trainIdx: number; distance: number }[]
  ): Pose {
    // Use essential matrix or homography for motion estimation
    // For simplicity, use parallax-based motion estimation

    let totalDx = 0;
    let totalDy = 0;
    let totalDz = 0;

    for (const match of matches) {
      const prevKp = prevKeypoints[match.queryIdx];
      const currKp = currKeypoints[match.trainIdx];

      // Estimate depth from parallax
      const dx = currKp.pixel.x - prevKp.pixel.x;
      const dy = currKp.pixel.y - prevKp.pixel.y;

      // Simple translation estimation (would be more complex in real SLAM)
      totalDx += dx * 0.01;
      totalDy += dy * 0.01;
    }

    const avgTranslation = matches.length > 0 ? 1 / matches.length : 1;

    return {
      position: {
        x: totalDx * avgTranslation,
        y: totalDy * avgTranslation,
        z: totalDz * avgTranslation,
      },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };
  }

  /**
   * Check if a new keyframe should be created
   */
  private shouldCreateKeyframe(features: FeatureExtractionResult): boolean {
    // Create keyframe if:
    // 1. First frame
    // 2. Sufficient motion from last keyframe
    // 3. Tracking quality degraded significantly

    if (!this.referenceKeyframe) return true;

    const dx = this.currentPose.position.x - this.referenceKeyframe.pose.position.x;
    const dy = this.currentPose.position.y - this.referenceKeyframe.pose.position.y;
    const dz = this.currentPose.position.z - this.referenceKeyframe.pose.position.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return distance > this.config.keyframeDistanceThreshold;
  }

  /**
   * Create a new keyframe
   */
  private createKeyframe(features: FeatureExtractionResult, timestamp: number): void {
    // Create new keyframe
    const keyframe: Keyframe = {
      id: `kf-${this.sequenceNumber++}`,
      pose: { ...this.currentPose },
      keypoints: features.keypoints,
      descriptors: features.descriptors,
      mapPointIds: [],
      connections: [],
      timestamp,
      sequenceNumber: this.sequenceNumber,
    };

    // Add to keyframe list
    this.keyframes.push(keyframe);
    this.referenceKeyframe = keyframe;

    // Add to pose graph
    if (this.keyframes.length > 1) {
      const prevKeyframe = this.keyframes[this.keyframes.length - 2];

      // Compute relative pose
      const relativePose = this.computeRelativePose(
        prevKeyframe.pose,
        keyframe.pose
      );

      // Create connection
      const connection: KeyframeConnection = {
        keyframeId: prevKeyframe.id,
        relativePose,
        informationMatrix: this.createInformationMatrix("ODOMETRY"),
        edgeType: "ODOMETRY",
      };

      keyframe.connections.push(connection);

      // Add to pose graph
      this.poseGraphManager.addKeyframe(keyframe);

      // Run optimization periodically
      if (this.keyframes.length % 10 === 0) {
        this.optimizePoseGraph();
      }
    }

    // Add new map points from this keyframe
    this.addMapPoints(features);
  }

  /**
   * Add new map points from keyframe
   */
  private addMapPoints(features: FeatureExtractionResult): void {
    // Triangulate new points from consecutive keyframes
    // For each keypoint without a map point, create a new one

    for (let i = 0; i < features.keypoints.length; i++) {
      const pointId = `mp-${this.mapPoints.size + 1}`;

      // Estimate 3D position from parallax
      const position = this.triangulatePoint(
        this.referenceKeyframe!,
        features.keypoints[i]
      );

      if (position) {
        const mapPoint: MapPoint = {
          id: pointId,
          position,
          observations: [],
          descriptor: features.descriptors[i],
          observationCount: 1,
          score: features.keypoints[i].response,
          createdAt: Date.now(),
          lastObservedAt: Date.now(),
        };

        this.mapPoints.set(pointId, mapPoint);
      }
    }
  }

  /**
   * Triangulate a 3D point from two keyframes
   */
  private triangulatePoint(
    keyframe1: Keyframe,
    keypoint2: Keypoint
  ): Vector3 | null {
    // Simplified triangulation
    // In real SLAM, this would use proper epipolar geometry

    const baseline = 0.1; // Assume some baseline between keyframes

    // Estimate depth from keypoint properties
    const depth = keypoint2.size * baseline;

    if (depth < 0.1 || depth > 100) {
      return null;
    }

    return {
      x: keyframe1.pose.position.x + keypoint2.pixel.x * 0.01,
      y: keyframe1.pose.position.y + keypoint2.pixel.y * 0.01,
      z: keyframe1.pose.position.z + depth,
    };
  }

  /**
   * Update the map with new observations
   */
  updateMap(observation: SLAMObservation): MapUpdateInfo {
    const result = this.localize(observation);

    let newPointsCount = 0;
    let prunedPointsCount = 0;
    let optimizationPerformed = false;
    let loopClosureDetected = false;

    // Check for loop closure
    if (this.config.enableLoopClosure) {
      const loopClosure = this.detectLoopClosure();
      if (loopClosure) {
        this.applyLoopClosure(loopClosure);
        loopClosureDetected = true;
      }
    }

    // Prune old/dead map points
    const beforeCount = this.mapPoints.size;
    this.pruneMapPoints();
    prunedPointsCount = beforeCount - this.mapPoints.size;

    return {
      keyframeAdded: this.shouldCreateKeyframe(this.featureExtractor.extract(observation)),
      newPointsCount,
      prunedPointsCount,
      optimizationPerformed,
      loopClosureDetected,
    };
  }

  /**
   * Detect loop closure
   */
  private detectLoopClosure(): LoopClosure | null {
    // Check if enough time has passed since last loop closure
    const now = Date.now();
    if (now - this.currentState.lastLoopClosureTime < this.config.loopClosureInterval) {
      return null;
    }

    // Need at least a few keyframes to detect loop closure
    if (this.keyframes.length < 10) {
      return null;
    }

    // Match current keyframe against older keyframes
    const currentKeyframe = this.keyframes[this.keyframes.length - 1];

    for (let i = 0; i < this.keyframes.length - 10; i++) {
      const candidateKeyframe = this.keyframes[i];

      // Match descriptors
      const matcher = new BFMatcher("HAMMING");
      const matches = matcher.matchWithRatio(
        currentKeyframe.descriptors,
        candidateKeyframe.descriptors,
        this.config.matchRatioThreshold
      );

      // Check if enough matches for loop closure
      const minLoopClosureMatches = 20;
      if (matches.length >= minLoopClosureMatches) {
        // Compute relative pose
        const relativePose = this.computeRelativePose(
          candidateKeyframe.pose,
          currentKeyframe.pose
        );

        // Verify loop closure with geometric constraints
        const inlierCount = this.verifyLoopClosure(
          currentKeyframe,
          candidateKeyframe,
          matches
        );

        if (inlierCount >= minLoopClosureMatches * 0.5) {
          return {
            currentKeyframeId: currentKeyframe.id,
            matchedKeyframeId: candidateKeyframe.id,
            relativePose,
            inlierCount,
            confidence: inlierCount / matches.length,
            correspondences: [],
          };
        }
      }
    }

    return null;
  }

  /**
   * Verify loop closure with geometric constraints
   */
  private verifyLoopClosure(
    kf1: Keyframe,
    kf2: Keyframe,
    matches: { queryIdx: number; trainIdx: number; distance: number }[]
  ): number {
    // Simplified verification - count inliers based on reprojection
    let inlierCount = 0;

    for (const match of matches) {
      const kp1 = kf1.keypoints[match.queryIdx];
      const kp2 = kf2.keypoints[match.trainIdx];

      // Compute expected position based on relative pose
      const relativeX = kp2.pixel.x - kp1.pixel.x;
      const relativeY = kp2.pixel.y - kp1.pixel.y;

      // Check if consistent with current relative pose
      const dx = kf2.pose.position.x - kf1.pose.position.x;
      const dy = kf2.pose.position.y - kf1.pose.position.y;

      const expectedRelX = dx * 100; // Scale factor
      const expectedRelY = dy * 100;

      const error = Math.sqrt(
        Math.pow(relativeX - expectedRelX, 2) +
        Math.pow(relativeY - expectedRelY, 2)
      );

      if (error < this.config.maxCorrespondenceDistance) {
        inlierCount++;
      }
    }

    return inlierCount;
  }

  /**
   * Apply loop closure
   */
  private applyLoopClosure(loopClosure: LoopClosure): void {
    // Add loop closure constraint to pose graph
    this.poseGraphManager.addLoopClosure(
      loopClosure.matchedKeyframeId,
      loopClosure.currentKeyframeId,
      loopClosure.relativePose
    );

    // Optimize pose graph
    this.optimizePoseGraph();

    // Update state
    this.currentState.lastLoopClosureTime = Date.now();
    this.currentState.loopClosureCount++;

    // Update map points with corrected poses
    this.updateMapPointPositions();
  }

  /**
   * Optimize the pose graph
   */
  private optimizePoseGraph(): void {
    const result = this.poseGraphManager.optimize();

    if (result.converged) {
      // Update keyframe poses with optimized poses
      for (const [keyframeId, pose] of result.poses) {
        const keyframe = this.keyframes.find((kf) => kf.id === keyframeId);
        if (keyframe) {
          keyframe.pose = pose;
        }
      }

      // Update current pose
      const currentKeyframe = this.keyframes[this.keyframes.length - 1];
      if (currentKeyframe) {
        this.currentPose = currentKeyframe.pose;
      }
    }
  }

  /**
   * Update map point positions after optimization
   */
  private updateMapPointPositions(): void {
    // Recompute map point positions based on optimized keyframe poses
    // This is a simplified implementation
    for (const [id, mapPoint] of this.mapPoints) {
      // Find the most recent observation
      // and update the position estimate
      const mostRecentPose = this.keyframes[this.keyframes.length - 1];
      if (mostRecentPose) {
        mapPoint.position.x +=
          (mostRecentPose.pose.position.x - this.currentPose.position.x) * 0.1;
        mapPoint.position.y +=
          (mostRecentPose.pose.position.y - this.currentPose.position.y) * 0.1;
        mapPoint.position.z +=
          (mostRecentPose.pose.position.z - this.currentPose.position.z) * 0.1;
      }
    }
  }

  /**
   * Prune old and invalid map points
   */
  private pruneMapPoints(): void {
    const now = Date.now();
    const maxAge = 5000; // 5 seconds
    const minObservations = 3;
    const minScore = 0.01;

    for (const [id, point] of this.mapPoints) {
      const age = now - point.lastObservedAt;
      const shouldPrune =
        age > maxAge ||
        point.observationCount < minObservations ||
        point.score < minScore;

      if (shouldPrune) {
        this.mapPoints.delete(id);
      }
    }

    // Limit total map points
    const maxMapPoints = 1000;
    if (this.mapPoints.size > maxMapPoints) {
      // Remove lowest score points
      const sorted = Array.from(this.mapPoints.values()).sort(
        (a, b) => a.score - b.score
      );

      const toRemove = this.mapPoints.size - maxMapPoints;
      for (let i = 0; i < toRemove; i++) {
        this.mapPoints.delete(sorted[i].id);
      }
    }
  }

  /**
   * Get the current pose
   */
  getPose(): Pose {
    return { ...this.currentPose };
  }

  /**
   * Get current SLAM state
   */
  getState(): SLAMState {
    return { ...this.currentState };
  }

  /**
   * Get the SLAM engine for direct access
   */
  getSLAMEngine(): SLAMEngine {
    return this.slamEngine;
  }

  /**
   * Convert to StateEstimate format
   */
  toStateEstimate(): StateEstimate {
    return {
      position: this.currentPose.position,
      velocity: { x: 0, y: 0, z: 0 },
      orientation: this.currentPose.orientation,
      confidence: this.currentState.isInitialized
        ? Math.min(0.95, this.mapPoints.size / this.minMapPoints)
        : 0,
      timestamp: this.currentPose.timestamp,
    };
  }

  /**
   * Get map statistics
   */
  getMapStatistics(): {
    mapPointCount: number;
    keyframeCount: number;
    averageObservations: number;
    isInitialized: boolean;
  } {
    let totalObservations = 0;

    for (const point of this.mapPoints.values()) {
      totalObservations += point.observationCount;
    }

    return {
      mapPointCount: this.mapPoints.size,
      keyframeCount: this.keyframes.length,
      averageObservations:
        this.mapPoints.size > 0
          ? totalObservations / this.mapPoints.size
          : 0,
      isInitialized: this.currentState.isInitialized,
    };
  }

  /**
   * Reset the localization system
   */
  reset(): void {
    this.currentPose = {
      position: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };

    this.currentState = {
      pose: { ...this.currentPose },
      mapPoints: new Map(),
      keyframes: [],
      mapVersion: 0,
      observationCount: 0,
      isInitialized: false,
      lastLoopClosureTime: 0,
      loopClosureCount: 0,
      status: "INITIALIZING",
    };

    this.mapPoints = new Map();
    this.keyframes = [];
    this.referenceKeyframe = null;
    this.previousDescriptors = [];
    this.previousKeypoints = [];
    this.sequenceNumber = 0;

    this.poseGraphManager.clear();
  }

  /**
   * Compose two poses
   */
  private composePose(base: Pose, relative: Pose): Pose {
    // Position composition
    const rx = base.orientation.x;
    const ry = base.orientation.y;
    const rz = base.orientation.z;
    const rw = base.orientation.w;

    const dx = relative.position.x;
    const dy = relative.position.y;
    const dz = relative.position.z;

    const newX = base.position.x + dx;
    const newY = base.position.y + dy;
    const newZ = base.position.z + dz;

    // Orientation composition
    const qx = relative.orientation.x;
    const qy = relative.orientation.y;
    const qz = relative.orientation.z;
    const qw = relative.orientation.w;

    const nx = rw * qx + rx * qw + ry * qz - rz * qy;
    const ny = rw * qy - rx * qz + ry * qw + rz * qx;
    const nz = rw * qz + rx * qy - ry * qx + rz * qw;
    const nw = rw * qw - rx * qx - ry * qy - rz * qz;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz + nw * nw);

    return {
      position: { x: newX, y: newY, z: newZ },
      orientation: {
        x: nx / len,
        y: ny / len,
        z: nz / len,
        w: nw / len,
      },
      timestamp: relative.timestamp,
    };
  }

  /**
   * Compute relative pose between two poses
   */
  private computeRelativePose(pose1: Pose, pose2: Pose): Pose {
    // Compute pose2 in pose1's frame
    // Simplified - assumes small angles

    return {
      position: {
        x: pose2.position.x - pose1.position.x,
        y: pose2.position.y - pose1.position.y,
        z: pose2.position.z - pose1.position.z,
      },
      orientation: {
        x: pose2.orientation.x - pose1.orientation.x,
        y: pose2.orientation.y - pose1.orientation.y,
        z: pose2.orientation.z - pose1.orientation.z,
        w: pose2.orientation.w,
      },
      timestamp: pose2.timestamp,
    };
  }

  /**
   * Create information matrix for edge
   */
  private createInformationMatrix(
    edgeType: "ODOMETRY" | "LOOP_CLOSURE" | "CONSTRAINT"
  ): number[][] {
    const scale = edgeType === "LOOP_CLOSURE" ? 10.0 : 100.0;

    return [
      [scale, 0, 0, 0, 0, 0],
      [0, scale, 0, 0, 0, 0],
      [0, 0, scale, 0, 0, 0],
      [0, 0, 0, scale * 0.1, 0, 0],
      [0, 0, 0, 0, scale * 0.1, 0],
      [0, 0, 0, 0, 0, scale * 0.1],
    ];
  }
}

// Keypoint interface for internal use
interface Keypoint {
  pixel: { x: number; y: number };
  scaleLevel: number;
  response: number;
  angle: number;
  size: number;
}