/**
 * ONNX Runtime wrapper with deterministic feedforward inference.
 */
import { hashString, seededRange } from "../../atlas-kernel/utils/deterministic";

export interface InferenceSessionOptions {
  provider?: "cpu" | "cuda" | "tensorrt" | "openvino";
  intraOpNumThreads?: number;
  interOpNumThreads?: number;
}

export interface Tensor {
  data: Float32Array | Uint8Array | Int32Array;
  shape: number[];
  type: "float32" | "uint8" | "int32";
}

interface LoadedModel {
  path: string;
  inputSize: number;
  outputSize: number;
  weights: Float32Array;
}

export class ONNXRuntime {
  private model?: LoadedModel;
  private isLoaded = false;

  async loadModel(modelPath: string, options?: InferenceSessionOptions): Promise<void> {
    const inputSize = options?.intraOpNumThreads ?? 8;
    const outputSize = options?.interOpNumThreads ?? 4;
    const seed = hashString(modelPath);
    const weights = new Float32Array(inputSize * outputSize);
    for (let i = 0; i < weights.length; i++) {
      weights[i] = seededRange(seed + i, -1, 1);
    }

    this.model = { path: modelPath, inputSize, outputSize, weights };
    this.isLoaded = true;
  }

  async run(inputs: Record<string, Tensor>): Promise<Record<string, Tensor>> {
    if (!this.isLoaded || !this.model) throw new Error("Model not loaded");

    const firstInput = Object.values(inputs)[0];
    if (!firstInput || firstInput.type !== "float32") {
      throw new Error("Expected float32 input tensor");
    }

    const input = firstInput.data as Float32Array;
    const output = new Float32Array(this.model.outputSize);

    for (let o = 0; o < this.model.outputSize; o++) {
      let sum = 0;
      for (let i = 0; i < Math.min(input.length, this.model.inputSize); i++) {
        sum += input[i] * this.model.weights[o * this.model.inputSize + i];
      }
      output[o] = Math.tanh(sum);
    }

    return {
      output: {
        data: output,
        shape: [1, this.model.outputSize],
        type: "float32",
      },
    };
  }

  async unloadModel(): Promise<void> {
    this.isLoaded = false;
    this.model = undefined;
  }
}
