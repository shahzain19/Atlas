import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai/Decision/types";
import { Task, TaskStatus } from "../../atlas-kernel/Task/Task";
import { RoutePlanner, Waypoint } from "../../atlas-navigation/RoutePlanning/RoutePlanner";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";

export class PlanningAgent extends BaseAgent {
  readonly name = "PlanningAgent";

  private routePlanner: RoutePlanner;

  constructor() {
    super();
    this.routePlanner = new RoutePlanner();
  }

  initialize(): void {
    console.log("Planning Agent initialized");
  }

  handle(_event: Event): Decision[] {
    return [];
  }

  planTasks(goal: string): Task[] {
    const tasks: Task[] = [];

    tasks.push({
      id: uuidv4(),
      name: `Move toward goal: ${goal}`,
      status: "pending" as TaskStatus,
      async run() {
        console.log(`Moving toward goal: ${goal}`);
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

  planRoute(start: Waypoint, end: Waypoint) {
    return this.routePlanner.planPath(start, end);
  }
}
