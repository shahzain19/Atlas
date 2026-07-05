import { Mission, Goal } from "../../atlas-kernel/Mission/Mission";
import { Task } from "../../atlas-kernel/Task/Task";
import { BasicTask } from "../../atlas-examples/BasicTask";
import { HardwareTask } from "../Task/HardwareTask";
import { AtlasRuntime } from "../Lifecycle/AtlasRuntime";
import { CapabilityType } from "../../atlas-kernel/Hardware/Hardware";

export class TaskPlanner {
  private runtime: AtlasRuntime;

  constructor(runtime: AtlasRuntime) {
    this.runtime = runtime;
  }

  /**
   * Plans tasks based on the goals of a mission.
   */
  async plan(mission: Mission): Promise<Task[]> {
    const tasks: Task[] = [];

    for (const goal of mission.goals) {
      if (goal.isCompleted) continue;

      const decomposedTasks = await this.decomposeGoal(goal);
      tasks.push(...decomposedTasks);
    }

    return tasks;
  }

  private async decomposeGoal(goal: Goal): Promise<Task[]> {
    const tasks: Task[] = [];
    const description = goal.description.toLowerCase();

    // Query the deep reasoning engine for contextual concepts
    const reasoningResult = await this.runtime.reasoning.reason(description);

    // Learn relationships dynamically to build the knowledge graph connections
    if (description.includes("inspect")) {
      await this.runtime.reasoning.learn("inspect involves motion imaging analysis");
    } else if (description.includes("survey")) {
      await this.runtime.reasoning.learn("survey involves motion navigation land");
    }

    // Check reasoning paths for capability concepts
    const hasImaging = reasoningResult.paths.some(p =>
      p.nodes.some(n => n.concept === "imaging" || n.concept === "analysis" || n.concept === "inspect")
    );
    const hasMotion = reasoningResult.paths.some(p =>
      p.nodes.some(n => n.concept === "motion" || n.concept === "state" || n.concept === "action")
    );
    const hasSurvey = reasoningResult.paths.some(p =>
      p.nodes.some(n => n.concept === "survey")
    );

    if (description.includes("inspect") || (hasImaging && hasMotion)) {
      tasks.push(new HardwareTask(`${goal.id}-nav`, "Navigate to Inspection Site", this.runtime, CapabilityType.MOTION, "MOVE_TO", { target: "Turbine #7" }));
      tasks.push(new HardwareTask(`${goal.id}-capture`, "Capture High-Res Images", this.runtime, CapabilityType.IMAGING, "CAPTURE_IMAGE", { resolution: "4K" }));
      tasks.push(new BasicTask(`${goal.id}-analysis`, "Analyze Visual Data"));
    } else if (description.includes("survey") || hasSurvey) {
      tasks.push(new HardwareTask(`${goal.id}-takeoff`, "Takeoff and Stabilize", this.runtime, CapabilityType.MOTION, "TAKEOFF", { altitude: 10 }));
      tasks.push(new HardwareTask(`${goal.id}-path`, "Execute Grid Search Pattern", this.runtime, CapabilityType.MOTION, "NAVIGATE_PATH", { pattern: "GRID" }));
      tasks.push(new HardwareTask(`${goal.id}-land`, "Return to Base and Land", this.runtime, CapabilityType.MOTION, "LAND", {}));
    } else {
      // Fallback: Generic task for unknown goals
      tasks.push(new BasicTask(`${goal.id}-generic`, `Execute: ${goal.description}`));
    }

    return tasks;
  }
}
