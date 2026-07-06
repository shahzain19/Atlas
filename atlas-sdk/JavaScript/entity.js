class Entity {
  constructor(id, name, type = "default") {
    this.id = id;
    this.name = name;
    this.type = type;
    this.metadata = {};
    this.createdAt = Date.now();
  }

  setMeta(key, value) {
    this.metadata[key] = value;
  }

  getMeta(key) {
    return this.metadata[key];
  }

  toDict() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      metadata: this.metadata,
      created_at: this.createdAt,
    };
  }

  static fromDict(data) {
    const e = new Entity(data.id, data.name, data.type || "default");
    e.metadata = data.metadata || {};
    e.createdAt = data.created_at || Date.now();
    return e;
  }
}

module.exports = { Entity };
