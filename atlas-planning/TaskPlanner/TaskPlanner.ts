import { Task, TaskStatus } from "../../atlas-kernel/Task/Task";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";
import { GroqClient } from "../../atlas-kernel/Groq/GroqClient";

export class TaskPlanner {
  async generateTasks(goal?: string): Promise<Task[]> {
    if (!goal) {
      goal = "Explore the environment";
    }

    try {
      const groq = GroqClient.getInstance();
      const result = await groq.generate(
        `You are a mission planner. Decompose this goal into 2-4 concrete robot tasks.
Goal: ${goal}

Return ONLY a JSON array of task names, like: ["Move forward", "Scan surroundings"]
Each task name should be 2-5 words, actionable.`,
        { temperature: 0.3, maxTokens: 200 }
      );

      const start = result.indexOf("[");
      const end = result.lastIndexOf("]") + 1;
      if (start !== -1 && end > start) {
        const names = JSON.parse(result.slice(start, end)) as string[];
        if (names.length >= 2) {
          return names.slice(0, 4).map((name) => ({
            id: uuidv4(),
            name,
            status: "pending" as TaskStatus,
            async run() {
              console.log(`Executing: ${name}...`);
            },
          }));
        }
      }
    } catch {
      // fall through to defaults
    }

    return this.defaultTasks();
  }

  private defaultTasks(): Task[] {
    return [
      {
        id: uuidv4(),
        name: "Move forward",
        status: "pending" as TaskStatus,
        async run() {
          console.log("Moving forward...");
        },
      },
      {
        id: uuidv4(),
        name: "Scan surroundings",
        status: "pending" as TaskStatus,
        async run() {
          console.log("Scanning surroundings...");
        },
      },
    ];
  }
}
