export interface Obstacle {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  size?: { width: number; height: number; depth: number };
  shape: "box" | "sphere" | "cylinder";
  dangerLevel: number;
  lastObserved: number;
  predictedTrajectory?: { x: number; y: number; z: number }[];
  metadata?: Record<string, unknown>;
}
