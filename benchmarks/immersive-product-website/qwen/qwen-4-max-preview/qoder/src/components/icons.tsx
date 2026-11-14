interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const IconArrowRight = ({ size = 18, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const IconArrowUpRight = ({ size = 18, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </svg>
);

export const IconPlay = ({ size = 18 }: IconProps) => (
  <svg {...base(size)} strokeWidth={0} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a.6.6 0 0 0 .92.5l10-6.5a.6.6 0 0 0 0-1l-10-6.5a.6.6 0 0 0-.92.5Z" />
  </svg>
);

export const IconPause = ({ size = 18 }: IconProps) => (
  <svg {...base(size)} strokeWidth={0} fill="currentColor" stroke="none">
    <rect x="6.5" y="5" width="3.6" height="14" rx="1.1" />
    <rect x="13.9" y="5" width="3.6" height="14" rx="1.1" />
  </svg>
);

export const IconX = ({ size = 18, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </svg>
);

export const IconCheck = ({ size = 18, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const IconSoundOn = ({ size = 18, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
    <path d="M15.5 9a4.2 4.2 0 0 1 0 6" />
    <path d="M18 6.5a8 8 0 0 1 0 11" />
  </svg>
);

export const IconSoundOff = ({ size = 18, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
    <path d="m16 9.5 5 5" />
    <path d="m21 9.5-5 5" />
  </svg>
);

export const IconMenu = ({ size = 18, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M4 7.5h16" />
    <path d="M4 12h16" />
    <path d="M4 16.5h10" />
  </svg>
);

export const IconDownload = ({ size = 18, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M12 4v10.5" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M4.5 19.5h15" />
  </svg>
);

export const IconBattery = ({ size = 18, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <rect x="2.5" y="8" width="16" height="8.5" rx="2.2" />
    <path d="M21 10.8v3" />
    <path d="M5.5 10.8v3" />
    <path d="M8.5 10.8v3" />
    <path d="M11.5 10.8v3" />
  </svg>
);

export const IconSpatial = ({ size = 18, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M5.5 5.5a9.2 9.2 0 0 0 0 13" />
    <path d="M18.5 5.5a9.2 9.2 0 0 1 0 13" />
    <path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6" />
    <path d="M15.8 8.2a5.4 5.4 0 0 1 0 7.6" />
  </svg>
);

export const IconDriver = ({ size = 18, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconAlert = ({ size = 14, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.8v5" />
    <path d="M12 16.2h.01" />
  </svg>
);

export const IconReplay = ({ size = 18, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
    <path d="M6.5 3.5v3.4h3.4" />
  </svg>
);

export const BrandMark = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
  </svg>
);