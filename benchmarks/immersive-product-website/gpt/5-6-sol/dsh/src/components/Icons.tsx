import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

export function ArrowUpRight(props: IconProps) {
  return <svg {...base} {...props}><path d="M7 17 17 7M8 7h9v9" /></svg>
}

export function ArrowRight(props: IconProps) {
  return <svg {...base} {...props}><path d="M5 12h14M14 7l5 5-5 5" /></svg>
}

export function Play(props: IconProps) {
  return <svg {...base} {...props}><path d="m9 7 8 5-8 5V7Z" /></svg>
}

export function Close(props: IconProps) {
  return <svg {...base} {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>
}

export function Check(props: IconProps) {
  return <svg {...base} {...props}><path d="m5 12 4 4L19 6" /></svg>
}

export function ChevronDown(props: IconProps) {
  return <svg {...base} {...props}><path d="m7 10 5 5 5-5" /></svg>
}

export function HeadphonesIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2v-3ZM20 14a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2v-3Z" /></svg>
}

export function SoundWave(props: IconProps) {
  return <svg {...base} {...props}><path d="M4 9v6M8 6v12M12 3v18M16 7v10M20 10v4" /></svg>
}

export function Bluetooth(props: IconProps) {
  return <svg {...base} {...props}><path d="m7 7 10 10-5 4V3l5 4L7 17" /></svg>
}

export function Battery(props: IconProps) {
  return <svg {...base} {...props}><rect x="3" y="7" width="17" height="10" rx="2"/><path d="M21 10v4M6 10v4M9 10v4M12 10v4M15 10v4" /></svg>
}

export function Weight(props: IconProps) {
  return <svg {...base} {...props}><path d="M5 8h14l2 13H3L5 8ZM9 8a3 3 0 0 1 6 0" /></svg>
}

export function Charge(props: IconProps) {
  return <svg {...base} {...props}><path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" /></svg>
}
