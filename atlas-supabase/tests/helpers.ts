import { EventInput, WorldObjectInput, GraphNodeInput, GraphEdgeInput } from '../src/types';

export function createTestEvent(overrides: Partial<EventInput> = {}): EventInput {
  return {
    type: 'test_event',
    source: 'test',
    payload: { message: 'hello' },
    priority: 0,
    category: 'test',
    importance: 0.5,
    tags: ['test'],
    ...overrides,
  };
}

export function createTestWorldObject(overrides: Partial<WorldObjectInput> = {}): WorldObjectInput {
  return {
    object_type: 'obstacle',
    label: 'Test Object',
    position_x: 0,
    position_y: 0,
    position_z: 0,
    confidence: 1.0,
    metadata: {},
    ...overrides,
  };
}

export function createTestNode(overrides: Partial<GraphNodeInput> = {}): GraphNodeInput {
  return {
    node_type: 'concept',
    label: 'Test Node',
    properties: {},
    ...overrides,
  };
}

export function createTestEdge(
  source_id: string,
  target_id: string,
  overrides: Partial<GraphEdgeInput> = {}
): GraphEdgeInput {
  return {
    source_id,
    target_id,
    edge_type: 'RELATES_TO',
    weight: 1.0,
    properties: {},
    ...overrides,
  };
}
