import { AutonomousAgent } from "../../atlas-runtime/Autonomy/AutonomousAgent";
import { AgentState } from "../../atlas-runtime/Autonomy/AutonomousAgent";

describe("AutonomousAgent", () => {
  let agent: AutonomousAgent;

  beforeEach(() => {
    agent = new AutonomousAgent("test-001", "Test Agent");
  });

  it("should initialize correctly", () => {
    expect(agent.id).toBe("test-001");
    expect(agent.name).toBe("Test Agent");
    expect(agent.state).toBe(AgentState.IDLE);
  });

  it("should have all required components", () => {
    expect(agent.eventBus).toBeDefined();
    expect(agent.worldModel).toBeDefined();
    expect(agent.perception).toBeDefined();
    expect(agent.reasoning).toBeDefined();
    expect(agent.planner).toBeDefined();
    expect(agent.brain).toBeDefined();
  });

  it("should get status correctly", () => {
    const status = agent.getStatus();
    expect(status.id).toBe("test-001");
    expect(status.name).toBe("Test Agent");
    expect(status.cycleCount).toBe(0);
  });
});
