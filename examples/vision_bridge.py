#!/usr/bin/env python3
"""Atlas Vision Bridge — Unix socket server wrapping VisionProcessor with YOLO.

Protocol (newline-delimited JSON over Unix socket):
  Request:  {"jpeg_b64": "<base64 JPEG>", "id": 1}
  Response: {"id": 1, "detections": [{"label":"person","confidence":0.95,"bbox":{"x":10,"y":20,"width":100,"height":200}}]}
"""

import asyncio
import json
import base64
import os
import sys
from io import BytesIO

SOCKET_PATH = "/tmp/atlas_vision.sock"

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "atlas-ai-py"))


async def build_processor():
    from atlas_ai.vision import VisionProcessor
    vp = VisionProcessor(backend="local")
    model = os.path.join(os.path.dirname(__file__), "..", "atlas-models", "yolov8n.onnx")
    if os.path.exists(model):
        await vp.load_detection_model(model)
    else:
        await vp.load_detection_model("yolov8n.onnx")
    return vp


async def handle_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    vp = await build_processor()
    try:
        while True:
            line = await reader.readline()
            if not line:
                break
            try:
                req = json.loads(line.decode().strip())
                req_id = req.get("id", 0)
                jpeg_b64 = req.get("jpeg_b64", req.get("pixels_b64", ""))

                if "jpeg_b64" in req or req.get("width", 32) > 100:
                    # Decode JPEG
                    from PIL import Image
                    jpeg_bytes = base64.b64decode(jpeg_b64)
                    pil_img = Image.open(BytesIO(jpeg_bytes)).convert("RGB")
                    w, h = pil_img.size
                    raw = pil_img.tobytes()
                else:
                    # Legacy: raw 32x32 RGB pixels
                    raw = base64.b64decode(jpeg_b64)
                    w, h = req.get("width", 32), req.get("height", 32)

                from atlas_ai.vision import CameraFrame
                frame = CameraFrame(data=raw, width=w, height=h)
                dets = await vp.detect_objects(frame)

                result = [
                    {
                        "label": d.label,
                        "confidence": float(round(d.confidence, 4)),
                        "bbox": {
                            "x": float(round(d.boundingBox.x, 1)),
                            "y": float(round(d.boundingBox.y, 1)),
                            "width": float(round(d.boundingBox.width, 1)),
                            "height": float(round(d.boundingBox.height, 1)),
                        },
                    }
                    for d in dets
                ]
                resp = json.dumps({"id": req_id, "detections": result})
            except Exception as e:
                resp = json.dumps({"id": req.get("id", 0), "error": str(e)})

            writer.write((resp + "\n").encode())
            await writer.drain()
    finally:
        writer.close()


async def main():
    if os.path.exists(SOCKET_PATH):
        os.unlink(SOCKET_PATH)
    server = await asyncio.start_unix_server(handle_client, path=SOCKET_PATH)
    os.chmod(SOCKET_PATH, 0o777)
    print(f"  Vision bridge listening on {SOCKET_PATH}")
    async with server:
        await server.serve_forever()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        if os.path.exists(SOCKET_PATH):
            os.unlink(SOCKET_PATH)
