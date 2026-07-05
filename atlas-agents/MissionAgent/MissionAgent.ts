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

  handle(event: Event): Decision[] {
    switch (event.type) {
      case "MISSION_RECEIVED":
      case "MISSION_QUEUED": {
        const mission = event.payload?.mission as Mission | undefined;
        if (mission) {
          this.addMissionToQueue(mission);
        }
        return [];
      }
      case "TICK": {
        if (!this.getCurrentMission() && this.getMissionQueue().length > 0) {
          return [
            {
              name: "StartNextMissionDecision",
              confidence: 1.0,
              execute: () => {
                void this.startNextMission();
              },
            },
          ];
        }
        return [];
      }
      case "MISSION_ABORT":
        return [
          {
            name: "AbortMissionDecision",
            confidence: 1.0,
            execute: () => {
              void this.stopCurrentMission();
            },
          },
        ];
      default:
        return [];
    }
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
