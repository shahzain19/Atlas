import numpy as np
from typing import NamedTuple, Optional, List


class CameraFrame(NamedTuple):
    width: int
    height: int
    channels: int
    data: np.ndarray
    timestamp: float


class LidarPoint(NamedTuple):
    x: float
    y: float
    z: float
    intensity: float
    timestamp: float


class LidarScan(NamedTuple):
    points: List[LidarPoint]
    timestamp: float


class RadarPoint(NamedTuple):
    azimuth: float
    elevation: float
    range: float
    intensity: float
    velocity: Optional[float] = None


class RadarScan(NamedTuple):
    points: List[RadarPoint]
    timestamp: float


class DepthFrame(NamedTuple):
    width: int
    height: int
    depthData: np.ndarray
    timestamp: float
    confidence: Optional[np.ndarray] = None


class ThermalFrame(NamedTuple):
    width: int
    height: int
    temperatureData: np.ndarray
    timestamp: float


class IMUData(NamedTuple):
    acceleration: dict
    gyroscope: dict
    timestamp: float
    magnetometer: Optional[dict] = None


class GPSData(NamedTuple):
    latitude: float
    longitude: float
    timestamp: float
    altitude: Optional[float] = None
    speed: Optional[float] = None
    heading: Optional[float] = None
    accuracy: Optional[float] = None


class DetectedObject(NamedTuple):
    id: str
    label: str
    confidence: float
    boundingBox: dict
    position: dict


class PerceptionState(NamedTuple):
    cameraFrame: Optional[CameraFrame]
    lidarScan: Optional[LidarScan]
    detectedObjects: List[DetectedObject]
    timestamp: float
