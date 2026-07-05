import copy
import time
from typing import Optional

from ..camera.camera_sensor import CameraSensor
from ..detection.object_detector import ObjectDetector
from ..lidar.lidar_sensor import LidarSensor
from ..types import CameraFrame, LidarScan, PerceptionState


class PerceptionPipeline:
    def __init__(self):
        self._camera: Optional[CameraSensor] = None
        self._lidar: Optional[LidarSensor] = None
        self._object_detector: Optional[ObjectDetector] = None
        self._state = PerceptionState(
            cameraFrame=None,
            lidarScan=None,
            detectedObjects=[],
            timestamp=time.time(),
        )

    def attach_camera(self, camera: CameraSensor) -> None:
        self._camera = camera

    def attach_lidar(self, lidar: LidarSensor) -> None:
        self._lidar = lidar

    def attach_object_detector(self, detector: ObjectDetector) -> None:
        self._object_detector = detector

    async def capture_all(self) -> PerceptionState:
        if self._camera:
            frame = self._camera.capture_frame()
            self._state = self._state._replace(cameraFrame=frame)
            if self._object_detector:
                objects = await self._object_detector.detect(frame)
                self._state = self._state._replace(detectedObjects=objects)
            self._state = self._state._replace(timestamp=time.time())
        if self._lidar:
            scan = self._lidar.capture_scan()
            self._state = self._state._replace(lidarScan=scan, timestamp=time.time())
        return self.get_state()

    def get_state(self) -> PerceptionState:
        return copy.deepcopy(self._state)
