export interface GraphNode {
  id: string;
  type: string;
  label?: string;
  properties: Record<string, unknown>;
}
