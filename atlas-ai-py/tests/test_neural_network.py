import pytest
import json
from copy import deepcopy
from atlas_ai.learning.neural_network import NeuralNetwork


def test_initialization():
    nn = NeuralNetwork([2, 3, 1])
    assert nn.layers == [2, 3, 1]
    assert len(nn.weights) == 2
    assert len(nn.weights[0]) == 3
    assert len(nn.weights[0][0]) == 2
    assert len(nn.weights[1]) == 1
    assert len(nn.weights[1][0]) == 3
    assert len(nn.biases) == 2
    assert len(nn.biases[0]) == 3
    assert len(nn.biases[1]) == 1


def test_forward_output_shape():
    nn = NeuralNetwork([2, 3, 2])
    output = nn.forward([0.5, -0.3])
    assert len(output) == 3
    assert len(output[0]) == 2
    assert len(output[1]) == 3
    assert len(output[2]) == 2


def test_predict_output_shape():
    nn = NeuralNetwork([2, 4, 1])
    pred = nn.predict([0.1, 0.2])
    assert len(pred) == 1


def test_predict_values_in_range():
    nn = NeuralNetwork([1, 3, 1])
    pred = nn.predict([0.5])
    assert 0 <= pred[0] <= 1


def test_backward_reduces_error():
    nn = NeuralNetwork([2, 3, 1], learning_rate=1.0)
    before_error = nn.backward([0.5, 0.3], [0.8])
    after_error = nn.backward([0.5, 0.3], [0.8])
    assert after_error <= before_error


def test_train_reduces_error():
    nn = NeuralNetwork([1, 2, 1], learning_rate=0.5)
    err1 = nn.train([0.8], [0.2])
    for _ in range(10):
        nn.train([0.8], [0.2])
    err_last = nn.train([0.8], [0.2])
    assert err_last <= err1 or abs(err_last - err1) < 0.01


def test_train_epoch_returns_errors():
    nn = NeuralNetwork([1, 2, 1])
    dataset = [{"inputs": [0.0], "targets": [0.0]}, {"inputs": [1.0], "targets": [1.0]}]
    errors = nn.train_epoch(dataset, epochs=5)
    assert len(errors) == 5
    for e in errors:
        assert e >= 0


def test_train_epoch_empty_dataset():
    nn = NeuralNetwork([1, 1])
    errors = nn.train_epoch([], epochs=5)
    assert errors == []


def test_train_epoch_early_stopping():
    nn = NeuralNetwork([1, 1], learning_rate=10.0)
    dataset = [{"inputs": [0.5], "targets": [0.5]}]
    errors = nn.train_epoch(dataset, epochs=1000)
    assert len(errors) < 100


def test_get_set_learning_rate():
    nn = NeuralNetwork([2, 2])
    assert nn.get_learning_rate() == 0.01
    nn.set_learning_rate(0.5)
    assert nn.get_learning_rate() == 0.5
    nn.set_learning_rate(100)
    assert nn.get_learning_rate() == 1.0
    nn.set_learning_rate(-1)
    assert nn.get_learning_rate() == 0.0001


def test_get_architecture():
    nn = NeuralNetwork([3, 5, 2])
    assert nn.get_architecture() == [3, 5, 2]


def test_to_json_from_json():
    nn = NeuralNetwork([2, 3, 1], learning_rate=0.1)
    data = nn.to_json()
    assert set(data.keys()) == {"layers", "learningRate", "weights", "biases"}
    nn2 = NeuralNetwork.from_json(data)
    assert nn2.layers == nn.layers
    assert nn2.weights == nn.weights
    assert nn2.biases == nn.biases


def test_forward_input_mismatch():
    nn = NeuralNetwork([2, 1])
    with pytest.raises(ValueError):
        nn.forward([1.0, 2.0, 3.0])


def test_backward_target_mismatch():
    nn = NeuralNetwork([2, 1])
    with pytest.raises(ValueError):
        nn.backward([1.0, 2.0], [0.5, 0.3])


def test_sigmoid_clamping():
    nn = NeuralNetwork([1, 1])
    assert nn._sigmoid(1000) == pytest.approx(1.0, rel=1e-6)
    assert nn._sigmoid(-1000) == pytest.approx(0.0, rel=1e-6)


def test_relu():
    nn = NeuralNetwork([1, 1])
    assert nn._relu(5) == 5
    assert nn._relu(-3) == 0
    assert nn._relu(0) == 0


def test_state_change_after_training():
    nn = NeuralNetwork([1, 2, 1], learning_rate=1.0)
    w_before = deepcopy(nn.weights)
    for _ in range(5):
        nn.train([0.5], [0.8])
    assert nn.weights != w_before


def test_forward_produces_different_outputs():
    nn = NeuralNetwork([2, 3, 1])
    out1 = nn.predict([0.1, 0.2])
    out2 = nn.predict([0.9, 0.8])
    assert out1 != out2


def test_bias_update_during_backward():
    nn = NeuralNetwork([1, 2, 1], learning_rate=10.0)
    b_before = [list(b) for b in nn.biases]
    nn.backward([0.5], [0.9])
    assert nn.biases != b_before
