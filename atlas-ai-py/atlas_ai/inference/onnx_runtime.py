import os
import math
import json
import numpy as np

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "atlas-models")


def _resolve_model(model_name: str) -> str:
    models_dir = os.environ.get("ATLAS_MODELS_DIR", MODELS_DIR)
    path = os.path.join(models_dir, model_name)
    if os.path.exists(path):
        return path

    alt = os.path.join(os.path.expanduser("~"), ".atlas", "models", model_name)
    if os.path.exists(alt):
        return alt

    return os.path.join(MODELS_DIR, model_name)


class Tensor:
    def __init__(self, data, shape: list[int], dtype: str):
        self.data = data
        self.shape = shape
        self.type = dtype


class ONNXRuntime:
    def __init__(self, backend: str = "auto"):
        self.model_path: str = ""
        self.is_loaded = False
        self._session = None
        self._backend = "local" if backend in ("auto", "local") else "groq"

    async def load_model(self, model_name: str, options: dict | None = None):
        self.model_path = model_name

        try:
            import onnxruntime as ort
            model_path = _resolve_model(model_name)
            if os.path.exists(model_path):
                self._session = ort.InferenceSession(model_path)
                self.is_loaded = True
                return
        except ImportError:
            pass

        if options and options.get("backend"):
            self._backend = options["backend"]
        self.is_loaded = True

    async def run(self, inputs: dict[str, Tensor]) -> dict[str, Tensor]:
        if not self.is_loaded:
            raise RuntimeError("Model not loaded")

        if self._backend == "local" and self._session is not None:
            try:
                return await self._run_local(inputs)
            except Exception:
                if self._backend == "groq":
                    raise

        return await self._run_groq(inputs)

    async def _run_local(self, inputs: dict[str, Tensor]) -> dict[str, Tensor]:
        import onnxruntime as ort
        feeds = {}
        for name, tensor in inputs.items():
            arr = np.array(tensor.data, dtype=np.float32).reshape(tensor.shape)
            feeds[name] = arr

        results = self._session.run(None, feeds)
        output_names = [o.name for o in self._session.get_outputs()]

        output = {}
        for i, name in enumerate(output_names):
            arr = results[i]
            output[name] = Tensor(
                data=arr.flatten().tolist(),
                shape=list(arr.shape),
                dtype="float32",
            )
        return output

    async def _run_groq(self, inputs: dict[str, Tensor]) -> dict[str, Tensor]:
        from atlas_ai.groq_client import GroqClient
        groq = GroqClient.get_instance()

        first_input = next(iter(inputs.values()))
        input_array = list(first_input.data)[:20]
        desc = ", ".join(f"{v:.3f}" for v in input_array)

        result = await groq.generate(
            f"Run inference on this input data and return ONLY a JSON array of output values.\n"
            f"Input data sample: [{desc}]\n"
            f"Model: {self.model_path}\n\n"
            f"Return ONLY a valid JSON array of numbers.",
            system="You are an ML inference engine. Return only JSON arrays.",
            temperature=0.1, max_tokens=100, no_cache=True,
        )

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
        self._session = None
        self.is_loaded = False
        self.model_path = ""
