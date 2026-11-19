import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdminInventoryAdjustRequest,
  AdminInventoryAdjustResponse,
} from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCopy } from '../../i18n/admin';
import { ApiRequestError, apiFetch } from '../../lib/api';

export interface StockAdjustProductTarget {
  id: number;
  sku: string;
  name: string;
  stockQty: number;
  lowStockThreshold: number;
}

export interface StockAdjustModalProps {
  open: boolean;
  product: StockAdjustProductTarget | null;
  initialReason?: 'MANUAL_RESTOCK' | 'AUDIT_ADJUSTMENT';
  onClose: () => void;
  onSuccess: (response: AdminInventoryAdjustResponse) => void;
}

export function StockAdjustModal({
  open,
  product,
  initialReason = 'MANUAL_RESTOCK',
  onClose,
  onSuccess,
}: StockAdjustModalProps): React.JSX.Element | null {
  const { lang } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);

  const [reason, setReason] = useState<'MANUAL_RESTOCK' | 'AUDIT_ADJUSTMENT'>(initialReason);
  const [direction, setDirection] = useState<'add' | 'subtract'>('add');
  const [quantityText, setQuantityText] = useState<string>('5');
  const [referenceId, setReferenceId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const qtyInputRef = useRef<HTMLInputElement | null>(null);
  const prevFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !product) return;

    prevFocusedRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    setReason(initialReason);
    setDirection('add');
    setQuantityText(initialReason === 'MANUAL_RESTOCK' ? '5' : '1');
    setReferenceId('');
    setNote('');
    setError(null);

    const focusTimer = window.setTimeout(() => {
      qtyInputRef.current?.focus();
    }, 10);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
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
      prevFocusedRef.current?.focus();
    };
  }, [open, product, initialReason, onClose]);

  if (!open || !product) return null;

  const parsedQty = Number.parseInt(quantityText, 10);
  const isValidQty = Number.isInteger(parsedQty) && parsedQty > 0;
  const effectiveDirection = reason === 'MANUAL_RESTOCK' ? 'add' : direction;
  const deltaQty = isValidQty ? (effectiveDirection === 'add' ? parsedQty : -parsedQty) : 0;
  const projectedStock = product.stockQty + deltaQty;
  const wouldBeNegative = isValidQty && projectedStock < 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (!isValidQty) {
      setError(copy.stockModal.errInvalidQty);
      qtyInputRef.current?.focus();
      return;
    }

    if (projectedStock < 0) {
      setError(copy.stockModal.errNegativeStock(parsedQty, product.stockQty));
      qtyInputRef.current?.focus();
      return;
    }

    const trimmedNote = note.trim();
    if (trimmedNote.length < 3) {
      setError(copy.stockModal.errNoteMin);
      return;
    }

    const payload: AdminInventoryAdjustRequest = {
      productId: product.id,
      deltaQty,
      reason,
      referenceId: referenceId.trim() ? referenceId.trim() : undefined,
      note: trimmedNote,
    };

    setSubmitting(true);
    try {
      const response = await apiFetch<AdminInventoryAdjustResponse>('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      onSuccess(response);
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(copy.stockModal.errSaveFallback);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
      <div
        className="fixed inset-0 bg-[var(--backdrop-scrim)]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-adjust-modal-title"
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="min-w-0">
            <h2
              id="stock-adjust-modal-title"
              className="text-lg font-semibold text-[var(--text-primary)]"
            >
              {copy.stockModal.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              <span className="font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--text-muted)]">
                {product.sku}
              </span>{' '}
              - {product.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-sm font-medium text-[var(--text-primary)]"
          >
            {copy.common.close}
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4 pb-8" noValidate>
          {error && (
            <div
              role="alert"
              className="rounded-[2px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-3.5 py-2.5 text-sm text-[var(--status-danger)]"
            >
              {error}
            </div>
          )}

          {/* Mutation Type */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">
              {copy.stockModal.mutationTypeLegend}
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label
                className={[
                  'flex min-h-[48px] items-center gap-2.5 rounded-[4px] border px-3 py-2 text-sm font-medium',
                  reason === 'MANUAL_RESTOCK'
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="stock-reason"
                  value="MANUAL_RESTOCK"
                  checked={reason === 'MANUAL_RESTOCK'}
                  onChange={() => {
                    setReason('MANUAL_RESTOCK');
                    setDirection('add');
                  }}
                />
                <span>{copy.stockModal.restockOption}</span>
              </label>

              <label
                className={[
                  'flex min-h-[48px] items-center gap-2.5 rounded-[4px] border px-3 py-2 text-sm font-medium',
                  reason === 'AUDIT_ADJUSTMENT'
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="stock-reason"
                  value="AUDIT_ADJUSTMENT"
                  checked={reason === 'AUDIT_ADJUSTMENT'}
                  onChange={() => setReason('AUDIT_ADJUSTMENT')}
                />
                <span>{copy.stockModal.auditOption}</span>
              </label>
            </div>
          </fieldset>

          {/* Direction for AUDIT_ADJUSTMENT */}
          {reason === 'AUDIT_ADJUSTMENT' && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">
                {copy.stockModal.directionLegend}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('add')}
                  aria-pressed={direction === 'add'}
                  className={[
                    'min-h-[44px] rounded-[4px] border px-3 text-sm font-medium transition-colors duration-150',
                    direction === 'add'
                      ? 'border-[var(--status-ok)] bg-[var(--status-ok-bg)] text-[var(--status-ok)] font-semibold'
                      : 'border-[var(--border-strong)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]',
                  ].join(' ')}
                >
                  {copy.stockModal.addBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('subtract')}
                  aria-pressed={direction === 'subtract'}
                  className={[
                    'min-h-[44px] rounded-[4px] border px-3 text-sm font-medium transition-colors duration-150',
                    direction === 'subtract'
                      ? 'border-[var(--status-danger)] bg-[var(--status-danger-bg)] text-[var(--status-danger)] font-semibold'
                      : 'border-[var(--border-strong)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]',
                  ].join(' ')}
                >
                  {copy.stockModal.subtractBtn}
                </button>
              </div>
            </fieldset>
          )}

          {/* Quantity */}
          <div>
            <label
              htmlFor="stock-adjust-qty"
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              {effectiveDirection === 'add'
                ? copy.stockModal.qtyAddLabel
                : copy.stockModal.qtySubtractLabel}
            </label>
            <input
              ref={qtyInputRef}
              id="stock-adjust-qty"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              required
              value={quantityText}
              onChange={(e) => setQuantityText(e.target.value)}
              aria-invalid={!isValidQty || wouldBeNegative}
              className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-base tabular-nums text-[var(--text-primary)]"
            />
          </div>

          {/* Calculation Preview */}
          <div className="grid grid-cols-3 gap-2 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[var(--text-muted)]">
                {copy.stockModal.previewCurrent}
              </p>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {product.stockQty}
              </p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[var(--text-muted)]">
                {copy.stockModal.previewDelta}
              </p>
              <p
                className={[
                  'mt-1 font-[family-name:var(--font-mono)] text-lg font-semibold tabular-nums',
                  deltaQty > 0
                    ? 'text-[var(--status-ok)]'
                    : deltaQty < 0
                      ? 'text-[var(--status-danger)]'
                      : 'text-[var(--text-muted)]',
                ].join(' ')}
              >
                {deltaQty > 0 ? `+${deltaQty}` : deltaQty < 0 ? `${deltaQty}` : '0'}
              </p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[var(--text-muted)]">
                {copy.stockModal.previewFinal}
              </p>
              <p
                className={[
                  'mt-1 font-[family-name:var(--font-mono)] text-lg font-semibold tabular-nums',
                  wouldBeNegative
                    ? 'text-[var(--status-danger)]'
                    : projectedStock <= product.lowStockThreshold
                      ? 'text-[var(--status-warn)]'
                      : 'text-[var(--status-ok)]',
                ].join(' ')}
              >
                {isValidQty ? projectedStock : product.stockQty}
              </p>
            </div>
          </div>

          {wouldBeNegative && (
            <p className="text-xs font-medium text-[var(--status-danger)]">
              {copy.stockModal.negativeWarn}
            </p>
          )}

          {/* Reference PO / Batch */}
          <div>
            <label
              htmlFor="stock-adjust-ref"
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              {copy.stockModal.refLabel}
            </label>
            <input
              id="stock-adjust-ref"
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder={copy.stockModal.refPlaceholder}
              className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Required Note */}
          <div>
            <label
              htmlFor="stock-adjust-note"
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              {copy.stockModal.noteLabel}
            </label>
            <textarea
              id="stock-adjust-note"
              rows={3}
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                reason === 'MANUAL_RESTOCK'
                  ? copy.stockModal.notePlaceholderRestock
                  : copy.stockModal.notePlaceholderAudit
              }
              className="w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              {copy.common.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || !isValidQty || wouldBeNegative}
              className="min-h-[44px] rounded-[4px] bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--text-primary)]"
            >
              {submitting
                ? copy.stockModal.submitting
                : reason === 'MANUAL_RESTOCK'
                  ? copy.stockModal.submitRestock
                  : copy.stockModal.submitAudit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
