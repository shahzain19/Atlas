import { KnowledgeGraph } from '../../src/knowledge/knowledge_graph';
import { createTestNode, createTestEdge } from '../helpers';
import { resetTables } from '../mock_supabase';

describe('KnowledgeGraph', () => {
  let kg: KnowledgeGraph;

  beforeEach(() => {
    resetTables();
    kg = new KnowledgeGraph();
  });

  describe('nodes', () => {
    it('should add a node', async () => {
      const node = await kg.addNode(createTestNode({ node_type: 'concept', label: 'AI' }));
      expect(node.id).toBeDefined();
      expect(node.node_type).toBe('concept');
      expect(node.label).toBe('AI');
    });

    it('should retrieve a node by id', async () => {
      const added = await kg.addNode(createTestNode());
      const fetched = await kg.getNode(added.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(added.id);
    });

    it('should return null for non-existent node', async () => {
      const fetched = await kg.getNode('00000000-0000-0000-0000-000000000999');
      expect(fetched).toBeNull();
    });

    it('should remove a node', async () => {
      const node = await kg.addNode(createTestNode());
      await kg.removeNode(node.id);
      const fetched = await kg.getNode(node.id);
      expect(fetched).toBeNull();
    });

    it('should find nodes by type', async () => {
      await kg.addNode(createTestNode({ node_type: 'animal', label: 'cat' }));
      await kg.addNode(createTestNode({ node_type: 'animal', label: 'dog' }));
      await kg.addNode(createTestNode({ node_type: 'plant', label: 'tree' }));
      const animals = await kg.findNodesByType('animal');
      expect(animals.length).toBe(2);
    });

    it('should get all nodes', async () => {
      await kg.addNode(createTestNode());
      await kg.addNode(createTestNode());
      const all = await kg.getAllNodes();
      expect(all.length).toBe(2);
    });
  });

  describe('edges', () => {
    it('should add and retrieve edges', async () => {
      const n1 = await kg.addNode(createTestNode());
      const n2 = await kg.addNode(createTestNode());
      const edge = await kg.addEdge(createTestEdge(n1.id, n2.id, { edge_type: 'RELATES_TO', weight: 0.5 }));
      expect(edge.id).toBeDefined();
      expect(edge.source_id).toBe(n1.id);
      expect(edge.target_id).toBe(n2.id);
      expect(edge.weight).toBe(0.5);
    });

    it('should get edge by id', async () => {
      const n1 = await kg.addNode(createTestNode());
      const n2 = await kg.addNode(createTestNode());
      const added = await kg.addEdge(createTestEdge(n1.id, n2.id));
      const fetched = await kg.getEdge(added.id);
      expect(fetched).not.toBeNull();
    });

    it('should remove an edge', async () => {
      const n1 = await kg.addNode(createTestNode());
      const n2 = await kg.addNode(createTestNode());
      const edge = await kg.addEdge(createTestEdge(n1.id, n2.id));
      await kg.removeEdge(edge.id);
      const fetched = await kg.getEdge(edge.id);
      expect(fetched).toBeNull();
    });

    it('should get neighbors', async () => {
      const n1 = await kg.addNode(createTestNode({ label: 'center' }));
      const n2 = await kg.addNode(createTestNode({ label: 'neighbor' }));
      await kg.addEdge(createTestEdge(n1.id, n2.id));
      const neighbors = await kg.getNeighbors(n1.id);
      expect(neighbors.length).toBe(1);
      expect(neighbors[0].node.label).toBe('neighbor');
    });

    it('should find edges by type', async () => {
      const n1 = await kg.addNode(createTestNode());
      const n2 = await kg.addNode(createTestNode());
      const n3 = await kg.addNode(createTestNode());
      await kg.addEdge(createTestEdge(n1.id, n2.id, { edge_type: 'IS_A' }));
      await kg.addEdge(createTestEdge(n2.id, n3.id, { edge_type: 'RELATES_TO' }));
      const isAEdges = await kg.findEdgesByType('IS_A');
      expect(isAEdges.length).toBe(1);
    });

    it('should get all edges', async () => {
      const n1 = await kg.addNode(createTestNode());
      const n2 = await kg.addNode(createTestNode());
      await kg.addEdge(createTestEdge(n1.id, n2.id));
      const all = await kg.getAllEdges();
      expect(all.length).toBe(1);
    });

    it('should get incoming neighbors', async () => {
      const n1 = await kg.addNode(createTestNode({ label: 'source' }));
      const n2 = await kg.addNode(createTestNode({ label: 'target' }));
      await kg.addEdge(createTestEdge(n1.id, n2.id));
      const incoming = await kg.getIncomingNeighbors(n2.id);
      expect(incoming.length).toBe(1);
      expect(incoming[0].node.label).toBe('source');
    });
  });
});
