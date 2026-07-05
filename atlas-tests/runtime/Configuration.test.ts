import { Configuration } from "../../atlas-runtime/Configuration/Configuration";
import * as fs from "fs";

describe("Configuration", () => {
  let config: Configuration;
  const testConfigPath = "test-config.json";

  beforeEach(() => {
    // Clean up test file before each test
    try {
      fs.unlinkSync(testConfigPath);
    } catch {}
    config = new Configuration({ path: testConfigPath });
  });

  afterEach(() => {
    // Clean up test file after each test
    try {
      fs.unlinkSync(testConfigPath);
    } catch {}
  });

  test("should set and get a simple config value", () => {
    config.set("testKey", "testValue");
    expect(config.get("testKey")).toBe("testValue");
  });

  test("should set and get nested config values", () => {
    config.set("a.b.c", 123);
    expect(config.get("a.b.c")).toBe(123);
    expect(config.get("a.b")).toEqual({ c: 123 });
  });

  test("should return default value when key not found", () => {
    expect(config.get("nonexistent", "default")).toBe("default");
  });

  test("should check if key exists", () => {
    config.set("exists", true);
    expect(config.has("exists")).toBe(true);
    expect(config.has("nonexistent")).toBe(false);
  });

  test("should get all config", () => {
    config.set("a", 1);
    config.set("b", "test");
    const all = config.getAll();
    expect(all).toEqual({ a: 1, b: "test" });
  });

  test("should reset config", () => {
    config.set("a", 1);
    config.reset();
    expect(config.get("a")).toBeUndefined();
  });

  test("should load defaults from constructor", () => {
    const withDefaults = new Configuration({
      path: testConfigPath,
      defaults: { defaultKey: "defaultValue" },
    });
    expect(withDefaults.get("defaultKey")).toBe("defaultValue");
  });
});
