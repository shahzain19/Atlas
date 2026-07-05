import math
import struct


def seeded_unit(seed: float) -> float:
    x = math.sin(seed * 12.9898 + 78.233) * 43758.5453
    return x - math.floor(x)


def seeded_range(seed: float, min_val: float, max_val: float) -> float:
    return min_val + seeded_unit(seed) * (max_val - min_val)


def hash_string(input_str: str) -> int:
    h = 0
    for ch in input_str:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h
