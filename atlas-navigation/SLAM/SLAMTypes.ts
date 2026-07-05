/**
 * SLAM Types - Core type definitions for SLAM integration
 */

import { Vector3, Quaternion } from "../../atlas-kernel/Perception/StateEstimate";

/**
 * SLAM configuration parameters
 */
export interface SLAMConfig {
  /** Feature detector type (ORB, SIFT, SURF, etc.) */
  detectorType: "ORB" | "SIFT" | "SURF" | "AKAZE" | "BRISK";
  /** Descriptor extractor type */
  descriptorType: "ORB" | "SIFT" | "SURF" | "AKAZE" | "BRISK";
  /** Number of keypoints to detect */
  maxKeypoints: number;
  /** Feature matching ratio threshold */
  matchRatioThreshold: number;
  /** Loop closure detection frequency (ms) */
  loopClosureInterval: number;
  /** Keyframe selection distance threshold */
  keyframeDistanceThreshold: number;
  /** Map point triangulation minimum triangulation angle */
  minTriangulationAngle: number;
  /** Pose graph optimization iterations */
  optimizationIterations: number;
  /** Initial map scale */
  mapScale: number;
  /** Enable loop closure detection */
  enableLoopClosure: boolean;
  /** Maximum correspondence distance for matching */
  maxCorrespondenceDistance: number;
  /** Minimum map points for initialization */
  minMapPoints: number;
  /** Tracking lost threshold */
  trackingLostThreshold: number;
}

/**
 * SLAM system state
 */
export interface SLAMState {
  /** Current robot pose */
  pose: Pose;
  /** Map of all tracked landmarks */
  mapPoints: Map<string, MapPoint>;
  /** List of keyframes for loop closure */
  keyframes: Keyframe[];
  /** Current map version */
  mapVersion: number;
  /** Total number of processed observations */
  observationCount: number;
  /** Whether SLAM is initialized */
  isInitialized: boolean;
  /** Last loop closure timestamp */
  lastLoopClosureTime: number;
  /** Cumulative loop closure count */
  loopClosureCount: number;
  /** Processing status */
  status: "INITIALIZING" | "TRACKING" | "LOST" | "OPTIMIZING";
}

/**
 * 3D pose representation
 */
export interface Pose {
  /** Position in world coordinates */
  position: Vector3;
  /** Orientation as quaternion */
  orientation: Quaternion;
  /** Timestamp of pose estimate */
  timestamp: number;
  /** Covariance matrix (6x6 for 3D position + 3D orientation) */
  covariance?: number[][];
}

/**
 * 3D map point/landmark
 */
export interface MapPoint {
  /** Unique identifier */
  id: string;
 /** Position in world coordinates */
  position: Vector3;
  /** Observing keyframes and their descriptors */
  observations: KeypointObservation[];
  /** Descriptor for loop closure matching */
  descriptor: number[];
  /** Number of times this point has been observed */
  observationCount: number;
  /** Point validity score */
  score: number;
  /** Timestamp when point was created */
  createdAt: number;
  /** Timestamp when point was last observed */
  lastObservedAt: number;
}

/**
 * Observation of a map point in a keyframe
 */
export interface KeypointObservation {
  /** Keyframe ID where observation occurred */
  keyframeId: string;
  /** Keypoint index in the keyframe */
  keypointIndex: number;
  /** Scale level of keypoint */
  scaleLevel: number;
  /** Tracking status */
  status: "PENDING" | "TRACKED" | "FAILED" | "OUTLIER";
}

/**
 * Keyframe for pose graph
 */
export interface Keyframe {
  /** Unique identifier */
  id: string;
  /** Camera pose at this keyframe */
  pose: Pose;
  /** Extracted keypoints */
  keypoints: Keypoint[];
  /** Computed descriptors */
  descriptors: number[][];
  /** Associated map point IDs */
  mapPointIds: string[];
  /** Connected keyframes for loop closure */
  connections: KeyframeConnection[];
  /** Timestamp */
  timestamp: number;
  /** Sequence number in trajectory */
  sequenceNumber: number;
}

/**
 * Connection between two keyframes
 */
export interface KeyframeConnection {
  /** Connected keyframe ID */
  keyframeId: string;
  /** Relative transformation */
  relativePose: Pose;
  /** Information matrix for optimization */
  informationMatrix: number[][];
  /** Edge type for graph */
  edgeType: "ODOMETRY" | "LOOP_CLOSURE" | "CONSTRAINT";
}

/**
 * Detected keypoint
 */
export interface Keypoint {
  /** Pixel coordinates in image */
  pixel: { x: number; y: number };
  /** Subpixel refined coordinates */
  subpixel?: { x: number; y: number };
  /** Scale level in pyramid */
  scaleLevel: number;
  /** Response strength */
  response: number;
  /** Orientation angle (degrees) */
  angle: number;
  /** Size of keypoint */
  size: number;
}

/**
 * Feature descriptor (typically 128 or 256 floats)
 */
export interface Descriptor {
  /** Descriptor values */
  values: number[];
  /** Distance to another descriptor */
  distanceTo(other: Descriptor): number;
}

/**
 * Loop closure detection result
 */
export interface LoopClosure {
  /** Current keyframe ID */
  currentKeyframeId: string;
  /** Matched previous keyframe ID */
  matchedKeyframeId: string;
  /** Relative transform between keyframes */
  relativePose: Pose;
  /** Number of inlier correspondences */
  inlierCount: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Matched map point correspondences */
  correspondences: MapPointCorrespondence[];
}

/**
 * Map point correspondence for loop closure
 */
export interface MapPointCorrespondence {
  /** Current map point ID */
  currentPointId: string;
  /** Previous map point ID */
  previousPointId: string;
  /** Reprojection error */
  reprojectionError: number;
  /** Is inlier after verification */
  isInlier: boolean;
}

/**
 * Feature extraction parameters
 */
export interface FeatureExtractionParams {
  /** Maximum number of features to detect */
  maxFeatures: number;
  /** Pyramid levels */
  pyramidLevels: number;
  /** Scale factor between pyramid levels */
  scaleFactor: number;
  /** Fast threshold */
  fastThreshold: number;
  /** Minimum distance between features */
  minDistance: number;
}

/**
 * Pose graph optimization result
 */
export interface OptimizationResult {
  /** Optimized poses */
  poses: Map<string, Pose>;
  /** Total chi-squared error before optimization */
  initialError: number;
  /** Total chi-squared error after optimization */
  finalError: number;
  /** Number of iterations performed */
  iterations: number;
  /** Number of outliers removed */
  outliersRemoved: number;
  /** Optimization converged */
  converged: boolean;
  /** Computation time in milliseconds */
  computationTime: number;
}

/**
 * Observation data structure for SLAM input
 */
export interface SLAMObservation {
  /** Image data (if using visual SLAM) */
  image?: {
    /** Image data array */
    data: Uint8Array;
    /** Image width */
    width: number;
    /** Image height */
    height: number;
  };
  /** Depth data (optional) */
  depth?: {
    /** Depth values in meters */
    data: Float32Array;
    /** Depth width */
    width: number;
    /** Depth height */
    height: number;
  };
  /** IMU data for visual-inertial SLAM */
  imu?: {
    /** Angular velocity */
    omega: Vector3;
    /** Linear acceleration */
    acceleration: Vector3;
  };
  /** Odometry data */
  odometry?: {
    /** Linear velocity */
    linear: Vector3;
    /** Angular velocity */
    angular: Vector3;
  };
  /** Timestamp */
  timestamp: number;
}

/**
 * Default SLAM configuration
 */
export const DEFAULT_SLAM_CONFIG: SLAMConfig = {
  detectorType: "ORB",
  descriptorType: "ORB",
  maxKeypoints: 2000,
  matchRatioThreshold: 0.75,
  loopClosureInterval: 1000,
  keyframeDistanceThreshold: 0.5,
  minTriangulationAngle: 3.0,
  optimizationIterations: 100,
  mapScale: 1.0,
  enableLoopClosure: true,
  maxCorrespondenceDistance: 10.0,
  minMapPoints: 50,
  trackingLostThreshold: 10,
};