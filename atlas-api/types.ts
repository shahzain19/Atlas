export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export type NavigateTarget = Position | GeoPosition;

export interface ScanResult {
  objects: Array<{
    label: string;
    confidence: number;
    position: Position;
  }>;
  timestamp: number;
}

export interface RobotStatus {
  position: Position;
  battery: number;
  speed: number;
  mode: "idle" | "navigating" | "scanning" | "returning" | "error";
  taskCount: number;
}

export interface DroneStatus {
  position: Position;
  battery: number;
  altitude: number;
  mode: "grounded" | "taking_off" | "flying" | "landing" | "returning" | "error";
  speed: number;
}

export interface FleetMember {
  id: string;
  type: "robot" | "drone";
  status: RobotStatus | DroneStatus;
  lastSeen: number;
}

export interface FleetStatus {
  members: FleetMember[];
  healthy: number;
  total: number;
  missionActive: boolean;
}

export interface MissionDefinition {
  name: string;
  description?: string;
  goals: GoalDefinition[];
}

export interface GoalDefinition {
  description: string;
  priority?: number;
}

export type AtlasEventType =
  | "TICK"
  | "GPS_UPDATE"
  | "OBJECT_DETECTED"
  | "IMAGE_CAPTURED"
  | "TASK_REQUEST"
  | "TASK_FAILURE"
  | "DRONE_TAKEOFF"
  | "DRONE_LAND"
  | "DRONE_FLY_TO"
  | "ROBOT_NAVIGATE"
  | "ROBOT_SCAN"
  | "MISSION_COMPLETED"
  | "BATTERY_LOW"
  | "WAYPOINT_REACHED"
  | "ERROR";

export interface AtlasEvent {
  type: AtlasEventType;
  timestamp: number;
  payload?: Record<string, unknown>;
  source?: string;
}
