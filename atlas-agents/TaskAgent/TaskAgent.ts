import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai_deprecated/Decision/types";
import { BasicTask } from "../../atlas-examples/BasicTask";
import { AtlasRuntime } from "../../atlas-runtime/Lifecycle/AtlasRuntime";

export class TaskAgent extends BaseAgent {
  readonly name = "TaskAgent";
  private runtime: AtlasRuntime;

  constructor(runtime: AtlasRuntime) {
    super();
    this.runtime = runtime;
  }

  handle(event: Event): Decision[] {
    if (event.type !== "TASK_REQUEST") {
      return [];
    }

    const taskName = event.payload.name || "Unnamed Task";
    const taskId = `task-${Date.now()}`;

    console.log(`[TaskAgent] Planning task: ${taskName}`);

    return [
      {
        name: "CreateTaskDecision",
        confidence: 1.0,
        execute: () => {
          const task = new BasicTask(taskId, taskName);
          this.runtime.registerTask(task);
          this.runtime.runTask(task.id);
        },
      },
    ];
  }
}
