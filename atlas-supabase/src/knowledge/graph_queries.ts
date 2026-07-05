import { createClient } from '../client';
import { GraphNodeRow, GraphEdgeRow } from '../types';

interface PathNode {
  id: string;
  label?: string | null;
  node_type: string;
}

interface PathEdge {
  id: string;
  source_id: string;
  target_id: string;
  edge_type: string;
  weight: number;
}

export interface PathResult {
  nodes: PathNode[];
  edges: PathEdge[];
  totalWeight: number;
}

export class GraphQueries {
  async findPath(
    startId: string,
    endId: string,
    maxDepth: number = 10
  ): Promise<PathResult | null> {
    if (startId === endId) {
      const startNode = await this.getNodeInfo(startId);
      if (!startNode) return null;
      return { nodes: [startNode], edges: [], totalWeight: 0 };
    }

    const client = createClient();
    await client.from('graph_edges').select();

    const visited = new Set<string>();
    const queue: Array<{
      nodeId: string;
      path: PathNode[];
      edges: PathEdge[];
      weight: number;
    }> = [];

    const startNode = await this.getNodeInfo(startId);
    if (!startNode) return null;
    visited.add(startId);
    queue.push({ nodeId: startId, path: [startNode], edges: [], weight: 0 });

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.nodeId === endId) {
        return {
          nodes: current.path,
          edges: current.edges,
          totalWeight: current.weight,
        };
      }

      if (current.path.length > maxDepth) continue;

      const neighbors = await this.getEdgesFrom(current.nodeId);
      for (const edge of neighbors) {
        const neighborId = edge.target_id;
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          const node = await this.getNodeInfo(neighborId);
          if (node) {
            queue.push({
              nodeId: neighborId,
              path: [...current.path, node],
              edges: [...current.edges, edge],
              weight: current.weight + edge.weight,
            });
          }
        }
      }
    }

    return null;
  }

  async findShortestPath(
    startId: string,
    endId: string
  ): Promise<PathResult | null> {
    return this.findPath(startId, endId, 100);
  }

  async detectCycles(): Promise<string[][]> {
    const client = createClient();
    const { data: allEdges, error } = await client.from('graph_edges').select();
    if (error) throw error;
    if (!allEdges) return [];

    const adjacency = new Map<string, string[]>();
    for (const edge of allEdges) {
      if (!adjacency.has(edge.source_id)) {
        adjacency.set(edge.source_id, []);
      }
      adjacency.get(edge.source_id)!.push(edge.target_id);
    }

    const cycles: string[][] = [];
    const allNodes = new Set<string>();
    for (const edge of allEdges) {
      allNodes.add(edge.source_id);
      allNodes.add(edge.target_id);
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();

    const dfs = (node: string, path: string[]) => {
      visiting.add(node);
      path.push(node);

      const neighbors = adjacency.get(node) || [];
      for (const neighbor of neighbors) {
        if (visiting.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart));
          }
        } else if (!visited.has(neighbor)) {
          dfs(neighbor, path);
        }
      }

      path.pop();
      visiting.delete(node);
      visited.add(node);
    };

    for (const node of allNodes) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  async getNodeWithRelations(
    nodeId: string
  ): Promise<{
    node: GraphNodeRow | null;
    outgoing: Array<{ node: GraphNodeRow; edge: GraphEdgeRow }>;
    incoming: Array<{ node: GraphNodeRow; edge: GraphEdgeRow }>;
  }> {
    const client = createClient();

    const { data: node, error: nodeError } = await client
      .from('graph_nodes')
      .select()
      .eq('id', nodeId)
      .single();
    if (nodeError && nodeError.code !== 'PGRST116') throw nodeError;

    const { data: outgoingEdges, error: outError } = await client
      .from('graph_edges')
      .select()
      .eq('source_id', nodeId);
    if (outError) throw outError;

    const { data: incomingEdges, error: inError } = await client
      .from('graph_edges')
      .select()
      .eq('target_id', nodeId);
    if (inError) throw inError;

    const outgoing: Array<{ node: GraphNodeRow; edge: GraphEdgeRow }> = [];
    for (const edge of outgoingEdges || []) {
      const { data: neighbor, error: neighError } = await client
        .from('graph_nodes')
        .select()
        .eq('id', edge.target_id)
        .single();
      if (neighError && neighError.code !== 'PGRST116') throw neighError;
      if (neighbor) outgoing.push({ node: neighbor, edge });
    }

    const incoming: Array<{ node: GraphNodeRow; edge: GraphEdgeRow }> = [];
    for (const edge of incomingEdges || []) {
      const { data: neighbor, error: neighError } = await client
        .from('graph_nodes')
        .select()
        .eq('id', edge.source_id)
        .single();
      if (neighError && neighError.code !== 'PGRST116') throw neighError;
      if (neighbor) incoming.push({ node: neighbor, edge });
    }

    return { node: node || null, outgoing, incoming };
  }

  private async getNodeInfo(id: string): Promise<PathNode | null> {
    const client = createClient();
    const { data, error } = await client
      .from('graph_nodes')
      .select()
      .eq('id', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data ? { id: data.id, label: data.label, node_type: data.node_type } : null;
  }

  private async getEdgesFrom(nodeId: string): Promise<PathEdge[]> {
    const client = createClient();
    const { data, error } = await client
      .from('graph_edges')
      .select()
      .eq('source_id', nodeId);
    if (error) throw error;
    return (data || []).map((e: GraphEdgeRow) => ({
      id: e.id,
      source_id: e.source_id,
      target_id: e.target_id,
      edge_type: e.edge_type,
      weight: e.weight,
    }));
  }
}
