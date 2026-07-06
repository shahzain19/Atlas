class Fleet {
  constructor(client) {
    this.client = client;
    this.members = new Map();
  }

  register(id, type) {
    this.members.set(id, {
      id,
      type,
      status: { mode: "idle", battery: 100 },
      lastSeen: Date.now(),
    });
    this.client.emitEvent("entity:registered", "fleet", {
      member_id: id,
      type,
    });
  }

  unregister(id) {
    this.members.delete(id);
  }

  async deploy(mission) {
    await this.client.emitEvent("MISSION_RECEIVED", "Fleet", {
      missionName: mission.name,
      goalCount: mission.goals.length,
      memberCount: this.members.size,
    });
  }

  async broadcast(signal, data = {}) {
    await this.client.emitEvent("TASK_REQUEST", "Fleet", {
      name: signal,
      data,
      broadcast: true,
    });
  }

  monitor() {
    let healthy = 0;
    for (const [, member] of this.members) {
      if (member.status.mode !== "error") healthy++;
    }
    return {
      members: Array.from(this.members.values()),
      healthy,
      total: this.members.size,
      missionActive: true,
    };
  }
}

module.exports = { Fleet };
