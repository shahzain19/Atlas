"""
Generate built-in ONNX models for the Atlas platform.
Creates small functional models stored in the models/ directory.
"""
import onnx
from onnx import helper, TensorProto
import numpy as np
import os

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "atlas-models")
os.makedirs(MODELS_DIR, exist_ok=True)


def make_mlp_inference(path: str):
    """3-layer MLP: input(64) -> FC(128,ReLU) -> FC(64,ReLU) -> FC(10,Sigmoid)"""
    np.random.seed(42)

    W1 = np.random.randn(128, 64).astype(np.float32) * 0.1
    B1 = np.zeros(128, dtype=np.float32)
    W2 = np.random.randn(64, 128).astype(np.float32) * 0.1
    B2 = np.zeros(64, dtype=np.float32)
    W3 = np.random.randn(10, 64).astype(np.float32) * 0.1
    B3 = np.zeros(10, dtype=np.float32)

    X = helper.make_tensor_value_info("input", TensorProto.FLOAT, [1, 64])
    Y = helper.make_tensor_value_info("output", TensorProto.FLOAT, [1, 10])

    w1_init = helper.make_tensor("W1", TensorProto.FLOAT, [128, 64], W1.flatten().tolist())
    b1_init = helper.make_tensor("B1", TensorProto.FLOAT, [128], B1.tolist())
    w2_init = helper.make_tensor("W2", TensorProto.FLOAT, [64, 128], W2.flatten().tolist())
    b2_init = helper.make_tensor("B2", TensorProto.FLOAT, [64], B2.tolist())
    w3_init = helper.make_tensor("W3", TensorProto.FLOAT, [10, 64], W3.flatten().tolist())
    b3_init = helper.make_tensor("B3", TensorProto.FLOAT, [10], B3.tolist())

    fc1 = helper.make_node("Gemm", ["input", "W1", "B1"], ["fc1"], name="fc1", transB=1)
    relu1 = helper.make_node("Relu", ["fc1"], ["r1"], name="relu1")
    fc2 = helper.make_node("Gemm", ["r1", "W2", "B2"], ["fc2"], name="fc2", transB=1)
    relu2 = helper.make_node("Relu", ["fc2"], ["r2"], name="relu2")
    fc3 = helper.make_node("Gemm", ["r2", "W3", "B3"], ["fc3"], name="fc3", transB=1)
    sigmoid = helper.make_node("Sigmoid", ["fc3"], ["output"], name="sigmoid")

    graph = helper.make_graph(
        [fc1, relu1, fc2, relu2, fc3, sigmoid],
        "mlp_inference",
        [X],
        [Y],
        [w1_init, b1_init, w2_init, b2_init, w3_init, b3_init],
    )
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 18)])
    onnx.save(model, path)
    print(f"Created {path} ({os.path.getsize(path)} bytes)")


def make_cnn_vision(path: str):
    """Mini CNN: input(3x32x32) -> Conv3x3(8ch) -> MaxPool(2x2) -> Conv3x3(16ch) -> MaxPool(2x2) -> FC(128) -> FC(10)"""
    np.random.seed(42)

    W1 = np.random.randn(8, 3, 3, 3).astype(np.float32) * 0.1
    B1 = np.zeros(8, dtype=np.float32)
    W2 = np.random.randn(16, 8, 3, 3).astype(np.float32) * 0.1
    B2 = np.zeros(16, dtype=np.float32)
    W3 = np.random.randn(128, 16 * 8 * 8).astype(np.float32) * 0.1  # 16ch x 8x8 after two pools
    B3 = np.zeros(128, dtype=np.float32)
    W4 = np.random.randn(10, 128).astype(np.float32) * 0.1
    B4 = np.zeros(10, dtype=np.float32)

    X = helper.make_tensor_value_info("input", TensorProto.FLOAT, [1, 3, 32, 32])
    Y = helper.make_tensor_value_info("output", TensorProto.FLOAT, [1, 10])

    init = [
        helper.make_tensor("W1", TensorProto.FLOAT, [8, 3, 3, 3], W1.flatten().tolist()),
        helper.make_tensor("B1", TensorProto.FLOAT, [8], B1.tolist()),
        helper.make_tensor("W2", TensorProto.FLOAT, [16, 8, 3, 3], W2.flatten().tolist()),
        helper.make_tensor("B2", TensorProto.FLOAT, [16], B2.tolist()),
        helper.make_tensor("W3", TensorProto.FLOAT, [128, 16 * 8 * 8], W3.flatten().tolist()),
        helper.make_tensor("B3", TensorProto.FLOAT, [128], B3.tolist()),
        helper.make_tensor("W4", TensorProto.FLOAT, [10, 128], W4.flatten().tolist()),
        helper.make_tensor("B4", TensorProto.FLOAT, [10], B4.tolist()),
    ]

    conv1 = helper.make_node("Conv", ["input", "W1", "B1"], ["c1"], name="conv1", pads=[1, 1, 1, 1], kernel_shape=[3, 3])
    relu1 = helper.make_node("Relu", ["c1"], ["r1"], name="relu1")
    pool1 = helper.make_node("MaxPool", ["r1"], ["p1"], name="pool1", kernel_shape=[2, 2], strides=[2, 2])
    conv2 = helper.make_node("Conv", ["p1", "W2", "B2"], ["c2"], name="conv2", pads=[1, 1, 1, 1], kernel_shape=[3, 3])
    relu2 = helper.make_node("Relu", ["c2"], ["r2"], name="relu2")
    pool2 = helper.make_node("MaxPool", ["r2"], ["p2"], name="pool2", kernel_shape=[2, 2], strides=[2, 2])
    flatten = helper.make_node("Flatten", ["p2"], ["flat"], name="flatten")
    fc3 = helper.make_node("Gemm", ["flat", "W3", "B3"], ["fc3"], name="fc3", transB=1)
    relu3 = helper.make_node("Relu", ["fc3"], ["r3"], name="relu3")
    fc4 = helper.make_node("Gemm", ["r3", "W4", "B4"], ["output"], name="fc4", transB=1)

    graph = helper.make_graph(
        [conv1, relu1, pool1, conv2, relu2, pool2, flatten, fc3, relu3, fc4],
        "cnn_vision",
        [X],
        [Y],
        init,
    )
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 18)])
    onnx.save(model, path)
    print(f"Created {path} ({os.path.getsize(path)} bytes)")


def make_object_detection(path: str):
    """Tiny detection model: input(3x64x64) -> Conv + Pool -> FC -> [bbox(4), scores(2)]"""
    np.random.seed(42)

    W1 = np.random.randn(4, 3, 5, 5).astype(np.float32) * 0.1
    B1 = np.zeros(4, dtype=np.float32)
    W2 = np.random.randn(128, 4 * 16 * 16).astype(np.float32) * 0.1  # 4ch x 16x16 after pool
    B2 = np.zeros(128, dtype=np.float32)
    W_bbox = np.random.randn(4, 128).astype(np.float32) * 0.1
    B_bbox = np.zeros(4, dtype=np.float32)
    W_score = np.random.randn(2, 128).astype(np.float32) * 0.1
    B_score = np.zeros(2, dtype=np.float32)

    X = helper.make_tensor_value_info("input", TensorProto.FLOAT, [1, 3, 64, 64])
    bbox_out = helper.make_tensor_value_info("bbox", TensorProto.FLOAT, [1, 4])
    score_out = helper.make_tensor_value_info("scores", TensorProto.FLOAT, [1, 2])

    init = [
        helper.make_tensor("W1", TensorProto.FLOAT, [4, 3, 5, 5], W1.flatten().tolist()),
        helper.make_tensor("B1", TensorProto.FLOAT, [4], B1.tolist()),
        helper.make_tensor("W2", TensorProto.FLOAT, [128, 4 * 16 * 16], W2.flatten().tolist()),
        helper.make_tensor("B2", TensorProto.FLOAT, [128], B2.tolist()),
        helper.make_tensor("W_bbox", TensorProto.FLOAT, [4, 128], W_bbox.flatten().tolist()),
        helper.make_tensor("B_bbox", TensorProto.FLOAT, [4], B_bbox.tolist()),
        helper.make_tensor("W_score", TensorProto.FLOAT, [2, 128], W_score.flatten().tolist()),
        helper.make_tensor("B_score", TensorProto.FLOAT, [2], B_score.tolist()),
    ]

    conv1 = helper.make_node("Conv", ["input", "W1", "B1"], ["c1"], name="conv1", pads=[2, 2, 2, 2], kernel_shape=[5, 5])
    relu1 = helper.make_node("Relu", ["c1"], ["r1"], name="relu1")
    pool1 = helper.make_node("MaxPool", ["r1"], ["p1"], name="pool1", kernel_shape=[4, 4], strides=[4, 4])
    flatten = helper.make_node("Flatten", ["p1"], ["flat"], name="flatten")
    fc2 = helper.make_node("Gemm", ["flat", "W2", "B2"], ["fc2"], name="fc2", transB=1)
    relu2 = helper.make_node("Relu", ["fc2"], ["feat"], name="relu2")
    bbox_node = helper.make_node("Gemm", ["feat", "W_bbox", "B_bbox"], ["bbox"], name="bbox_out", transB=1)
    score_node = helper.make_node("Gemm", ["feat", "W_score", "B_score"], ["scores"], name="score_out", transB=1)

    graph = helper.make_graph(
        [conv1, relu1, pool1, flatten, fc2, relu2, bbox_node, score_node],
        "object_detection",
        [X],
        [bbox_out, score_out],
        init,
    )
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 18)])
    onnx.save(model, path)
    print(f"Created {path} ({os.path.getsize(path)} bytes)")


if __name__ == "__main__":
    make_mlp_inference(os.path.join(MODELS_DIR, "mlp_inference.onnx"))
    make_cnn_vision(os.path.join(MODELS_DIR, "cnn_vision.onnx"))
    make_object_detection(os.path.join(MODELS_DIR, "object_detection.onnx"))
    print("All models created in", MODELS_DIR)
