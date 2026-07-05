import { ONNXRuntime, Tensor } from "../../atlas-ai/Inference/ONNXRuntime";

describe("ONNXRuntime", () => {
  let onnx: ONNXRuntime;

  beforeEach(() => {
    onnx = new ONNXRuntime();
  });

  it("should initialize without errors", () => {
    expect(onnx).toBeDefined();
  });

  it("should load a model", async () => {
    await onnx.loadModel("dummy-model.onnx");
  });

  it("should run inference", async () => {
    await onnx.loadModel("dummy-model.onnx");
    const inputs: Record<string, Tensor> = {
      input: {
        data: new Float32Array([0.1, 0.2, 0.3]),
        shape: [1, 3],
        type: "float32",
      },
    };
    const outputs = await onnx.run(inputs);
    expect(outputs.output).toBeDefined();
    expect(outputs.output.data).toBeInstanceOf(Float32Array);
  });

  it("should unload model", async () => {
    await onnx.loadModel("dummy-model.onnx");
    await onnx.unloadModel();
  });
});
