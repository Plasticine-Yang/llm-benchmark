/**
 * Deterministic seeded PRNG using FNV-1a 32-bit string hash + Mulberry32.
 */
export interface SeededPrng {
  next(): number;
  nextInt(minInclusive: number, maxInclusive: number): number;
  getState(): number;
}

export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createPrng(seed: string, initialState?: number): SeededPrng {
  let state = initialState !== undefined ? (initialState >>> 0) : hashSeed(seed);
  if (state === 0) state = 0x6d2b79f5;

  function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(minInclusive: number, maxInclusive: number): number {
    return minInclusive + Math.floor(next() * (maxInclusive - minInclusive + 1));
  }

  function getState(): number {
    return state >>> 0;
  }

  return { next, nextInt, getState };
}
