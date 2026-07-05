export type MissionStatus = "pending" | "active" | "completed" | "failed" | "aborted";

export interface Goal {
  id: string;
  description: string;
  priority: number;
  isCompleted: boolean;
  metadata?: Record<string, any>;
}

export interface Mission {
  id: string;
  name: string;
  status: MissionStatus;
  goals: Goal[];
  startTime?: number;
  endTime?: number;
}
