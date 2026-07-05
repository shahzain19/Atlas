import math
import time
from copy import deepcopy


class PredictionMetrics:
    def __init__(self):
        self.mse: float = 0
        self.rmse: float = 0
        self.mae: float = 0
        self.r2: float = 0
        self.mape: float = 0


class TrainingHistory:
    def __init__(self):
        self.epoch: list[int] = []
        self.loss: list[float] = []
        self.val_loss: list[float] = []
        self.metrics: list[PredictionMetrics] = []


class ForecastResult:
    def __init__(self):
        self.predictions: list[float] = []
        self.confidence: list[float] = []
        self.horizon: int = 0
        self.timestamps: list[float] = []


class PredictiveModel:
    def __init__(self, window_size: int = 5, learning_rate: float = 0.01):
        self.model: list[float] = []
        self.history = TrainingHistory()
        self.metrics = PredictionMetrics()
        self.window_size = window_size
        self.learning_rate = learning_rate
        self.initialized = False

    def train(
        self,
        data: list[float],
        epochs: int = 100,
        validation_split: float = 0.2,
    ) -> TrainingHistory:
        if not self.initialized or len(self.model) == 0:
            self._initialize_model(data)

        train_size = int(len(data) * (1 - validation_split))
        train_data = data[:train_size]
        val_data = data[train_size:]

        for epoch in range(epochs):
            train_loss = 0.0
            train_samples = 0

            for i in range(len(train_data) - self.window_size):
                window = train_data[i:i + self.window_size]
                target = train_data[i + self.window_size]

                prediction = self._predict_step(window)
                error = target - prediction

                self._update_weights(window, error)

                train_loss += error * error
                train_samples += 1

            avg_train_loss = train_loss / max(1, train_samples)
            self.history.loss.append(avg_train_loss)
            self.history.epoch.append(epoch)

            val_loss = 0.0
            val_samples = 0

            for i in range(len(val_data) - self.window_size):
                window = val_data[i:i + self.window_size]
                target = val_data[i + self.window_size]
                prediction = self._predict_step(window)
                val_loss += (target - prediction) ** 2
                val_samples += 1

            avg_val_loss = val_loss / max(1, val_samples)
            self.history.val_loss.append(avg_val_loss)

            if epoch > 10 and avg_train_loss < 0.0001:
                break

        return self.history

    def predict(self, input_data: list[float]) -> ForecastResult:
        horizon = min(len(input_data) - self.window_size, 20)
        predictions: list[float] = []
        confidence: list[float] = []
        timestamps: list[float] = []

        for i in range(horizon):
            window = input_data[i:i + self.window_size]
            prediction = self._predict_step(window)
            predictions.append(prediction)

            variance = self._calculate_variance(window)
            conf = max(0.5, min(0.95, 1 - math.sqrt(variance) * 0.1))
            confidence.append(conf)

            timestamps.append(time.time() + i * 1000)

        result = ForecastResult()
        result.predictions = predictions
        result.confidence = confidence
        result.horizon = horizon
        result.timestamps = timestamps
        return result

    def forecast(self, input_data: list[float], steps: int) -> ForecastResult:
        predictions: list[float] = []
        confidence: list[float] = []
        timestamps: list[float] = []
        working_data = list(input_data)

        for i in range(steps):
            window = working_data[-self.window_size:]
            prediction = self._predict_step(window)
            predictions.append(prediction)
            working_data.append(prediction)

            conf = max(0.3, 0.9 - i * 0.05)
            confidence.append(conf)

            timestamps.append(time.time() + (len(input_data) + i) * 1000)

        result = ForecastResult()
        result.predictions = predictions
        result.confidence = confidence
        result.horizon = steps
        result.timestamps = timestamps
        return result

    def evaluate(self, test_data: list[float]) -> PredictionMetrics:
        if len(test_data) <= self.window_size:
            return self.metrics

        actual: list[float] = []
        predicted: list[float] = []

        for i in range(len(test_data) - self.window_size):
            window = test_data[i:i + self.window_size]
            target = test_data[i + self.window_size]
            actual.append(target)
            predicted.append(self._predict_step(window))

        n = len(actual)
        mse = sum((a - predicted[i]) ** 2 for i, a in enumerate(actual)) / n
        rmse = math.sqrt(mse)
        mae = sum(abs(a - predicted[i]) for i, a in enumerate(actual)) / n

        mean_actual = sum(actual) / n
        ss_total = sum((a - mean_actual) ** 2 for a in actual)
        ss_residual = sum((a - predicted[i]) ** 2 for i, a in enumerate(actual))
        r2 = 1 - ss_residual / (ss_total + 1e-10)

        mape = (
            sum(abs((a - predicted[i]) / (a + 1e-10)) for i, a in enumerate(actual))
            * 100
            / n
        )

        self.metrics.mse = mse if mse else 0
        self.metrics.rmse = rmse if rmse else 0
        self.metrics.mae = mae if mae else 0
        self.metrics.r2 = max(0, r2)
        self.metrics.mape = mape if mape else 0

        return self.metrics

    def get_history(self) -> TrainingHistory:
        return deepcopy(self.history)

    def get_metrics(self) -> PredictionMetrics:
        return deepcopy(self.metrics)

    def get_model(self) -> list[float]:
        return list(self.model)

    def set_model(self, weights: list[float]):
        self.model = list(weights)
        self.initialized = True

    def reset(self):
        self.model = []
        self.history = TrainingHistory()
        self.metrics = PredictionMetrics()
        self.initialized = False

    def to_json(self) -> dict:
        return {
            "model": self.model,
            "windowSize": self.window_size,
            "learningRate": self.learning_rate,
            "history": {
                "epoch": self.history.epoch,
                "loss": self.history.loss,
                "valLoss": self.history.val_loss,
                "metrics": [{"mse": m.mse, "rmse": m.rmse, "mae": m.mae, "r2": m.r2, "mape": m.mape} for m in self.history.metrics],
            },
            "metrics": {
                "mse": self.metrics.mse,
                "rmse": self.metrics.rmse,
                "mae": self.metrics.mae,
                "r2": self.metrics.r2,
                "mape": self.metrics.mape,
            },
            "initialized": self.initialized,
        }

    @staticmethod
    def from_json(data: dict):
        model = PredictiveModel(data.get("windowSize", 5), data.get("learningRate", 0.01))
        model.model = data.get("model", [])
        hist_data = data.get("history", {})
        model.history.epoch = hist_data.get("epoch", [])
        model.history.loss = hist_data.get("loss", [])
        model.history.val_loss = hist_data.get("valLoss", [])
        met_data = data.get("metrics", {})
        model.metrics.mse = met_data.get("mse", 0)
        model.metrics.rmse = met_data.get("rmse", 0)
        model.metrics.mae = met_data.get("mae", 0)
        model.metrics.r2 = met_data.get("r2", 0)
        model.metrics.mape = met_data.get("mape", 0)
        model.initialized = data.get("initialized", False)
        return model

    def _initialize_model(self, data: list[float]):
        n = self.window_size + 1
        self.model = [1.0 / n] * n
        self.initialized = True

    def _predict_step(self, window: list[float]) -> float:
        if len(self.model) == 0:
            return sum(window) / len(window) if window else 0

        prediction = 0.0
        for i in range(min(len(window), len(self.model))):
            prediction += window[i] * self.model[i]
        return prediction

    def _update_weights(self, window: list[float], error: float):
        gradient = self.learning_rate * error
        for i in range(min(len(window), len(self.model))):
            self.model[i] += gradient * window[i] * 0.01

    def _calculate_variance(self, data: list[float]) -> float:
        if not data:
            return 0
        mean = sum(data) / len(data)
        return sum((v - mean) ** 2 for v in data) / len(data)
