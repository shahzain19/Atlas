import { SLAMEngine } from "../../atlas-runtime/Perception/SLAMEngine";
import { Observation } from "../../atlas-kernel/Perception/StateEstimate";

describe("SLAMEngine", () => {
  let slam: SLAMEngine;

  beforeEach(() => {
    slam = new SLAMEngine();
  });

  it("should initialize with an empty map", () => {
    const map = slam.getMap();
    expect(map.objects).toHaveLength(0);
  });

  it("should add new objects to the map", () => {
    const observation: Observation = {
      source: "Vision",
      type: "OBJECT_DETECTED",
      data: { object: "Tree", confidence: 0.8, position: { x: 5, y: 0, z: 5 } },
      uncertainty: 0.2,
      timestamp: Date.now(),
    };

    slam.processObservation(observation);
    const map = slam.getMap();

    expect(map.objects).toHaveLength(1);
    expect(map.objects[0].label).toBe("Tree");
    expect(map.objects[0].position.x).toBe(5);
  });

  it("should update existing objects in the map", () => {
    const obs1: Observation = {
      source: "Vision",
      type: "OBJECT_DETECTED",
      data: { object: "Post", confidence: 0.5, position: { x: 10, y: 0, z: 10 } },
      uncertainty: 0.5,
      timestamp: 1,
    };

    const obs2: Observation = {
      source: "Lidar",
      type: "OBJECT_DETECTED",
      data: { object: "Post", confidence: 0.9, position: { x: 12, y: 0, z: 12 } },
      uncertainty: 0.1,
      timestamp: 2,
    };

    slam.processObservation(obs1);
    slam.processObservation(obs2);
    
    const map = slam.getMap();
    expect(map.objects).toHaveLength(1);
    
    // Position should be heavily weighted towards the second observation (0.9 confidence)
    expect(map.objects[0].position.x).toBeGreaterThan(11);
    expect(map.objects[0].confidence).toBe(0.9);
  });
});
