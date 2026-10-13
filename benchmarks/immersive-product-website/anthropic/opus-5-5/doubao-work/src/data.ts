export type FinishId = 'obsidian' | 'mist' | 'amber'

export interface Finish {
  id: FinishId
  name: string
  cn: string
  note: string
  swatch: string
}

export const FINISHES: Finish[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    cn: '曜石',
    note: '阳极氧化铝外壳，哑光微喷砂。暗处几乎隐形，只留腔体的一圈冷光。',
    swatch: 'radial-gradient(circle at 32% 28%, #5a6168, #23272b 58%, #121417)',
  },
  {
    id: 'mist',
    name: 'Mist Silver',
    cn: '雾银',
    note: '多层 PVD 镀膜，像清晨金属表面的薄雾，随光线在冷白与灰之间游移。',
    swatch: 'radial-gradient(circle at 32% 28%, #ffffff, #c7ced4 52%, #7c858d)',
  },
  {
    id: 'amber',
    name: 'Burnt Amber',
    cn: '焦琥珀',
    note: '低饱和铜琥珀色，取自老式电子管的余温。每一副的色温都略有不同。',
    swatch: 'radial-gradient(circle at 32% 28%, #e6bb8b, #9a6a40 55%, #3e2817)',
  },
]

export const SECTIONS = [
  { id: 'sound', label: 'Sound', cn: '声场' },
  { id: 'structure', label: 'Structure', cn: '结构' },
  { id: 'specs', label: 'Specifications', cn: '规格' },
  { id: 'purchase', label: 'Purchase', cn: '购买' },
] as const

export const CITIES = ['北京 · 三里屯', '上海 · 南京西路', '广州 · 天环', '深圳 · 万象天地', '成都 · 太古里', '杭州 · 湖滨']
