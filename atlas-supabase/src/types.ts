// DB row types

export interface EventRow {
  id: string;
  type: string;
  source?: string | null;
  payload: Record<string, unknown>;
  priority: number;
  category?: string | null;
  importance: number;
  tags: string[];
  created_at: string;
}

export interface WorldObjectRow {
  id: string;
  object_type: string;
  label?: string | null;
  position_x: number;
  position_y: number;
  position_z: number;
  velocity_x?: number | null;
  velocity_y?: number | null;
  velocity_z?: number | null;
  size_width?: number | null;
  size_height?: number | null;
  size_depth?: number | null;
  confidence: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GraphNodeRow {
  id: string;
  node_type: string;
  label?: string | null;
  properties: Record<string, unknown>;
  created_at: string;
}

export interface GraphEdgeRow {
  id: string;
  source_id: string;
  target_id: string;
  edge_type: string;
  label?: string | null;
  weight: number;
  properties: Record<string, unknown>;
  created_at: string;
}

export interface MemoryEntryRow {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SystemConfigRow {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

// API input types

export interface EventInput {
  type: string;
  source?: string;
  payload?: Record<string, unknown>;
  priority?: number;
  category?: string;
  importance?: number;
  tags?: string[];
}

export interface WorldObjectInput {
  object_type: string;
  label?: string;
  position_x?: number;
  position_y?: number;
  position_z?: number;
  velocity_x?: number;
  velocity_y?: number;
  velocity_z?: number;
  size_width?: number;
  size_height?: number;
  size_depth?: number;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface GraphNodeInput {
  node_type: string;
  label?: string;
  properties?: Record<string, unknown>;
}

export interface GraphEdgeInput {
  source_id: string;
  target_id: string;
  edge_type: string;
  label?: string;
  weight?: number;
  properties?: Record<string, unknown>;
}

export interface MemoryEntryInput {
  content: string;
  metadata?: Record<string, unknown>;
}
