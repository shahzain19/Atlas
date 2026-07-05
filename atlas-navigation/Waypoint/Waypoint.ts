import { Vector3 } from "../../atlas-kernel/Perception/StateEstimate";

export interface Waypoint {
  id: string;
  position: Vector3;
  label?: string;
  tolerance?: number; // metres — how close is "arrived"
}

export type WaypointStatus = "pending" | "active" | "reached" | "skipped";

export interface WaypointEntry {
  waypoint: Waypoint;
  status: WaypointStatus;
}
