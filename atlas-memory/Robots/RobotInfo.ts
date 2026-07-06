export type RobotStatus = "idle" | "busy" | "charging" | "error" | "offline";

export interface RobotInfo {
  id: string;
  name?: string;
  type: string;
  status: RobotStatus;
  position: { x: number; y: number; z: number };
  battery: number;
  temperature?: number;
  cpu?: number;
  memory?: number;
  lastHeartbeat: number;
  capabilities: string[];
  currentTask?: string;
  metadata?: Record<string, unknown>;
}
