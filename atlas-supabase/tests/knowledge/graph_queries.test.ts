import { KnowledgeGraph } from '../../src/knowledge/knowledge_graph';
import { GraphQueries } from '../../src/knowledge/graph_queries';
import { createTestNode, createTestEdge } from '../helpers';
import { resetTables } from '../mock_supabase';

describe('GraphQueries', () => {
  let kg: KnowledgeGraph;
  let gq: GraphQueries;

  beforeEach(() => {
    resetTables();
    kg = new KnowledgeGraph();
    gq = new GraphQueries();
  });

  describe('findPath', () => {
    it('should find a direct path between connected nodes', async () => {
      const n1 = await kg.addNode(createTestNode({ label: 'A' }));
      const n2 = await kg.addNode(createTestNode({ label: 'B' }));
      await kg.addEdge(createTestEdge(n1.id, n2.id));

      const path = await gq.findPath(n1.id, n2.id);
      expect(path).not.toBeNull();
      expect(path!.nodes.length).toBe(2);
      expect(path!.edges.length).toBe(1);
    });

    it('should return null for disconnected nodes', async () => {
      const n1 = await kg.addNode(createTestNode({ label: 'A' }));
      const n2 = await kg.addNode(createTestNode({ label: 'B' }));
      const path = await gq.findPath(n1.id, n2.id, 5);
      expect(path).toBeNull();
    });

    it('should return a single-node path when start equals end', async () => {
      const n1 = await kg.addNode(createTestNode({ label: 'self' }));
      const path = await gq.findPath(n1.id, n1.id);
      expect(path).not.toBeNull();
      expect(path!.nodes.length).toBe(1);
      expect(path!.edges.length).toBe(0);
    });

    it('should find a multi-hop path', async () => {
      const n1 = await kg.addNode(createTestNode({ label: 'A' }));
      const n2 = await kg.addNode(createTestNode({ label: 'B' }));
      const n3 = await kg.addNode(createTestNode({ label: 'C' }));
      await kg.addEdge(createTestEdge(n1.id, n2.id));
      await kg.addEdge(createTestEdge(n2.id, n3.id));

      const path = await gq.findPath(n1.id, n3.id);
      expect(path).not.toBeNull();
      expect(path!.nodes.length).toBe(3);
      expect(path!.edges.length).toBe(2);
    });
  });

  describe('detectCycles', () => {
    it('should detect a cycle', async () => {
      const n1 = await kg.addNode(createTestNode());
      const n2 = await kg.addNode(createTestNode());
      const n3 = await kg.addNode(createTestNode());
      await kg.addEdge(createTestEdge(n1.id, n2.id));
      await kg.addEdge(createTestEdge(n2.id, n3.id));
      await kg.addEdge(createTestEdge(n3.id, n1.id));

      const cycles = await gq.detectCycles();
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should return empty array for acyclic graph', async () => {
      const n1 = await kg.addNode(createTestNode());
      const n2 = await kg.addNode(createTestNode());
      const n3 = await kg.addNode(createTestNode());
      await kg.addEdge(createTestEdge(n1.id, n2.id));
      await kg.addEdge(createTestEdge(n2.id, n3.id));

      const cycles = await gq.detectCycles();
      expect(cycles.length).toBe(0);
    });
  });

  describe('getNodeWithRelations', () => {
    it('should return node with outgoing and incoming relations', async () => {
      const center = await kg.addNode(createTestNode({ label: 'center' }));
      const out = await kg.addNode(createTestNode({ label: 'outgoing' }));
      const inc = await kg.addNode(createTestNode({ label: 'incoming' }));
      await kg.addEdge(createTestEdge(center.id, out.id));
      await kg.addEdge(createTestEdge(inc.id, center.id));

      const relations = await gq.getNodeWithRelations(center.id);
      expect(relations.node).not.toBeNull();
      expect(relations.outgoing.length).toBe(1);
      expect(relations.outgoing[0].node.label).toBe('outgoing');
      expect(relations.incoming.length).toBe(1);
      expect(relations.incoming[0].node.label).toBe('incoming');
    });
  });
});
