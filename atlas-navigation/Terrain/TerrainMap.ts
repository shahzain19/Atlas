export interface TerrainCell {
  x: number;
  y: number;
  elevation: number; // meters
  roughness: number; // 0 (smooth) to 1 (rough)
  passable: boolean;
}

export class TerrainMap {
  private cells: Map<string, TerrainCell> = new Map();
  private cellSize: number;

  constructor(cellSize: number = 1.0) {
    this.cellSize = cellSize;
  }

  private getKey(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  setCell(x: number, y: number, cell: Omit<TerrainCell, "x" | "y">): void {
    this.cells.set(this.getKey(x, y), { ...cell, x, y });
  }

  getCell(x: number, y: number): TerrainCell | undefined {
    return this.cells.get(this.getKey(x, y));
  }

  getElevation(x: number, y: number): number {
    const cell = this.getCell(x, y);
    return cell?.elevation ?? 0;
  }

  isPassable(x: number, y: number): boolean {
    const cell = this.getCell(x, y);
    return cell?.passable ?? true;
  }
}
