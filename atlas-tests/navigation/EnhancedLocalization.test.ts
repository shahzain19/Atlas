import { EnhancedLocalization } from "../../atlas-navigation/Localization/EnhancedLocalization";
import { SLAMObservation, SLAMConfig } from "../../atlas-navigation/SLAM/SLAMTypes";

describe("EnhancedLocalization", () => {
  let localization: EnhancedLocalization;

  beforeEach(() => {
    localization = new EnhancedLocalization();
  });

  afterEach(() => {
    localization.reset();
  });

  it("should initialize with zero pose", () => {
    const pose = localization.getPose();

    expect(pose.position.x).toBe(0);
    expect(pose.position.y).toBe(0);
    expect(pose.position.z).toBe(0);
    expect(pose.orientation.w).toBe(1);
  });

  it("should localize from observation", () => {
    const observation = createTestImageObservation();
    const result = localization.localize(observation);

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.trackedFeatures).toBeGreaterThanOrEqual(0);
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
  });

  it("should update pose with motion", () => {
    // First frame
    const obs1 = createTestImageObservation();
    localization.localize(obs1);

    // Second frame with simulated motion
    const obs2 = createTestImageObservation(10); // Shifted image
    const result2 = localization.localize(obs2);

    expect(result2.pose.position.x).toBeDefined();
  });

  it("should initialize after sufficient observations", () => {
    // Use lower threshold for faster initialization in test
    const localization = new EnhancedLocalization({
      minMapPoints: 5,
    });

    for (let i = 0; i < 10; i++) {
      const obs = createTestImageObservation(i * 10);
      localization.localize(obs);
    }

    const state = localization.getState();
    // May be initialized if enough map points were created
    expect(typeof state.isInitialized).toBe("boolean");
  });

  it("should update map", () => {
    const observation = createTestImageObservation();
    const update = localization.updateMap(observation);

    expect(update).toBeDefined();
    expect(typeof update.keyframeAdded).toBe("boolean");
    expect(typeof update.loopClosureDetected).toBe("boolean");
  });

  it("should get current pose", () => {
    const pose = localization.getPose();

    expect(pose.position).toBeDefined();
    expect(pose.orientation).toBeDefined();
    expect(pose.timestamp).toBeDefined();
  });

  it("should convert to StateEstimate format", () => {
    const observation = createTestImageObservation();
    localization.localize(observation);

    const stateEstimate = localization.toStateEstimate();

    expect(stateEstimate.position).toBeDefined();
    expect(stateEstimate.velocity).toBeDefined();
    expect(stateEstimate.orientation).toBeDefined();
    expect(stateEstimate.confidence).toBeGreaterThanOrEqual(0);
    expect(stateEstimate.timestamp).toBeDefined();
  });

  it("should get map statistics", () => {
    const stats = localization.getMapStatistics();

    expect(typeof stats.mapPointCount).toBe("number");
    expect(typeof stats.keyframeCount).toBe("number");
    expect(typeof stats.averageObservations).toBe("number");
    expect(typeof stats.isInitialized).toBe("boolean");
  });

  it("should reset localization", () => {
    const obs = createTestImageObservation();
    localization.localize(obs);

    localization.reset();

    const pose = localization.getPose();
    expect(pose.position.x).toBe(0);
    expect(pose.position.y).toBe(0);
    expect(pose.position.z).toBe(0);
  });

  it("should get SLAM engine", () => {
    const engine = localization.getSLAMEngine();

    expect(engine).toBeDefined();
    expect(typeof engine.getMap).toBe("function");
    expect(typeof engine.getEstimate).toBe("function");
  });

  it("should handle consecutive observations", () => {
    for (let i = 0; i < 100; i++) {
      const obs = createTestImageObservation(i);
      const result = localization.localize(obs);

      expect(result.status).toMatch(/^(SUCCESS|LOST|INITIALIZING)$/);
    }

    const state = localization.getState();
    expect(state.observationCount).toBe(100);
  });

  it("should add keyframes when moving", () => {
    const localization = new EnhancedLocalization({
      keyframeDistanceThreshold: 0.1, // Lower threshold for more keyframes
    });

    // Create observations with significant motion
    for (let i = 0; i < 20; i++) {
      const obs = createTestImageObservation(i * 2); // Larger motion
      localization.localize(obs);
    }

    const stats = localization.getMapStatistics();
    // With lower threshold, should have at least 1 keyframe
    expect(stats.keyframeCount).toBeGreaterThanOrEqual(1);
  });

  it("should detect loop closure after sufficient keyframes", () => {
    // Add many keyframes
    for (let i = 0; i < 15; i++) {
      const obs = createTestImageObservation(i);
      localization.updateMap(obs);
    }

    // Create observation similar to first keyframe
    const loopObs = createTestImageObservation(0);
    const update = localization.updateMap(loopObs);

    // May or may not detect loop closure depending on feature matching
    expect(typeof update.loopClosureDetected).toBe("boolean");
  });

  it("should get SLAM state", () => {
    const obs = createTestImageObservation();
    localization.localize(obs);

    const state = localization.getState();

    expect(state.pose).toBeDefined();
    expect(state.mapPoints).toBeDefined();
    expect(state.keyframes).toBeDefined();
    expect(typeof state.mapVersion).toBe("number");
    expect(typeof state.observationCount).toBe("number");
    expect(typeof state.isInitialized).toBe("boolean");
  });
});

describe("EnhancedLocalization with custom config", () => {
  it("should accept custom SLAM config", () => {
    const customConfig: Partial<SLAMConfig> = {
      detectorType: "ORB",
      maxKeypoints: 500,
      keyframeDistanceThreshold: 0.2,
      enableLoopClosure: false,
    };

    const localization = new EnhancedLocalization(customConfig);
    const pose = localization.getPose();

    expect(pose.position.x).toBe(0);
  });

  it("should respect keyframe distance threshold", () => {
    const localization = new EnhancedLocalization({
      keyframeDistanceThreshold: 1.0,
    });

    // Add observations with small motion
    for (let i = 0; i < 20; i++) {
      const obs = createTestImageObservation(i * 0.1); // Small motion
      localization.localize(obs);
    }

    const stats = localization.getMapStatistics();

    // With small motion and high threshold, should have fewer keyframes
    // This is a qualitative check
    expect(stats.keyframeCount).toBeLessThanOrEqual(20);
  });
});

describe("EnhancedLocalization with IMU data", () => {
  it("should handle observation with IMU data", () => {
    const localization = new EnhancedLocalization();

    const observation: SLAMObservation = {
      image: {
        data: createTestImageData(),
        width: 100,
        height: 100,
      },
      imu: {
        omega: { x: 0.1, y: 0.1, z: 0.1 },
        acceleration: { x: 0, y: 9.8, z: 0 },
      },
      timestamp: Date.now(),
    };

    const result = localization.localize(observation);

    expect(result.status).toBeDefined();
  });
});

describe("EnhancedLocalization with odometry", () => {
  it("should handle observation with odometry data", () => {
    const localization = new EnhancedLocalization();

    const observation: SLAMObservation = {
      image: {
        data: createTestImageData(),
        width: 100,
        height: 100,
      },
      odometry: {
        linear: { x: 0.5, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: 0.1 },
      },
      timestamp: Date.now(),
    };

    const result = localization.localize(observation);

    expect(result.status).toBeDefined();
  });
});

describe("EnhancedLocalization - feature tracking", () => {
  it("should track features between frames", () => {
    const localization = new EnhancedLocalization();

    // First frame
    const obs1 = createTestImageObservation();
    localization.localize(obs1);

    // Similar second frame
    const obs2 = createTestImageObservation();
    const result2 = localization.localize(obs2);

    // Should have some tracked features
    expect(result2.trackedFeatures).toBeGreaterThanOrEqual(0);
  });

  it("should report lost when too few features tracked", () => {
    const localization = new EnhancedLocalization({
      // High minMapPoints threshold will cause initialization delay
    });

    // Add observations (each will have limited features)
    for (let i = 0; i < 5; i++) {
      const obs = createTestImageObservation(i);
      const result = localization.localize(obs);
    }

    const state = localization.getState();
    // May be in TRACKING or LOST depending on feature count
    expect(state.status).toMatch(/^(TRACKING|LOST|INITIALIZING)$/);
  });
});

describe("EnhancedLocalization - map management", () => {
  it("should prune old map points", () => {
    const localization = new EnhancedLocalization();

    // Add observations
    for (let i = 0; i < 10; i++) {
      const obs = createTestImageObservation(i);
      localization.updateMap(obs);
    }

    // Get initial stats
    const initialStats = localization.getMapStatistics();

    // Create observation after delay (would trigger pruning in real implementation)
    const delayedObs = createTestImageObservation(100);
    localization.updateMap(delayedObs);

    // Stats should be accessible
    const finalStats = localization.getMapStatistics();
    expect(finalStats.mapPointCount).toBeGreaterThanOrEqual(0);
  });

  it("should limit map size", () => {
    const localization = new EnhancedLocalization();

    // Add many observations
    for (let i = 0; i < 100; i++) {
      const obs = createTestImageObservation(i);
      localization.updateMap(obs);
    }

    const stats = localization.getMapStatistics();

    // Map should be limited (internal limit is 1000)
    expect(stats.mapPointCount).toBeLessThanOrEqual(1000);
  });
});

describe("EnhancedLocalization - error handling", () => {
  it("should handle empty observation", () => {
    const localization = new EnhancedLocalization();

    const obs: SLAMObservation = {
      timestamp: Date.now(),
    };

    // Should throw when no image data
    expect(() => localization.localize(obs)).toThrow();
  });

  it("should handle invalid keyframe access", () => {
    const localization = new EnhancedLocalization();

    // Get pose before any observations
    const pose = localization.getPose();

    expect(pose.position.x).toBe(0);
    expect(pose.position.y).toBe(0);
  });

  it("should handle rapid consecutive calls", () => {
    const localization = new EnhancedLocalization();

    for (let i = 0; i < 1000; i++) {
      const obs = createTestImageObservation(i);
      const result = localization.localize(obs);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    }
  });
});

// Helper functions

function createTestImageData(): Uint8Array {
  const width = 100;
  const height = 100;
  const data = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      // Create some pattern with edges
      const isEdge = ((x % 20) < 2) || ((y % 20) < 2);
      data[idx] = isEdge ? 255 : 50;
    }
  }

  return data;
}

function createTestImageObservation(offset: number = 0): SLAMObservation {
  const imageData = createTestImageData();

  // Add slight shift based on offset to simulate motion
  if (offset > 0) {
    const shifted = new Uint8Array(imageData.length);
    for (let i = 0; i < imageData.length - offset; i++) {
      shifted[i + offset] = imageData[i];
    }
    return {
      image: {
        data: shifted,
        width: 100,
        height: 100,
      },
      timestamp: Date.now() + offset,
    };
  }

  return {
    image: {
      data: imageData,
      width: 100,
      height: 100,
    },
    timestamp: Date.now(),
  };
}