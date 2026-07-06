export { SemanticRegion, Point2D } from "./SemanticRegion";
import { SemanticRegion, Point2D } from "./SemanticRegion";
import { uuidv4 } from "../../atlas-kernel/utils/uuid";

export class SemanticMap {
  private regions: Map<string, SemanticRegion> = new Map();

  addRegion(region: Omit<SemanticRegion, "id">): SemanticRegion {
    const newRegion: SemanticRegion = { ...region, id: uuidv4() };
    this.regions.set(newRegion.id, newRegion);
    return newRegion;
  }

  removeRegion(id: string): boolean {
    return this.regions.delete(id);
  }

  getRegion(id: string): SemanticRegion | undefined {
    return this.regions.get(id);
  }

  getAllRegions(): SemanticRegion[] {
    return Array.from(this.regions.values());
  }

  containsPoint(x: number, y: number): SemanticRegion[] {
    return this.getAllRegions().filter((r) =>
      this.pointInPolygon(x, y, r.polygon)
    );
  }

  findRegionsByCategory(category: string): SemanticRegion[] {
    return this.getAllRegions().filter((r) => r.category === category);
  }

  updateRegionProperties(
    id: string,
    properties: Record<string, unknown>
  ): SemanticRegion | undefined {
    const region = this.regions.get(id);
    if (!region) return undefined;
    region.properties = { ...region.properties, ...properties };
    return region;
  }

  private pointInPolygon(x: number, y: number, polygon: Point2D[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }
}
