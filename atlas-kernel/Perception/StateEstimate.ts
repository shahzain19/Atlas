export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface StateEstimate {
  position: Vector3;
  velocity: Vector3;
  orientation: Quaternion;
  confidence: number; // 0.0 to 1.0
  timestamp: number;
}

export interface Observation {
  source: string;
  type: string;
  data: any;
  uncertainty: number; // Variance or standard deviation
  timestamp: number;
}
