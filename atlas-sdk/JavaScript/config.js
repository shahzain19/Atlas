const fs = require("fs");

class Config {
  constructor(path = "config.json") {
    this.path = path;
    this.data = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.path)) {
        this.data = JSON.parse(fs.readFileSync(this.path, "utf8"));
      }
    } catch {
      this.data = {};
    }
  }

  save() {
    fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
  }

  get(key, defaultValue = null) {
    const keys = key.split(".");
    let current = this.data;
    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        return defaultValue;
      }
    }
    return current;
  }

  set(key, value) {
    const keys = key.split(".");
    let current = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this.save();
  }

  all() {
    return { ...this.data };
  }
}

module.exports = { Config };
