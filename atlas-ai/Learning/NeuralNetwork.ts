/**
 * NeuralNetwork - A simple feedforward neural network implementation
 * Supports forward propagation, backpropagation, and training
 */
export class NeuralNetwork {
  readonly layers: number[];
  readonly weights: number[][][];
  readonly biases: number[][];
  private learningRate: number;

  constructor(layerSizes: number[], learningRate: number = 0.01) {
    this.layers = layerSizes;
    this.learningRate = learningRate;

    // Initialize weights and biases
    this.weights = [];
    this.biases = [];

    for (let i = 1; i < layerSizes.length; i++) {
      const inputSize = layerSizes[i - 1];
      const outputSize = layerSizes[i];

      // Initialize weights with Xavier initialization
      const layerWeights: number[][] = [];
      const layerBiases: number[] = new Array(outputSize).fill(0);

      for (let j = 0; j < outputSize; j++) {
        const neuronWeights: number[] = [];
        const scale = Math.sqrt(2.0 / inputSize);
        for (let k = 0; k < inputSize; k++) {
          neuronWeights.push(this.randomNormal() * scale);
        }
        layerWeights.push(neuronWeights);
        layerBiases[j] = this.randomNormal() * scale;
      }

      this.weights.push(layerWeights);
      this.biases.push(layerBiases);
    }
  }

  /**
   * Forward propagation through the network
   */
  forward(inputs: number[]): number[][] {
    if (inputs.length !== this.layers[0]) {
      throw new Error(`Input size ${inputs.length} does not match input layer size ${this.layers[0]}`);
    }

    let currentActivations = inputs.map((x) => this.relu(x));

    const activations: number[][] = [currentActivations];

    for (let layerIndex = 0; layerIndex < this.weights.length; layerIndex++) {
      const layerWeights = this.weights[layerIndex];
      const layerBiases = this.biases[layerIndex];
      const nextActivations: number[] = [];

      for (let neuronIndex = 0; neuronIndex < layerWeights.length; neuronIndex++) {
        const neuronWeights = layerWeights[neuronIndex];
        let sum = layerBiases[neuronIndex];

        for (let weightIndex = 0; weightIndex < neuronWeights.length; weightIndex++) {
          sum += currentActivations[weightIndex] * neuronWeights[weightIndex];
        }

        // Use different activation for output layer
        if (layerIndex === this.weights.length - 1) {
          nextActivations.push(this.sigmoid(sum));
        } else {
          nextActivations.push(this.relu(sum));
        }
      }

      currentActivations = nextActivations;
      activations.push([...currentActivations]);
    }

    return activations;
  }

  /**
   * Makes a prediction (returns the output layer values)
   */
  predict(inputs: number[]): number[] {
    const activations = this.forward(inputs);
    return activations[activations.length - 1];
  }

  /**
   * Backpropagation - computes gradients for training
   */
  backward(inputs: number[], targets: number[]): number {
    if (targets.length !== this.layers[this.layers.length - 1]) {
      throw new Error(`Target size ${targets.length} does not match output layer size ${this.layers[this.layers.length - 1]}`);
    }

    const activations = this.forward(inputs);
    const outputLayer = activations[activations.length - 1];

    // Calculate output layer error
    const deltas: number[][] = [];
    const outputDelta: number[] = [];

    for (let i = 0; i < outputLayer.length; i++) {
      const error = targets[i] - outputLayer[i];
      const derivative = outputLayer[i] * (1 - outputLayer[i] + 1e-8); // sigmoid derivative with epsilon
      outputDelta.push(error * derivative);
    }
    deltas.push(outputDelta);

    // Backpropagate through hidden layers
    for (let layerIndex = this.weights.length - 2; layerIndex >= 0; layerIndex--) {
      const nextDelta = deltas[0];
      const layerWeights = this.weights[layerIndex + 1];
      const newDelta: number[] = [];

      for (let neuronIndex = 0; neuronIndex < layerWeights.length; neuronIndex++) {
        let error = 0;
        for (let nextNeuronIndex = 0; nextNeuronIndex < nextDelta.length; nextNeuronIndex++) {
          error += nextDelta[nextNeuronIndex] * layerWeights[nextNeuronIndex][neuronIndex];
        }

        // Use ReLU derivative for hidden layers
        const preActivation = this.calculatePreActivation(activations, layerIndex, neuronIndex);
        const derivative = preActivation > 0 ? 1 : 0;
        newDelta.push(error * derivative);
      }

      deltas.unshift(newDelta);
    }

    // Update weights and biases
    let currentActivations = activations[0];
    for (let layerIndex = 0; layerIndex < this.weights.length; layerIndex++) {
      const delta = deltas[layerIndex];

      for (let neuronIndex = 0; neuronIndex < this.weights[layerIndex].length; neuronIndex++) {
        // Update bias
        this.biases[layerIndex][neuronIndex] += this.learningRate * delta[neuronIndex];

        // Update weights
        for (let weightIndex = 0; weightIndex < this.weights[layerIndex][neuronIndex].length; weightIndex++) {
          const gradient = delta[neuronIndex] * currentActivations[weightIndex];
          this.weights[layerIndex][neuronIndex][weightIndex] +=
            Math.abs(this.learningRate) * (isNaN(gradient) ? 0 : gradient);
        }
      }

      if (layerIndex < activations.length - 1) {
        currentActivations = activations[layerIndex + 1];
      }
    }

    // Calculate total error (MSE)
    let totalError = 0;
    for (let i = 0; i < outputLayer.length; i++) {
      totalError += 0.5 * Math.pow(targets[i] - outputLayer[i], 2);
    }

    return isNaN(totalError) ? 0 : totalError;
  }

  /**
   * Trains the network on a single dataset
   */
  train(inputs: number[], targets: number[]): number {
    return this.backward(inputs, targets);
  }

  /**
   * Trains the network on multiple epochs
   */
  trainEpoch(
    dataset: Array<{ inputs: number[]; targets: number[] }>,
    epochs: number = 100
  ): number[] {
    const errors: number[] = [];

    // Handle empty dataset
    if (dataset.length === 0) {
      return errors;
    }

    for (let epoch = 0; epoch < epochs; epoch++) {
      let epochError = 0;

      for (const data of dataset) {
        const error = this.train(data.inputs, data.targets);
        epochError += isNaN(error) ? 0 : error;
      }

      const avgError = epochError / dataset.length;
      errors.push(avgError);

      // Early stopping if error is very low
      if (avgError < 0.001 && epoch > 0) {
        break;
      }
    }

    return errors;
  }

  /**
   * Gets the current learning rate
   */
  getLearningRate(): number {
    return this.learningRate;
  }

  /**
   * Sets the learning rate
   */
  setLearningRate(rate: number): void {
    this.learningRate = Math.max(0.0001, Math.min(1.0, rate));
  }

  /**
   * Gets the network architecture
   */
  getArchitecture(): number[] {
    return [...this.layers];
  }

  /**
   * Serializes the network to JSON
   */
  toJSON(): object {
    return {
      layers: this.layers,
      learningRate: this.learningRate,
      weights: this.weights,
      biases: this.biases,
    };
  }

  /**
   * Creates a network from serialized data
   */
  static fromJSON(data: object): NeuralNetwork {
    const json = data as {
      layers: number[];
      learningRate: number;
      weights: number[][][];
      biases: number[][][];
    };
    const network = new NeuralNetwork(json.layers, json.learningRate);
    // Recreate network with custom constructor logic to set weights
    const reconstructed = new NeuralNetwork(json.layers, json.learningRate);
    (reconstructed as any).weights = json.weights;
    (reconstructed as any).biases = json.biases;
    return reconstructed;
  }

  /**
   * ReLU activation function
   */
  private relu(x: number): number {
    return Math.max(0, x);
  }

  /**
   * Sigmoid activation function
   */
  private sigmoid(x: number): number {
    // Clamp input to prevent overflow
    const clamped = Math.max(-500, Math.min(500, x));
    return 1 / (1 + Math.exp(-clamped));
  }

  /**
   * Generates a random number from a normal distribution
   */
  private randomNormal(): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Calculates the pre-activation value for a neuron
   */
  private calculatePreActivation(activations: number[][], layerIndex: number, neuronIndex: number): number {
    const prevActivations = activations[layerIndex];
    const layerWeights = this.weights[layerIndex];
    let sum = this.biases[layerIndex][neuronIndex];

    for (let i = 0; i < prevActivations.length; i++) {
      sum += prevActivations[i] * layerWeights[neuronIndex][i];
    }

    return sum;
  }
}