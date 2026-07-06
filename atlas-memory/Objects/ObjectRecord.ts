export interface ObjectRecord {
  id: string;
  type: string;
  label?: string;
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  size?: { width: number; height: number; depth: number };
  confidence: number;
  firstSeen: number;
  lastSeen: number;
  observationCount: number;
  metadata?: Record<string, unknown>;
}
