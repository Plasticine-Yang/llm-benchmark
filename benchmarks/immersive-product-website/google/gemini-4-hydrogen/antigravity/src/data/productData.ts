import type {
  DesignStoryChapter,
  FinishId,
  FinishProfile,
  NavItem,
  SpecGroup,
  StructureChapter,
} from '../types/product'

export const NAV_ITEMS: NavItem[] = [
  { id: 'brand', label: 'Brand', zhLabel: '品牌' },
  { id: 'sound', label: 'Sound', zhLabel: '声场' },
  { id: 'structure', label: 'Structure', zhLabel: '结构' },
  { id: 'specifications', label: 'Specifications', zhLabel: '规格' },
  { id: 'purchase', label: 'Purchase', zhLabel: '购买' },
]

export const FINISHES: Record<FinishId, FinishProfile> = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    zhName: '黑曜石墨',
    serialCode: 'N1-OBS // 01',
    materialSummary: '深空石墨阳极氧化铝 · 烟熏蓝宝石级腔体 · 哑光钨金内环',
    tagline: '沉静吸光表面与幽暗透明腔体的零干扰声学基准。',
    swatchCore: '#20252E',
    swatchRing: '#687487',
    metalLight: '#495261',
    metalMid: '#272C36',
    metalDark: '#13161C',
    metalStroke: 'rgba(220, 228, 238, 0.28)',
    cushionOuter: '#1D2129',
    cushionInner: '#12151B',
    chamberGlassTop: 'rgba(218, 228, 242, 0.16)',
    chamberGlassBottom: 'rgba(18, 22, 29, 0.82)',
    chamberRim: 'rgba(224, 232, 244, 0.48)',
    chamberDispersionCool: 'rgba(180, 206, 236, 0.36)',
    chamberDispersionWarm: 'rgba(201, 138, 75, 0.34)',
    driverRing: '#C98A4B',
    driverConeLight: '#333B48',
    driverConeDark: '#151921',
    ambientPrimary: 'rgba(176, 194, 218, 0.14)',
    ambientSecondary: 'rgba(201, 138, 75, 0.12)',
    ambientRim: 'rgba(216, 226, 240, 0.22)',
  },
  'mist-silver': {
    id: 'mist-silver',
    name: 'Mist Silver',
    zhName: '雾银',
    serialCode: 'N1-SLV // 02',
    materialSummary: '细珠喷砂冰银铝合金 · 晶体高透腔体 · 缎面冷钛声环',
    tagline: '如冷室仪表般凛冽通透的金属光泽，映出清晰内部声路。',
    swatchCore: '#B8C3D1',
    swatchRing: '#E6ECF5',
    metalLight: '#DDE5EF',
    metalMid: '#98A4B5',
    metalDark: '#525C6B',
    metalStroke: 'rgba(242, 247, 252, 0.62)',
    cushionOuter: '#353C48',
    cushionInner: '#1F242D',
    chamberGlassTop: 'rgba(240, 246, 252, 0.28)',
    chamberGlassBottom: 'rgba(54, 64, 79, 0.66)',
    chamberRim: 'rgba(242, 247, 255, 0.72)',
    chamberDispersionCool: 'rgba(210, 228, 248, 0.56)',
    chamberDispersionWarm: 'rgba(212, 168, 122, 0.28)',
    driverRing: '#D2DBE6',
    driverConeLight: '#6F7B8E',
    driverConeDark: '#262C36',
    ambientPrimary: 'rgba(214, 228, 245, 0.22)',
    ambientSecondary: 'rgba(148, 172, 201, 0.13)',
    ambientRim: 'rgba(232, 240, 250, 0.36)',
  },
  'burnt-amber': {
    id: 'burnt-amber',
    name: 'Burnt Amber',
    zhName: '焦糖琥珀',
    serialCode: 'N1-AMB // 03',
    materialSummary: '暗古铜电镀石墨机身 · 琥珀滤光声学罩 · 精车紫铜线圈环',
    tagline: '在暗室微光中折射温润琥珀火彩，致敬真空管模拟听感。',
    swatchCore: '#8D5A32',
    swatchRing: '#D39759',
    metalLight: '#7D5B42',
    metalMid: '#3B2D25',
    metalDark: '#1C1614',
    metalStroke: 'rgba(229, 179, 124, 0.38)',
    cushionOuter: '#27201D',
    cushionInner: '#171312',
    chamberGlassTop: 'rgba(229, 171, 108, 0.22)',
    chamberGlassBottom: 'rgba(34, 24, 19, 0.80)',
    chamberRim: 'rgba(232, 176, 114, 0.54)',
    chamberDispersionCool: 'rgba(210, 218, 230, 0.26)',
    chamberDispersionWarm: 'rgba(224, 146, 68, 0.54)',
    driverRing: '#DF9B54',
    driverConeLight: '#4C392C',
    driverConeDark: '#1E1714',
    ambientPrimary: 'rgba(206, 138, 69, 0.22)',
    ambientSecondary: 'rgba(156, 98, 46, 0.14)',
    ambientRim: 'rgba(224, 164, 102, 0.34)',
  },
}

export const FINISH_ORDER: FinishId[] = ['obsidian', 'mist-silver', 'burnt-amber']

export const STRUCTURE_CHAPTERS: StructureChapter[] = [
  {
    id: 'layer-headband',
    index: '01',
    title: '一体锻造钛钢头梁与阻尼转轴',
    enTitle: 'FORGED YOKE & TORSION BRIDGE',
    specTag: '312 g 零压均衡配重',
    description:
      '航空级铝合金与弹簧钛钢芯一体化弯折，配合双向无级阻尼转轴，将整机 312 g 重量均匀分摊至颅顶弧线。',
  },
  {
    id: 'layer-chamber',
    index: '02',
    title: '透明双腔体声学架构',
    enTitle: 'DUAL TRANSPARENT CHAMBERS',
    specTag: '正反独立隔离谐振腔',
    description:
      '高透光学级聚碳酸酯外罩内部嵌套亥姆霍兹阻尼副腔，前后声波互不串扰，消除封闭式耳机的腔体浑浊染色。',
  },
  {
    id: 'layer-driver',
    index: '03',
    title: '38 mm 铍振膜单元与空间引擎',
    enTitle: '38 MM BERYLLIUM DRIVER & IMU',
    specTag: '1000 Hz 动态 HRTF 追踪',
    description:
      '特制 38 mm 纯铍球顶动圈协同六轴惯性传感芯片，以微秒级响应锁定空间坐标，转头时声像依然锚定原位。',
  },
  {
    id: 'layer-cushion',
    index: '04',
    title: '阶梯式微孔声学耳垫',
    enTitle: 'MICRO-PERFORATED ACOUSTIC SEAL',
    specTag: '-38 dB 被动+混合降噪基底',
    description:
      '内侧采用渐进密度记忆海绵与低损耗蛋白皮，形成恒压声学密封环，稳定保留 18 Hz 极低频下潜与细腻残响。',
  },
]

export const CORE_HIGHLIGHTS = [
  { label: '整机重量', code: 'WEIGHT', value: '312 g' },
  { label: '无线协议', code: 'BLUETOOTH', value: 'Bluetooth 5.4' },
  { label: '连续续航', code: 'BATTERY', value: '42 h' },
  { label: '极速快充', code: 'FAST CHARGE', value: '10 min / 6 h' },
  { label: '发售定价', code: 'LAUNCH PRICE', value: '¥3,499' },
]

export const SPEC_GROUPS: SpecGroup[] = [
  {
    title: '声学与空间架构',
    code: 'ACOUSTICS & SPATIAL',
    entries: [
      { label: '换能单元', value: '38 mm 铍振膜双腔体动圈' },
      { label: '空间引擎', value: 'Spatial Engine · 个性化 HRTF + 头部追踪' },
      { label: '声学腔体', value: '透明双腔体（亥姆霍兹阻尼隔离）' },
      { label: '频响范围', value: '6 Hz — 44,000 Hz（Hi-Res 参考曲线）' },
    ],
  },
  {
    title: '连接、续航与物理参数',
    code: 'POWER, LINK & CHASSIS',
    entries: [
      { label: '整机重量', value: '312 g' },
      { label: '无线连接', value: 'Bluetooth 5.4 · LDAC / AAC / USB-C 无损' },
      { label: '续航与快充', value: '42 h 连续播放 · 10 min / 6 h 闪充' },
      { label: '首发售价', value: '¥3,499（含定制声学硬壳收纳盒）' },
    ],
  },
]

export const LISTENING_STUDIOS = [
  '上海 · 静安声学空间（铜仁路 88 号）',
  '北京 · 三里屯声学室（北区 N4）',
  '深圳 · 南山声学实验室（万象天地）',
  '成都 · 太古里私人声场体验间',
]

export const TIME_SLOTS = [
  '工作日午后（14:00 — 17:30）',
  '晚间静谧场（19:00 — 21:30）',
  '周末全天私人席位',
]

export const DESIGN_STORY_CHAPTERS: DesignStoryChapter[] = [
  {
    id: 'origin',
    startTime: 0,
    endTime: 22,
    timecode: '00:00 — 00:22',
    title: '第一幕 · 暗室中的声学原初',
    subtitle: 'AN INSTRUMENT IN A DARK ROOM',
    narration:
      '一切始于消声室的零分贝基准线。我们拒绝将耳机视作消费电子饰品，而是以精密声学仪器的尺度重新雕刻每一道空气通道。',
    telemetry: 'NOISE FLOOR -118 dB // ANECHOIC BASELINE',
  },
  {
    id: 'chambers',
    startTime: 22,
    endTime: 48,
    timecode: '00:22 — 00:48',
    title: '第二幕 · 透明双腔体的物理真相',
    subtitle: 'DUAL TRANSPARENT ACOUSTIC CHAMBERS',
    narration:
      '透明不是装饰，而是声学结构诚实性的证明。前腔聚焦瞬态响应，后腔通过精密微孔泄压阻尼抑制驻波，让细节如玻璃般清澈。',
    telemetry: 'THD < 0.08% @ 1 kHz // DUAL ISOLATED VOLUMES',
  },
  {
    id: 'spatial',
    startTime: 48,
    endTime: 72,
    timecode: '00:48 — 01:12',
    title: '第三幕 · Spatial Engine 与个性化 HRTF',
    subtitle: 'BUILDING SPACE AROUND THE LISTENER',
    narration:
      '声音不该被囚禁在左右耳膜之间。通过扫描耳廓反射特征与每秒千次姿态采样，NOCTURNE ONE 在颅外重建一座可步入的三维声场。',
    telemetry: '6-AXIS IMU // 1000 Hz HRTF CONVOLUTION',
  },
  {
    id: 'craft',
    startTime: 72,
    endTime: 90,
    timecode: '01:12 — 01:30',
    title: '第四幕 · 312 g 与 42 小时的持久陪伴',
    subtitle: 'CALIBRATED BALANCE FOR LONG SESSIONS',
    narration:
      '312 g 均衡配重消解长时间佩戴的压迫感，Bluetooth 5.4 与 42 小时续航让你在长途飞行或深夜工作室中，始终置身纯净声场。',
    telemetry: '312 g // 42 h PLAYBACK // 10 min → 6 h',
  },
]
