export type TaskStatus = "pending" | "running" | "completed" | "failed";

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  retryCount?: number;
  maxRetries?: number;

  run(): Promise<void>;
}