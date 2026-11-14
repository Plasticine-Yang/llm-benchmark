import type { CSSProperties } from 'react'

export type FinishId = 'obsidian' | 'mist' | 'amber'

export type Finish = {
  id: FinishId
  name: string
  en: string
  code: string
  note: string
  swatch: string
  vars: CSSProperties
}

export const FINISHES: Finish[] = [
  {
    id: 'obsidian',
    name: '曜石黑',
    en: 'Obsidian',
    code: 'N01 / OBS',
    note: '微砂阳极氧化铝，哑光深石墨。',
    swatch: 'linear-gradient(135deg, #616b6d, #23292b 58%, #0f1415)',
    vars: {
      '--shell-1': '#41494b',
      '--shell-2': '#171c1e',
      '--shell-edge': '#9aa8ab',
      '--chamber-tint': '#8fb4bb',
      '--ambient': '#7e958f',
    } as CSSProperties,
  },
  {
    id: 'mist',
    name: '雾银',
    en: 'Mist Silver',
    code: 'N01 / MST',
    note: '喷砂冷银，边缘保留一道镜面倒角。',
    swatch: 'linear-gradient(135deg, #f0f4f4, #adb9bb 52%, #5e6a6d)',
    vars: {
      '--shell-1': '#b7c3c5',
      '--shell-2': '#59666a',
      '--shell-edge': '#f2f7f7',
      '--chamber-tint': '#c6e0e3',
      '--ambient': '#a9c2c2',
    } as CSSProperties,
  },
  {
    id: 'amber',
    name: '灼琥珀',
    en: 'Burnt Amber',
    code: 'N01 / AMB',
    note: '限量阳极着色，随光线呈现暖铜色阶。',
    swatch: 'linear-gradient(135deg, #e3b17c, #a86b3c 52%, #3d2618)',
    vars: {
      '--shell-1': '#a46b41',
      '--shell-2': '#3b271b',
      '--shell-edge': '#e7b880',
      '--chamber-tint': '#e0a86e',
      '--ambient': '#c07b40',
    } as CSSProperties,
  },
]
