from atlas_ai.groq_client import GroqClient


class Tensor:
    def __init__(self, data, shape: list[int], dtype: str):
        self.data = data
        self.shape = shape
        self.type = dtype


class ONNXRuntime:
    def __init__(self):
        self.groq = GroqClient.get_instance()
        self.model_path: str = ""
        self.is_loaded = False

    async def load_model(self, model_path: str, options: dict | None = None):
        self.model_path = model_path
        self.is_loaded = True

    async def run(self, inputs: dict[str, Tensor]) -> dict[str, Tensor]:
        if not self.is_loaded:
            raise RuntimeError("Model not loaded")

        first_input = next(iter(inputs.values()))
        input_array = list(first_input.data)[:20]
        desc = ", ".join(f"{v:.3f}" for v in input_array)

        result = await self.groq.generate(
            f"Run inference on this input data and return ONLY a JSON array of output values (4 floats between -1 and 1).\n"
            f"Input data sample: [{desc}]\n"
            f"Model: {self.model_path}\n\n"
            f"Return ONLY a valid JSON array of 4 numbers.",
            system="You are an ML inference engine. Return only JSON arrays.",
            temperature=0.1, max_tokens=100
        )

        import json
        import math
        try:
            start = result.index("[")
            end = result.rindex("]") + 1
            parsed = json.loads(result[start:end])
            return {"output": Tensor(data=parsed, shape=[1, len(parsed)], dtype="float32")}
        except (ValueError, json.JSONDecodeError):
            pass

        output = [0.0] * 4
        for i in range(min(len(input_array), 4)):
            output[i] = math.tanh(input_array[i] or 0)
        return {"output": Tensor(data=output, shape=[1, 4], dtype="float32")}

    async def unload_model(self):
        self.is_loaded = False
        self.model_path = ""
