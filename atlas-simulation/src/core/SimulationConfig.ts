export interface SimulationConfig {
  speed: number;
  paused: boolean;
  gravity: number;
  groundLevel: number;
  fogNear: number;
  fogFar: number;
  obstacleCount: number;
  waypointCount: number;
  lidarRayCount: number;
  lidarRange: number;
  radarRange: number;
  radarAngle: number;
  trailLength: number;
}

export const DEFAULT_CONFIG: SimulationConfig = {
  speed: 1.0,
  paused: false,
  gravity: -9.81,
  groundLevel: 0,
  fogNear: 30,
  fogFar: 100,
  obstacleCount: 15,
  waypointCount: 5,
  lidarRayCount: 64,
  lidarRange: 15,
  radarRange: 20,
  radarAngle: Math.PI / 6,
  trailLength: 100,
};
