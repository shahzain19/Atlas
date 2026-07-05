import { LongTermMemory } from "../../atlas-runtime/Memory/LongTermMemory";
import { Event } from "../../atlas-kernel/Event/Event";
import * as fs from "fs";
import * as path from "path";

describe("LongTermMemory", () => {
  const testDir = "test_storage";
  let ltm: LongTermMemory;

  beforeEach(() => {
    ltm = new LongTermMemory(testDir);
  });

  afterEach(async () => {
    await ltm.clear();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should persist events to disk", async () => {
    const event: Event = { type: "PERSISTENT_EVENT", timestamp: Date.now() };
    await ltm.logEvent(event);

    // Create a new instance to verify loading from disk
    const secondInstance = new LongTermMemory(testDir);
    const events = secondInstance.getEvents();
    
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("PERSISTENT_EVENT");
  });

  it("should find events by type in persistence", async () => {
    await ltm.logEvent({ type: "TYPE_X", timestamp: 1 });
    await ltm.logEvent({ type: "TYPE_Y", timestamp: 2 });
    await ltm.logEvent({ type: "TYPE_X", timestamp: 3 });

    const typeX = ltm.findEventsByType("TYPE_X");
    expect(typeX).toHaveLength(2);
  });

  it("should clear persistent storage", async () => {
    await ltm.logEvent({ type: "TEST", timestamp: 1 });
    await ltm.clear();
    
    const events = ltm.getEvents();
    expect(events).toHaveLength(0);

    const content = fs.readFileSync(path.join(testDir, "memory.json"), "utf-8");
    const data = JSON.parse(content);
    expect(data.events).toHaveLength(0);
  });
});
