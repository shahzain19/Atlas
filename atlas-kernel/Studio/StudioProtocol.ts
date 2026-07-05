/**
 * Atlas Studio ↔ Runtime WebSocket protocol
 */

export type RuntimeStatus = "idle" | "running" | "error";

export interface StudioAgentInfo {
  name: string;
  status: RuntimeStatus;
}

export interface StudioTaskInfo {
  id: string;
  name: string;
  status: string;
}

export interface StudioMemoryStats {
  shortTerm: number;
  longTerm: number;
  knowledgeGraph: number;
}

export interface StudioWorldObject {
  label: string;
  x: number;
  y: number;
}

export interface StudioWorldState {
  position: { x: number; y: number; z: number };
  confidence: number;
  objects: StudioWorldObject[];
}

export interface StudioSnapshot {
  status: RuntimeStatus;
  agents: StudioAgentInfo[];
  tasks: StudioTaskInfo[];
  memory: StudioMemoryStats;
  world: StudioWorldState;
  logs: string[];
}

export type StudioClientMessage =
  | { type: "ping" }
  | { type: "get_snapshot" }
  | { type: "start_runtime" }
  | { type: "stop_runtime" }
  | { type: "submit_mission"; payload: { name: string } };

export type StudioServerMessage =
  | { type: "pong"; timestamp: number }
  | { type: "snapshot"; payload: StudioSnapshot }
  | { type: "event"; payload: { type: string; message: string; timestamp: number } }
  | { type: "error"; payload: { message: string } };

export const STUDIO_WS_PATH = "/api/ws";
