export interface GridCell {
  x: number;
  y: number;
  occupancy: number;
  confidence: number;
  lastUpdated: number;
}

export interface MapMeta {
  resolution: number;
  width: number;
  height: number;
  origin: { x: number; y: number };
}
