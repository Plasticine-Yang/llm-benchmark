import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 18, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const ArrowUpRight = (p: IconProps) => (
  <Base {...p}><path d="M7 17 17 7M8 7h9v9" /></Base>
)
export const ArrowRight = (p: IconProps) => (
  <Base {...p}><path d="M4 12h15M13 6l6 6-6 6" /></Base>
)
export const ArrowDown = (p: IconProps) => (
  <Base {...p}><path d="M12 4v15M6 13l6 6 6-6" /></Base>
)
export const Play = (p: IconProps) => (
  <Base {...p}><path d="m9 6 9 6-9 6V6Z" fill="currentColor" stroke="none" /></Base>
)
export const Pause = (p: IconProps) => (
  <Base {...p}><path d="M9 6v12M15 6v12" strokeWidth="2" /></Base>
)
export const Close = (p: IconProps) => (
  <Base {...p}><path d="M6 6l12 12M18 6 6 18" /></Base>
)
export const Check = (p: IconProps) => (
  <Base {...p}><path d="m5 12.5 4.5 4.5L19 7" /></Base>
)
export const Menu = (p: IconProps) => (
  <Base {...p}><path d="M4 8h16M4 16h16" /></Base>
)
export const Plus = (p: IconProps) => (
  <Base {...p}><path d="M12 5v14M5 12h14" /></Base>
)
export const Skip = (p: IconProps) => (
  <Base {...p}><path d="m5 6 8 6-8 6V6ZM17 6v12" /></Base>
)
export const Spinner = (p: IconProps) => (
  <Base {...p} className={`spin ${p.className ?? ''}`}>
    <path d="M12 3a9 9 0 1 0 9 9" opacity=".9" />
  </Base>
)
