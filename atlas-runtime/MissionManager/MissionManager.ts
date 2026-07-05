import { Mission, MissionStatus } from "../../atlas-kernel/Mission/Mission";

export class MissionManager {
  private missions: Map<string, Mission> = new Map();
  private activeMissionId: string | null = null;

  addMission(mission: Mission): void {
    this.missions.set(mission.id, mission);
  }

  startMission(missionId: string): void {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);

    mission.status = "active";
    mission.startTime = Date.now();
    this.activeMissionId = missionId;
  }

  completeMission(missionId: string): void {
    const mission = this.missions.get(missionId);
    if (mission) {
      mission.status = "completed";
      mission.endTime = Date.now();
      if (this.activeMissionId === missionId) {
        this.activeMissionId = null;
      }
    }
  }

  failMission(missionId: string): void {
    const mission = this.missions.get(missionId);
    if (mission) {
      mission.status = "failed";
      mission.endTime = Date.now();
      if (this.activeMissionId === missionId) {
        this.activeMissionId = null;
      }
    }
  }

  getActiveMission(): Mission | null {
    return this.activeMissionId ? this.missions.get(this.activeMissionId) || null : null;
  }

  getMission(missionId: string): Mission | null {
    return this.missions.get(missionId) || null;
  }

  getAllMissions(): Mission[] {
    return Array.from(this.missions.values());
  }
}
