class Drone {
  constructor(client, id, name) {
    this.client = client;
    this.id = id;
    this.name = name || `Drone-${id}`;
  }

  async takeoff(altitude = 10) {
    await this.client.emitEvent("DRONE_TAKEOFF", this.name, {
      targetAltitude: altitude,
      droneId: this.id,
    });
  }

  async flyTo(lat, lon, alt) {
    await this.client.emitEvent("DRONE_FLY_TO", this.name, {
      latitude: lat,
      longitude: lon,
      altitude: alt,
      droneId: this.id,
    });
  }

  async captureImage() {
    await this.client.emitEvent("IMAGE_CAPTURED", this.name, {
      camera: "downward",
      droneId: this.id,
    });
  }

  async returnHome() {
    await this.client.emitEvent("DRONE_RETURN", this.name, {
      droneId: this.id,
    });
  }

  async land() {
    await this.client.emitEvent("DRONE_LAND", this.name, {
      droneId: this.id,
    });
  }
}

module.exports = { Drone };
