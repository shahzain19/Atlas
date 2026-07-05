import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";
import { BasicTask } from "../../atlas-examples/BasicTask";
import { RecoverySystem } from "../../atlas-runtime/Recovery/RecoverySystem";

describe("RecoverySystem", () => {
  let runtime: AtlasRuntime;
  let recovery: RecoverySystem;

  beforeEach(() => {
    runtime = new AtlasRuntime();
    recovery = new RecoverySystem(runtime);
  });

  it("should retry a failing task and succeed", async () => {
    let callCount = 0;
    const task = new BasicTask("t1", "Retry Task", 2);
    
    // Mock run to fail once then succeed
    task.run = jest.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) throw new Error("Temporary Failure");
      return Promise.resolve();
    });

    runtime.registerTask(task);
    const recovered = await recovery.recover(task, new Error("Temporary Failure"));

    expect(recovered).toBe(true);
    expect(task.retryCount).toBe(1);
    expect(task.run).toHaveBeenCalledTimes(2);
    expect(task.status).toBe("completed");
  });

  it("should fail after maximum retries", async () => {
    const task = new BasicTask("t1", "Fail Task", 1);
    task.run = jest.fn().mockRejectedValue(new Error("Persistent Failure"));

    runtime.registerTask(task);
    const recovered = await recovery.recover(task, new Error("Persistent Failure"));

    expect(recovered).toBe(false);
    expect(task.retryCount).toBe(1); // 1 retry attempt inside recover, then failed
    expect(task.run).toHaveBeenCalledTimes(2); // 1 initial call (simulated) + 1 retry call
    expect(task.status).toBe("failed");
  });
});
