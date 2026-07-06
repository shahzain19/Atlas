export interface SceneNode {
  id: string;
  label: string;
  type: string;
  parentId?: string;
  children: string[];
  transform: {
    x: number;
    y: number;
    z: number;
    rotation: number;
    scale: number;
  };
  properties: Record<string, unknown>;
}
