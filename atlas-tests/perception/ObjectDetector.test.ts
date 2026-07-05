import { ObjectDetector } from "../../atlas-perception/ObjectDetection/ObjectDetector";
import { CameraSensor } from "../../atlas-perception/Camera/CameraSensor";

describe("ObjectDetector", () => {
  let detector: ObjectDetector;

  beforeEach(() => {
    detector = new ObjectDetector();
  });

  it("should initialize with default config", () => {
    const config = detector.getConfig();
    expect(config.confidenceThreshold).toBe(0.5);
  });

  it("should detect objects in a frame", async () => {
    const camera = new CameraSensor();
    const frame = camera.captureFrame();
    const detections = await detector.detect(frame);
    expect(detections.length).toBeGreaterThan(0);
    expect(detections[0]).toHaveProperty("label");
    expect(detections[0]).toHaveProperty("confidence");
  });
});
