import { LocalEmbedder } from "../../atlas-runtime/Memory/Embedder";
import { SemanticMemory } from "../../atlas-runtime/Memory/SemanticMemory";
import { Event } from "../../atlas-kernel/Event/Event";

describe("SemanticMemory", () => {
  let embedder: LocalEmbedder;
  let semantic: SemanticMemory;

  beforeEach(() => {
    embedder = new LocalEmbedder(32);
    semantic = new SemanticMemory(embedder);
  });

  it("should generate similar embeddings for similar text", async () => {
    const v1 = await embedder.embed("task request survey");
    const v2 = await embedder.embed("survey request task");
    const v3 = await embedder.embed("battery failure critical");

    // Cosine similarity for normalized vectors is just the dot product
    const sim12 = v1.values.reduce((sum, v, i) => sum + v * v2.values[i], 0);
    const sim13 = v1.values.reduce((sum, v, i) => sum + v * v3.values[i], 0);

    expect(sim12).toBeGreaterThan(0.9);
    expect(sim13).toBeLessThan(0.5);
  });

  it("should store and search events semantically", async () => {
    const e1: Event = { 
      type: "TASK_REQUEST", 
      timestamp: 1, 
      payload: { name: "Bridge Inspection" },
      metadata: { category: "operation" }
    };
    const e2: Event = { 
      type: "TASK_FAILURE", 
      timestamp: 2, 
      payload: { error: "GPS Lost" },
      metadata: { category: "system" }
    };

    await semantic.add(e1);
    await semantic.add(e2);

    const results = await semantic.search("inspect bridge");
    expect(results).toHaveLength(1);
    expect(results[0].payload.name).toBe("Bridge Inspection");

    const failureResults = await semantic.search("gps error");
    expect(failureResults).toHaveLength(1);
    expect(failureResults[0].type).toBe("TASK_FAILURE");
  });

  it("should return empty array when no similar events found", async () => {
    await semantic.add({ type: "TICK", timestamp: 1 });
    const results = await semantic.search("something completely unrelated");
    expect(results).toHaveLength(0);
  });
});
