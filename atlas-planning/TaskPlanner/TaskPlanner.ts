import { Task, TaskStatus } from "../../atlas-kernel/Task/Task";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";

export class TaskPlanner {
  generateTasks(goal?: string): Task[] {
    const tasks: Task[] = [];

    if (!goal) {
      goal = "Explore the environment";
    }

    tasks.push({
      id: uuidv4(),
      name: "Move forward",
      status: "pending" as TaskStatus,
      async run() {
        console.log("Moving forward...");
      },
    });

    tasks.push({
      id: uuidv4(),
      name: "Scan surroundings",
      status: "pending" as TaskStatus,
      async run() {
        console.log("Scanning surroundings...");
      },
    });

    return tasks;
  }
}
