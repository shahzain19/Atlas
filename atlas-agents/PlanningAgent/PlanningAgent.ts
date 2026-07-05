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

  handle(event: Event): Decision[] {
    switch (event.type) {
      case "REQUEST_PLAN":
        if (!event.payload?.goal) return [];
        return [
          {
            name: "PlanTasksDecision",
            confidence: 0.9,
            execute: () => {
              void this.planTasks(event.payload.goal as string);
            },
          },
        ];
      case "REQUEST_ROUTE":
        if (!event.payload?.start || !event.payload?.end) return [];
        return [
          {
            name: "PlanRouteDecision",
            confidence: 0.9,
            execute: () => {
              void this.planRoute(event.payload.start as any, event.payload.end as any);
            },
          },
        ];
      default:
        return [];
    }
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
