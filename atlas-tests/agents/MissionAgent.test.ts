import { MissionAgent } from "../../atlas-agents/MissionAgent/MissionAgent";
import { Mission } from "../../atlas-kernel/Mission/Mission";

describe("MissionAgent", () => {
  let agent: MissionAgent;

  beforeEach(() => {
    agent = new MissionAgent();
  });

  it("should initialize", () => {
    expect(() => agent.initialize()).not.toThrow();
  });

  it("should queue missions", () => {
    const mission: Mission = {
      id: "mission-1",
      name: "Test Mission",
      status: "pending",
      goals: [],
    };
    agent.addMissionToQueue(mission);
    expect(agent.getMissionQueue()).toHaveLength(1);
    expect(agent.getMissionQueue()[0].id).toBe("mission-1");
  });

  it("should start next mission from queue", async () => {
    const mission: Mission = {
      id: "mission-2",
      name: "Next Mission",
      status: "pending",
      goals: [],
    };
    agent.addMissionToQueue(mission);
    await agent.startNextMission();
    expect(agent.getCurrentMission()?.id).toBe("mission-2");
    expect(agent.getCurrentMission()?.status).toBe("active");
    expect(agent.getMissionQueue()).toHaveLength(0);
  });

  it("should stop current mission", async () => {
    const mission: Mission = {
      id: "mission-3",
      name: "Stop Mission",
      status: "active",
      goals: [],
    };
    agent.addMissionToQueue(mission);
    await agent.startNextMission();
    await agent.stopCurrentMission();
    expect(agent.getCurrentMission()?.status).toBe("aborted");
  });

  it("should return empty decisions for handle()", () => {
    const event = { type: "TICK", timestamp: Date.now(), payload: {} };
    const decisions = agent.handle(event);
    expect(decisions).toEqual([]);
  });

  it("should clear mission queue", () => {
    const mission: Mission = {
      id: "mission-4",
      name: "Clear Mission",
      status: "pending",
      goals: [],
    };
    agent.addMissionToQueue(mission);
    agent.addMissionToQueue(mission);
    expect(agent.getMissionQueue()).toHaveLength(2);
    agent.clearMissionQueue();
    expect(agent.getMissionQueue()).toHaveLength(0);
  });
});
