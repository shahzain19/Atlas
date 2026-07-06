import { AtlasRuntime } from "../atlas-runtime/Lifecycle/AtlasRuntime";
import { AgentMessage } from "../atlas-kernel/Communication/AgentMessage";
import { Mission as MissionType } from "../atlas-kernel/Mission/Mission";
import { FleetMember, FleetStatus, MissionDefinition } from "./types";

export class Fleet {
  private runtime: AtlasRuntime;
  private members: Map<string, FleetMember> = new Map();

  constructor(runtime: AtlasRuntime) {
    this.runtime = runtime;
  }

  register(id: string, type: FleetMember["type"]): void {
    const state = this.runtime.perception.getState();
    this.members.set(id, {
      id,
      type,
      status: {
        position: state.position,
        battery: 100,
        speed: 0,
        mode: "idle",
        taskCount: 0,
      },
      lastSeen: Date.now(),
    });
  }

  unregister(id: string): void {
    this.members.delete(id);
  }

  async deploy(mission: MissionDefinition): Promise<void> {
    const m: MissionType = {
      id: `fleet-mission-${Date.now()}`,
      name: mission.name,
      status: "pending",
      goals: mission.goals.map((g, i) => ({
        id: `fg-${i}`,
        description: g.description,
        priority: g.priority || 1,
        isCompleted: false,
      })),
    };

    await this.runtime.emit({
      type: "MISSION_RECEIVED",
      source: "Fleet",
      timestamp: Date.now(),
      payload: {
        missionId: m.id,
        name: m.name,
        memberCount: this.members.size,
      },
    });

    await this.runtime.submitMission(m);
  }

  async broadcast(signal: string, data?: Record<string, unknown>): Promise<void> {
    const msg: AgentMessage = {
      id: `broadcast-${Date.now()}`,
      sender: "Fleet",
      recipient: "all",
      type: signal,
      payload: data || {},
      timestamp: Date.now(),
    };
    this.runtime.sendMessage(msg);

    await this.runtime.emit({
      type: "TASK_REQUEST",
      source: "Fleet",
      timestamp: Date.now(),
      payload: { name: signal, data, broadcast: true },
    });
  }

  monitor(): FleetStatus {
    const now = Date.now();
    let healthy = 0;

    for (const [, member] of this.members) {
      if (now - member.lastSeen < 10000) {
        healthy++;
      }
    }

    const running = this.runtime.isActive();

    return {
      members: Array.from(this.members.values()),
      healthy,
      total: this.members.size,
      missionActive: running,
    };
  }

  getMember(id: string): FleetMember | undefined {
    return this.members.get(id);
  }

  get size(): number {
    return this.members.size;
  }
}
