import { Task } from "../../atlas-kernel/Task/Task";

export class TaskManager {
  private tasks: Map<string, Task> = new Map();

  add(task: Task) {
    this.tasks.set(task.id, task);
  }

  async run(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error("Task not found");

    task.status = "running";

    try {
      await task.run();
      task.status = "completed";
      return task;
    } catch (err) {
      task.status = "failed";
      throw err;
    }
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getAll(): Task[] {
    return Array.from(this.tasks.values());
  }
}