export interface Point2D {
  x: number;
  y: number;
}

export interface SemanticRegion {
  id: string;
  label: string;
  category: string;
  polygon: Point2D[];
  properties: Record<string, unknown>;
  confidence: number;
}
