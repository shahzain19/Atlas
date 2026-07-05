export interface NMEAFix {
  latitude: number;
  longitude: number;
  altitude?: number;
  speedKnots?: number;
  course?: number;
  fixQuality?: number;
  satellites?: number;
  hdop?: number;
  timestamp: number;
}

export class NMEAParser {
  private buffer = "";

  parseChunk(chunk: string): NMEAFix[] {
    this.buffer += chunk;
    const fixes: NMEAFix[] = [];
    let newlineIndex = this.buffer.indexOf("\n");

    while (newlineIndex >= 0) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);
      const fix = this.parseSentence(line);
      if (fix) fixes.push(fix);
      newlineIndex = this.buffer.indexOf("\n");
    }

    return fixes;
  }

  parseSentence(sentence: string): NMEAFix | null {
    if (!sentence.startsWith("$")) return null;
    const body = sentence.slice(1).split("*")[0];
    const parts = body.split(",");
    const type = parts[0];

    if (type.endsWith("GGA")) return this.parseGGA(parts);
    if (type.endsWith("RMC")) return this.parseRMC(parts);
    return null;
  }

  private parseGGA(parts: string[]): NMEAFix | null {
    const lat = this.parseCoordinate(parts[2], parts[3]);
    const lon = this.parseCoordinate(parts[4], parts[5]);
    if (lat === null || lon === null) return null;

    return {
      latitude: lat,
      longitude: lon,
      altitude: parts[9] ? parseFloat(parts[9]) : undefined,
      fixQuality: parts[6] ? parseInt(parts[6], 10) : undefined,
      satellites: parts[7] ? parseInt(parts[7], 10) : undefined,
      hdop: parts[8] ? parseFloat(parts[8]) : undefined,
      timestamp: Date.now(),
    };
  }

  private parseRMC(parts: string[]): NMEAFix | null {
    const status = parts[2];
    if (status !== "A") return null;

    const lat = this.parseCoordinate(parts[3], parts[4]);
    const lon = this.parseCoordinate(parts[5], parts[6]);
    if (lat === null || lon === null) return null;

    return {
      latitude: lat,
      longitude: lon,
      speedKnots: parts[7] ? parseFloat(parts[7]) : undefined,
      course: parts[8] ? parseFloat(parts[8]) : undefined,
      timestamp: Date.now(),
    };
  }

  private parseCoordinate(value: string | undefined, hemisphere: string | undefined): number | null {
    if (!value || !hemisphere || value.length < 4) return null;

    const dotIndex = value.indexOf(".");
    if (dotIndex < 0) return null;

    const degreesDigits = dotIndex - 2;
    const degrees = parseFloat(value.slice(0, degreesDigits));
    const minutes = parseFloat(value.slice(degreesDigits));
    if (Number.isNaN(degrees) || Number.isNaN(minutes)) return null;

    let decimal = degrees + minutes / 60;
    if (hemisphere === "S" || hemisphere === "W") decimal *= -1;
    return decimal;
  }
}
