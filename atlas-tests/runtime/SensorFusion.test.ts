import { SensorFusion } from "../../atlas-runtime/Perception/SensorFusion";
import { Observation } from "../../atlas-kernel/Perception/StateEstimate";

describe("SensorFusion", () => {
  let fusion: SensorFusion;

  beforeEach(() => {
    fusion = new SensorFusion();
  });

  it("should initialize with zero state", () => {
    const state = fusion.getState();
    expect(state.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(state.confidence).toBe(0);
  });

  it("should update position with weighted average", () => {
    const obs1: Observation = {
      source: "GPS",
      type: "position",
      data: { x: 10, y: 10, z: 10 },
      uncertainty: 0.1, // High confidence (k ~ 0.9)
      timestamp: Date.now(),
    };

    fusion.update(obs1);
    let state = fusion.getState();
    
    // Position should be close to 10
    expect(state.position.x).toBeGreaterThan(9);
    expect(state.confidence).toBeGreaterThan(0);

    const obs2: Observation = {
      source: "Lidar",
      type: "position",
      data: { x: 20, y: 20, z: 20 },
      uncertainty: 10.0, // Low confidence (k ~ 0.09)
      timestamp: Date.now(),
    };

    fusion.update(obs2);
    state = fusion.getState();

    // Position should move only slightly towards 20
    expect(state.position.x).toBeLessThan(12);
  });

  it("should increase confidence with more observations", () => {
    const obs: Observation = {
      source: "GPS",
      type: "position",
      data: { x: 1, y: 1, z: 1 },
      uncertainty: 0.5,
      timestamp: Date.now(),
    };

    fusion.update(obs);
    const conf1 = fusion.getState().confidence;
    
    fusion.update(obs);
    const conf2 = fusion.getState().confidence;

    expect(conf2).toBeGreaterThan(conf1);
  });
});
