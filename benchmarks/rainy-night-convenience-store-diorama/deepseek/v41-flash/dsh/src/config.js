/**
 * 全局布局参数 —— 一座「正方形底座」上的雨夜便利店街角微缩模型。
 *
 * 坐标系（世界单位 ≈ 米）：
 *   x 轴：向东为正      z 轴：向南为正      y 轴：向上为正
 *   底座 48 × 48，几何中心在原点；顶面 y = 0。
 *
 * 街区结构（从底座边缘向中心）：
 *   ・主路（东西向）沿南侧，z = 8.8 ~ 15.2
 *   ・横街（南北向）沿西侧，x = -15.2 ~ -8.8
 *   ・人行道：主路北侧 z = 6.6 ~ 8.8；横街东侧 x = -8.8 ~ -6.6
 *   ・街区地块：x ≥ -6.6 且 z ≤ 6.6（东北象限）
 *   ・便利店：x ∈ [-6.0, 6.0]，z ∈ [-8.5, 1.5]，正面朝南、玻璃橱窗临西南转角
 *     屋顶敞开（女儿墙围合），俯视时能直接看到明亮的店内 —— 典型 diorama 处理
 *   ・小巷：便利店东侧 x = 6.6 ~ 8.2 的南北向窄巷（死巷，巷尾有小霓虹）
 *   ・停车位：横街东侧 x = -13.2 ~ -9.2，三个车位，正对便利店西侧玻璃
 */

export const BASE = {
  size: 48,          // 正方形底座边长
  thickness: 1.0,    // 底座厚度（微缩模型感：底部可见切面）
  grid: 2.4,         // 底座顶面网格（微弱刻线）
};

export const ROAD = {
  main: { z0: 8.8, z1: 15.2 },   // 主路（东西向）
  side: { x0: -15.2, x1: -8.8 }, // 横街（南北向）
  curbH: 0.16,                   // 路缘石高
  laneY: 0.02,                   // 路面图层高度
};

export const WALK = {
  south: { x0: -6.6, x1: 16.0, z0: 6.6, z1: 8.8, y: ROAD.curbH },
  west:  { x0: -8.8, x1: -6.6, z0: -15.0, z1: 8.8, y: ROAD.curbH },
  alley: { x0: 6.6, x1: 8.2, z0: -8.0, z1: 6.6, y: ROAD.curbH },
};

export const ALLEY = {
  x0: 6.6, x1: 8.2,
  z0: -10.6, z1: 6.6,     // 巷子尽头（z0）用一堵墙封住
};

export const PARKING = {
  x0: -13.2, x1: -9.2,    // 车位深度方向（车头朝东，正对便利店西窗）
  z0: 0.4, z1: 8.2,
  bays: 3,
};

export const STORE = {
  x0: -6.0, x1: 6.0,
  z0: -8.5, z1: 1.5,
  floorY: 0.16,          // 店内地面（与人行道齐平）
  wallT: 0.22,           // 外墙厚度
  wallH: 3.30,           // 外墙高
  ceilingY: 3.30,        // 天花
  parapetY: 3.92,        // 女儿墙顶
  signY: 4.45,           // 主招牌中心高
  awningY: 3.42,         // 雨棚
  doorX: -2.0,           // 自动门中心（南墙）
  doorW: 1.80,           // 自动门洞宽
  doorH: 2.35,
  counter: { x0: -5.4, x1: -3.6, z0: -3.2, z1: -1.6, h: 0.98 },
  shelfRows: [-0.6, -3.0, -5.4],
  shelfX0: -1.8, shelfX1: 3.6,
  cooler: { x0: -5.8, x1: -4.1, z0: -1.2, z1: 1.2, h: 2.15 },    // 饮料冷柜（西墙，玻璃朝店内 → 街上可见）
  iceFreezer: { x0: 4.0, x1: 5.8, z0: -7.9, z1: -5.2, h: 1.0 }, // 冰柜（东北角）
  odenCase: { x0: -5.7, x1: -5.0, z0: -6.4, z1: -3.6, h: 1.12 }, // 关东煮柜台（西墙北段）
  coffee: { x: -4.0, z: -2.0 },   // 咖啡机（柜台上）
  magazine: { x: 4.3, z: -0.6 },  // 杂志架（东南橱窗前）
  backDoor: { x: 0.8, z: -8.5 },  // 后场门（北墙）
  backShelves: { x0: -2.4, x1: 2.6, z0: -8.15, z1: -6.6, h: 2.0 },
  roofOpen: true,                 // 屋顶敞开（俯视可见店内）
};

export const SUN = {
  dir: { x: -0.45, y: 1.0, z: 0.55 },   // 主光（月光）方向
  key: 0xbfd6ff,
  fill: 0x2a3d5c,
  skyCol: 0x0d1a2e,
  groundCol: 0x070a10,
};

/** 关键灯位（世界坐标） */
export const LIGHTS = {
  streetLamp: { x: 9.4, z: 7.5 },       // 路灯
  pole: { x: -7.3, z: 7.4 },            // 电线杆
  pole2: { x: 13.6, z: 7.6 },           // 第二根电线杆
  vending: { x: 3.3, z: 2.5 },          // 自动贩卖机
  signals: { far: { x: -12.4, z: 16.6 }, near: { x: 10.4, z: 16.1 } },
};

export const TIME = {
  rainSpeed: 1.0,
  doorPeriod: 17.0,     // 自动门开合周期（秒）
};

/** 全场景统一调色板（偏冷蓝的雨夜 + 暖黄室内光） */
export const PAL = {
  night: 0x11192b,
  building: 0x8f9bb2,
  buildingDark: 0x5b6478,
  buildingWarm: 0xa8968a,
  tile: 0xb9c1cf,
  road: 0x4d5566,
  roadWet: 0x333b4b,
  walk: 0x8d95a6,
  walkLine: 0xd8dde7,
  curb: 0xa8b0bd,
  storeWall: 0xd9dce4,
  storeTrim: 0xf0f2f6,
  storeFloor: 0xc9c2b4,
  shelf: 0xeceef2,
  metal: 0x99a2b3,
  metalDark: 0x4a5262,
  wood: 0x7a5c46,
  warmLight: 0xffd9a0,
  coolLight: 0xa9dcff,
  neonPink: 0xff6fa8,
  neonCyan: 0x6fe6ff,
  signRed: 0xff5a4d,
  signGreen: 0x53d68a,
  glassTint: 0xbfe6ff,
  outline: 0x14161f,
};

export const BRAND = {
  jp: 'みなとマート',
  en: 'MINATO MART',
  short: 'MM',
  sub: '24H',
};
