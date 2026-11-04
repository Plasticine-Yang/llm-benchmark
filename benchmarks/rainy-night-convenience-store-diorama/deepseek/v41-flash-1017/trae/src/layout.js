// 场景统一坐标：底座 24 × 24，x 向右，z 向观察者（+z 为店铺正面朝向）
export const BASE = { size: 24, half: 12 };
export const SIDEWALK_Y = 0.02;

export const STORE = {
  x0: -3,
  x1: 8,
  z0: -9,
  z1: 1,
  floorY: 0.5,
  ceilY: 3.28,
  glassBottom: 0.6,
  glassTop: 3.02,
  signTop: 4.02,
  f2Top: 6.55,
  roofTop: 6.82,
  parapetTop: 7.16,
};

export const PYLON = { x: -4.85, z: 0.2 };
export const STREET_LAMP = { x: -5.32, z: 3.78 };
export const VENDING = { x: 9.35, z: 2.62 };
export const BINS = { x: 10.75, z: 2.62 };
export const POLE_A = { x: -8.9, z: 9.72 };
export const POLE_B = { x: 6.7, z: 9.72 };
export const TRAFFIC = { x: -10.55, z: 9.35 };
export const DOOR = { x0: 1.1, x1: 2.9 };

export const ROAD = {
  front: { z0: 4.0, z1: 8.8 },
  left: { x0: -10.2, x1: -5.6 },
  alley: { x0: 8.0, x1: 11.6, z0: -12, z1: 1.0 },
};

export const SIDEWALKS = [
  // 店前人行道（一直延伸到巷口）
  { x0: -5.6, z0: 1.0, x1: 12, z1: 4.0 },
  // 店铺左侧人行道
  { x0: -5.6, z0: -12, x1: -3.0, z1: 1.0 },
  // 街道对面人行道（前街，被左侧路口切开）
  { x0: -12, z0: 8.8, x1: -10.2, z1: 10.8 },
  { x0: -5.6, z0: 8.8, x1: 12, z1: 10.8 },
  // 左侧街道对面人行道（同样被前街切开）
  { x0: -11.8, z0: -12, x1: -10.2, z1: 4.0 },
  { x0: -11.8, z0: 8.8, x1: -10.2, z1: 12 },
];

export const ROADS = [
  { x0: -12, z0: 4.0, x1: 12, z1: 8.8 },
  { x0: -10.2, z0: -12, x1: -5.6, z1: 12 },
  { x0: 8.0, z0: -12, x1: 11.6, z1: 1.0 },
  { x0: -3.0, z0: -12, x1: 8.0, z1: -9.0 },
];
