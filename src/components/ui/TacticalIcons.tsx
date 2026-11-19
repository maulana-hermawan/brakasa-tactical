import React from 'react';

export interface TacticalIconProps {
  size?: number;
  className?: string;
}

const baseProps = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.85,
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const,
  'aria-hidden': true as const,
  className,
});

export function IconPlay({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polygon points="7,5 19,12 7,19" fill="currentColor" stroke="currentColor" />
    </svg>
  );
}

export function IconPause({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="6" y="5" width="4" height="14" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" fill="currentColor" />
    </svg>
  );
}

export function IconVolumeOn({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polygon points="4,9 9,9 14,5 14,19 9,15 4,15" />
      <polyline points="17,9 19,12 17,15" />
      <polyline points="19.5,6.5 22,12 19.5,17.5" />
    </svg>
  );
}

export function IconVolumeOff({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polygon points="4,9 9,9 14,5 14,19 9,15 4,15" />
      <line x1="17" y1="9" x2="22" y2="15" />
      <line x1="22" y1="9" x2="17" y2="15" />
    </svg>
  );
}

export function IconSun({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="8.5" y="8.5" width="7" height="7" />
      <line x1="12" y1="2.5" x2="12" y2="5.5" />
      <line x1="12" y1="18.5" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="5.5" y2="12" />
      <line x1="18.5" y1="12" x2="21.5" y2="12" />
      <line x1="5.2" y1="5.2" x2="7.3" y2="7.3" />
      <line x1="16.7" y1="16.7" x2="18.8" y2="18.8" />
      <line x1="18.8" y1="5.2" x2="16.7" y2="7.3" />
      <line x1="7.3" y1="16.7" x2="5.2" y2="18.8" />
    </svg>
  );
}

export function IconMoon({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />
    </svg>
  );
}

export function IconCart({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polyline points="3,5 6,5 8.5,16 19,16 21,8 7,8" />
      <rect x="9" y="19" width="2" height="2" fill="currentColor" />
      <rect x="17" y="19" width="2" height="2" fill="currentColor" />
    </svg>
  );
}

export function IconMenu({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="16" y2="18" />
    </svg>
  );
}

export function IconClose({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

export function IconSearch({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="4" y="4" width="12" height="12" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </svg>
  );
}

export function IconShieldCheck({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polygon points="12,3 20,6 20,13 12,21 4,13 4,6" />
      <polyline points="8.5,12 11,14.5 16,9.5" />
    </svg>
  );
}

export function IconAlertTriangle({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polygon points="12,3 22,20 2,20" />
      <line x1="12" y1="9.5" x2="12" y2="14" />
      <rect x="11.2" y="16.5" width="1.6" height="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconAlertOctagon({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polygon points="8,3 16,3 21,8 21,16 16,21 8,21 3,16 3,8" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
  );
}

export function IconChevronLeft({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polyline points="15,5 8,12 15,19" />
    </svg>
  );
}

export function IconChevronRight({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polyline points="9,5 16,12 9,19" />
    </svg>
  );
}

export function IconChevronDown({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polyline points="5,9 12,16 19,9" />
    </svg>
  );
}

export function IconArrowRight({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13,6 19,12 13,18" />
    </svg>
  );
}

export function IconPlus({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconMinus({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconTrash({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polyline points="4,7 20,7" />
      <path d="M9 7V4h6v3" />
      <polygon points="6,7 18,7 17,20 7,20" />
      <line x1="10" y1="11" x2="10" y2="16" />
      <line x1="14" y1="11" x2="14" y2="16" />
    </svg>
  );
}

export function IconTruck({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="2" y="6" width="13" height="10" />
      <polygon points="15,9 20,9 22,12 22,16 15,16" />
      <rect x="5" y="16" width="3" height="3" />
      <rect x="16.5" y="16" width="3" height="3" />
    </svg>
  );
}

export function IconTarget({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="5" y="5" width="14" height="14" />
      <line x1="12" y1="2" x2="12" y2="7" />
      <line x1="12" y1="17" x2="12" y2="22" />
      <line x1="2" y1="12" x2="7" y2="12" />
      <line x1="17" y1="12" x2="22" y2="12" />
      <rect x="11" y="11" width="2" height="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconVideo({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="3" y="6" width="13" height="12" />
      <polygon points="16,10 21,7 21,17 16,14" />
    </svg>
  );
}

export function IconInfo({ size = 18, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="3" y="3" width="18" height="18" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <rect x="11.2" y="7" width="1.6" height="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCheck({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polyline points="4,12.5 9.5,18 20,6.5" />
    </svg>
  );
}

export function IconSliders({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <rect x="7" y="4" width="3" height="4" fill="currentColor" />
      <rect x="14" y="10" width="3" height="4" fill="currentColor" />
      <rect x="9" y="16" width="3" height="4" fill="currentColor" />
    </svg>
  );
}

export function IconGlobe({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="3" y="3" width="18" height="18" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  );
}

export function IconMapPin({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polygon points="12,21 5,13 5,6 12,3 19,6 19,13" />
      <rect x="10" y="8" width="4" height="4" />
    </svg>
  );
}

export function IconClock({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="3" y="3" width="18" height="18" />
      <polyline points="12,7 12,12 16,14" />
    </svg>
  );
}

export function IconPhone({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polygon points="5,4 9,4 11,9 8.5,10.5 13.5,15.5 15,13 20,15 20,19 16,20 8,16 4,8" />
    </svg>
  );
}

export function IconExternalLink({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <polyline points="14,4 20,4 20,10" />
      <line x1="10" y1="14" x2="20" y2="4" />
      <polyline points="18,14 18,20 4,20 4,6 10,6" />
    </svg>
  );
}

export function IconZoomIn({ size = 16, className }: TacticalIconProps): React.JSX.Element {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="4" y="4" width="12" height="12" />
      <line x1="10" y1="7" x2="10" y2="13" />
      <line x1="7" y1="10" x2="13" y2="10" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </svg>
  );
}
