import { Task } from "../../atlas-kernel/Task/Task";
import { AtlasRuntime } from "../Lifecycle/AtlasRuntime";

export class RecoverySystem {
  private runtime: AtlasRuntime;

  constructor(runtime: AtlasRuntime) {
    this.runtime = runtime;
  }

  /**
   * Evaluates a failed task and decides on a recovery strategy.
   */
  async recover(task: Task, error: Error): Promise<boolean> {
    if (task.retryCount === undefined) {
      task.retryCount = 0;
    }
    
    const maxRetries = task.maxRetries ?? 3;

    console.log(`[RecoverySystem] Analyzing failure for task: ${task.name} (${task.id})`);
    console.log(`[RecoverySystem] Error: ${error.message}`);

    if (task.retryCount < maxRetries) {
      console.log(`[RecoverySystem] Strategy: RETRY (${task.retryCount + 1}/${maxRetries})`);
      task.retryCount++;
      
      // Wait before retrying (exponential backoff could be added here)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        await this.runtime.runTask(task.id);
        return true;
      } catch (retryError) {
        // Recursive recovery attempt
        return this.recover(task, retryError as Error);
      }
    }

    console.log(`[RecoverySystem] Strategy: FAIL - Max retries exceeded`);
    return false;
  }
}
