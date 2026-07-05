import pytest
from atlas_ai.vision.vision_processor import VisionProcessor, CameraFrame, Tensor


@pytest.mark.asyncio
async def test_preprocess_returns_tensor():
    processor = VisionProcessor()
    frame = CameraFrame(data=[128, 64, 32] * 100, width=10, height=10)
    tensor = await processor.preprocess(frame)
    assert isinstance(tensor, Tensor)
    assert tensor.shape == [1, 1, 10, 10]
    assert tensor.type == "float32"
    assert len(tensor.data) == 100


@pytest.mark.asyncio
async def test_preprocess_normalizes():
    processor = VisionProcessor()
    frame = CameraFrame(data=[255, 0, 0] * 16, width=4, height=4)
    tensor = await processor.preprocess(frame)
    assert tensor.data[0] == 1.0


@pytest.mark.asyncio
async def test_postprocess_returns_detections():
    processor = VisionProcessor()
    frame = CameraFrame(data=[0] * 48, width=4, height=4)
    output_tensor = Tensor(data=[0.9, 0.1, 0.3, 0.7, 0.0, 0.0, 0.0, 0.0], shape=[1, 8], dtype="float32")
    detections = await processor.postprocess({"output": output_tensor}, frame)
    assert len(detections) > 0
    for d in detections:
        assert d.confidence <= 0.99
        assert d.label in ("person", "car", "bicycle", "structure")
        assert d.boundingBox.width > 0
        assert d.boundingBox.height > 0


@pytest.mark.asyncio
async def test_postprocess_filters_low_confidence():
    processor = VisionProcessor()
    frame = CameraFrame(data=[0] * 48, width=4, height=4)
    output_tensor = Tensor(data=[0.01, 0.02, 0.03, 0.04], shape=[1, 4], dtype="float32")
    detections = await processor.postprocess({"output": output_tensor}, frame)
    assert len(detections) == 0


@pytest.mark.asyncio
async def test_detect_objects_requires_loaded_model():
    processor = VisionProcessor()
    frame = CameraFrame(data=[0] * 48, width=4, height=4)
    with pytest.raises(RuntimeError, match="Model not loaded"):
        await processor.detect_objects(frame)


@pytest.mark.asyncio
async def test_load_detection_model():
    processor = VisionProcessor()
    assert processor.model_loaded is False
    await processor.load_detection_model("test_model.onnx")
    assert processor.model_loaded is True


@pytest.mark.asyncio
async def test_detect_objects_after_load():
    processor = VisionProcessor()
    await processor.load_detection_model("test_model.onnx")
    frame = CameraFrame(data=[128] * 48, width=4, height=4)
    detections = await processor.detect_objects(frame)
    assert isinstance(detections, list)


@pytest.mark.asyncio
async def test_postprocess_empty_output():
    processor = VisionProcessor()
    frame = CameraFrame(data=[0] * 48, width=4, height=4)
    detections = await processor.postprocess({}, frame)
    assert detections == []


@pytest.mark.asyncio
async def test_postprocess_block_sizes():
    processor = VisionProcessor()
    frame = CameraFrame(data=[0] * 192, width=16, height=12)
    output_tensor = Tensor(data=[0.9] * 32, shape=[1, 32], dtype="float32")
    detections = await processor.postprocess({"output": output_tensor}, frame)
    for d in detections:
        assert d.boundingBox.width >= 32
        assert d.boundingBox.height >= 32
