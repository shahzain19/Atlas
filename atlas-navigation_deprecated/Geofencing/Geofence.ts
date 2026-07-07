export enum GeofenceType {
  KEEP_IN = "keep_in",
  KEEP_OUT = "keep_out",
}

export interface Geofence {
  id: string;
  type: GeofenceType;
  polygon: { x: number; y: number }[];
  altitudeMin?: number;
  altitudeMax?: number;
}

export class GeofenceManager {
  private geofences: Map<string, Geofence> = new Map();

  addGeofence(geofence: Geofence): void {
    this.geofences.set(geofence.id, geofence);
  }

  removeGeofence(id: string): void {
    this.geofences.delete(id);
  }

  isPointAllowed(x: number, y: number, z?: number): boolean {
    let allowed = true;

    for (const geofence of this.geofences.values()) {
      const inPolygon = this.pointInPolygon(x, y, geofence.polygon);

      if (geofence.type === GeofenceType.KEEP_IN) {
        if (!inPolygon) allowed = false;
      } else if (geofence.type === GeofenceType.KEEP_OUT) {
        if (inPolygon) allowed = false;
      }

      if (geofence.altitudeMin !== undefined && z !== undefined && z < geofence.altitudeMin) {
        allowed = false;
      }
      if (geofence.altitudeMax !== undefined && z !== undefined && z > geofence.altitudeMax) {
        allowed = false;
      }

      if (!allowed) break;
    }

    return allowed;
  }

  // Ray casting algorithm
  private pointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }
}
