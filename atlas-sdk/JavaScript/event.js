const crypto = require("crypto");

class Event {
  constructor(type, source = "js-sdk", payload = null) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.source = source;
    this.payload = payload || {};
    this.timestamp = Date.now();
    this.priority = "medium";
  }

  toDict() {
    return {
      id: this.id,
      type: this.type,
      source: this.source,
      payload: this.payload,
      timestamp: this.timestamp,
      priority: this.priority,
    };
  }

  static fromDict(data) {
    const e = new Event(data.type, data.source || "js-sdk", data.payload);
    e.id = data.id || e.id;
    e.timestamp = data.timestamp || Date.now();
    e.priority = data.priority || "medium";
    return e;
  }
}

module.exports = { Event };
