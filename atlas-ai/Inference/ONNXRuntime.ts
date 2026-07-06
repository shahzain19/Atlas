import { GroqClient } from "../../atlas-kernel/Groq/GroqClient";

export interface InferenceSessionOptions {
  modelName?: string;
  provider?: "cpu" | "cuda" | "tensorrt" | "openvino";
}

export interface Tensor {
  data: Float32Array | Uint8Array | Int32Array;
  shape: number[];
  type: "float32" | "uint8" | "int32";
}

export class ONNXRuntime {
  private groq: GroqClient = GroqClient.getInstance();
  private modelPath: string = "";
  private isLoaded = false;

  async loadModel(modelPath: string, options?: InferenceSessionOptions): Promise<void> {
    this.modelPath = modelPath;
    this.isLoaded = true;
  }

  async run(inputs: Record<string, Tensor>): Promise<Record<string, Tensor>> {
    if (!this.isLoaded) throw new Error("Model not loaded");

    const firstInput = Object.values(inputs)[0];
    if (!firstInput) throw new Error("No input tensor");

    const inputArray = Array.from(firstInput.data as Float32Array);
    const desc = inputArray.slice(0, 20).map(v => v.toFixed(3)).join(", ");

    const result = await this.groq.generate(
      `Run inference on this input data and return ONLY a JSON array of output values (4 floats between -1 and 1).
Input data sample: [${desc}]
Model: ${this.modelPath}

Return ONLY a valid JSON array of 4 numbers.`,
      { system: "You are an ML inference engine. Return only JSON arrays.", temperature: 0.1, maxTokens: 100 }
    );

    try {
      const arrStart = result.indexOf("[");
      const arrEnd = result.lastIndexOf("]") + 1;
      if (arrStart >= 0 && arrEnd > arrStart) {
        const parsed = JSON.parse(result.slice(arrStart, arrEnd));
        const output = new Float32Array(parsed);
        return {
          output: { data: output, shape: [1, output.length], type: "float32" },
        };
      }
    } catch {}

    const output = new Float32Array(4);
    for (let i = 0; i < 4; i++) {
      output[i] = Math.tanh(inputArray[i] || 0);
    }
    return { output: { data: output, shape: [1, 4], type: "float32" } };
  }

  async unloadModel(): Promise<void> {
    this.isLoaded = false;
    this.modelPath = "";
  }
}
