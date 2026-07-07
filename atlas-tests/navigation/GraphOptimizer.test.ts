import { GraphOptimizer, PoseGraphManager } from "../../atlas-navigation_deprecated/SLAM/GraphOptimizer";
import { Vector3, Quaternion } from "../../atlas-kernel/Perception/StateEstimate";
import { Pose } from "../../atlas-navigation_deprecated/SLAM/SLAMTypes";

describe("GraphOptimizer", () => {
  let optimizer: GraphOptimizer;

  beforeEach(() => {
    optimizer = new GraphOptimizer();
  });

  it("should initialize with empty graph", () => {
    expect(optimizer.getVertexCount()).toBe(0);
    expect(optimizer.getEdgeCount()).toBe(0);
  });

  it("should add vertex to graph", () => {
    const pose = createTestPose(0, 0, 0);
    optimizer.addVertex("vertex1", pose);

    expect(optimizer.getVertexCount()).toBe(1);
  });

  it("should add multiple vertices", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0));
    optimizer.addVertex("v2", createTestPose(1, 0, 0));
    optimizer.addVertex("v3", createTestPose(2, 0, 0));

    expect(optimizer.getVertexCount()).toBe(3);
  });

  it("should throw error when adding duplicate vertex", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0));

    expect(() => {
      optimizer.addVertex("v1", createTestPose(1, 1, 1));
    }).toThrow("Vertex with id v1 already exists");
  });

  it("should add edge between vertices", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0));
    optimizer.addVertex("v2", createTestPose(1, 0, 0));

    const relativePose: Pose = {
      position: { x: 1, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };

    optimizer.addEdge("v1", "v2", relativePose);

    expect(optimizer.getEdgeCount()).toBe(1);
  });

  it("should throw error when adding edge with missing source vertex", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0));

    expect(() => {
      optimizer.addEdge("v1", "missing", createTestPose(1, 0, 0));
    }).toThrow("Target vertex missing not found");
  });

  it("should throw error when adding edge with missing target vertex", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0));

    expect(() => {
      optimizer.addEdge("missing", "v1", createTestPose(1, 0, 0));
    }).toThrow("Source vertex missing not found");
  });

  it("should optimize pose graph with two vertices", () => {
    const pose1 = createTestPose(0, 0, 0);
    const pose2 = createTestPose(1, 0, 0);

    optimizer.addVertex("v1", pose1, true); // Fixed
    optimizer.addVertex("v2", pose2);

    const relativePose: Pose = {
      position: { x: 1, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };

    optimizer.addEdge("v1", "v2", relativePose);

    const result = optimizer.optimize();

    expect(result.converged).toBe(true);
    expect(result.iterations).toBeGreaterThanOrEqual(0);
    expect(result.poses.size).toBe(2);
  });

  it("should throw error when optimizing with no vertices", () => {
    expect(() => optimizer.optimize()).toThrow("Graph must have at least 2 vertices");
  });

  it("should throw error when optimizing with no edges", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0));
    optimizer.addVertex("v2", createTestPose(1, 0, 0));

    expect(() => optimizer.optimize()).toThrow("Graph must have at least 1 edge");
  });

  it("should update vertex pose", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0));

    const newPose = createTestPose(5, 5, 5);
    optimizer.updateVertex("v1", newPose);

    const vertex = optimizer.getVertex("v1");
    expect(vertex?.pose.position.x).toBe(5);
    expect(vertex?.pose.position.y).toBe(5);
    expect(vertex?.pose.position.z).toBe(5);
  });

  it("should get all vertices", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0));
    optimizer.addVertex("v2", createTestPose(1, 0, 0));
    optimizer.addVertex("v3", createTestPose(2, 0, 0));

    const vertices = optimizer.getAllVertices();

    expect(vertices.length).toBe(3);
  });

  it("should get all edges", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0));
    optimizer.addVertex("v2", createTestPose(1, 0, 0));

    const relativePose: Pose = {
      position: { x: 1, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };

    optimizer.addEdge("v1", "v2", relativePose, undefined, "ODOMETRY");

    const edges = optimizer.getAllEdges();

    expect(edges.length).toBe(1);
    expect(edges[0].edgeType).toBe("ODOMETRY");
  });

  it("should remove edge", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0));
    optimizer.addVertex("v2", createTestPose(1, 0, 0));

    const relativePose: Pose = {
      position: { x: 1, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };

    optimizer.addEdge("v1", "v2", relativePose);
    expect(optimizer.getEdgeCount()).toBe(1);

    optimizer.removeEdge("edge-0");
    expect(optimizer.getEdgeCount()).toBe(0);
  });

  it("should clear graph", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0));
    optimizer.addVertex("v2", createTestPose(1, 0, 0));

    const relativePose: Pose = {
      position: { x: 1, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };

    optimizer.addEdge("v1", "v2", relativePose);

    optimizer.clear();

    expect(optimizer.getVertexCount()).toBe(0);
    expect(optimizer.getEdgeCount()).toBe(0);
  });

  it("should optimize linear chain of poses", () => {
    const poses = [
      createTestPose(0, 0, 0),
      createTestPose(1, 0, 0),
      createTestPose(2, 0, 0),
      createTestPose(3, 0, 0),
      createTestPose(4, 0, 0),
    ];

    optimizer.addVertex("v0", poses[0], true); // Fixed origin

    for (let i = 1; i < poses.length; i++) {
      optimizer.addVertex(`v${i}`, poses[i]);

      const relativePose: Pose = {
        position: { x: 1, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
        timestamp: Date.now(),
      };

      optimizer.addEdge(`v${i - 1}`, `v${i}`, relativePose);
    }

    const result = optimizer.optimize();

    expect(result.converged).toBe(true);
    expect(result.poses.size).toBe(5);
  });

  it("should handle loop closure edge", () => {
    optimizer.addVertex("v0", createTestPose(0, 0, 0), true);
    optimizer.addVertex("v1", createTestPose(1, 0, 0));
    optimizer.addVertex("v2", createTestPose(2, 0, 0));
    optimizer.addVertex("v3", createTestPose(3, 0, 0));

    // Chain
    for (let i = 1; i <= 3; i++) {
      const relativePose: Pose = {
        position: { x: 1, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
        timestamp: Date.now(),
      };
      optimizer.addEdge(`v${i - 1}`, `v${i}`, relativePose);
    }

    // Loop closure back to v0
    const loopClosurePose: Pose = {
      position: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };

    optimizer.addEdge("v3", "v0", loopClosurePose, undefined, "LOOP_CLOSURE");

    const result = optimizer.optimize();

    expect(result.converged).toBe(true);
    // Loop closure should help constrain the graph
  });

  it("should track optimization statistics", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0));
    optimizer.addVertex("v2", createTestPose(1, 0, 0));

    const relativePose: Pose = {
      position: { x: 1, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };

    optimizer.addEdge("v1", "v2", relativePose);
    optimizer.optimize();

    const stats = optimizer.getStatistics();

    expect(stats.totalOptimizations).toBe(1);
    expect(stats.averageOptimizationTime).toBeGreaterThan(0);
  });

  it("should optimize subset of vertices", () => {
    optimizer.addVertex("v0", createTestPose(0, 0, 0), true);
    optimizer.addVertex("v1", createTestPose(1, 0, 0));
    optimizer.addVertex("v2", createTestPose(2, 0, 0));
    optimizer.addVertex("v3", createTestPose(3, 0, 0));

    const relativePose: Pose = {
      position: { x: 1, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };

    optimizer.addEdge("v0", "v1", relativePose);
    optimizer.addEdge("v1", "v2", relativePose);
    optimizer.addEdge("v2", "v3", relativePose);

    const result = optimizer.optimizeSubset(["v1", "v2", "v3"]);

    expect(result.poses.size).toBe(3);
    expect(result.converged).toBe(true);
  });

  it("should respect fixed vertices during optimization", () => {
    optimizer.addVertex("v1", createTestPose(0, 0, 0), true);
    optimizer.addVertex("v2", createTestPose(10, 10, 10)); // Far from correct

    const relativePose: Pose = {
      position: { x: 1, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };

    optimizer.addEdge("v1", "v2", relativePose);

    const result = optimizer.optimize();

    // v1 should remain fixed at origin
    const v1Pose = result.poses.get("v1");
    expect(v1Pose?.position.x).toBeCloseTo(0, 5);
    expect(v1Pose?.position.y).toBeCloseTo(0, 5);
    expect(v1Pose?.position.z).toBeCloseTo(0, 5);

    // v2 should be optimized close to expected position
    const v2Pose = result.poses.get("v2");
    expect(v2Pose?.position.x).toBeLessThan(2); // Should be pulled towards 1
  });
});

describe("PoseGraphManager", () => {
  let manager: PoseGraphManager;

  beforeEach(() => {
    manager = new PoseGraphManager();
  });

  it("should add keyframe to graph", () => {
    const keyframe = createTestKeyframe("kf1", 0, 0, 0);
    manager.addKeyframe(keyframe);

    const stats = manager.getGraphStats();
    expect(stats.vertexCount).toBe(1);
  });

  it("should add loop closure constraint", () => {
    manager.addKeyframe(createTestKeyframe("kf1", 0, 0, 0));
    manager.addKeyframe(createTestKeyframe("kf2", 1, 0, 0));
    manager.addKeyframe(createTestKeyframe("kf3", 2, 0, 0));

    const loopClosure: Pose = {
      position: { x: -2, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
    };

    manager.addLoopClosure("kf3", "kf1", loopClosure);

    const stats = manager.getGraphStats();
    // 2 edges from keyframes (kf1-kf2, kf2-kf3) + 1 loop closure = 3
    expect(stats.edgeCount).toBe(3);
  });

  it("should optimize pose graph", () => {
    manager.addKeyframe(createTestKeyframe("kf1", 0, 0, 0));
    manager.addKeyframe(createTestKeyframe("kf2", 1, 0, 0));
    manager.addKeyframe(createTestKeyframe("kf3", 2, 0, 0));

    const result = manager.optimize();

    expect(result).toBeDefined();
    expect(result.poses.size).toBe(3);
  });

  it("should get optimized pose for keyframe", () => {
    manager.addKeyframe(createTestKeyframe("kf1", 0, 0, 0));
    manager.addKeyframe(createTestKeyframe("kf2", 1, 0, 0));

    manager.optimize();

    const pose = manager.getOptimizedPose("kf1");

    expect(pose).toBeDefined();
    expect(pose?.position.x).toBeDefined();
  });

  it("should get all optimized poses", () => {
    manager.addKeyframe(createTestKeyframe("kf1", 0, 0, 0));
    manager.addKeyframe(createTestKeyframe("kf2", 1, 0, 0));
    manager.addKeyframe(createTestKeyframe("kf3", 2, 0, 0));

    manager.optimize();

    const poses = manager.getAllOptimizedPoses();

    expect(poses.size).toBe(3);
  });

  it("should clear graph", () => {
    manager.addKeyframe(createTestKeyframe("kf1", 0, 0, 0));
    manager.addKeyframe(createTestKeyframe("kf2", 1, 0, 0));

    manager.clear();

    const stats = manager.getGraphStats();
    expect(stats.vertexCount).toBe(0);
    expect(stats.edgeCount).toBe(0);
  });

  it("should handle keyframe connections", () => {
    const kf1 = createTestKeyframe("kf1", 0, 0, 0);
    const kf2 = createTestKeyframe("kf2", 1, 0, 0);

    kf2.connections = [
      {
        keyframeId: "kf1",
        relativePose: {
          position: { x: 1, y: 0, z: 0 },
          orientation: { x: 0, y: 0, z: 0, w: 1 },
        },
        informationMatrix: [
          [100, 0, 0, 0, 0, 0],
          [0, 100, 0, 0, 0, 0],
          [0, 0, 100, 0, 0, 0],
          [0, 0, 0, 10, 0, 0],
          [0, 0, 0, 0, 10, 0],
          [0, 0, 0, 0, 0, 10],
        ],
        edgeType: "ODOMETRY",
      },
    ];

    manager.addKeyframe(kf1);
    manager.addKeyframe(kf2);

    // Only the explicit connection edge (auto-edge skipped since connection already exists)
    const stats = manager.getGraphStats();
    expect(stats.edgeCount).toBe(1);
  });
});

// Helper functions

function createTestPose(x: number, y: number, z: number): Pose {
  return {
    position: { x, y, z },
    orientation: { x: 0, y: 0, z: 0, w: 1 },
    timestamp: Date.now(),
  };
}

function createTestKeyframe(
  id: string,
  x: number,
  y: number,
  z: number
): any {
  return {
    id,
    pose: createTestPose(x, y, z),
    keypoints: [],
    descriptors: [],
    mapPointIds: [],
    connections: [],
    timestamp: Date.now(),
    sequenceNumber: parseInt(id.replace("kf", "")) || 0,
  };
}