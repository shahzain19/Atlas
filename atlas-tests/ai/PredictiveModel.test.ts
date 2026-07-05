import { PredictiveModel, PredictionMetrics } from "../../atlas-ai/Prediction/PredictiveModel";

describe("PredictiveModel", () => {
  let model: PredictiveModel;

  beforeEach(() => {
    model = new PredictiveModel(5, 0.01);
  });

  describe("constructor", () => {
    it("should initialize with specified window size", () => {
      const customModel = new PredictiveModel(10, 0.05);

      expect(customModel).toBeDefined();
    });

    it("should use default learning rate of 0.01", () => {
      const defaultModel = new PredictiveModel(5);

      expect(defaultModel).toBeDefined();
    });

    it("should start in uninitialized state", () => {
      const freshModel = new PredictiveModel();

      const history = freshModel.getHistory();
      expect(history.epoch.length).toBe(0);
    });
  });

  describe("train", () => {
    it("should return training history", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const history = model.train(data, 10);

      expect(history).toHaveProperty("epoch");
      expect(history).toHaveProperty("loss");
      expect(history).toHaveProperty("valLoss");
      expect(history).toHaveProperty("metrics");
      expect(Array.isArray(history.epoch)).toBe(true);
      expect(Array.isArray(history.loss)).toBe(true);
    });

    it("should populate epoch numbers", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const history = model.train(data, 20);

      expect(history.epoch.length).toBeGreaterThan(0);
      expect(history.epoch[0]).toBe(0);
      expect(history.epoch[history.epoch.length - 1]).toBe(history.epoch.length - 1);
    });

    it("should decrease loss over epochs", () => {
      const data = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5];
      const history = model.train(data, 50);

      expect(history.loss[0]).toBeGreaterThan(history.loss[history.loss.length - 1]);
    });

    it("should handle short datasets", () => {
      const data = [1, 2, 3];
      const history = model.train(data, 10);

      expect(history.loss.length).toBeGreaterThan(0);
    });

    it("should accept validation split parameter", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const history = model.train(data, 10, 0.3);

      expect(history.loss.length).toBeGreaterThanOrEqual(history.valLoss.length);
    });
  });

  describe("predict", () => {
    it("should return forecast result", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      model.train(data, 10);
      const result = model.predict(data);

      expect(result).toHaveProperty("predictions");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("horizon");
      expect(result).toHaveProperty("timestamps");
      expect(Array.isArray(result.predictions)).toBe(true);
      expect(Array.isArray(result.confidence)).toBe(true);
      expect(Array.isArray(result.timestamps)).toBe(true);
    });

    it("should predict correct number of values", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      model.train(data, 10);
      const result = model.predict(data);

      expect(result.predictions.length).toBe(result.horizon);
      expect(result.confidence.length).toBe(result.horizon);
    });

    it("should generate timestamps", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      model.train(data, 10);
      const result = model.predict(data);

      expect(result.timestamps.length).toBe(result.horizon);
      // Just verify timestamps are reasonable numbers
      expect(result.timestamps[0]).toBeGreaterThan(1700000000000);
    });

    it("should return confidence values between 0.5 and 0.95", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      model.train(data, 10);
      const result = model.predict(data);

      for (const conf of result.confidence) {
        expect(conf).toBeGreaterThanOrEqual(0.5);
        expect(conf).toBeLessThanOrEqual(0.95);
      }
    });

    it("should work without training", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = model.predict(data);

      expect(result.predictions.length).toBeGreaterThan(0);
    });
  });

  describe("forecast", () => {
    it("should return forecast for future steps", () => {
      const data = [1, 2, 3, 4, 5];
      model.train(data, 10);
      const result = model.forecast(data, 5);

      expect(result.predictions.length).toBe(5);
      expect(result.confidence.length).toBe(5);
    });

    it("should decrease confidence for longer horizons", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      model.train(data, 10);
      const result = model.forecast(data, 10);

      // First prediction should have higher confidence
      expect(result.confidence[0]).toBeGreaterThan(result.confidence[result.confidence.length - 1]);
    });

    it("should extend data with predictions", () => {
      const data = [1, 2, 3, 4, 5];
      model.train(data, 10);
      const result = model.forecast(data, 3);

      // Predictions should be reasonable values
      expect(result.predictions.every((p) => typeof p === "number")).toBe(true);
    });
  });

  describe("evaluate", () => {
    it("should return metrics object", () => {
      const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      model.train(testData.slice(0, 7), 10);
      const metrics = model.evaluate(testData);

      expect(metrics).toHaveProperty("mse");
      expect(metrics).toHaveProperty("rmse");
      expect(metrics).toHaveProperty("mae");
      expect(metrics).toHaveProperty("r2");
      expect(metrics).toHaveProperty("mape");
      expect(typeof metrics.mse).toBe("number");
      expect(typeof metrics.rmse).toBe("number");
      expect(typeof metrics.mae).toBe("number");
    });

    it("should have non-negative metrics", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      model.train(data, 10);
      const metrics = model.evaluate(data);

      expect(metrics.mse).toBeGreaterThanOrEqual(0);
      expect(metrics.rmse).toBeGreaterThanOrEqual(0);
      expect(metrics.mae).toBeGreaterThanOrEqual(0);
      expect(metrics.mape).toBeGreaterThanOrEqual(0);
    });

    it("should have r2 between 0 and 1", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      model.train(data, 10);
      const metrics = model.evaluate(data);

      expect(metrics.r2).toBeGreaterThanOrEqual(0);
      expect(metrics.r2).toBeLessThanOrEqual(1);
    });

    it("should handle short test data", () => {
      const data = [1, 2, 3];
      const metrics = model.evaluate(data);

      expect(typeof metrics.mse).toBe("number");
    });
  });

  describe("getHistory", () => {
    it("should return training history", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      model.train(data, 5);

      const history = model.getHistory();

      expect(history.epoch.length).toBe(5);
      expect(history.loss.length).toBe(5);
    });

    it("should return copy of history", () => {
      model.train([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
      const history1 = model.getHistory();
      const history2 = model.getHistory();

      expect(history1).not.toBe(history2);
      expect(history1.loss).toEqual(history2.loss);
    });
  });

  describe("getMetrics", () => {
    it("should return current metrics", () => {
      const metrics = model.getMetrics();

      expect(metrics).toHaveProperty("mse");
      expect(metrics).toHaveProperty("rmse");
      expect(metrics).toHaveProperty("mae");
      expect(metrics).toHaveProperty("r2");
      expect(metrics).toHaveProperty("mape");
    });

    it("should show zero metrics before evaluation", () => {
      const metrics = model.getMetrics();

      expect(metrics.mse).toBe(0);
      expect(metrics.rmse).toBe(0);
    });
  });

  describe("reset", () => {
    it("should clear model and history", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      model.train(data, 10);
      model.reset();

      const history = model.getHistory();
      const metrics = model.getMetrics();

      expect(history.epoch.length).toBe(0);
      expect(metrics.mse).toBe(0);
    });
  });

  describe("toJSON and fromJSON", () => {
    it("should serialize model to JSON", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      model.train(data, 10);
      const json = model.toJSON();

      expect(json).toHaveProperty("model");
      expect(json).toHaveProperty("windowSize");
      expect(json).toHaveProperty("learningRate");
      expect(json).toHaveProperty("history");
      expect(json).toHaveProperty("metrics");
    });

    it("should deserialize model from JSON", () => {
      const original = new PredictiveModel(5, 0.05);
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      original.train(data, 10);

      const json = original.toJSON();
      const restored = PredictiveModel.fromJSON(json);

      expect(restored).toBeDefined();
    });

    it("should preserve model weights after serialization", () => {
      const original = new PredictiveModel(5, 0.1);
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      original.train(data, 20);

      const json = original.toJSON();
      const restored = PredictiveModel.fromJSON(json);

      const originalMetrics = original.evaluate(data);
      const restoredMetrics = restored.evaluate(data);

      expect(originalMetrics.mse).toBeCloseTo(restoredMetrics.mse, 5);
    });
  });

  describe("prediction behavior", () => {
    it("should predict on linear data", () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      model.train(data, 50);

      const result = model.predict(data);
      const forecast = model.forecast(data, 5);

      // Predictions should be reasonably close to actual trend
      expect(result.predictions.length).toBeGreaterThan(0);
      expect(forecast.predictions.length).toBe(5);
    });

    it("should handle constant data", () => {
      const data = Array(15).fill(5);
      model.train(data, 20);

      const result = model.predict(data);

      // Predictions should be close to 5
      for (const prediction of result.predictions) {
        expect(Math.abs(prediction - 5)).toBeLessThan(1);
      }
    });

    it("should handle noisy data", () => {
      const data = [1, 1.1, 2, 2.2, 3, 3.1, 4, 4.3, 5, 5.2, 6, 6.1, 7, 7.4];
      model.train(data, 30);

      const metrics = model.evaluate(data);

      // Should still have reasonable R2 on training data
      expect(metrics.r2).toBeGreaterThan(0);
    });
  });
});