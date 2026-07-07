import { PolicyEngine, RandomPolicy, Observation, Action } from "../../atlas-ai_deprecated/Policy/PolicyEngine";

describe("PolicyEngine", () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    const policy = new RandomPolicy();
    engine = new PolicyEngine(policy);
  });

  it("should initialize without errors", () => {
    expect(engine).toBeDefined();
  });

  it("should select an action", async () => {
    const obs: Observation = { state: {}, timestamp: Date.now() };
    const action: Action = await engine.act(obs);
    expect(action.type).toBeDefined();
    expect(action.confidence).toBeGreaterThan(0);
  });

  it("should update policy", () => {
    engine.update(1.0);
  });

  it("should allow changing policy", () => {
    const newPolicy = new RandomPolicy();
    engine.setPolicy(newPolicy);
  });
});
