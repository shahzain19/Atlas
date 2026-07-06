export { RobotInfo, RobotStatus } from "./RobotInfo";
import { RobotInfo, RobotStatus } from "./RobotInfo";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";

export class RobotState {
  private robots: Map<string, RobotInfo> = new Map();

  addRobot(robot: Omit<RobotInfo, "id" | "lastHeartbeat">): RobotInfo {
    const newRobot: RobotInfo = {
      ...robot,
      id: uuidv4(),
      lastHeartbeat: Date.now(),
    };
    this.robots.set(newRobot.id, newRobot);
    return newRobot;
  }

  updateRobot(id: string, updates: Partial<RobotInfo>): RobotInfo | undefined {
    const existing = this.robots.get(id);
    if (!existing) return undefined;
    const updated: RobotInfo = { ...existing, ...updates, id: existing.id };
    this.robots.set(id, updated);
    return updated;
  }

  removeRobot(id: string): boolean {
    return this.robots.delete(id);
  }

  getRobot(id: string): RobotInfo | undefined {
    return this.robots.get(id);
  }

  getRobotsByStatus(status: RobotStatus): RobotInfo[] {
    return this.getAllRobots().filter((r) => r.status === status);
  }

  getAllRobots(): RobotInfo[] {
    return Array.from(this.robots.values());
  }

  getAvailableRobots(): RobotInfo[] {
    return this.getAllRobots().filter(
      (r) => r.status === "idle" && r.battery > 20
    );
  }

  updateHeartbeat(id: string): void {
    const robot = this.robots.get(id);
    if (robot) {
      robot.lastHeartbeat = Date.now();
    }
  }

  isStale(id: string, timeout: number = 30000): boolean {
    const robot = this.robots.get(id);
    if (!robot) return true;
    return Date.now() - robot.lastHeartbeat > timeout;
  }

  assignTask(id: string, task: string): boolean {
    const robot = this.robots.get(id);
    if (!robot) return false;
    robot.currentTask = task;
    robot.status = "busy";
    return true;
  }

  clearTask(id: string): boolean {
    const robot = this.robots.get(id);
    if (!robot) return false;
    robot.currentTask = undefined;
    robot.status = "idle";
    return true;
  }
}
