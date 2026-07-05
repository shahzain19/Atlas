import math
import random
import json
from copy import deepcopy


class NeuralNetwork:
    def __init__(self, layer_sizes: list[int], learning_rate: float = 0.01):
        self.layers = list(layer_sizes)
        self.learning_rate = learning_rate
        self.weights: list[list[list[float]]] = []
        self.biases: list[list[float]] = []

        for i in range(1, len(layer_sizes)):
            input_size = layer_sizes[i - 1]
            output_size = layer_sizes[i]

            layer_weights: list[list[float]] = []
            layer_biases: list[float] = [0.0] * output_size

            scale = math.sqrt(2.0 / input_size)

            for j in range(output_size):
                neuron_weights: list[float] = []
                for k in range(input_size):
                    neuron_weights.append(self._random_normal() * scale)
                layer_weights.append(neuron_weights)
                layer_biases[j] = self._random_normal() * scale

            self.weights.append(layer_weights)
            self.biases.append(layer_biases)

    def forward(self, inputs: list[float]) -> list[list[float]]:
        if len(inputs) != self.layers[0]:
            raise ValueError(
                f"Input size {len(inputs)} does not match input layer size {self.layers[0]}"
            )

        current_activations = [self._relu(x) for x in inputs]
        activations: list[list[float]] = [list(current_activations)]

        for layer_idx in range(len(self.weights)):
            layer_weights = self.weights[layer_idx]
            layer_biases = self.biases[layer_idx]
            next_activations: list[float] = []

            for neuron_idx in range(len(layer_weights)):
                neuron_weights = layer_weights[neuron_idx]
                s = layer_biases[neuron_idx]
                for w_idx in range(len(neuron_weights)):
                    s += current_activations[w_idx] * neuron_weights[w_idx]

                if layer_idx == len(self.weights) - 1:
                    next_activations.append(self._sigmoid(s))
                else:
                    next_activations.append(self._relu(s))

            current_activations = next_activations
            activations.append(list(current_activations))

        return activations

    def predict(self, inputs: list[float]) -> list[float]:
        activations = self.forward(inputs)
        return activations[-1]

    def backward(self, inputs: list[float], targets: list[float]) -> float:
        if len(targets) != self.layers[-1]:
            raise ValueError(
                f"Target size {len(targets)} does not match output layer size {self.layers[-1]}"
            )

        activations = self.forward(inputs)
        output_layer = activations[-1]

        deltas: list[list[float]] = []
        output_delta: list[float] = []

        for i in range(len(output_layer)):
            error = targets[i] - output_layer[i]
            derivative = output_layer[i] * (1 - output_layer[i] + 1e-8)
            output_delta.append(error * derivative)
        deltas.append(output_delta)

        for layer_idx in range(len(self.weights) - 2, -1, -1):
            next_delta = deltas[0]
            layer_weights = self.weights[layer_idx + 1]
            new_delta: list[float] = []

            input_neuron_count = len(layer_weights[0]) if layer_weights else 0
            for neuron_idx in range(input_neuron_count):
                error = 0.0
                for next_neuron_idx in range(len(next_delta)):
                    error += next_delta[next_neuron_idx] * layer_weights[next_neuron_idx][neuron_idx]

                pre_activation = self._calculate_pre_activation(activations, layer_idx, neuron_idx)
                derivative = 1.0 if pre_activation > 0 else 0.0
                new_delta.append(error * derivative)

            deltas.insert(0, new_delta)

        current_activations = activations[0]
        for layer_idx in range(len(self.weights)):
            delta = deltas[layer_idx]

            for neuron_idx in range(len(self.weights[layer_idx])):
                self.biases[layer_idx][neuron_idx] += self.learning_rate * delta[neuron_idx]

                for w_idx in range(len(self.weights[layer_idx][neuron_idx])):
                    gradient = delta[neuron_idx] * current_activations[w_idx]
                    self.weights[layer_idx][neuron_idx][w_idx] += (
                        abs(self.learning_rate) * (0 if math.isnan(gradient) else gradient)
                    )

            if layer_idx < len(activations) - 1:
                current_activations = activations[layer_idx + 1]

        total_error = 0.0
        for i in range(len(output_layer)):
            total_error += 0.5 * (targets[i] - output_layer[i]) ** 2

        return 0 if math.isnan(total_error) else total_error

    def train(self, inputs: list[float], targets: list[float]) -> float:
        return self.backward(inputs, targets)

    def train_epoch(
        self,
        dataset: list[dict],
        epochs: int = 100,
    ) -> list[float]:
        errors: list[float] = []

        if len(dataset) == 0:
            return errors

        for epoch in range(epochs):
            epoch_error = 0.0
            for data in dataset:
                error = self.train(data["inputs"], data["targets"])
                epoch_error += 0 if math.isnan(error) else error

            avg_error = epoch_error / len(dataset)
            errors.append(avg_error)

            if avg_error < 0.001 and epoch > 0:
                break

        return errors

    def get_learning_rate(self) -> float:
        return self.learning_rate

    def set_learning_rate(self, rate: float):
        self.learning_rate = max(0.0001, min(1.0, rate))

    def get_architecture(self) -> list[int]:
        return list(self.layers)

    def to_json(self) -> dict:
        return {
            "layers": self.layers,
            "learningRate": self.learning_rate,
            "weights": self.weights,
            "biases": self.biases,
        }

    @staticmethod
    def from_json(data: dict):
        nn = NeuralNetwork(data["layers"], data.get("learningRate", 0.01))
        nn.weights = data["weights"]
        nn.biases = data["biases"]
        return nn

    def _relu(self, x: float) -> float:
        return max(0.0, x)

    def _sigmoid(self, x: float) -> float:
        clamped = max(-500, min(500, x))
        return 1.0 / (1.0 + math.exp(-clamped))

    def _random_normal(self) -> float:
        u = 0.0
        v = 0.0
        while u == 0:
            u = random.random()
        while v == 0:
            v = random.random()
        return math.sqrt(-2.0 * math.log(u)) * math.cos(2.0 * math.pi * v)

    def _calculate_pre_activation(
        self, activations: list[list[float]], layer_idx: int, neuron_idx: int
    ) -> float:
        prev_activations = activations[layer_idx]
        layer_weights = self.weights[layer_idx]
        s = self.biases[layer_idx][neuron_idx]
        for i in range(len(prev_activations)):
            s += prev_activations[i] * layer_weights[neuron_idx][i]
        return s
