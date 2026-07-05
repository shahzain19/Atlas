import { KnowledgeGraph } from "../../atlas-memory/KnowledgeGraph/KnowledgeGraph";
import { GraphNode } from "../../atlas-memory/KnowledgeGraph/GraphNode";

describe("KnowledgeGraph", () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  it("should add nodes", () => {
    const node = graph.addNode({ type: "person", properties: { name: "Alice" } });
    expect(node.id).toBeDefined();
    expect(node.type).toBe("person");
  });

  it("should get nodes by id", () => {
    const node = graph.addNode({ type: "person", properties: { name: "Bob" } });
    const retrieved = graph.getNode(node.id);
    expect(retrieved).toEqual(node);
  });

  it("should remove nodes", () => {
    const node = graph.addNode({ type: "person", properties: { name: "Charlie" } });
    graph.removeNode(node.id);
    expect(graph.getNode(node.id)).toBeUndefined();
  });

  it("should add and get edges", () => {
    const node1 = graph.addNode({ type: "person", properties: { name: "Dave" } });
    const node2 = graph.addNode({ type: "car", properties: { model: "Tesla" } });
    
    const edge = graph.addEdge(node1.id, node2.id, { type: "owns", weight: 1, properties: {} });
    expect(edge.source).toBe(node1.id);
    expect(edge.target).toBe(node2.id);
  });

  it("should get neighbors", () => {
    const node1 = graph.addNode({ type: "person", properties: {} });
    const node2 = graph.addNode({ type: "car", properties: {} });
    graph.addEdge(node1.id, node2.id, { type: "owns", weight: 1, properties: {} });
    
    const neighbors = graph.getNeighbors(node1.id);
    expect(neighbors.length).toBe(1);
    expect(neighbors[0].id).toBe(node2.id);
  });

  it("should find nodes by type", () => {
    graph.addNode({ type: "person", properties: {} });
    graph.addNode({ type: "car", properties: {} });
    graph.addNode({ type: "person", properties: {} });
    
    expect(graph.findNodesByType("person").length).toBe(2);
  });

  it("should get all nodes and edges", () => {
    graph.addNode({ type: "a", properties: {} });
    graph.addNode({ type: "b", properties: {} });
    expect(graph.getAllNodes().length).toBe(2);
    expect(graph.getAllEdges().length).toBe(0);
  });
});
