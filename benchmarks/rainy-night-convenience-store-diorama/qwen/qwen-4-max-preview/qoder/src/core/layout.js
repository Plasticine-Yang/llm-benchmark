/* Shared world layout. Base is a 24 x 24 square centred on the origin.
 * +Z points to the viewer's front, +X to the right.               */
export const L = {
  half: 12,
  groundY: 0.0,
  walkY: 0.15,

  // convenience store shell
  store: { x0: -7.6, x1: 2.6, z0: -7.2, z1: 0.6, h: 4.4, parapet: 0.55 },
  awn: { front: 2.15, side: 3.45, y: 3.35, t: 0.16 },
  door: { x0: -0.4, x1: 1.6, h: 2.75 },

  // roads
  frontRoad: { z0: 6.0, z1: 10.6 },
  sideRoad: { x0: 5.0, x1: 10.2 },

  // raised sidewalk rectangles [x0, x1, z0, z1]
  walk: [
    [-12, 5.0, -12, 0.9],
    [-5.2, 5.0, 0.9, 6.0],
    [-12, -11.7, 0.9, 6.0],
    [-12, 12, 10.6, 12],
    [10.2, 12, -12, 10.6],
  ],
  parking: { x0: -11.7, x1: -5.2, z0: 0.9, z1: 6.0 },

  // neighbours
  leftBlock: { x0: -12, x1: -9.3, z0: -9.4, z1: -0.8, h: 6.3 },
  backBlock: { x0: -9.3, x1: 5.0, z0: -12, z1: -7.2, h: 5.7 },
  rightBlock: { x0: 10.4, x1: 12, z0: -12, z1: 2.4, h: 3.9 },
  farBlock: { x0: -12, x1: -2.4, z0: 11.0, z1: 12, h: 4.4 },
  alley: { x0: -9.3, x1: -7.6, z0: -9.4, z1: -0.8 },
};

export const STORE_W = L.store.x1 - L.store.x0;
export const STORE_D = L.store.z1 - L.store.z0;
export const STORE_CX = (L.store.x0 + L.store.x1) / 2;
export const STORE_CZ = (L.store.z0 + L.store.z1) / 2;