/** Shared layout constants of the 14 x 14 diorama base (x,z in [-7,7], ground at y=0). */
export const HALF = 7;
export const SLAB = 0.1; // sidewalk / lot height

export const LAYER = { DEFAULT: 0, NO_OUTLINE: 1, GROUND: 2, FX: 3 };

export const L = {
  frontWalk: { z0: 3.2, z1: 4.0 },
  rightWalk: { x0: 3.4, x1: 4.1 },
  roadA: { z0: 4.0, z1: 6.3 },
  roadB: { x0: 4.1, x1: 6.4 },
  shop: { x0: -3.2, x1: 2.6, z0: -3.0, z1: 1.0, h: 3.05 },
  canopy: { y: 2.38, depth: 0.72 },
  alley: { x0: -4.4, x1: -3.2 },
  neighbor: { x0: -7, x1: -4.4, z0: -6.8, z1: 1.2 },
};

export function groundY(x, z) {
  if (x < L.roadB.x0 && z < L.roadA.z0) return SLAB;
  if (z > L.roadA.z1 && (x < L.roadB.x0 || x > L.roadB.x1)) return SLAB;
  if (x > L.roadB.x1 && (z < L.roadA.z0 || z > L.roadA.z1)) return SLAB;
  return 0;
}

/** true where rain can reach the ground (not under roofs). */
export function openSky(x, z) {
  const s = L.shop;
  if (x > s.x0 - 0.1 && x < s.x1 + 0.7 && z > s.z0 - 0.1 && z < s.z1 + 0.75) return false;
  const n = L.neighbor;
  if (x > n.x0 && x < n.x1 + 0.35 && z > n.z0 - 0.3 && z < n.z1 + 0.9) return false;
  return true;
}
