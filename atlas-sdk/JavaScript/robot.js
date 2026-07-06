class Robot {
  constructor(client, id, name) {
    this.client = client;
    this.id = id;
    this.name = name || `Robot-${id}`;
  }

  async navigateTo(target) {
    const pos = target.latitude != null
      ? { x: target.latitude, y: target.longitude, z: target.altitude || 0 }
      : { x: target.x || 0, y: target.y || 0, z: target.z || 0 };

    await this.client.emitEvent("ROBOT_NAVIGATE", this.name, {
      target: pos,
      robotId: this.id,
    });
  }

  async scan() {
    await this.client.emitEvent("IMAGE_CAPTURED", this.name, {
      camera: "front",
      robotId: this.id,
    });
  }

  async explore() {
    await this.client.emitEvent("TASK_REQUEST", this.name, {
      name: "Autonomous Survey",
      robotId: this.id,
    });
  }
}

module.exports = { Robot };
