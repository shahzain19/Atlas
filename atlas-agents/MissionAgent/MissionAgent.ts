import { BaseAgent } from "../BaseAgent/BaseAgent";
import { Event } from "../../atlas-kernel/Event/Event";
import { Decision } from "../../atlas-ai/Decision/types";
import { Mission } from "../../atlas-kernel/Mission/Mission";

export class MissionAgent extends BaseAgent {
  readonly name = "MissionAgent";

  private currentMission?: Mission;
  private missionQueue: Mission[] = [];

  initialize(): void {
    console.log("Mission Agent initialized");
  }

  handle(_event: Event): Decision[] {
    return [];
  }

  addMissionToQueue(mission: Mission): void {
    this.missionQueue.push(mission);
  }

  getMissionQueue(): Mission[] {
    return [...this.missionQueue];
  }

  clearMissionQueue(): void {
    this.missionQueue = [];
  }

  getCurrentMission(): Mission | undefined {
    return this.currentMission;
  }

  async startNextMission(): Promise<void> {
    if (this.missionQueue.length > 0) {
      this.currentMission = this.missionQueue.shift();
      if (this.currentMission) {
        this.currentMission.status = "active";
        this.currentMission.startTime = Date.now();
      }
    }
  }

  async stopCurrentMission(): Promise<void> {
    if (this.currentMission) {
      this.currentMission.status = "aborted";
      this.currentMission.endTime = Date.now();
    }
  }
}
