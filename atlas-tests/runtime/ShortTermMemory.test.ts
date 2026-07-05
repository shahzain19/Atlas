import { ShortTermMemory } from "../../atlas-runtime/Memory/ShortTermMemory";
import { Event } from "../../atlas-kernel/Event/Event";

describe("ShortTermMemory", () => {
  let stm: ShortTermMemory;

  beforeEach(() => {
    stm = new ShortTermMemory(3); // Small size for testing shift
  });

  it("should remember events", () => {
    const event: Event = { type: "TEST", timestamp: Date.now() };
    stm.remember(event);
    expect(stm.getRecentEvents()).toContainEqual(event);
  });

  it("should enforce maxSize using FIFO", () => {
    const e1 = { type: "E1", timestamp: 1 };
    const e2 = { type: "E2", timestamp: 2 };
    const e3 = { type: "E3", timestamp: 3 };
    const e4 = { type: "E4", timestamp: 4 };

    stm.remember(e1);
    stm.remember(e2);
    stm.remember(e3);
    stm.remember(e4);

    const recent = stm.getRecentEvents();
    expect(recent).toHaveLength(3);
    expect(recent[0].type).toBe("E2");
    expect(recent[2].type).toBe("E4");
    expect(recent).not.toContainEqual(e1);
  });

  it("should find events by type", () => {
    stm.remember({ type: "TYPE_A", timestamp: 1 });
    stm.remember({ type: "TYPE_B", timestamp: 2 });
    stm.remember({ type: "TYPE_A", timestamp: 3 });

    const typeA = stm.findRecentByType("TYPE_A");
    expect(typeA).toHaveLength(2);
    expect(typeA[0].timestamp).toBe(1);
    expect(typeA[1].timestamp).toBe(3);
  });

  it("should clear memory", () => {
    stm.remember({ type: "TEST", timestamp: 1 });
    stm.clear();
    expect(stm.getRecentEvents()).toHaveLength(0);
  });
});
