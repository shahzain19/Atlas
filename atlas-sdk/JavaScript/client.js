const WebSocket = require("ws");
const { Entity } = require("./entity");
const { Event } = require("./event");

class AtlasClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl || process.env.ATLAS_WS_URL;
    this.ws = null;
    this.entities = new Map();
    this.handlers = new Map();
    this.connected = false;
  }

  connect(url) {
    if (url) this.wsUrl = url;
    if (!this.wsUrl) throw new Error("WebSocket URL required. Set ATLAS_WS_URL or pass wsUrl.");

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.on("open", async () => {
        this.connected = true;
        try {
          await this.send({ type: "get_snapshot" });
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      this.ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "snapshot" || msg.type === "event") {
            this.emitLocal("runtime:" + msg.type, "runtime", msg.payload);
          }
        } catch {}
      });

      this.ws.on("error", (err) => reject(err));
    });
  }

  async send(msg) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Not connected");
    }
    return new Promise((resolve, reject) => {
      this.ws.send(JSON.stringify(msg), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async request(msg) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Not connected");
    }
    return new Promise((resolve, reject) => {
      const handler = (data) => {
        try {
          const reply = JSON.parse(data.toString());
          resolve(reply);
        } catch {}
      };
      this.ws.once("message", handler);
      this.ws.send(JSON.stringify(msg), (err) => {
        if (err) {
          this.ws.removeListener("message", handler);
          reject(err);
        }
      });
      setTimeout(() => {
        this.ws.removeListener("message", handler);
        reject(new Error("Request timed out"));
      }, 10000);
    });
  }

  async getSnapshot() {
    return this.request({ type: "get_snapshot" });
  }

  async startRuntime() {
    return this.request({ type: "start_runtime" });
  }

  async stopRuntime() {
    return this.request({ type: "stop_runtime" });
  }

  async emitEvent(eventType, source = "js-sdk", payload = {}) {
    await this.send({
      type: "emit_event",
      payload: {
        type: eventType,
        source,
        timestamp: Date.now(),
        payload,
      },
    });
  }

  registerEntity(entity) {
    this.entities.set(entity.id, entity);
    this.emitEvent("entity:registered", "js-sdk", entity.toDict());
  }

  unregisterEntity(id) {
    this.entities.delete(id);
    this.emitEvent("entity:unregistered", "js-sdk", { entity_id: id });
  }

  getEntity(id) {
    return this.entities.get(id);
  }

  getAllEntities() {
    return Array.from(this.entities.values());
  }

  on(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType).push(handler);
  }

  off(eventType, handler) {
    if (!handler) {
      this.handlers.delete(eventType);
    } else {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
      }
    }
  }

  emitLocal(eventType, source, payload) {
    const event = new Event(eventType, source, payload);

    const handlers = this.handlers.get(eventType) || [];
    const wildcard = this.handlers.get("*") || [];

    for (const h of [...handlers, ...wildcard]) {
      try {
        h(event);
      } catch (err) {
        console.error("Error in event handler:", err);
      }
    }

    return event;
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
    this.connected = false;
  }
}

module.exports = { AtlasClient };
