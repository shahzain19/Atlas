export { GridCell, MapMeta } from "./GridMapTypes";
import { GridCell, MapMeta } from "./GridMapTypes";

export class GridMap {
  private grid: GridCell[][] = [];
  private meta: MapMeta;

  constructor(resolution: number, width: number, height: number, origin: { x: number; y: number } = { x: 0, y: 0 }) {
    this.meta = { resolution, width, height, origin };
    this.initializeGrid();
  }

  private initializeGrid(): void {
    this.grid = [];
    for (let i = 0; i < this.meta.height; i++) {
      const row: GridCell[] = [];
      for (let j = 0; j < this.meta.width; j++) {
        row.push({
          x: j,
          y: i,
          occupancy: 0,
          confidence: 0,
          lastUpdated: Date.now(),
        });
      }
      this.grid.push(row);
    }
  }

  updateCell(gridX: number, gridY: number, occupancy: number, confidence: number = 1): void {
    if (!this.isValidCell(gridX, gridY)) return;
    this.grid[gridY][gridX] = {
      ...this.grid[gridY][gridX],
      occupancy: Math.max(0, Math.min(1, occupancy)),
      confidence,
      lastUpdated: Date.now(),
    };
  }

  getCell(gridX: number, gridY: number): GridCell | undefined {
    if (!this.isValidCell(gridX, gridY)) return undefined;
    return { ...this.grid[gridY][gridX] };
  }

  worldToGrid(worldX: number, worldY: number): { gridX: number; gridY: number } {
    return {
      gridX: Math.floor((worldX - this.meta.origin.x) / this.meta.resolution),
      gridY: Math.floor((worldY - this.meta.origin.y) / this.meta.resolution),
    };
  }

  gridToWorld(gridX: number, gridY: number): { worldX: number; worldY: number } {
    return {
      worldX: gridX * this.meta.resolution + this.meta.origin.x + this.meta.resolution / 2,
      worldY: gridY * this.meta.resolution + this.meta.origin.y + this.meta.resolution / 2,
    };
  }

  markObstacle(gridX: number, gridY: number): void {
    this.updateCell(gridX, gridY, 1, 1);
  }

  markFree(gridX: number, gridY: number): void {
    this.updateCell(gridX, gridY, 0, 1);
  }

  getOccupancyAround(centerX: number, centerY: number, radius: number): GridCell[] {
    const cells: GridCell[] = [];
    const center = this.worldToGrid(centerX, centerY);
    const gridRadius = Math.ceil(radius / this.meta.resolution);

    for (let dy = -gridRadius; dy <= gridRadius; dy++) {
      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        const gx = center.gridX + dx;
        const gy = center.gridY + dy;
        if (this.isValidCell(gx, gy)) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= gridRadius) {
            cells.push({ ...this.grid[gy][gx] });
          }
        }
      }
    }
    return cells;
  }

  getTraversableCells(threshold: number = 0.5): GridCell[] {
    const cells: GridCell[] = [];
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.occupancy < threshold) {
          cells.push({ ...cell });
        }
      }
    }
    return cells;
  }

  generateCostMap(): number[][] {
    const h = this.meta.height;
    const w = this.meta.width;
    const cost: number[][] = Array.from({ length: h }, () => new Array(w).fill(Infinity));
    const queue: { x: number; y: number; dist: number }[] = [];

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (this.grid[y][x].occupancy >= 1) {
          cost[y][x] = 0;
          queue.push({ x, y, dist: 0 });
        }
      }
    }

    const dirs = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
    ];

    let front = 0;
    while (front < queue.length) {
      const { x, y, dist } = queue[front++];
      for (const { dx, dy } of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.isValidCell(nx, ny) && cost[ny][nx] > dist + 1) {
          cost[ny][nx] = dist + 1;
          queue.push({ x: nx, y: ny, dist: dist + 1 });
        }
      }
    }

    return cost;
  }

  getMeta(): MapMeta {
    return { ...this.meta };
  }

  reset(): void {
    this.initializeGrid();
  }

  private isValidCell(x: number, y: number): boolean {
    return x >= 0 && x < this.meta.width && y >= 0 && y < this.meta.height;
  }
}
