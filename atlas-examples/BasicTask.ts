import { Task } from "../atlas-kernel/Task/Task";

export class BasicTask implements Task {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" = "pending";
  retryCount: number = 0;
  maxRetries: number = 2;

  constructor(id: string, name: string, maxRetries: number = 2) {
    this.id = id;
    this.name = name;
    this.maxRetries = maxRetries;
  }

  async run(): Promise<void> {
    console.log(`🚀 Running task: ${this.name}`);

    await new Promise((res) => setTimeout(res, 1000));

    console.log(`✅ Finished task: ${this.name}`);
  }
}