import math
from atlas_ai.types import hash_string, seeded_range


class Tensor:
    def __init__(self, data, shape: list[int], dtype: str):
        self.data = data
        self.shape = shape
        self.type = dtype


class InferenceSessionOptions:
    def __init__(self):
        self.provider: str = "cpu"
        self.intra_op_num_threads: int = 8
        self.inter_op_num_threads: int = 4


class LoadedModel:
    def __init__(self, path: str, input_size: int, output_size: int, weights: list[float]):
        self.path = path
        self.input_size = input_size
        self.output_size = output_size
        self.weights = weights


class ONNXRuntime:
    def __init__(self):
        self.model: LoadedModel | None = None
        self.is_loaded = False

    async def load_model(self, model_path: str, options: dict | None = None):
        if options is None:
            options = {}
        input_size = options.get("intraOpNumThreads", 8)
        output_size = options.get("interOpNumThreads", 4)
        seed = hash_string(model_path)
        weights = [0.0] * (input_size * output_size)
        for i in range(len(weights)):
            weights[i] = seeded_range(seed + i, -1.0, 1.0)

        self.model = LoadedModel(path=model_path, input_size=input_size, output_size=output_size, weights=weights)
        self.is_loaded = True

    async def run(self, inputs: dict[str, Tensor]) -> dict[str, Tensor]:
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model not loaded")

        first_input = next(iter(inputs.values()))
        if first_input.type != "float32":
            raise RuntimeError("Expected float32 input tensor")

        input_data = first_input.data
        output = [0.0] * self.model.output_size

        for o in range(self.model.output_size):
            s = 0.0
            for i in range(min(len(input_data), self.model.input_size)):
                s += input_data[i] * self.model.weights[o * self.model.input_size + i]
            output[o] = math.tanh(s)

        return {
            "output": Tensor(data=output, shape=[1, self.model.output_size], dtype="float32"),
        }

    async def unload_model(self):
        self.is_loaded = False
        self.model = None
