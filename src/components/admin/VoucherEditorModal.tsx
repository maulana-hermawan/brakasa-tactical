import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdminVoucherCreateRequest,
  AdminVoucherUpdateRequest,
  Voucher,
  VoucherDiscountType,
} from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCopy } from '../../i18n/admin';
import { ApiRequestError, apiFetch } from '../../lib/api';

export interface VoucherEditorModalProps {
  open: boolean;
  voucher: Voucher | null;
  onClose: () => void;
  onSaved: (voucher: Voucher) => void;
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function VoucherEditorModal({
  open,
  voucher,
  onClose,
  onSaved,
}: VoucherEditorModalProps): React.JSX.Element | null {
  const { lang } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);
  const isEdit = voucher !== null;

  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [discountType, setDiscountType] = useState<VoucherDiscountType>('PERCENT');
  const [discountValue, setDiscountValue] = useState<string>('10');
  const [maxDiscountIdr, setMaxDiscountIdr] = useState<string>('');
  const [minSubtotalIdr, setMinSubtotalIdr] = useState<string>('0');
  const [maxUses, setMaxUses] = useState<string>('');
  const [startsAt, setStartsAt] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const prevFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    prevFocusedRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (voucher) {
      setCode(voucher.code);
      setDescription(voucher.description);
      setDiscountType(voucher.discountType);
      setDiscountValue(String(voucher.discountValue));
      setMaxDiscountIdr(voucher.maxDiscountIdr !== null ? String(voucher.maxDiscountIdr) : '');
      setMinSubtotalIdr(String(voucher.minSubtotalIdr));
      setMaxUses(voucher.maxUses !== null ? String(voucher.maxUses) : '');
      setStartsAt(toDatetimeLocalValue(voucher.startsAt));
      setExpiresAt(toDatetimeLocalValue(voucher.expiresAt));
      setIsPublic(voucher.isPublic);
      setIsActive(voucher.isActive);
    } else {
      setCode('');
      setDescription('');
      setDiscountType('PERCENT');
      setDiscountValue('10');
      setMaxDiscountIdr('500000');
      setMinSubtotalIdr('2000000');
      setMaxUses('100');
      setStartsAt('');
      setExpiresAt('');
      setIsPublic(true);
      setIsActive(true);
    }
    setError(null);

    const focusTimer = window.setTimeout(() => {
      codeInputRef.current?.focus();
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
  }, [open, voucher, onClose]);

  if (!open) return null;

  const applyShippingSubsidyTemplate = (): void => {
    setCode((prev) => (prev.trim() ? prev : 'KARGOSUBSIDI'));
    setDescription(copy.voucherModal.templateDesc);
    setDiscountType('FIXED');
    setDiscountValue('150000');
    setMaxDiscountIdr('150000');
    setMinSubtotalIdr('5000000');
    setMaxUses('50');
    setIsPublic(true);
    setIsActive(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.length < 3 || !/^[A-Z0-9_-]+$/.test(normalizedCode)) {
      setError(copy.voucherModal.errCode);
      codeInputRef.current?.focus();
      return;
    }

    const parsedDiscountValue = Number.parseInt(discountValue, 10);
    if (!Number.isInteger(parsedDiscountValue) || parsedDiscountValue <= 0) {
      setError(copy.voucherModal.errValue);
      return;
    }

    if (discountType === 'PERCENT' && parsedDiscountValue > 100) {
      setError(copy.voucherModal.errPercentMax);
      return;
    }

    const parsedMinSubtotal = Number.parseInt(minSubtotalIdr || '0', 10);
    if (!Number.isInteger(parsedMinSubtotal) || parsedMinSubtotal < 0) {
      setError(copy.voucherModal.errMinSubtotal);
      return;
    }

    const parsedMaxDiscount = maxDiscountIdr.trim()
      ? Number.parseInt(maxDiscountIdr, 10)
      : null;
    if (parsedMaxDiscount !== null && (!Number.isInteger(parsedMaxDiscount) || parsedMaxDiscount <= 0)) {
      setError(copy.voucherModal.errMaxDiscount);
      return;
    }

    const parsedMaxUses = maxUses.trim() ? Number.parseInt(maxUses, 10) : null;
    if (parsedMaxUses !== null && (!Number.isInteger(parsedMaxUses) || parsedMaxUses <= 0)) {
      setError(copy.voucherModal.errMaxUses);
      return;
    }

    const startsAtIso = fromDatetimeLocalValue(startsAt);
    const expiresAtIso = fromDatetimeLocalValue(expiresAt);
    if (startsAtIso && expiresAtIso && new Date(expiresAtIso) <= new Date(startsAtIso)) {
      setError(copy.voucherModal.errDateRange);
      return;
    }

    const payload: AdminVoucherCreateRequest = {
      code: normalizedCode,
      description: description.trim(),
      discountType,
      discountValue: parsedDiscountValue,
      maxDiscountIdr: parsedMaxDiscount,
      minSubtotalIdr: parsedMinSubtotal,
      maxUses: parsedMaxUses,
      startsAt: startsAtIso,
      expiresAt: expiresAtIso,
      isPublic,
      isActive,
    };

    setSubmitting(true);
    try {
      let saved: Voucher;
      if (isEdit && voucher) {
        const updatePayload: AdminVoucherUpdateRequest = payload;
        saved = await apiFetch<Voucher>(`/api/admin/vouchers/${voucher.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });
      } else {
        saved = await apiFetch<Voucher>('/api/admin/vouchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(copy.voucherModal.errSaveFallback);
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
        aria-labelledby="voucher-editor-modal-title"
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
          <h2
            id="voucher-editor-modal-title"
            className="text-lg font-semibold text-[var(--text-primary)]"
          >
            {isEdit
              ? copy.voucherModal.editTitle(voucher.code)
              : copy.voucherModal.createTitle}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-sm font-medium text-[var(--text-primary)]"
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

          {!isEdit && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2.5">
              <p className="text-xs text-[var(--text-secondary)]">
                {copy.voucherModal.templatePrompt}
              </p>
              <button
                type="button"
                onClick={applyShippingSubsidyTemplate}
                className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              >
                {copy.voucherModal.templateBtn}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="voucher-code"
                className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
              >
                {copy.voucherModal.codeLabel}
              </label>
              <input
                ref={codeInputRef}
                id="voucher-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={copy.voucherModal.codePlaceholder}
                className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm uppercase text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label
                htmlFor="voucher-discount-type"
                className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
              >
                {copy.voucherModal.typeLabel}
              </label>
              <select
                id="voucher-discount-type"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as VoucherDiscountType)}
                className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="PERCENT">{copy.voucherModal.typePercent}</option>
                <option value="FIXED">{copy.voucherModal.typeFixed}</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="voucher-description"
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              {copy.voucherModal.descLabel}
            </label>
            <input
              id="voucher-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={copy.voucherModal.descPlaceholder}
              className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="voucher-discount-value"
                className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
              >
                {discountType === 'PERCENT'
                  ? copy.voucherModal.valuePercentLabel
                  : copy.voucherModal.valueFixedLabel}
              </label>
              <input
                id="voucher-discount-value"
                type="number"
                min={1}
                max={discountType === 'PERCENT' ? 100 : undefined}
                step={1}
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label
                htmlFor="voucher-max-discount"
                className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
              >
                {copy.voucherModal.maxDiscountLabel}
              </label>
              <input
                id="voucher-max-discount"
                type="number"
                min={1}
                step={1000}
                value={maxDiscountIdr}
                onChange={(e) => setMaxDiscountIdr(e.target.value)}
                placeholder={copy.voucherModal.maxDiscountPlaceholder}
                className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label
                htmlFor="voucher-min-subtotal"
                className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
              >
                {copy.voucherModal.minSubtotalLabel}
              </label>
              <input
                id="voucher-min-subtotal"
                type="number"
                min={0}
                step={10000}
                required
                value={minSubtotalIdr}
                onChange={(e) => setMinSubtotalIdr(e.target.value)}
                className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="voucher-max-uses"
                className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
              >
                {copy.voucherModal.maxUsesLabel}
              </label>
              <input
                id="voucher-max-uses"
                type="number"
                min={1}
                step={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder={copy.voucherModal.maxUsesPlaceholder}
                className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label
                htmlFor="voucher-starts-at"
                className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
              >
                {copy.voucherModal.startsAtLabel}
              </label>
              <input
                id="voucher-starts-at"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label
                htmlFor="voucher-expires-at"
                className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
              >
                {copy.voucherModal.expiresAtLabel}
              </label>
              <input
                id="voucher-expires-at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex min-h-[48px] items-center gap-2.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 shrink-0"
              />
              <span>{copy.voucherModal.activeFlag}</span>
            </label>

            <label className="flex min-h-[48px] items-center gap-2.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 shrink-0"
              />
              <span>{copy.voucherModal.publicFlag}</span>
            </label>
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
              disabled={submitting}
              className="min-h-[44px] rounded-[4px] bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--text-primary)]"
            >
              {submitting
                ? copy.voucherModal.savingBtn
                : isEdit
                  ? copy.voucherModal.saveEditBtn
                  : copy.voucherModal.saveCreateBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
