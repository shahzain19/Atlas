export interface Interaction {
  timestamp: number;
  type: string;
  duration?: number;
}

export interface Human {
  id: string;
  name?: string;
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  confidence: number;
  activity?: string;
  gaze?: { x: number; y: number; z: number };
  lastSeen: number;
  interactionHistory: Interaction[];
}
