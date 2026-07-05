import { Vector3 } from "./StateEstimate";

export interface MapObject {
  id: string;
  label: string;
  position: Vector3;
  confidence: number;
  lastSeen: number;
}

export interface LocalMap {
  id: string;
  objects: MapObject[];
  resolution: number; // meters per cell
  timestamp: number;
}
