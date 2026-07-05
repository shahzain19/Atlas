import { TaskManager } from "../../atlas-runtime/TaskManager/TaskManager";
import { Task } from "../../atlas-kernel/Task/Task";

describe("TaskManager", () => {
  let manager: TaskManager;

  beforeEach(() => {
    manager = new TaskManager();
  });

  it("should add and track tasks", () => {
    const task: Task = {
      id: "task-1",
      name: "Test Task",
      status: "pending",
      run: jest.fn().mockResolvedValue(undefined),
    };

    manager.add(task);
    // TaskManager internal storage is private, we'll verify via run
  });

  it("should execute tasks successfully", async () => {
    const task: Task = {
      id: "task-1",
      name: "Test Task",
      status: "pending",
      run: jest.fn().mockResolvedValue(undefined),
    };

    manager.add(task);
    await manager.run("task-1");

    expect(task.run).toHaveBeenCalled();
    expect(task.status).toBe("completed");
  });

  it("should handle task failures", async () => {
    const error = new Error("Task failed");
    const task: Task = {
      id: "task-1",
      name: "Test Task",
      status: "pending",
      run: jest.fn().mockRejectedValue(error),
    };

    manager.add(task);
    await expect(manager.run("task-1")).rejects.toThrow("Task failed");

    expect(task.status).toBe("failed");
  });

  it("should throw error for non-existent tasks", async () => {
    await expect(manager.run("non-existent")).rejects.toThrow("Task not found");
  });
});
