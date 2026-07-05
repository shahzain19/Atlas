import pytest
import math
from atlas_ai.inference.onnx_runtime import ONNXRuntime, Tensor


@pytest.fixture
def runtime():
    return ONNXRuntime()


@pytest.mark.asyncio
async def test_load_model(runtime):
    assert runtime.is_loaded is False
    await runtime.load_model("model.onnx")
    assert runtime.is_loaded is True
    assert runtime.model is not None
    assert runtime.model.path == "model.onnx"


@pytest.mark.asyncio
async def test_load_model_with_options(runtime):
    await runtime.load_model("test.onnx", {"intraOpNumThreads": 16, "interOpNumThreads": 8})
    assert runtime.model.input_size == 16
    assert runtime.model.output_size == 8


@pytest.mark.asyncio
async def test_run_returns_output(runtime):
    await runtime.load_model("test.onnx")
    input_tensor = Tensor(data=[0.5, 0.2, 0.1], shape=[1, 3], dtype="float32")
    output = await runtime.run({"input": input_tensor})
    assert "output" in output
    out_tensor = output["output"]
    assert out_tensor.shape == [1, 4]
    assert out_tensor.type == "float32"
    assert len(out_tensor.data) == 4


@pytest.mark.asyncio
async def test_run_applies_tanh(runtime):
    await runtime.load_model("test.onnx")
    input_tensor = Tensor(data=[100.0], shape=[1, 1], dtype="float32")
    output = await runtime.run({"input": input_tensor})
    for v in output["output"].data:
        assert -1 <= v <= 1


@pytest.mark.asyncio
async def test_run_without_load(runtime):
    input_tensor = Tensor(data=[0.5], shape=[1, 1], dtype="float32")
    with pytest.raises(RuntimeError, match="Model not loaded"):
        await runtime.run({"input": input_tensor})


@pytest.mark.asyncio
async def test_run_wrong_type(runtime):
    await runtime.load_model("test.onnx")
    input_tensor = Tensor(data=[0, 1], shape=[1, 2], dtype="int32")
    with pytest.raises(RuntimeError, match="Expected float32 input tensor"):
        await runtime.run({"input": input_tensor})


@pytest.mark.asyncio
async def test_unload_model(runtime):
    await runtime.load_model("test.onnx")
    assert runtime.is_loaded is True
    await runtime.unload_model()
    assert runtime.is_loaded is False
    assert runtime.model is None


@pytest.mark.asyncio
async def test_deterministic_weights(runtime):
    await runtime.load_model("model_a.onnx")
    w1 = list(runtime.model.weights)
    await runtime.unload_model()
    await runtime.load_model("model_a.onnx")
    w2 = list(runtime.model.weights)
    assert w1 == w2


@pytest.mark.asyncio
async def test_different_models_different_weights(runtime):
    await runtime.load_model("model_x.onnx")
    w1 = list(runtime.model.weights)
    await runtime.unload_model()
    await runtime.load_model("model_y.onnx")
    w2 = list(runtime.model.weights)
    assert w1 != w2


@pytest.mark.asyncio
async def test_run_output_shape(runtime):
    await runtime.load_model("test.onnx", {"intraOpNumThreads": 3, "interOpNumThreads": 2})
    input_tensor = Tensor(data=[1.0, 2.0, 3.0], shape=[1, 3], dtype="float32")
    output = await runtime.run({"input": input_tensor})
    assert len(output["output"].data) == 2


@pytest.mark.asyncio
async def test_state_change_after_load(runtime):
    assert runtime.is_loaded is False
    await runtime.load_model("test.onnx")
    assert runtime.is_loaded is True
    await runtime.unload_model()
    assert runtime.is_loaded is False


@pytest.mark.asyncio
async def test_run_consistency(runtime):
    await runtime.load_model("test.onnx")
    input_tensor = Tensor(data=[0.1, 0.2], shape=[1, 2], dtype="float32")
    o1 = await runtime.run({"input": input_tensor})
    o2 = await runtime.run({"input": input_tensor})
    assert o1["output"].data == o2["output"].data
