import { TaskAgent } from "../../atlas-agents/TaskAgent/TaskAgent";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";
import { Event } from "../../atlas-kernel/Event/Event";

describe("TaskAgent", () => {
  let runtime: AtlasRuntime;
  let agent: TaskAgent;

  beforeEach(() => {
    runtime = new AtlasRuntime();
    agent = new TaskAgent(runtime);
  });

  it("should ignore non-task events", () => {
    const event: Event = { type: "TICK", timestamp: Date.now(), payload: { dt: 50 } };
    const decisions = agent.handle(event);
    expect(decisions).toHaveLength(0);
  });

  it("should respond to TASK_REQUEST", () => {
    const event: Event = { 
      type: "TASK_REQUEST", 
      timestamp: Date.now(), 
      payload: { name: "Test Task" } 
    };
    const decisions = agent.handle(event);
    
    expect(decisions).toHaveLength(1);
    expect(decisions[0].name).toBe("CreateTaskDecision");
    expect(decisions[0].confidence).toBe(1.0);
  });

  it("should register and run task when decision is executed", async () => {
    const registerSpy = jest.spyOn(runtime, "registerTask");
    const runSpy = jest.spyOn(runtime, "runTask").mockResolvedValue(undefined);

    const event: Event = { 
      type: "TASK_REQUEST", 
      timestamp: Date.now(), 
      payload: { name: "Test Task" } 
    };
    const decisions = agent.handle(event);
    decisions[0].execute();

    expect(registerSpy).toHaveBeenCalled();
    expect(runSpy).toHaveBeenCalled();
  });
});
