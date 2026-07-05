import { createClient } from '../client';
import { GraphNodeInput, GraphNodeRow, GraphEdgeInput, GraphEdgeRow } from '../types';

export class KnowledgeGraph {
  async addNode(input: GraphNodeInput): Promise<GraphNodeRow> {
    const client = createClient();
    const { data, error } = await client
      .from('graph_nodes')
      .insert({
        node_type: input.node_type,
        label: input.label || null,
        properties: input.properties || {},
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getNode(id: string): Promise<GraphNodeRow | null> {
    const client = createClient();
    const { data, error } = await client
      .from('graph_nodes')
      .select()
      .eq('id', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }

  async removeNode(id: string): Promise<void> {
    const client = createClient();
    const { error } = await client.from('graph_nodes').delete().eq('id', id);
    if (error) throw error;
  }

  async addEdge(input: GraphEdgeInput): Promise<GraphEdgeRow> {
    const client = createClient();
    const { data, error } = await client
      .from('graph_edges')
      .insert({
        source_id: input.source_id,
        target_id: input.target_id,
        edge_type: input.edge_type,
        label: input.label || null,
        weight: input.weight ?? 1.0,
        properties: input.properties || {},
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getEdge(id: string): Promise<GraphEdgeRow | null> {
    const client = createClient();
    const { data, error } = await client
      .from('graph_edges')
      .select()
      .eq('id', id)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }

  async removeEdge(id: string): Promise<void> {
    const client = createClient();
    const { error } = await client.from('graph_edges').delete().eq('id', id);
    if (error) throw error;
  }

  async getNeighbors(nodeId: string): Promise<Array<{ node: GraphNodeRow; edge: GraphEdgeRow }>> {
    const client = createClient();
    const { data: edges, error } = await client
      .from('graph_edges')
      .select()
      .eq('source_id', nodeId);
    if (error) throw error;
    if (!edges) return [];

    const results: Array<{ node: GraphNodeRow; edge: GraphEdgeRow }> = [];
    for (const edge of edges) {
      const { data: node, error: nodeError } = await client
        .from('graph_nodes')
        .select()
        .eq('id', edge.target_id)
        .single();
      if (nodeError && nodeError.code !== 'PGRST116') throw nodeError;
      if (node) {
        results.push({ node, edge });
      }
    }
    return results;
  }

  async getIncomingNeighbors(nodeId: string): Promise<Array<{ node: GraphNodeRow; edge: GraphEdgeRow }>> {
    const client = createClient();
    const { data: edges, error } = await client
      .from('graph_edges')
      .select()
      .eq('target_id', nodeId);
    if (error) throw error;
    if (!edges) return [];

    const results: Array<{ node: GraphNodeRow; edge: GraphEdgeRow }> = [];
    for (const edge of edges) {
      const { data: node, error: nodeError } = await client
        .from('graph_nodes')
        .select()
        .eq('id', edge.source_id)
        .single();
      if (nodeError && nodeError.code !== 'PGRST116') throw nodeError;
      if (node) {
        results.push({ node, edge });
      }
    }
    return results;
  }

  async findNodesByType(type: string): Promise<GraphNodeRow[]> {
    const client = createClient();
    const { data, error } = await client
      .from('graph_nodes')
      .select()
      .eq('node_type', type);
    if (error) throw error;
    return data || [];
  }

  async findEdgesByType(type: string): Promise<GraphEdgeRow[]> {
    const client = createClient();
    const { data, error } = await client
      .from('graph_edges')
      .select()
      .eq('edge_type', type);
    if (error) throw error;
    return data || [];
  }

  async getAllNodes(): Promise<GraphNodeRow[]> {
    const client = createClient();
    const { data, error } = await client.from('graph_nodes').select();
    if (error) throw error;
    return data || [];
  }

  async getAllEdges(): Promise<GraphEdgeRow[]> {
    const client = createClient();
    const { data, error } = await client.from('graph_edges').select();
    if (error) throw error;
    return data || [];
  }
}
