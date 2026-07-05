import { Task, TaskStatus } from "../../atlas-kernel/Task/Task";
import { AtlasRuntime } from "../Lifecycle/AtlasRuntime";
import { CapabilityType } from "../../atlas-kernel/Hardware/Hardware";

export class HardwareTask implements Task {
  id: string;
  name: string;
  status: TaskStatus = "pending";
  retryCount: number = 0;
  maxRetries: number = 3;

  private runtime: AtlasRuntime;
  private capability: CapabilityType;
  private command: string;
  private params: Record<string, any>;

  constructor(
    id: string,
    name: string,
    runtime: AtlasRuntime,
    capability: CapabilityType,
    command: string,
    params: Record<string, any> = {}
  ) {
    this.id = id;
    this.name = name;
    this.runtime = runtime;
    this.capability = capability;
    this.command = command;
    this.params = params;
  }

  async run(): Promise<void> {
    console.log(`[HardwareTask] Executing: ${this.name} (Capability: ${this.capability})`);
    
    // Use the HardwareManager via AtlasRuntime to dispatch the command
    await this.runtime.hardware.dispatchCapabilityCommand(
      this.capability,
      this.command,
      this.params
    );

    console.log(`[HardwareTask] Successfully completed: ${this.name}`);
  }
}
