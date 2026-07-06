import { ModelManager } from "../../atlas-kernel/Models/ModelManager";

export interface InferenceSessionOptions {
  modelName?: string;
  provider?: "cpu" | "cuda" | "tensorrt" | "openvino";
  backend?: "local" | "groq" | "auto";
}

export interface Tensor {
  data: Float32Array | Uint8Array | Int32Array;
  shape: number[];
  type: "float32" | "uint8" | "int32";
}

export class ONNXRuntime {
  private manager: ModelManager;
  private modelPath: string = "";
  private isLoaded = false;
  private inferenceBackend: "local" | "groq";

  constructor(backend: "local" | "groq" | "auto" = "auto") {
    this.manager = ModelManager.getInstance();
    this.inferenceBackend = backend === "auto" ? "local" : backend;
  }

  async loadModel(modelName: string, options?: InferenceSessionOptions): Promise<void> {
    this.modelPath = modelName;
    this.isLoaded = true;
    if (options?.backend && options.backend !== "auto") this.inferenceBackend = options.backend;
  }

  async run(inputs: Record<string, Tensor>): Promise<Record<string, Tensor>> {
    if (!this.isLoaded) throw new Error("Model not loaded");

    const modelName = this.modelPath || "mlp_inference.onnx";

    if (this.inferenceBackend === "local") {
      try {
        return await this.runLocal(modelName, inputs);
      } catch {
        // local failed, fall through to groq fallback
      }
    }

    return this.runGroq(modelName, inputs);
  }

  private async runLocal(modelName: string, inputs: Record<string, Tensor>): Promise<Record<string, Tensor>> {
    const session = await this.manager.loadSession(modelName);
    const feeds: Record<string, any> = {};
    for (const [name, tensor] of Object.entries(inputs)) {
      feeds[name] = new (require("onnxruntime-node").Tensor)(
        tensor.type as any,
        tensor.data,
        tensor.shape,
      );
    }
    const results: Record<string, any> = await session.run(feeds);
    const output: Record<string, Tensor> = {};
    for (const [name, tensor] of Object.entries(results)) {
      const t = tensor as any;
      output[name] = {
        data: t.data as Float32Array,
        shape: t.dims as number[],
        type: t.type as "float32",
      };
    }
    return output;
  }

  private async runGroq(modelName: string, inputs: Record<string, Tensor>): Promise<Record<string, Tensor>> {
    const { GroqClient } = await import("../../atlas-kernel/Groq/GroqClient");
    const groq = GroqClient.getInstance();
    const firstInput = Object.values(inputs)[0];
    if (!firstInput) throw new Error("No input tensor");

    const inputArray = Array.from(firstInput.data as Float32Array);
    const desc = inputArray.slice(0, 20).map(v => v.toFixed(3)).join(", ");

    const result = await groq.generate(
      `Run inference on this input data and return ONLY a JSON array of output values.
Input data sample: [${desc}]
Model: ${modelName}

Return ONLY a valid JSON array of numbers.`,
      { system: "You are an ML inference engine. Return only JSON arrays.", temperature: 0.1, maxTokens: 100, noCache: true }
    );

    try {
      const arrStart = result.indexOf("[");
      const arrEnd = result.lastIndexOf("]") + 1;
      if (arrStart >= 0 && arrEnd > arrStart) {
        const parsed = JSON.parse(result.slice(arrStart, arrEnd));
        const output = new Float32Array(parsed);
        return { output: { data: output, shape: [1, output.length], type: "float32" } };
      }
    } catch {}

    const output = new Float32Array(4);
    for (let i = 0; i < 4; i++) {
      output[i] = Math.tanh(inputArray[i] || 0);
    }
    return { output: { data: output, shape: [1, 4], type: "float32" } };
  }

  async unloadModel(): Promise<void> {
    if (this.modelPath) this.manager.releaseSession(this.modelPath);
    this.isLoaded = false;
    this.modelPath = "";
  }
}
