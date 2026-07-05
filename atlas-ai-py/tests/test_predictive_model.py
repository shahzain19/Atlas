import pytest
from atlas_ai.prediction.predictive_model import PredictiveModel


def test_initialization():
    model = PredictiveModel(window_size=3, learning_rate=0.01)
    assert model.window_size == 3
    assert model.learning_rate == 0.01
    assert model.initialized is False
    assert model.model == []


def test_train_returns_history():
    model = PredictiveModel(window_size=2)
    data = [1.0, 2.0, 3.0, 4.0, 5.0]
    history = model.train(data, epochs=10)
    assert len(history.epoch) > 0
    assert len(history.loss) > 0
    assert len(history.val_loss) > 0


def test_train_initializes_model():
    model = PredictiveModel(window_size=2)
    assert model.initialized is False
    model.train([1.0, 2.0, 3.0, 4.0, 5.0], epochs=1)
    assert model.initialized is True
    assert len(model.model) == 3


def test_predict_returns_forecast():
    model = PredictiveModel(window_size=2)
    model.train([1.0, 2.0, 3.0, 4.0, 5.0], epochs=5)
    result = model.predict([5.0, 6.0, 7.0, 8.0, 9.0])
    assert len(result.predictions) > 0
    assert len(result.confidence) == len(result.predictions)
    assert len(result.timestamps) == len(result.predictions)


def test_forecast_returns_result():
    model = PredictiveModel(window_size=2)
    model.train([1.0, 2.0, 3.0, 4.0, 5.0], epochs=5)
    result = model.forecast([5.0, 6.0, 7.0], steps=3)
    assert len(result.predictions) == 3
    assert len(result.confidence) == 3
    assert result.horizon == 3


def test_forecast_decreasing_confidence():
    model = PredictiveModel(window_size=2)
    model.train([1.0, 2.0, 3.0], epochs=5)
    result = model.forecast([3.0, 4.0], steps=5)
    for i in range(1, len(result.confidence)):
        assert result.confidence[i] <= result.confidence[i - 1]


def test_evaluate_returns_metrics():
    model = PredictiveModel(window_size=2)
    model.train([1.0, 2.0, 3.0, 4.0, 5.0], epochs=5)
    metrics = model.evaluate([5.0, 6.0, 7.0, 8.0])
    assert metrics.mse >= 0
    assert metrics.rmse >= 0
    assert metrics.mae >= 0
    assert metrics.r2 >= 0
    assert metrics.mape >= 0


def test_evaluate_short_data():
    model = PredictiveModel(window_size=5)
    metrics = model.evaluate([1.0, 2.0])
    assert metrics.mse == 0


def test_reset():
    model = PredictiveModel(window_size=2)
    model.train([1.0, 2.0, 3.0], epochs=5)
    model.reset()
    assert model.model == []
    assert model.initialized is False
    assert model.history.epoch == []
    assert model.history.loss == []
    assert model.history.val_loss == []


def test_to_json_from_json():
    model = PredictiveModel(window_size=3, learning_rate=0.05)
    model.train([1.0, 2.0, 3.0, 4.0, 5.0, 6.0], epochs=5)
    data = model.to_json()
    model2 = PredictiveModel.from_json(data)
    assert model2.window_size == model.window_size
    assert model2.learning_rate == model.learning_rate
    assert model2.initialized == model.initialized
    assert model2.model == model.model


def test_set_model():
    model = PredictiveModel(window_size=2)
    assert model.initialized is False
    model.set_model([0.5, 0.3, 0.2])
    assert model.initialized is True
    assert model.model == [0.5, 0.3, 0.2]


def test_get_model():
    model = PredictiveModel(window_size=2)
    model.train([1.0, 2.0, 3.0, 4.0], epochs=5)
    m = model.get_model()
    assert len(m) > 0


def test_get_history():
    model = PredictiveModel(window_size=2)
    model.train([1.0, 2.0, 3.0, 4.0], epochs=10)
    h = model.get_history()
    assert len(h.epoch) > 0
    assert len(h.loss) > 0


def test_state_change_after_training():
    model = PredictiveModel(window_size=2)
    model_before = model.get_model()
    model.train([1.0, 2.0, 3.0, 4.0], epochs=10)
    model_after = model.get_model()
    assert model_before != model_after


def test_predict_without_training():
    model = PredictiveModel(window_size=2)
    model.set_model([0.5, 0.5, 0.5])
    result = model.predict([1.0, 2.0, 3.0, 4.0])
    assert len(result.predictions) > 0


def test_empty_data_forecast():
    model = PredictiveModel(window_size=2)
    model.set_model([0.5, 0.5])
    result = model.forecast([], steps=0)
    assert result.predictions == []
