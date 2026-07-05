import { TaskPlanner } from "../../atlas-runtime/Planner/TaskPlanner";
import { Mission } from "../../atlas-kernel/Mission/Mission";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";

describe("TaskPlanner", () => {
  let planner: TaskPlanner;
  let runtime: AtlasRuntime;

  beforeEach(() => {
    runtime = new AtlasRuntime();
    planner = new TaskPlanner(runtime);
  });

  it("should decompose an inspection mission into multiple tasks", async () => {
    const mission: Mission = {
      id: "m1",
      name: "Turbine Inspection",
      status: "pending",
      goals: [
        { id: "g1", description: "Inspect Turbine #7", priority: 1, isCompleted: false }
      ],
    };

    const tasks = await planner.plan(mission);
    expect(tasks.length).toBe(3);
    expect(tasks[0].name).toContain("Navigate");
    expect(tasks[1].name).toContain("Capture");
    expect(tasks[2].name).toContain("Analyze");
  });

  it("should decompose a survey mission into flight tasks", async () => {
    const mission: Mission = {
      id: "m1",
      name: "Field Survey",
      status: "pending",
      goals: [
        { id: "g1", description: "Survey North Field", priority: 1, isCompleted: false }
      ],
    };

    const tasks = await planner.plan(mission);
    expect(tasks.length).toBe(3);
    expect(tasks[0].name).toContain("Takeoff");
    expect(tasks[1].name).toContain("Search");
    expect(tasks[2].name).toContain("Land");
  });

  it("should ignore completed goals", async () => {
    const mission: Mission = {
      id: "m1",
      name: "Mixed Mission",
      status: "pending",
      goals: [
        { id: "g1", description: "Goal 1", priority: 1, isCompleted: true },
        { id: "g2", description: "Goal 2", priority: 1, isCompleted: false }
      ],
    };

    const tasks = await planner.plan(mission);
    expect(tasks.length).toBe(1); // Only one task for Goal 2
  });

  it("should dynamically adapt plans based on learning feedback", async () => {
    const mission: Mission = {
      id: "m_learn",
      name: "Custom Task",
      status: "pending",
      goals: [
        { id: "g_learn", description: "perform custom flight mission", priority: 1, isCompleted: false }
      ],
    };

    // Before learning: Should decompose to a generic task
    let tasks = await planner.plan(mission);
    expect(tasks[0].name).toContain("Execute: perform custom flight mission");

    // Teach the reasoning engine the connection with multiple reinforcements
    await runtime.reasoning.learn("flight survey");
    await runtime.reasoning.learn("flight survey");
    await runtime.reasoning.learn("flight survey");
    await runtime.reasoning.learn("flight survey");

    // After learning: Should now decompose to flight tasks
    tasks = await planner.plan(mission);
    expect(tasks.length).toBe(3);
    expect(tasks[0].name).toContain("Takeoff");
    expect(tasks[2].name).toContain("Land");
  });
});
