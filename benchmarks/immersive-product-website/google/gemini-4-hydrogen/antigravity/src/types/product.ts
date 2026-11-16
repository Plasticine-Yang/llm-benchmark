export type FinishId = 'obsidian' | 'mist-silver' | 'burnt-amber'

export interface FinishProfile {
  id: FinishId
  name: string
  zhName: string
  serialCode: string
  materialSummary: string
  tagline: string
  swatchCore: string
  swatchRing: string
  metalLight: string
  metalMid: string
  metalDark: string
  metalStroke: string
  cushionOuter: string
  cushionInner: string
  chamberGlassTop: string
  chamberGlassBottom: string
  chamberRim: string
  chamberDispersionCool: string
  chamberDispersionWarm: string
  driverRing: string
  driverConeLight: string
  driverConeDark: string
  ambientPrimary: string
  ambientSecondary: string
  ambientRim: string
}

export type ReservationMode = 'audition' | 'preorder'

export interface ReservationOrigin {
  x: number
  y: number
  width: number
  height: number
}

export type SoundstagePreset = 'studio' | 'concert' | 'binaural'

export interface NavItem {
  id: 'brand' | 'sound' | 'structure' | 'specifications' | 'purchase'
  label: string
  zhLabel: string
}

export interface StructureChapter {
  id: string
  index: string
  title: string
  enTitle: string
  specTag: string
  description: string
}

export interface SpecEntry {
  label: string
  value: string
  note?: string
}

export interface SpecGroup {
  title: string
  code: string
  entries: SpecEntry[]
}

export interface DesignStoryChapter {
  id: string
  startTime: number
  endTime: number
  timecode: string
  title: string
  subtitle: string
  narration: string
  telemetry: string
}
