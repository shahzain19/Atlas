/**
 * PredictiveModel - Time series forecasting and prediction model
 * Supports training, prediction, and evaluation metrics
 */

export interface PredictionMetrics {
  mse: number;
  rmse: number;
  mae: number;
  r2: number;
  mape: number;
}

export interface TrainingHistory {
  epoch: number[];
  loss: number[];
  valLoss: number[];
  metrics: PredictionMetrics[];
}

export interface ForecastResult {
  predictions: number[];
  confidence: number[];
  horizon: number;
  timestamps: number[];
}

/**
 * PredictiveModel - Forecasting model for time series and general prediction
 */
export class PredictiveModel {
  private model: number[];
  private history: TrainingHistory;
  private metrics: PredictionMetrics;
  private windowSize: number;
  private learningRate: number;
  private initialized: boolean;

  constructor(windowSize: number = 5, learningRate: number = 0.01) {
    this.model = [];
    this.history = {
      epoch: [],
      loss: [],
      valLoss: [],
      metrics: [],
    };
    this.metrics = {
      mse: 0,
      rmse: 0,
      mae: 0,
      r2: 0,
      mape: 0,
    };
    this.windowSize = windowSize;
    this.learningRate = learningRate;
    this.initialized = false;
  }

  /**
   * Trains the model on historical data
   */
  train(
    data: number[],
    epochs: number = 100,
    validationSplit: number = 0.2
  ): TrainingHistory {
    // Initialize model weights if not done
    if (!this.initialized || this.model.length === 0) {
      this.initializeModel(data);
    }

    const trainSize = Math.floor(data.length * (1 - validationSplit));
    const trainData = data.slice(0, trainSize);
    const valData = data.slice(trainSize);

    for (let epoch = 0; epoch < epochs; epoch++) {
      // Train on sliding windows
      let trainLoss = 0;
      let trainSamples = 0;

      for (let i = 0; i < trainData.length - this.windowSize; i++) {
        const window = trainData.slice(i, i + this.windowSize);
        const target = trainData[i + this.windowSize];

        const prediction = this.predictStep(window);
        const error = target - prediction;

        // Update model weights
        this.updateWeights(window, error);

        trainLoss += error * error;
        trainSamples++;
      }

      const avgTrainLoss = trainLoss / Math.max(1, trainSamples);
      this.history.loss.push(avgTrainLoss);
      this.history.epoch.push(epoch);

      // Validation loss
      let valLoss = 0;
      let valSamples = 0;

      for (let i = 0; i < valData.length - this.windowSize; i++) {
        const window = valData.slice(i, i + this.windowSize);
        const target = valData[i + this.windowSize];
        const prediction = this.predictStep(window);
        valLoss += Math.pow(target - prediction, 2);
        valSamples++;
      }

      const avgValLoss = valLoss / Math.max(1, valSamples);
      this.history.valLoss.push(avgValLoss);

      // Early stopping
      if (epoch > 10 && avgTrainLoss < 0.0001) {
        break;
      }
    }

    return this.history;
  }

  /**
   * Makes predictions on new data
   */
  predict(inputData: number[]): ForecastResult {
    const horizon = Math.min(inputData.length - this.windowSize, 20);
    const predictions: number[] = [];
    const confidence: number[] = [];
    const timestamps: number[] = [];

    for (let i = 0; i < horizon; i++) {
      const window = inputData.slice(i, i + this.windowSize);
      const prediction = this.predictStep(window);
      predictions.push(prediction);

      // Calculate confidence based on prediction variance
      const variance = this.calculateVariance(window);
      const conf = Math.max(0.5, Math.min(0.95, 1 - Math.sqrt(variance) * 0.1));
      confidence.push(conf);

      timestamps.push(Date.now() + i * 1000); // Assume 1 second intervals
    }

    return {
      predictions,
      confidence,
      horizon,
      timestamps,
    };
  }

  /**
   * Forecasts future values beyond the input data
   */
  forecast(inputData: number[], steps: number): ForecastResult {
    const predictions: number[] = [];
    const confidence: number[] = [];
    const timestamps: number[] = [];
    const workingData = [...inputData];

    for (let i = 0; i < steps; i++) {
      const window = workingData.slice(-this.windowSize);
      const prediction = this.predictStep(window);
      predictions.push(prediction);
      workingData.push(prediction);

      // Decrease confidence for longer horizons
      const conf = Math.max(0.3, 0.9 - i * 0.05);
      confidence.push(conf);

      timestamps.push(Date.now() + (inputData.length + i) * 1000);
    }

    return {
      predictions,
      confidence,
      horizon: steps,
      timestamps,
    };
  }

  /**
   * Evaluates the model on test data
   */
  evaluate(testData: number[]): PredictionMetrics {
    if (testData.length <= this.windowSize) {
      return this.metrics;
    }

    const actual: number[] = [];
    const predicted: number[] = [];

    for (let i = 0; i < testData.length - this.windowSize; i++) {
      const window = testData.slice(i, i + this.windowSize);
      const target = testData[i + this.windowSize];
      actual.push(target);
      predicted.push(this.predictStep(window));
    }

    // Calculate metrics
    const n = actual.length;
    const mse = actual.reduce((sum, a, i) => sum + Math.pow(a - predicted[i], 2), 0) / n;
    const rmse = Math.sqrt(mse);
    const mae = actual.reduce((sum, a, i) => sum + Math.abs(a - predicted[i]), 0) / n;

    // R-squared
    const meanActual = actual.reduce((sum, v) => sum + v, 0) / n;
    const ssTotal = actual.reduce((sum, a) => sum + Math.pow(a - meanActual, 2), 0);
    const ssResidual = actual.reduce((sum, a, i) => sum + Math.pow(a - predicted[i], 2), 0);
    const r2 = 1 - ssResidual / (ssTotal + 1e-10);

    // MAPE
    const mape =
      actual.reduce((sum, a, i) => sum + Math.abs((a - predicted[i]) / (a + 1e-10)), 0) * 100 / n;

    this.metrics = {
      mse: mse || 0,
      rmse: rmse || 0,
      mae: mae || 0,
      r2: Math.max(0, r2),
      mape: mape || 0,
    };

    return this.metrics;
  }

  /**
   * Gets the training history
   */
  getHistory(): TrainingHistory {
    return { ...this.history };
  }

  /**
   * Gets current metrics
   */
  getMetrics(): PredictionMetrics {
    return { ...this.metrics };
  }

  /**
   * Gets the model parameters
   */
  getModel(): number[] {
    return [...this.model];
  }

  /**
   * Sets the model parameters
   */
  setModel(weights: number[]): void {
    this.model = [...weights];
    this.initialized = true;
  }

  /**
   * Resets the model
   */
  reset(): void {
    this.model = [];
    this.history = {
      epoch: [],
      loss: [],
      valLoss: [],
      metrics: [],
    };
    this.metrics = {
      mse: 0,
      rmse: 0,
      mae: 0,
      r2: 0,
      mape: 0,
    };
    this.initialized = false;
  }

  /**
   * Serializes the model to JSON
   */
  toJSON(): object {
    return {
      model: this.model,
      windowSize: this.windowSize,
      learningRate: this.learningRate,
      history: this.history,
      metrics: this.metrics,
      initialized: this.initialized,
    };
  }

  /**
   * Creates a model from serialized data
   */
  static fromJSON(data: object): PredictiveModel {
    const json = data as {
      model: number[];
      windowSize: number;
      learningRate: number;
      history: TrainingHistory;
      metrics: PredictionMetrics;
      initialized: boolean;
    };
    const model = new PredictiveModel(json.windowSize, json.learningRate);
    model.model = json.model;
    model.history = json.history;
    model.metrics = json.metrics;
    model.initialized = json.initialized;
    return model;
  }

  /**
   * Initializes the model with optimal weights
   */
  private initializeModel(data: number[]): void {
    const n = this.windowSize + 1;
    this.model = new Array(n).fill(0).map((_, i) => {
      // Linear trend initialization
      return i === 0 ? 1 / n : 1 / n;
    });
    this.initialized = true;
  }

  /**
   * Single prediction step
   */
  private predictStep(window: number[]): number {
    if (this.model.length === 0) {
      // Simple average if model not trained
      return window.reduce((a, b) => a + b, 0) / window.length;
    }

    let prediction = 0;
    for (let i = 0; i < Math.min(window.length, this.model.length); i++) {
      prediction += window[i] * this.model[i];
    }

    return prediction;
  }

  /**
   * Updates model weights using gradient descent
   */
  private updateWeights(window: number[], error: number): void {
    const gradient = this.learningRate * error;

    for (let i = 0; i < Math.min(window.length, this.model.length); i++) {
      this.model[i] += gradient * window[i];
    }
  }

  /**
   * Calculates variance of a window
   */
  private calculateVariance(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    return data.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / data.length;
  }
}