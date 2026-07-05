/**
 * Perception Pipeline - integrates sensors and processing
 * Part of atlas-perception module
 */
import { CameraSensor, CameraFrame } from "./Camera/CameraSensor";
import { LidarSensor, LidarScan } from "./Lidar/LidarSensor";
import { ObjectDetector, DetectedObject } from "./ObjectDetection/ObjectDetector";

export interface PerceptionState {
  cameraFrame?: CameraFrame;
  lidarScan?: LidarScan;
  detectedObjects: DetectedObject[];
  timestamp: number;
}

export class PerceptionPipeline {
  private camera?: CameraSensor;
  private lidar?: LidarSensor;
  private objectDetector?: ObjectDetector;
  private state: PerceptionState;

  constructor() {
    this.state = {
      detectedObjects: [],
      timestamp: Date.now(),
    };
  }

  attachCamera(camera: CameraSensor): void {
    this.camera = camera;
    this.camera.setFrameCallback(this.processCameraFrame.bind(this));
  }

  attachLidar(lidar: LidarSensor): void {
    this.lidar = lidar;
    this.lidar.setScanCallback(this.processLidarScan.bind(this));
  }

  attachObjectDetector(detector: ObjectDetector): void {
    this.objectDetector = detector;
  }

  private async processCameraFrame(frame: CameraFrame): Promise<void> {
    this.state.cameraFrame = frame;
    if (this.objectDetector) {
      const objects = await this.objectDetector.detect(frame);
      this.state.detectedObjects = objects;
    }
    this.state.timestamp = Date.now();
  }

  private processLidarScan(scan: LidarScan): void {
    this.state.lidarScan = scan;
    this.state.timestamp = Date.now();
  }

  async captureAll(): Promise<PerceptionState> {
    if (this.camera) {
      const frame = this.camera.captureFrame();
      await this.processCameraFrame(frame);
    }
    if (this.lidar) {
      const scan = this.lidar.captureScan();
      this.processLidarScan(scan);
    }
    return this.getState();
  }

  getState(): PerceptionState {
    return { ...this.state };
  }
}
