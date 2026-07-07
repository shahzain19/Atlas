import { CameraSensor } from "../../atlas-perception_deprecated/Camera/CameraSensor";

describe("CameraSensor", () => {
  let camera: CameraSensor;

  beforeEach(() => {
    camera = new CameraSensor();
  });

  it("should initialize with default config", () => {
    const config = camera.getConfig();
    expect(config.width).toBe(640);
    expect(config.height).toBe(480);
    expect(config.fps).toBe(30);
  });

  it("should initialize with custom config", () => {
    const customCamera = new CameraSensor({ width: 1280, height: 720, fps: 60 });
    const config = customCamera.getConfig();
    expect(config.width).toBe(1280);
    expect(config.height).toBe(720);
    expect(config.fps).toBe(60);
  });

  it("should capture a frame", () => {
    const frame = camera.captureFrame();
    expect(frame.width).toBe(640);
    expect(frame.height).toBe(480);
    expect(frame.channels).toBe(3);
    expect(frame.data).toBeInstanceOf(Uint8Array);
  });

  it("should allow updating config", () => {
    camera.updateConfig({ fps: 15 });
    expect(camera.getConfig().fps).toBe(15);
  });

  it("should call frame callback when set", () => {
    const callback = jest.fn();
    camera.setFrameCallback(callback);
    camera.captureFrame();
    expect(callback).toHaveBeenCalled();
  });
});
