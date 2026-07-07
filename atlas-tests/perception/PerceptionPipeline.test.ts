import { PerceptionPipeline } from "../../atlas-perception_deprecated/PerceptionPipeline";
import { CameraSensor } from "../../atlas-perception_deprecated/Camera/CameraSensor";
import { LidarSensor } from "../../atlas-perception_deprecated/Lidar/LidarSensor";
import { ObjectDetector } from "../../atlas-perception_deprecated/ObjectDetection/ObjectDetector";

describe("PerceptionPipeline", () => {
  let pipeline: PerceptionPipeline;

  beforeEach(() => {
    pipeline = new PerceptionPipeline();
  });

  it("should initialize with empty state", () => {
    const state = pipeline.getState();
    expect(state.detectedObjects.length).toBe(0);
  });

  it("should attach sensors and detector", async () => {
    const camera = new CameraSensor();
    const lidar = new LidarSensor();
    const detector = new ObjectDetector();

    pipeline.attachCamera(camera);
    pipeline.attachLidar(lidar);
    pipeline.attachObjectDetector(detector);

    const state = await pipeline.captureAll();
    expect(state.cameraFrame).not.toBeUndefined();
    expect(state.lidarScan).not.toBeUndefined();
    expect(state.detectedObjects.length).toBeGreaterThan(0);
  });
});
