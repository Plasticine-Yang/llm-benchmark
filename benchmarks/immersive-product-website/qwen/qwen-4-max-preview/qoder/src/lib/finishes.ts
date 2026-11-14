export type FinishKey = 'obsidian' | 'mist' | 'amber';

export interface Finish {
  key: FinishKey;
  name: string;
  en: string;
  desc: string;
  swatch: string;
  vars: Record<string, string>;
}

export const FINISHES: Finish[] = [
  {
    key: 'obsidian',
    name: '曜石',
    en: 'Obsidian',
    desc: '深石墨阳极氧化，哑光陶瓷质感。光线只在边缘停留。',
    swatch: 'linear-gradient(145deg,#3a3f47,#101216)',
    vars: {
      '--fp-shell-hi': '#3d434c',
      '--fp-shell-mid': '#23262c',
      '--fp-shell-lo': '#0f1115',
      '--fp-band-hi': '#363b43',
      '--fp-band-lo': '#181b1f',
      '--fp-cushion-hi': '#26282d',
      '--fp-cushion-lo': '#0e0f12',
      '--fp-metal-hi': '#a7b0ba',
      '--fp-metal-lo': '#4a515b',
      '--fp-glow': 'rgba(150,172,198,0.10)',
    },
  },
  {
    key: 'mist',
    name: '雾银',
    en: 'Mist Silver',
    desc: '冷调微珠喷砂，冰银表面随环境光呼吸，指纹无处停留。',
    swatch: 'linear-gradient(145deg,#eef1f4,#868d96)',
    vars: {
      '--fp-shell-hi': '#f0f3f6',
      '--fp-shell-mid': '#c2c8cf',
      '--fp-shell-lo': '#7f868f',
      '--fp-band-hi': '#e0e5ea',
      '--fp-band-lo': '#969da6',
      '--fp-cushion-hi': '#34373c',
      '--fp-cushion-lo': '#16171b',
      '--fp-metal-hi': '#f7f9fb',
      '--fp-metal-lo': '#a9b1bb',
      '--fp-glow': 'rgba(206,222,238,0.14)',
    },
  },
  {
    key: 'amber',
    name: '灼琥珀',
    en: 'Burnt Amber',
    desc: '限量烤漆，七层手工打磨。像暗室里一盏将熄未熄的灯。',
    swatch: 'linear-gradient(145deg,#c08a4e,#3f2a15)',
    vars: {
      '--fp-shell-hi': '#b57e46',
      '--fp-shell-mid': '#7d5228',
      '--fp-shell-lo': '#3a2612',
      '--fp-band-hi': '#a06e3a',
      '--fp-band-lo': '#4a3016',
      '--fp-cushion-hi': '#2d2115',
      '--fp-cushion-lo': '#120d07',
      '--fp-metal-hi': '#e6b478',
      '--fp-metal-lo': '#8a5f2e',
      '--fp-glow': 'rgba(216,152,80,0.17)',
    },
  },
];

export const finishByKey = (key: FinishKey): Finish =>
  FINISHES.find((f) => f.key === key) ?? FINISHES[0];