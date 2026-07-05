import math
from dataclasses import dataclass, field
from typing import Any
from enum import IntEnum


class EventPriority(IntEnum):
    LOW = 0
    MEDIUM = 1
    HIGH = 2
    CRITICAL = 3


@dataclass
class Event:
    type: str
    timestamp: float
    source: str | None = None
    payload: Any = None
    priority: EventPriority | None = None
    metadata: dict | None = None


@dataclass
class DecisionContext:
    event: Event
    state: dict[str, Any] | None = None


@dataclass
class Decision:
    name: str
    confidence: float
    execute: callable


def hash_string(input_str: str) -> int:
    h = 0
    for ch in input_str:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h


def seeded_unit(seed: int) -> float:
    x = math.sin(seed * 12.9898 + 78.233) * 43758.5453
    return x - math.floor(x)


def seeded_range(seed: int, lo: float, hi: float) -> float:
    return lo + seeded_unit(seed) * (hi - lo)


def seeded_int(seed: int, lo: int, hi: int) -> int:
    return int(seeded_range(seed, float(lo), float(hi + 1)))
