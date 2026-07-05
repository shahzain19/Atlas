import { LocalMap, MapObject } from "../../atlas-kernel/Perception/LocalMap";
import { Observation, Vector3, StateEstimate } from "../../atlas-kernel/Perception/StateEstimate";

/**
 * SLAM Engine configuration
 */
export interface SLAMEngineConfig {
  /** Map resolution in meters per cell */
  resolution: number;
  /** Maximum number of objects to track */
  maxObjects: number;
  /** Object age threshold for pruning (ms) */
  objectAgeThreshold: number;
  /** Enable loop closure detection */
  enableLoopClosure: boolean;
  /** Loop closure confidence threshold */
  loopClosureThreshold: number;
  /** Keyframe distance threshold */
  keyframeDistanceThreshold: number;
  /** Pose graph optimization iterations */
  optimizationIterations: number;
}

/**
 * Default SLAM engine configuration
 */
const DEFAULT_SLAM_CONFIG: SLAMEngineConfig = {
  resolution: 0.1,
  maxObjects: 100,
  objectAgeThreshold: 30000,
  enableLoopClosure: true,
  loopClosureThreshold: 0.8,
  keyframeDistanceThreshold: 0.5,
  optimizationIterations: 50,
};

/**
 * Keyframe for pose graph
 */
export interface SLAMKeyframe {
  id: string;
  estimate: StateEstimate;
  objects: MapObject[];
  timestamp: number;
  connections: KeyframeConnection[];
}

/**
 * Connection between keyframes
 */
export interface KeyframeConnection {
  keyframeId: string;
  relativeTransform: Transform3D;
  confidence: number;
  isLoopClosure: boolean;
}

/**
 * 3D transformation
 */
export interface Transform3D {
  position: Vector3;
  orientation: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
}

/**
 * Loop closure result
 */
export interface LoopClosureResult {
  detected: boolean;
  keyframeId: string;
  transform: Transform3D;
  confidence: number;
}

/**
 * Pose graph optimization result
 */
export interface PoseGraphResult {
  optimizedEstimate: StateEstimate;
  errorReduction: number;
  iterations: number;
  converged: boolean;
}

export class SLAMEngine {
  private currentMap: LocalMap;
  private keyframes: Map<string, SLAMKeyframe>;
  private poseGraph: Map<string, Map<string, KeyframeConnection>>;
  private currentEstimate: StateEstimate;
  private config: SLAMEngineConfig;
  private lastKeyframeId: string | null;
  private observationCount: number;
  private loopClosureCount: number;
  private lastLoopClosureTime: number;

  constructor(config?: Partial<SLAMEngineConfig>) {
    this.config = { ...DEFAULT_SLAM_CONFIG, ...config };

    this.currentMap = {
      id: `map-${Date.now()}`,
      objects: [],
      resolution: this.config.resolution,
      timestamp: Date.now(),
    };

    this.keyframes = new Map();
    this.poseGraph = new Map();
    this.currentEstimate = {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      confidence: 0,
      timestamp: Date.now(),
    };

    this.lastKeyframeId = null;
    this.observationCount = 0;
    this.loopClosureCount = 0;
    this.lastLoopClosureTime = 0;
  }

  /**
   * Processes an observation to update the local map.
   * This implements Simultaneous Localization and Mapping logic.
   */
  processObservation(observation: Observation): LocalMap {
    this.observationCount++;

    // Update current estimate based on observation type
    this.updateEstimate(observation);

    // Process based on observation type
    if (observation.type === "OBJECT_DETECTED") {
      this.updateMapFromDetection(observation);
    } else if (observation.type === "ODOMETRY") {
      this.updateFromOdometry(observation);
    } else if (observation.type === "POSE") {
      this.updateFromPose(observation);
    }

    // Check for keyframe creation
    if (this.shouldCreateKeyframe()) {
      this.createKeyframe();
    }

    // Check for loop closure
    if (this.config.enableLoopClosure) {
      const loopClosure = this.detectLoopClosure();
      if (loopClosure?.detected) {
        this.applyLoopClosure(loopClosure);
      }
    }

    // Prune old objects
    this.pruneObjects();

    this.currentMap.timestamp = Date.now();
    return { ...this.currentMap };
  }

  /**
   * Update state estimate from observation
   */
  private updateEstimate(observation: Observation): void {
    if (observation.type === "POSE" || observation.type === "ODOMETRY") {
      const data = observation.data;

      if ("position" in data) {
        // Direct pose update
        const newPosition = data.position as Vector3;
        const uncertainty = observation.uncertainty;

        // Weighted update
        const alpha = this.computeUpdateWeight(uncertainty);
        this.currentEstimate.position.x =
          this.currentEstimate.position.x * (1 - alpha) + newPosition.x * alpha;
        this.currentEstimate.position.y =
          this.currentEstimate.position.y * (1 - alpha) + newPosition.y * alpha;
        this.currentEstimate.position.z =
          this.currentEstimate.position.z * (1 - alpha) + newPosition.z * alpha;

        if ("orientation" in data) {
          this.currentEstimate.orientation = data.orientation as any;
        }

        this.currentEstimate.timestamp = observation.timestamp;
      } else if ("velocity" in data) {
        // Velocity update - integrate
        const dt = this.estimateDeltaTime();
        this.currentEstimate.position.x += (data as any).velocity.x * dt;
        this.currentEstimate.position.y += (data as any).velocity.y * dt;
        this.currentEstimate.position.z += (data as any).velocity.z * dt;
        this.currentEstimate.velocity = data as any;
      }

      // Update confidence based on observation uncertainty
      this.currentEstimate.confidence = Math.max(
        0,
        Math.min(1, 1 - observation.uncertainty)
      );
    }
  }

  /**
   * Update map from object detection
   */
  private updateMapFromDetection(observation: Observation): void {
    if (observation.type !== "OBJECT_DETECTED") return;

    const detectedObj = observation.data as { object: string; confidence: number; position?: Vector3 };
    const pos = detectedObj.position || { x: 0, y: 0, z: 0 };

    const existingObj = this.currentMap.objects.find(
      obj => obj.label === detectedObj.object
    );

    if (existingObj) {
      // Update existing object position using weighted average
      const k = detectedObj.confidence;
      existingObj.position.x = existingObj.position.x * (1 - k) + pos.x * k;
      existingObj.position.y = existingObj.position.y * (1 - k) + pos.y * k;
      existingObj.position.z = existingObj.position.z * (1 - k) + pos.z * k;
      existingObj.confidence = Math.max(existingObj.confidence, detectedObj.confidence);
      existingObj.lastSeen = Date.now();
    } else {
      // Add new object to map
      this.currentMap.objects.push({
        id: `obj-${this.currentMap.objects.length + 1}`,
        label: detectedObj.object,
        position: pos,
        confidence: detectedObj.confidence,
        lastSeen: Date.now(),
      });
    }
  }

  /**
   * Update from odometry observation
   */
  private updateFromOdometry(observation: Observation): void {
    const odometry = observation.data as {
      linear: Vector3;
      angular: Vector3;
    };

    const dt = this.estimateDeltaTime();

    // Integrate odometry
    this.currentEstimate.position.x += odometry.linear.x * dt;
    this.currentEstimate.position.y += odometry.linear.y * dt;
    this.currentEstimate.position.z += odometry.linear.z * dt;

    this.currentEstimate.velocity = odometry.linear;
    this.currentEstimate.timestamp = observation.timestamp;
  }

  /**
   * Update from direct pose observation
   */
  private updateFromPose(observation: Observation): void {
    const pose = observation.data as StateEstimate;

    this.currentEstimate.position = pose.position;
    this.currentEstimate.orientation = pose.orientation;
    this.currentEstimate.timestamp = observation.timestamp;

    if (pose.velocity) {
      this.currentEstimate.velocity = pose.velocity;
    }
  }

  /**
   * Check if a new keyframe should be created
   */
  private shouldCreateKeyframe(): boolean {
    if (!this.lastKeyframeId) return true;

    const lastKeyframe = this.keyframes.get(this.lastKeyframeId);
    if (!lastKeyframe) return true;

    const dx = this.currentEstimate.position.x - lastKeyframe.estimate.position.x;
    const dy = this.currentEstimate.position.y - lastKeyframe.estimate.position.y;
    const dz = this.currentEstimate.position.z - lastKeyframe.estimate.position.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return distance > this.config.keyframeDistanceThreshold;
  }

  /**
   * Create a new keyframe
   */
  private createKeyframe(): void {
    const keyframeId = `kf-${this.observationCount}`;

    const keyframe: SLAMKeyframe = {
      id: keyframeId,
      estimate: { ...this.currentEstimate },
      objects: [...this.currentMap.objects],
      timestamp: Date.now(),
      connections: [],
    };

    this.keyframes.set(keyframeId, keyframe);

    // Add connection to previous keyframe if exists
    if (this.lastKeyframeId) {
      const prevKeyframe = this.keyframes.get(this.lastKeyframeId);
      if (prevKeyframe) {
        const relativeTransform = this.computeRelativeTransform(
          prevKeyframe.estimate,
          this.currentEstimate
        );

        const connection: KeyframeConnection = {
          keyframeId: this.lastKeyframeId,
          relativeTransform,
          confidence: this.currentEstimate.confidence,
          isLoopClosure: false,
        };

        keyframe.connections.push(connection);

        // Add to pose graph
        this.addPoseGraphEdge(this.lastKeyframeId, keyframeId, connection);
      }
    }

    this.lastKeyframeId = keyframeId;
  }

  /**
   * Detect loop closure with previous keyframes
   */
  private detectLoopClosure(): LoopClosureResult | null {
    if (this.keyframes.size < 5) return null;

    const currentKeyframe = this.keyframes.get(this.lastKeyframeId!);
    if (!currentKeyframe) return null;

    // Check recent keyframes for potential loop closure
    const keyframeArray = Array.from(this.keyframes.values());
    const searchWindow = Math.min(10, keyframeArray.length - 1);

    for (let i = 0; i < searchWindow; i++) {
      const candidateKeyframe = keyframeArray[keyframeArray.length - 2 - i];

      // Skip if too recent
      if (candidateKeyframe.id === this.lastKeyframeId) continue;

      // Check for object matches
      const matchScore = this.computeLoopClosureScore(
        currentKeyframe.objects,
        candidateKeyframe.objects
      );

      if (matchScore >= this.config.loopClosureThreshold) {
        const transform = this.computeRelativeTransform(
          candidateKeyframe.estimate,
          this.currentEstimate
        );

        return {
          detected: true,
          keyframeId: candidateKeyframe.id,
          transform,
          confidence: matchScore,
        };
      }
    }

    return null;
  }

  /**
   * Compute loop closure score based on object matching
   */
  private computeLoopClosureScore(
    currentObjects: MapObject[],
    candidateObjects: MapObject[]
  ): number {
    if (currentObjects.length === 0 || candidateObjects.length === 0) {
      return 0;
    }

    let matches = 0;

    for (const currentObj of currentObjects) {
      for (const candidateObj of candidateObjects) {
        if (currentObj.label === candidateObj.label) {
          // Check if positions are consistent
          const dx = currentObj.position.x - candidateObj.position.x;
          const dy = currentObj.position.y - candidateObj.position.y;
          const dz = currentObj.position.z - candidateObj.position.z;

          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < this.config.resolution * 5) {
            matches++;
            break;
          }
        }
      }
    }

    return matches / Math.max(currentObjects.length, candidateObjects.length);
  }

  /**
   * Apply loop closure constraint
   */
  private applyLoopClosure(loopClosure: LoopClosureResult): void {
    // Add loop closure edge to pose graph
    const connection: KeyframeConnection = {
      keyframeId: loopClosure.keyframeId,
      relativeTransform: loopClosure.transform,
      confidence: loopClosure.confidence,
      isLoopClosure: true,
    };

    const currentKeyframe = this.keyframes.get(this.lastKeyframeId!);
    if (currentKeyframe) {
      currentKeyframe.connections.push(connection);
    }

    this.addPoseGraphEdge(loopClosure.keyframeId, this.lastKeyframeId!, connection);

    // Optimize pose graph
    this.optimizePoseGraph();

    this.loopClosureCount++;
    this.lastLoopClosureTime = Date.now();
  }

  /**
   * Add edge to pose graph
   */
  private addPoseGraphEdge(
    fromId: string,
    toId: string,
    connection: KeyframeConnection
  ): void {
    if (!this.poseGraph.has(fromId)) {
      this.poseGraph.set(fromId, new Map());
    }
    this.poseGraph.get(fromId)!.set(toId, connection);
  }

  /**
   * Optimize the pose graph
   */
  private optimizePoseGraph(): PoseGraphResult {
    if (this.keyframes.size < 3) {
      return {
        optimizedEstimate: { ...this.currentEstimate },
        errorReduction: 0,
        iterations: 0,
        converged: true,
      };
    }

    const startError = this.computePoseGraphError();
    let iterations = 0;
    let converged = false;

    // Simple gradient descent optimization
    for (let i = 0; i < this.config.optimizationIterations; i++) {
      const error = this.computePoseGraphError();

      if (error < 0.001) {
        converged = true;
        break;
      }

      // Adjust keyframe estimates based on constraints
      this.adjustKeyframes();

      iterations++;
    }

    const endError = this.computePoseGraphError();

    // Update current estimate from last keyframe
    if (this.lastKeyframeId) {
      const lastKeyframe = this.keyframes.get(this.lastKeyframeId);
      if (lastKeyframe) {
        this.currentEstimate = { ...lastKeyframe.estimate };
      }
    }

    return {
      optimizedEstimate: { ...this.currentEstimate },
      errorReduction: startError - endError,
      iterations,
      converged,
    };
  }

  /**
   * Compute total error in pose graph
   */
  private computePoseGraphError(): number {
    let totalError = 0;

    for (const [fromId, connections] of this.poseGraph) {
      const fromKeyframe = this.keyframes.get(fromId);
      if (!fromKeyframe) continue;

      for (const [toId, connection] of connections) {
        const toKeyframe = this.keyframes.get(toId);
        if (!toKeyframe) continue;

        // Compute expected transform
        const expectedTransform = this.computeRelativeTransform(
          fromKeyframe.estimate,
          toKeyframe.estimate
        );

        // Compute error
        const dx = expectedTransform.position.x - connection.relativeTransform.position.x;
        const dy = expectedTransform.position.y - connection.relativeTransform.position.y;
        const dz = expectedTransform.position.z - connection.relativeTransform.position.z;

        totalError += dx * dx + dy * dy + dz * dz;
      }
    }

    return totalError;
  }

  /**
   * Adjust keyframe estimates to satisfy constraints
   */
  private adjustKeyframes(): void {
    const keyframeIds = Array.from(this.keyframes.keys());

    // Simple adjustment: move each keyframe towards constraint satisfaction
    for (const keyframeId of keyframeIds) {
      const connections = this.poseGraph.get(keyframeId);
      if (!connections) continue;

      const keyframe = this.keyframes.get(keyframeId);
      if (!keyframe) continue;

      let totalDx = 0;
      let totalDy = 0;
      let totalDz = 0;
      let weightSum = 0;

      for (const [toId, connection] of connections) {
        const toKeyframe = this.keyframes.get(toId);
        if (!toKeyframe) continue;

        const expectedTransform = this.computeRelativeTransform(
          keyframe.estimate,
          toKeyframe.estimate
        );

        const dx = connection.relativeTransform.position.x - expectedTransform.position.x;
        const dy = connection.relativeTransform.position.y - expectedTransform.position.y;
        const dz = connection.relativeTransform.position.z - expectedTransform.position.z;

        const weight = connection.confidence;
        totalDx += dx * weight;
        totalDy += dy * weight;
        totalDz += dz * weight;
        weightSum += weight;
      }

      if (weightSum > 0) {
        const scale = 0.1; // Learning rate
        keyframe.estimate.position.x += totalDx * scale;
        keyframe.estimate.position.y += totalDy * scale;
        keyframe.estimate.position.z += totalDz * scale;
      }
    }
  }

  /**
   * Compute relative transform between two poses
   */
  private computeRelativeTransform(
    from: StateEstimate,
    to: StateEstimate
  ): Transform3D {
    return {
      position: {
        x: to.position.x - from.position.x,
        y: to.position.y - from.position.y,
        z: to.position.z - from.position.z,
      },
      orientation: from.orientation, // Simplified
    };
  }

  /**
   * Prune old/dead objects from the map
   */
  private pruneObjects(): void {
    const now = Date.now();
    const maxAge = this.config.objectAgeThreshold;

    this.currentMap.objects = this.currentMap.objects.filter(
      obj => now - obj.lastSeen < maxAge
    );

    // Limit total objects
    if (this.currentMap.objects.length > this.config.maxObjects) {
      // Remove lowest confidence objects
      this.currentMap.objects.sort((a, b) => a.confidence - b.confidence);
      this.currentMap.objects = this.currentMap.objects.slice(0, this.config.maxObjects);
    }
  }

  /**
   * Compute update weight from uncertainty
   */
  private computeUpdateWeight(uncertainty: number): number {
    // Lower uncertainty = higher weight
    return Math.max(0.01, Math.min(0.99, 1 / (uncertainty + 1)));
  }

  /**
   * Estimate delta time from timestamps
   */
  private estimateDeltaTime(): number {
    const now = Date.now();
    const dt = now - this.currentEstimate.timestamp;
    return dt / 1000; // Convert to seconds
  }

  /**
   * Get current map
   */
  getMap(): LocalMap {
    return { ...this.currentMap };
  }

  /**
   * Get current state estimate
   */
  getEstimate(): StateEstimate {
    return { ...this.currentEstimate };
  }

  /**
   * Get all keyframes
   */
  getKeyframes(): SLAMKeyframe[] {
    return Array.from(this.keyframes.values());
  }

  /**
   * Get pose graph statistics
   */
  getPoseGraphStats(): {
    vertexCount: number;
    edgeCount: number;
    loopClosureCount: number;
  } {
    let edgeCount = 0;
    for (const connections of this.poseGraph.values()) {
      edgeCount += connections.size;
    }

    return {
      vertexCount: this.keyframes.size,
      edgeCount,
      loopClosureCount: this.loopClosureCount,
    };
  }

  /**
   * Clear the map and reset
   */
  clearMap(): void {
    this.currentMap.objects = [];
    this.currentMap.timestamp = Date.now();
  }

  /**
   * Reset the SLAM engine
   */
  reset(): void {
    this.clearMap();
    this.keyframes.clear();
    this.poseGraph.clear();
    this.currentEstimate = {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      confidence: 0,
      timestamp: Date.now(),
    };
    this.lastKeyframeId = null;
    this.observationCount = 0;
    this.loopClosureCount = 0;
    this.lastLoopClosureTime = 0;
  }
}
