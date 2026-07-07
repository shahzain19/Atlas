import { NMEAParser } from "../../atlas-hardware_deprecated/Protocol/NMEAParser";

describe("NMEAParser", () => {
  const parser = new NMEAParser();

  it("parses GGA sentences", () => {
    const fix = parser.parseSentence("$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47");
    expect(fix).not.toBeNull();
    expect(fix!.latitude).toBeCloseTo(48.1173, 3);
    expect(fix!.longitude).toBeCloseTo(11.5167, 3);
    expect(fix!.altitude).toBeCloseTo(545.4, 1);
  });

  it("parses RMC sentences with valid status", () => {
    const fix = parser.parseSentence("$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A");
    expect(fix).not.toBeNull();
    expect(fix!.latitude).toBeCloseTo(48.1173, 3);
    expect(fix!.speedKnots).toBeCloseTo(22.4, 1);
  });

  it("ignores invalid sentences", () => {
    expect(parser.parseSentence("not nmea")).toBeNull();
    expect(parser.parseSentence("$GPRMC,123519,V,4807.038,N,01131.000,E,,,,,*47")).toBeNull();
  });

  it("parses chunked input", () => {
    const chunk = "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47\n";
    const fixes = parser.parseChunk(chunk);
    expect(fixes).toHaveLength(1);
  });
});
