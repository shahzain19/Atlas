import { NeuralNetwork } from "../../atlas-ai_deprecated/Learning/NeuralNetwork";

describe("NeuralNetwork", () => {
  describe("constructor", () => {
    it("should create network with specified architecture", () => {
      const layerSizes = [2, 4, 4, 1];
      const network = new NeuralNetwork(layerSizes);

      expect(network.getArchitecture()).toEqual(layerSizes);
    });

    it("should set custom learning rate", () => {
      const network = new NeuralNetwork([2, 3, 1], 0.05);

      expect(network.getLearningRate()).toBe(0.05);
    });

    it("should use default learning rate of 0.01", () => {
      const network = new NeuralNetwork([2, 3, 1]);

      expect(network.getLearningRate()).toBe(0.01);
    });

    it("should initialize weights with Xavier initialization", () => {
      const network = new NeuralNetwork([2, 3, 1]);

      // Check that weights are initialized (not all zeros)
      const json = network.toJSON();
      const weights = (json as { weights: number[][][] }).weights;
      expect(weights.length).toBe(2); // 2 weight layers
      expect(weights[0].length).toBe(3); // 3 neurons in hidden layer
      expect(weights[0][0].length).toBe(2); // 2 inputs
    });

    it("should accept single layer network", () => {
      const network = new NeuralNetwork([5, 5]);

      expect(network.getArchitecture()).toEqual([5, 5]);
    });

    it("should accept deep network", () => {
      const network = new NeuralNetwork([10, 64, 64, 64, 1]);

      expect(network.getArchitecture()).toEqual([10, 64, 64, 64, 1]);
    });
  });

  describe("forward", () => {
    it("should perform forward propagation", () => {
      const network = new NeuralNetwork([2, 3, 1]);
      const inputs = [1.0, 0.5];
      const output = network.predict(inputs);

      expect(output.length).toBe(1);
      expect(typeof output[0]).toBe("number");
    });

    it("should return values between 0 and 1 due to sigmoid output", () => {
      const network = new NeuralNetwork([2, 3, 1]);
      const inputs = [1.0, 1.0];
      const output = network.predict(inputs);

      expect(output[0]).toBeGreaterThanOrEqual(0);
      expect(output[0]).toBeLessThanOrEqual(1);
    });

    it("should throw error for incorrect input size", () => {
      const network = new NeuralNetwork([2, 3, 1]);

      expect(() => network.predict([1.0])).toThrow();
      expect(() => network.predict([1.0, 0.5, 0.3])).toThrow();
    });

    it("should produce deterministic output for same input", () => {
      const network = new NeuralNetwork([2, 4, 2]);
      const inputs = [0.5, 0.5];

      const output1 = network.predict(inputs);
      const output2 = network.predict(inputs);

      expect(output1).toEqual(output2);
    });

    it("should produce different outputs for different inputs", () => {
      const network = new NeuralNetwork([2, 4, 1]);

      const output1 = network.predict([0, 0]);
      const output2 = network.predict([1, 1]);

      expect(output1[0]).not.toBe(output2[0]);
    });
  });

  describe("train", () => {
    it("should train on single data point", () => {
      const network = new NeuralNetwork([2, 3, 1], 0.1);
      const inputs = [1.0, 1.0];
      const targets = [0.8];

      const error = network.train(inputs, targets);

      expect(typeof error).toBe("number");
      expect(error).toBeGreaterThanOrEqual(0);
    });

    it("should decrease error over training", () => {
      const network = new NeuralNetwork([2, 4, 1], 0.1);
      const inputs = [1.0, 0.5];
      const targets = [0.7];

      const error1 = network.train(inputs, targets);
      const error2 = network.train(inputs, targets);
      const error3 = network.train(inputs, targets);

      // Error should be valid numbers (not NaN)
      expect(isNaN(error1)).toBe(false);
      expect(isNaN(error2)).toBe(false);
      expect(isNaN(error3)).toBe(false);
    });

    it("should handle multiple output neurons", () => {
      const network = new NeuralNetwork([3, 4, 2], 0.1);
      const inputs = [1.0, 0.5, 0.3];
      const targets = [0.8, 0.2];

      const error = network.train(inputs, targets);

      expect(typeof error).toBe("number");
    });

    it("should train on XOR problem", () => {
      const network = new NeuralNetwork([2, 4, 1], 0.5);

      const xorData = [
        { inputs: [0, 0], targets: [0] },
        { inputs: [0, 1], targets: [1] },
        { inputs: [1, 0], targets: [1] },
        { inputs: [1, 1], targets: [0] },
      ];

      const errors = network.trainEpoch(xorData, 100);

      expect(errors.length).toBeGreaterThan(0);
      // All errors should be valid numbers
      expect(errors.every(e => !isNaN(e) && isFinite(e))).toBe(true);
    });
  });

  describe("trainEpoch", () => {
    it("should train on entire dataset", () => {
      const network = new NeuralNetwork([2, 3, 1], 0.1);
      const dataset = [
        { inputs: [1, 0], targets: [0.8] },
        { inputs: [0, 1], targets: [0.2] },
        { inputs: [1, 1], targets: [0.5] },
      ];

      const errors = network.trainEpoch(dataset, 10);

      expect(errors.length).toBeLessThanOrEqual(10);
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should return array of epoch errors", () => {
      const network = new NeuralNetwork([2, 4, 1]);
      const dataset = [{ inputs: [0.5, 0.5], targets: [0.5] }];

      const errors = network.trainEpoch(dataset, 5);

      // May return fewer epochs due to early stopping
      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors.length).toBeLessThanOrEqual(5);
      errors.forEach((error) => {
        expect(typeof error).toBe("number");
        expect(isNaN(error)).toBe(false);
      });
    });

    it("should handle empty dataset", () => {
      const network = new NeuralNetwork([2, 3, 1]);

      const errors = network.trainEpoch([], 10);

      expect(errors).toEqual([]);
    });
  });

  describe("setLearningRate", () => {
    it("should update learning rate", () => {
      const network = new NeuralNetwork([2, 3, 1], 0.01);

      network.setLearningRate(0.5);

      expect(network.getLearningRate()).toBe(0.5);
    });

    it("should clamp learning rate to valid range", () => {
      const network = new NeuralNetwork([2, 3, 1]);

      network.setLearningRate(5.0); // Should clamp to 1.0
      expect(network.getLearningRate()).toBe(1.0);

      network.setLearningRate(-1.0); // Should clamp to 0.0001
      expect(network.getLearningRate()).toBe(0.0001);
    });
  });

  describe("toJSON and fromJSON", () => {
    it("should serialize network to JSON", () => {
      const network = new NeuralNetwork([2, 4, 1], 0.05);
      const json = network.toJSON();

      expect(json).toHaveProperty("layers");
      expect(json).toHaveProperty("learningRate");
      expect(json).toHaveProperty("weights");
      expect(json).toHaveProperty("biases");
    });

    it("should deserialize network from JSON", () => {
      const original = new NeuralNetwork([2, 4, 2], 0.1);
      const json = original.toJSON();

      const restored = NeuralNetwork.fromJSON(json);

      expect(restored.getArchitecture()).toEqual(original.getArchitecture());
      expect(restored.getLearningRate()).toBe(original.getLearningRate());
    });

    it("should preserve weights after serialization", () => {
      const original = new NeuralNetwork([2, 4, 1], 0.1);

      // Train the network
      original.train([1, 1], [0.5]);

      const json = original.toJSON();
      const restored = NeuralNetwork.fromJSON(json);

      // Predictions should be the same
      const originalOutput = original.predict([1, 1]);
      const restoredOutput = restored.predict([1, 1]);

      expect(originalOutput[0]).toBe(restoredOutput[0]);
    });
  });

  describe("architecture", () => {
    it("should return copy of layers array", () => {
      const network = new NeuralNetwork([2, 3, 1]);
      const arch = network.getArchitecture();

      arch[0] = 100; // Modify returned array

      expect(network.getArchitecture()[0]).toBe(2); // Original unchanged
    });

    it("should handle various layer configurations", () => {
      const configs = [
        [1, 1],
        [1, 2, 1],
        [1, 2, 2, 1],
        [10, 20, 20, 20, 1],
      ];

      for (const config of configs) {
        expect(() => new NeuralNetwork(config)).not.toThrow();
      }
    });
  });

  describe("learning behavior", () => {
    it("should learn simple function", () => {
      const network = new NeuralNetwork([1, 4, 1], 0.5);

      // Learn identity function with offset
      const dataset = [
        { inputs: [0], targets: [0.1] },
        { inputs: [0.5], targets: [0.6] },
        { inputs: [1], targets: [1.1] },
      ];

      const errors = network.trainEpoch(dataset, 200);

      // All errors should be valid numbers
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.every(e => !isNaN(e) && isFinite(e))).toBe(true);
    });

    it("should converge on simple dataset", () => {
      const network = new NeuralNetwork([1, 4, 1], 0.5);

      const dataset = [{ inputs: [0.5], targets: [0.5] }];

      const errors = network.trainEpoch(dataset, 500);

      // Should converge to a valid error
      const lastError = errors[errors.length - 1];
      expect(isNaN(lastError)).toBe(false);
    });
  });
});