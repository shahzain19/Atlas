export type EntityID = string;

export interface Entity {
  id: EntityID;
  type: string;
  name?: string;

  state: Record<string, any>;

  update?(dt: number): void;
}