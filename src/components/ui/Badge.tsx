import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'olive'
  | 'coyote'
  | 'accent'
  | 'ok'
  | 'warn'
  | 'danger';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  neutral: {
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
    borderColor: 'var(--border-subtle)',
  },
  olive: {
    backgroundColor: 'var(--brand-olive-surface)',
    color: 'var(--brand-olive-tag-text)',
    borderColor: 'var(--brand-olive)',
  },
  coyote: {
    backgroundColor: 'var(--brand-coyote-surface)',
    color: 'var(--brand-coyote-tag-text)',
    borderColor: 'var(--brand-coyote)',
  },
  accent: {
    backgroundColor: 'var(--accent-primary)',
    color: 'var(--accent-foreground)',
    borderColor: 'var(--accent-primary)',
  },
  ok: {
    backgroundColor: 'var(--status-ok-bg)',
    color: 'var(--status-ok)',
    borderColor: 'var(--status-ok)',
  },
  warn: {
    backgroundColor: 'var(--status-warn-bg)',
    color: 'var(--status-warn)',
    borderColor: 'var(--status-warn)',
  },
  danger: {
    backgroundColor: 'var(--status-danger-bg)',
    color: 'var(--status-danger)',
    borderColor: 'var(--status-danger)',
  },
};

export function Badge({
  children,
  variant = 'neutral',
  icon,
  className = '',
}: BadgeProps): React.JSX.Element {
  return (
    <span
      style={{
        ...VARIANT_STYLES[variant],
        borderRadius: 'var(--radius-plate)',
      }}
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono-tech text-xs font-medium leading-tight tracking-wide tabular-nums ${className}`}
    >
      {icon ? <span className="inline-flex shrink-0 items-center">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}
