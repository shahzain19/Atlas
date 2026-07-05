export interface WorldPosition {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface WorldObject {
  id: string;
  type: string;
  label?: string;
  position: WorldPosition;
  velocity?: { x: number; y: number; z: number };
  size?: { width: number; height: number; depth: number };
  confidence: number;
  lastSeen: number;
  metadata?: Record<string, unknown>;
}
