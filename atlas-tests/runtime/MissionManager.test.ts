import { MissionManager } from "../../atlas-runtime/MissionManager/MissionManager";
import { Mission } from "../../atlas-kernel/Mission/Mission";

describe("MissionManager", () => {
  let manager: MissionManager;

  beforeEach(() => {
    manager = new MissionManager();
  });

  it("should add and track missions", () => {
    const mission: Mission = {
      id: "m1",
      name: "Test Mission",
      status: "pending",
      goals: [],
    };

    manager.addMission(mission);
    expect(manager.getMission("m1")).toBe(mission);
  });

  it("should manage mission lifecycle", () => {
    const mission: Mission = {
      id: "m1",
      name: "Test Mission",
      status: "pending",
      goals: [],
    };

    manager.addMission(mission);
    manager.startMission("m1");
    
    expect(mission.status).toBe("active");
    expect(manager.getActiveMission()).toBe(mission);

    manager.completeMission("m1");
    expect(mission.status).toBe("completed");
    expect(manager.getActiveMission()).toBeNull();
  });
});
