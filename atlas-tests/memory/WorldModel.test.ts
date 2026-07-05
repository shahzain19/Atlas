import { WorldModel } from "../../atlas-memory/WorldModel/WorldModel";
import { WorldObject } from "../../atlas-memory/WorldModel/WorldObject";

describe("WorldModel", () => {
  let worldModel: WorldModel;

  beforeEach(() => {
    worldModel = new WorldModel();
  });

  it("should initialize with default position", () => {
    const pos = worldModel.getOwnPosition();
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(0);
    expect(pos.z).toBe(0);
  });

  it("should set and get own position", () => {
    const newPos = { x: 10, y: 20, z: 5, timestamp: Date.now() };
    worldModel.setOwnPosition(newPos);
    const pos = worldModel.getOwnPosition();
    expect(pos.x).toBe(10);
    expect(pos.y).toBe(20);
    expect(pos.z).toBe(5);
  });

  it("should add and get objects", () => {
    const obj: WorldObject = {
      id: "obj-001",
      type: "person",
      position: { x: 5, y: 5, z: 0, timestamp: Date.now() },
      confidence: 0.8,
      lastSeen: Date.now(),
    };
    worldModel.addObject(obj);
    const retrieved = worldModel.getObject("obj-001");
    expect(retrieved).toEqual(obj);
  });

  it("should update objects", () => {
    const obj: WorldObject = {
      id: "obj-001",
      type: "person",
      position: { x: 5, y: 5, z: 0, timestamp: Date.now() },
      confidence: 0.8,
      lastSeen: Date.now(),
    };
    worldModel.addObject(obj);
    worldModel.updateObject("obj-001", { type: "car" });
    const updated = worldModel.getObject("obj-001");
    expect(updated?.type).toBe("car");
  });

  it("should remove objects", () => {
    const obj: WorldObject = {
      id: "obj-001",
      type: "person",
      position: { x: 5, y: 5, z: 0, timestamp: Date.now() },
      confidence: 0.8,
      lastSeen: Date.now(),
    };
    worldModel.addObject(obj);
    worldModel.removeObject("obj-001");
    expect(worldModel.getObject("obj-001")).toBeUndefined();
  });

  it("should get objects by type", () => {
    const obj1: WorldObject = {
      id: "obj-001",
      type: "person",
      position: { x: 5, y: 5, z: 0, timestamp: Date.now() },
      confidence: 0.8,
      lastSeen: Date.now(),
    };
    const obj2: WorldObject = {
      id: "obj-002",
      type: "car",
      position: { x: 10, y: 10, z: 0, timestamp: Date.now() },
      confidence: 0.9,
      lastSeen: Date.now(),
    };
    worldModel.addObject(obj1);
    worldModel.addObject(obj2);
    expect(worldModel.getObjectsByType("person").length).toBe(1);
  });

  it("should get all objects", () => {
    expect(worldModel.getAllObjects().length).toBe(0);
    worldModel.addObject({
      id: "obj-001",
      type: "person",
      position: { x: 5, y: 5, z: 0, timestamp: Date.now() },
      confidence: 0.8,
      lastSeen: Date.now(),
    });
    expect(worldModel.getAllObjects().length).toBe(1);
  });
});
