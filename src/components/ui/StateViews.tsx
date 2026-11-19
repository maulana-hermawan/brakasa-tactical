import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { IconAlertOctagon, IconInfo } from './TacticalIcons';

export function LoadingState({
  label,
}: {
  label?: string;
}): React.JSX.Element {
  const { t } = useLanguage();
  const displayLabel = label ?? t.states.loadingDefault;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
        borderRadius: 'var(--radius-plate)',
      }}
      className="flex min-h-[140px] w-full flex-col items-center justify-center gap-4 border p-6 text-center"
    >
      <div
        aria-hidden="true"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
        className="relative h-1 w-44 overflow-hidden"
      >
        <div
          style={{ backgroundColor: 'var(--accent-primary)' }}
          className="brakasa-loading-indicator absolute inset-y-0 left-0 w-1/3"
        />
      </div>
      <p
        style={{ color: 'var(--text-secondary)' }}
        className="m-0 font-mono-tech text-xs font-medium uppercase tracking-wider"
      >
        {displayLabel}
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}): React.JSX.Element {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-strong)',
        borderRadius: 'var(--radius-plate)',
      }}
      className="flex min-h-[180px] w-full flex-col items-start justify-center gap-3 border border-dashed p-6 sm:p-8"
    >
      <div className="inline-flex items-center gap-2.5">
        <span style={{ color: 'var(--text-muted)' }} className="shrink-0">
          <IconInfo size={18} />
        </span>
        <h3
          style={{ color: 'var(--text-primary)' }}
          className="m-0 text-lg font-semibold leading-snug"
        >
          {title}
        </h3>
      </div>
      <p
        style={{ color: 'var(--text-secondary)' }}
        className="m-0 max-w-[60ch] text-sm leading-relaxed"
      >
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="btn-brakasa btn-secondary mt-2"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}): React.JSX.Element {
  const { t } = useLanguage();
  const displayTitle = title ?? t.states.errorTitleDefault;

  return (
    <div
      role="alert"
      style={{
        backgroundColor: 'var(--status-danger-bg)',
        borderColor: 'var(--status-danger)',
        borderRadius: 'var(--radius-plate)',
      }}
      className="flex w-full flex-col items-start gap-3 border p-6"
    >
      <div className="inline-flex items-center gap-2.5">
        <span style={{ color: 'var(--status-danger)' }} className="shrink-0">
          <IconAlertOctagon size={18} />
        </span>
        <h3
          style={{ color: 'var(--text-primary)' }}
          className="m-0 text-lg font-semibold leading-snug"
        >
          {displayTitle}
        </h3>
      </div>
      <p
        style={{ color: 'var(--text-secondary)' }}
        className="m-0 max-w-[64ch] text-sm leading-relaxed"
      >
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="btn-brakasa btn-secondary mt-1"
        >
          {t.states.retryLabel}
        </button>
      ) : null}
    </div>
  );
}
