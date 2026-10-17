import type { SVGProps } from 'react';

const PATHS = {
  copy: (
    <>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.75" />
      <path d="M10.5 5.5V3.75A1.25 1.25 0 0 0 9.25 2.5h-5.5A1.25 1.25 0 0 0 2.5 3.75v5.5A1.25 1.25 0 0 0 3.75 10.5H5.5" />
    </>
  ),
  check: <path d="m3.25 8.5 3 3 6.5-7" />,
  reveal: (
    <>
      <path d="M2.5 4.75A1.25 1.25 0 0 1 3.75 3.5h2.6l1.4 1.5h4.5a1.25 1.25 0 0 1 1.25 1.25v5.5A1.25 1.25 0 0 1 12.25 13h-8.5A1.25 1.25 0 0 1 2.5 11.75Z" />
      <path d="M7 10.25 9.75 7.5M7.5 7.5h2.25v2.25" />
    </>
  ),
  refresh: (
    <>
      <path d="M13 8a5 5 0 1 1-1.46-3.54" />
      <path d="M13 2.75v2.5h-2.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="8" cy="8" r="2.75" />
      <path d="M8 1.75v1.25M8 13v1.25M1.75 8H3M13 8h1.25M3.6 3.6l.88.88M11.52 11.52l.88.88M3.6 12.4l.88-.88M11.52 4.48l.88-.88" />
    </>
  ),
  moon: <path d="M13.25 9.6A5.5 5.5 0 0 1 6.4 2.75a5.5 5.5 0 1 0 6.85 6.85Z" />,
  search: (
    <>
      <circle cx="7.25" cy="7.25" r="4.25" />
      <path d="m10.5 10.5 3 3" />
    </>
  ),
  alert: (
    <>
      <path d="M7.13 2.75a1 1 0 0 1 1.74 0l5.2 9.25a1 1 0 0 1-.87 1.5H2.8a1 1 0 0 1-.87-1.5Z" />
      <path d="M8 6.5v2.75M8 11.25v.01" />
    </>
  ),
  close: <path d="m4 4 8 8M12 4l-8 8" />,
  plus: <path d="M8 3.5v9M3.5 8h9" />,
  play: <path d="M5 3.4v9.2a.6.6 0 0 0 .9.52l7.6-4.6a.6.6 0 0 0 0-1.04L5.9 2.88A.6.6 0 0 0 5 3.4Z" fill="currentColor" stroke="none" />,
  stop: <rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" stroke="none" />,
  reload: (
    <>
      <path d="M2.75 8a5.25 5.25 0 0 1 9.1-3.57" />
      <path d="M13.25 8a5.25 5.25 0 0 1-9.1 3.57" />
      <path d="M12.25 2.25v2.5h-2.5M3.75 13.75v-2.5h2.5" />
    </>
  ),
  external: (
    <>
      <path d="M9.5 2.5h4v4M13.25 2.75 7.5 8.5" />
      <path d="M12 9.5v2.75A1.25 1.25 0 0 1 10.75 13.5h-7A1.25 1.25 0 0 1 2.5 12.25v-7A1.25 1.25 0 0 1 3.75 4H6.5" />
    </>
  ),
  terminal: (
    <>
      <rect x="2" y="3" width="12" height="10" rx="1.75" />
      <path d="m5 6.5 2 1.5-2 1.5M8.5 10h2.5" />
    </>
  ),
  chevronUp: <path d="m4.5 10 3.5-3.5 3.5 3.5" />,
  chevronDown: <path d="m4.5 6 3.5 3.5 3.5-3.5" />,
  panelLeft: (
    <>
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" />
      <path d="M6 3.5v9" />
    </>
  ),
  panelRight: (
    <>
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" />
      <path d="M10 3.5v9" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

export function Icon({ name, size = 16, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
