/** Deterministic pseudo-random value in [0, 1) from a numeric seed. */
export function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Deterministic value in [min, max). */
export function seededRange(seed: number, min: number, max: number): number {
  return min + seededUnit(seed) * (max - min);
}

/** Deterministic integer in [min, max]. */
export function seededInt(seed: number, min: number, max: number): number {
  return Math.floor(seededRange(seed, min, max + 1));
}

/** Hash a string into a stable numeric seed. */
export function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}
