import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.35,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
}

export function ArrowUpRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}

export function ArrowLeft(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 12H5M11 6l-6 6 6 6" />
    </svg>
  )
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 7.3v9.4L16 12 9 7.3Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 7v10M15 7v10" strokeWidth="1.8" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8.5h16M9 15.5h11" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.5 4.2 4L19 6.8" />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m7 9.5 5 5 5-5" />
    </svg>
  )
}

export function VolumeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10v4h4l5 4V6L8 10H4Z" />
      <path d="M16 9.2a4.3 4.3 0 0 1 0 5.6M18.7 6.8a8 8 0 0 1 0 10.4" />
    </svg>
  )
}

export function HeadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.5a7 7 0 0 0-7 7v4.2A2.8 2.8 0 0 0 7.8 18H9v-5H6.6M12 4.5a7 7 0 0 1 7 7v4.2a2.8 2.8 0 0 1-2.8 2.3H15v-5h2.4" />
    </svg>
  )
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20V4M6 10l6-6 6 6" />
    </svg>
  )
}

export function MoveIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v18M3 12h18M9.5 5.5 12 3l2.5 2.5M9.5 18.5 12 21l2.5-2.5M5.5 9.5 3 12l2.5 2.5M18.5 9.5 21 12l-2.5 2.5" />
    </svg>
  )
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.4 2.4M15.6 15.6 18 18M18 6l-2.4 2.4M8.4 15.6 6 18" />
    </svg>
  )
}
