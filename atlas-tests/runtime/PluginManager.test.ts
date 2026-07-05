import { PluginManager, Plugin } from "../../atlas-runtime/PluginManager/PluginManager";

describe("PluginManager", () => {
  let manager: PluginManager;
  let mockRuntime: any;

  beforeEach(() => {
    mockRuntime = {};
    manager = new PluginManager(mockRuntime);
  });

  test("should register and retrieve a plugin", async () => {
    const mockPlugin: Plugin = {
      name: "TestPlugin",
      version: "1.0.0",
      initialize: jest.fn(),
    };

    await manager.register(mockPlugin);
    expect(manager.get("TestPlugin")).toEqual(mockPlugin);
    expect(mockPlugin.initialize).toHaveBeenCalledWith(mockRuntime);
  });

  test("should unregister a plugin", async () => {
    const mockPlugin: Plugin = {
      name: "TestPlugin",
      version: "1.0.0",
      initialize: jest.fn(),
      stop: jest.fn(),
      destroy: jest.fn(),
    };

    await manager.register(mockPlugin);
    await manager.unregister("TestPlugin");
    expect(manager.get("TestPlugin")).toBeUndefined();
    expect(mockPlugin.stop).toHaveBeenCalled();
    expect(mockPlugin.destroy).toHaveBeenCalled();
  });

  test("should throw when registering duplicate plugin", async () => {
    const mockPlugin: Plugin = {
      name: "TestPlugin",
      version: "1.0.0",
      initialize: jest.fn(),
    };

    await manager.register(mockPlugin);
    await expect(manager.register(mockPlugin)).rejects.toThrow(
      "Plugin TestPlugin already registered"
    );
  });

  test("should check dependencies before registering", async () => {
    const dependencyPlugin: Plugin = {
      name: "DependencyPlugin",
      version: "1.0.0",
      initialize: jest.fn(),
    };

    const dependentPlugin: Plugin = {
      name: "DependentPlugin",
      version: "1.0.0",
      dependencies: ["DependencyPlugin"],
      initialize: jest.fn(),
    };

    await expect(manager.register(dependentPlugin)).rejects.toThrow(
      "Plugin DependentPlugin requires dependency DependencyPlugin"
    );

    await manager.register(dependencyPlugin);
    await manager.register(dependentPlugin);
    expect(manager.has("DependentPlugin")).toBe(true);
  });

  test("should start and stop all plugins", async () => {
    const plugin1: Plugin = {
      name: "Plugin1",
      version: "1.0.0",
      initialize: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };

    const plugin2: Plugin = {
      name: "Plugin2",
      version: "1.0.0",
      initialize: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };

    await manager.register(plugin1);
    await manager.register(plugin2);

    await manager.startAll();
    expect(plugin1.start).toHaveBeenCalled();
    expect(plugin2.start).toHaveBeenCalled();

    await manager.stopAll();
    expect(plugin1.stop).toHaveBeenCalled();
    expect(plugin2.stop).toHaveBeenCalled();
  });

  test("should get all registered plugins", async () => {
    const plugin1: Plugin = {
      name: "Plugin1",
      version: "1.0.0",
      initialize: jest.fn(),
    };

    const plugin2: Plugin = {
      name: "Plugin2",
      version: "1.0.0",
      initialize: jest.fn(),
    };

    await manager.register(plugin1);
    await manager.register(plugin2);

    const allPlugins = manager.getAll();
    expect(allPlugins.length).toBe(2);
    expect(allPlugins.map((p) => p.name)).toEqual(["Plugin1", "Plugin2"]);
  });

  test("should check if plugin exists", async () => {
    const plugin: Plugin = {
      name: "TestPlugin",
      version: "1.0.0",
      initialize: jest.fn(),
    };

    expect(manager.has("TestPlugin")).toBe(false);
    await manager.register(plugin);
    expect(manager.has("TestPlugin")).toBe(true);
  });

  test("should clear all plugins", async () => {
    const plugin: Plugin = {
      name: "TestPlugin",
      version: "1.0.0",
      initialize: jest.fn(),
    };

    await manager.register(plugin);
    manager.clear();
    expect(manager.getAll().length).toBe(0);
  });
});
