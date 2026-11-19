import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdminDeleteVoucherResponse,
  AdminVoucherListResponse,
  Voucher,
} from '../../../shared/types';
import { VoucherEditorModal } from '../../components/admin/VoucherEditorModal';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateViews';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCopy } from '../../i18n/admin';
import { ApiRequestError, apiFetch } from '../../lib/api';
import { formatDateTimeId, formatIdr } from '../../lib/format';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

export function AdminVouchersPage(): React.JSX.Element {
  const { lang } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);
  useDocumentTitle(copy.vouchers.docTitle);

  const { refresh: refreshAuth } = useAdminAuth();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null);
  const [deletePending, setDeletePending] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteDialogRef = useRef<HTMLDivElement | null>(null);
  const deleteCancelRef = useRef<HTMLButtonElement | null>(null);
  const deletePrevFocusRef = useRef<HTMLElement | null>(null);

  const loadVouchers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<AdminVoucherListResponse>('/api/admin/vouchers');
      setVouchers(response.vouchers);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        await refreshAuth();
        return;
      }
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(copy.vouchers.errorFallback);
      }
    } finally {
      setLoading(false);
    }
  }, [refreshAuth, copy.vouchers.errorFallback]);

  useEffect(() => {
    void loadVouchers();
  }, [loadVouchers]);

  useEffect(() => {
    if (!deletingVoucher) return;

    deletePrevFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      deleteCancelRef.current?.focus();
    }, 10);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDeletingVoucher(null);
        setDeleteError(null);
        return;
      }

      if (event.key === 'Tab' && deleteDialogRef.current) {
        const focusables = deleteDialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      deletePrevFocusRef.current?.focus();
    };
  }, [deletingVoucher]);

  const handleToggleActive = async (voucher: Voucher): Promise<void> => {
    setTogglingId(voucher.id);
    setNotice(null);
    setError(null);
    try {
      const updated = await apiFetch<Voucher>(`/api/admin/vouchers/${voucher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !voucher.isActive }),
      });
      setVouchers((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setNotice(copy.vouchers.toggledNotice(updated.code, updated.isActive));
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(copy.vouchers.toggleErrorFallback);
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deletingVoucher) return;
    setDeletePending(true);
    setDeleteError(null);
    try {
      await apiFetch<AdminDeleteVoucherResponse>(`/api/admin/vouchers/${deletingVoucher.id}`, {
        method: 'DELETE',
      });
      setNotice(copy.vouchers.deletedNotice(deletingVoucher.code));
      setDeletingVoucher(null);
      void loadVouchers();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setDeleteError(err.message);
      } else {
        setDeleteError(copy.vouchers.deleteErrorFallback);
      }
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase leading-none tracking-[0.01em] text-[var(--text-primary)] sm:text-4xl">
          {copy.vouchers.title}
        </h1>

        <button
          type="button"
          onClick={() => {
            setEditingVoucher(null);
            setEditorOpen(true);
          }}
          className="inline-flex min-h-[44px] items-center justify-center rounded-[4px] bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--text-primary)]"
        >
          {copy.vouchers.createBtn}
        </button>
      </header>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-2 rounded-[2px] border border-[var(--status-ok)] bg-[var(--status-ok-bg)] px-4 py-3 text-sm text-[var(--status-ok)]"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="min-h-[44px] rounded-[4px] border border-[var(--status-ok)] px-3 text-xs font-semibold"
          >
            {copy.common.close}
          </button>
        </div>
      )}

      {error && vouchers.length > 0 && (
        <div
          role="alert"
          className="rounded-[2px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger)]"
        >
          {error}
        </div>
      )}

      {loading ? (
        <LoadingState label={copy.vouchers.loadingLabel} />
      ) : error && vouchers.length === 0 ? (
        <ErrorState
          title={copy.vouchers.errorTitle}
          message={error}
          onRetry={() => void loadVouchers()}
        />
      ) : vouchers.length === 0 ? (
        <EmptyState
          title={copy.vouchers.emptyTitle}
          description={copy.vouchers.emptyDesc}
          actionLabel={copy.vouchers.createBtn}
          onAction={() => {
            setEditingVoucher(null);
            setEditorOpen(true);
          }}
        />
      ) : (
        <>
          {/* Mobile Cards (< 768px) */}
          <div className="space-y-3 md:hidden">
            {vouchers.map((v) => (
              <article
                key={v.id}
                className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-[family-name:var(--font-mono)] text-base font-bold text-[var(--accent-text)]">
                      {v.code}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      {v.description || copy.vouchers.noDescription}
                    </p>
                  </div>
                  <span
                    className={[
                      'shrink-0 rounded-[2px] border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold',
                      v.isActive
                        ? 'border-[var(--status-ok)] bg-[var(--status-ok-bg)] text-[var(--status-ok)]'
                        : 'border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-muted)]',
                    ].join(' ')}
                  >
                    {v.isActive ? copy.vouchers.activeBadge : copy.vouchers.inactiveBadge}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-2 border-t border-[var(--border-subtle)] pt-2.5 font-[family-name:var(--font-mono)] text-xs tabular-nums">
                  <div>
                    <dt className="text-[10px] text-[var(--text-muted)]">
                      {copy.vouchers.mobileDiscountValue}
                    </dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {v.discountType === 'PERCENT'
                        ? `${v.discountValue}%${v.maxDiscountIdr ? ` (${copy.vouchers.maxCap(formatIdr(v.maxDiscountIdr))})` : ''}`
                        : formatIdr(v.discountValue)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-[var(--text-muted)]">
                      {copy.vouchers.mobileUsedQuota}
                    </dt>
                    <dd className="font-semibold text-[var(--text-primary)]">
                      {v.usedCount} / {v.maxUses ?? copy.vouchers.unlimited}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-[var(--text-muted)]">
                      {copy.vouchers.mobileMinSubtotal}
                    </dt>
                    <dd className="text-[var(--text-secondary)]">{formatIdr(v.minSubtotalIdr)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-[var(--text-muted)]">
                      {copy.vouchers.mobileVisibility}
                    </dt>
                    <dd className="text-[var(--text-secondary)]">
                      {v.isPublic ? copy.vouchers.visibilityPublic : copy.vouchers.visibilityPrivate}
                    </dd>
                  </div>
                </dl>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVoucher(v);
                      setEditorOpen(true);
                    }}
                    className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2 text-xs font-semibold text-[var(--text-primary)]"
                  >
                    {copy.common.edit}
                  </button>
                  <button
                    type="button"
                    disabled={togglingId === v.id}
                    onClick={() => void handleToggleActive(v)}
                    className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-2 text-xs font-medium text-[var(--text-primary)]"
                  >
                    {v.isActive ? copy.vouchers.deactivate : copy.vouchers.activate}
                  </button>
                  <button
                    type="button"
                    disabled={v.usedCount > 0}
                    title={
                      v.usedCount > 0
                        ? copy.vouchers.usedTooltip(v.usedCount)
                        : copy.vouchers.deleteTooltip(v.code)
                    }
                    onClick={() => {
                      setDeletingVoucher(v);
                      setDeleteError(null);
                    }}
                    className="min-h-[44px] rounded-[4px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-2 text-xs font-medium text-[var(--status-danger)]"
                  >
                    {copy.common.delete}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop Table (>= 768px) */}
          <div className="hidden md:block overflow-x-auto rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                  <th className="px-3 py-3 font-medium">{copy.vouchers.colCodeDesc}</th>
                  <th className="px-3 py-3 font-medium">{copy.vouchers.colDiscount}</th>
                  <th className="px-3 py-3 font-medium">{copy.vouchers.colMinSpend}</th>
                  <th className="px-3 py-3 font-medium">{copy.vouchers.colUsage}</th>
                  <th className="px-3 py-3 font-medium">{copy.vouchers.colValidity}</th>
                  <th className="px-3 py-3 font-medium">{copy.vouchers.colStatus}</th>
                  <th className="px-3 py-3 text-right font-medium">{copy.vouchers.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {vouchers.map((v) => (
                  <tr
                    key={v.id}
                    className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
                  >
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-mono)] text-sm font-bold text-[var(--accent-text)]">
                          {v.code}
                        </span>
                        <span className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">
                          {v.isPublic ? copy.common.publicTag : copy.common.privateTag}
                        </span>
                      </div>
                      <p className="mt-0.5 max-w-[260px] text-xs text-[var(--text-secondary)]">
                        {v.description || copy.vouchers.noDescription}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 align-top font-[family-name:var(--font-mono)] tabular-nums">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        {v.discountType === 'PERCENT'
                          ? `${v.discountValue}%`
                          : formatIdr(v.discountValue)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        {v.discountType === 'PERCENT'
                          ? v.maxDiscountIdr
                            ? copy.vouchers.maxCap(formatIdr(v.maxDiscountIdr))
                            : copy.vouchers.noCap
                          : copy.vouchers.fixedDiscount}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 align-top font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-primary)]">
                      {formatIdr(v.minSubtotalIdr)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 align-top font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-primary)]">
                      {v.usedCount} / {v.maxUses ?? copy.vouchers.unlimited}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 align-top font-[family-name:var(--font-mono)] text-[11px] tabular-nums text-[var(--text-muted)]">
                      {v.startsAt || v.expiresAt ? (
                        <div>
                          <p>
                            {copy.vouchers.startsPrefix}:{' '}
                            {v.startsAt ? formatDateTimeId(v.startsAt, lang) : copy.vouchers.immediate}
                          </p>
                          <p>
                            {copy.vouchers.endsPrefix}:{' '}
                            {v.expiresAt ? formatDateTimeId(v.expiresAt, lang) : copy.vouchers.noExpiry}
                          </p>
                        </div>
                      ) : (
                        copy.vouchers.alwaysValid
                      )}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 align-top">
                      <span
                        className={[
                          'inline-flex rounded-[2px] border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold',
                          v.isActive
                            ? 'border-[var(--status-ok)] bg-[var(--status-ok-bg)] text-[var(--status-ok)]'
                            : 'border-[var(--border-strong)] bg-[var(--bg-canvas)] text-[var(--text-muted)]',
                        ].join(' ')}
                      >
                        {v.isActive ? copy.vouchers.activeBadge : copy.vouchers.inactiveBadge}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 align-top text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVoucher(v);
                            setEditorOpen(true);
                          }}
                          className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                        >
                          {copy.common.edit}
                        </button>
                        <button
                          type="button"
                          disabled={togglingId === v.id}
                          onClick={() => void handleToggleActive(v)}
                          className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
                        >
                          {v.isActive ? copy.vouchers.deactivate : copy.vouchers.activate}
                        </button>
                        <button
                          type="button"
                          disabled={v.usedCount > 0}
                          title={
                            v.usedCount > 0
                              ? copy.vouchers.usedTooltip(v.usedCount)
                              : copy.vouchers.deleteTooltip(v.code)
                          }
                          onClick={() => {
                            setDeletingVoucher(v);
                            setDeleteError(null);
                          }}
                          className="min-h-[44px] rounded-[4px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-3 text-xs font-medium text-[var(--status-danger)]"
                        >
                          {copy.common.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <VoucherEditorModal
        open={editorOpen}
        voucher={editingVoucher}
        onClose={() => setEditorOpen(false)}
        onSaved={(saved) => {
          setNotice(
            editingVoucher
              ? copy.vouchers.savedEditNotice(saved.code)
              : copy.vouchers.savedCreateNotice(saved.code),
          );
          void loadVouchers();
        }}
      />

      {deletingVoucher && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[var(--backdrop-scrim)]"
            aria-hidden="true"
            onClick={() => setDeletingVoucher(null)}
          />
          <div
            ref={deleteDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-voucher-title"
            className="relative z-10 w-full max-w-md rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-overlay)] space-y-4"
          >
            <div>
              <h2 id="delete-voucher-title" className="text-lg font-semibold text-[var(--text-primary)]">
                {copy.vouchers.deleteDialogTitle}
              </h2>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--status-danger)]">
                {deletingVoucher.code}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {copy.vouchers.deleteDialogBody(deletingVoucher.code)}
              </p>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="rounded-[2px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-3 py-2 text-xs text-[var(--status-danger)]"
              >
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                ref={deleteCancelRef}
                type="button"
                onClick={() => setDeletingVoucher(null)}
                className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-4 text-sm font-medium text-[var(--text-primary)]"
              >
                {copy.common.cancel}
              </button>
              <button
                type="button"
                disabled={deletePending}
                onClick={() => void handleConfirmDelete()}
                className="min-h-[44px] rounded-[4px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-4 text-sm font-semibold text-[var(--status-danger)]"
              >
                {deletePending ? copy.vouchers.deletingBtn : copy.vouchers.deleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
