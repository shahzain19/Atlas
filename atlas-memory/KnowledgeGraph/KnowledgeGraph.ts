import { GraphNode } from "./GraphNode";
import { GraphEdge } from "./GraphEdge";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";

export class KnowledgeGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private adjacency: Map<string, string[]> = new Map();

  addNode(node: Omit<GraphNode, "id">): GraphNode {
    const id = uuidv4();
    const newNode: GraphNode = { ...node, id };
    this.nodes.set(id, newNode);
    this.adjacency.set(id, []);
    return newNode;
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  removeNode(id: string): void {
    this.nodes.delete(id);
    const edgesToRemove: string[] = [];
    this.edges.forEach((edge, edgeId) => {
      if (edge.source === id || edge.target === id) {
        edgesToRemove.push(edgeId);
      }
    });
    edgesToRemove.forEach((eid) => this.removeEdge(eid));
    this.adjacency.delete(id);
  }

  addEdge(
    sourceId: string,
    targetId: string,
    edge: Omit<GraphEdge, "id" | "source" | "target">
  ): GraphEdge {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      throw new Error("Source or target node not found");
    }
    const id = uuidv4();
    const newEdge: GraphEdge = { ...edge, id, source: sourceId, target: targetId };
    this.edges.set(id, newEdge);
    this.adjacency.get(sourceId)?.push(targetId);
    return newEdge;
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  removeEdge(id: string): void {
    const edge = this.edges.get(id);
    if (edge) {
      const adj = this.adjacency.get(edge.source);
      if (adj) {
        const idx = adj.indexOf(edge.target);
        if (idx !== -1) adj.splice(idx, 1);
      }
      this.edges.delete(id);
    }
  }

  getNeighbors(nodeId: string): GraphNode[] {
    const neighbors: GraphNode[] = [];
    const adj = this.adjacency.get(nodeId) || [];
    adj.forEach((targetId) => {
      const node = this.nodes.get(targetId);
      if (node) neighbors.push(node);
    });
    return neighbors;
  }

  findNodesByType(type: string): GraphNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.type === type);
  }

  findEdgesByType(type: string): GraphEdge[] {
    return Array.from(this.edges.values()).filter((e) => e.type === type);
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }
}
