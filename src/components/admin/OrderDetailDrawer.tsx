import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SHIPPING_COURIERS,
  type AdminOrderDetailResponse,
  type AdminOrderStatusUpdateRequest,
  type AdminOrderStatusUpdateResponse,
  type OrderStatus,
  type ShippingCourierCode,
} from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCopy, type AdminDictionary } from '../../i18n/admin';
import { ApiRequestError, apiFetch } from '../../lib/api';
import {
  formatDateTimeId,
  formatIdr,
  formatWeight,
  getOrderStatusLabel,
  getShippingClassLabel,
} from '../../lib/format';
import { ErrorState, LoadingState } from '../ui/StateViews';

export interface OrderDetailDrawerProps {
  orderId: number | null;
  initialIntent?: OrderStatus | null;
  onClose: () => void;
  onUpdated: (response: AdminOrderStatusUpdateResponse) => void;
}

function getOrderStatusStyle(status: OrderStatus): {
  bg: string;
  color: string;
  border: string;
  symbol: string;
} {
  switch (status) {
    case 'PENDING_PAYMENT':
      return {
        bg: 'var(--status-warn-bg)',
        color: 'var(--status-warn)',
        border: 'var(--status-warn)',
        symbol: '[!]',
      };
    case 'PAID_VERIFIED':
      return {
        bg: 'var(--brand-olive-surface)',
        color: 'var(--brand-olive-tag-text)',
        border: 'var(--brand-olive)',
        symbol: '[V]',
      };
    case 'PACKED':
      return {
        bg: 'var(--brand-coyote-surface)',
        color: 'var(--brand-coyote-tag-text)',
        border: 'var(--brand-coyote)',
        symbol: '[P]',
      };
    case 'SHIPPED':
      return {
        bg: 'var(--brand-olive-surface)',
        color: 'var(--brand-olive-tag-text)',
        border: 'var(--brand-olive)',
        symbol: '[>]',
      };
    case 'COMPLETED':
      return {
        bg: 'var(--status-ok-bg)',
        color: 'var(--status-ok)',
        border: 'var(--status-ok)',
        symbol: '[OK]',
      };
    case 'CANCELLED':
      return {
        bg: 'var(--status-danger-bg)',
        color: 'var(--status-danger)',
        border: 'var(--status-danger)',
        symbol: '[X]',
      };
  }
}

function getTransitionCtaLabel(
  status: OrderStatus,
  copy: AdminDictionary,
  lang: 'id' | 'en',
): string {
  switch (status) {
    case 'PAID_VERIFIED':
      return copy.orderDrawer.ctaPaidVerified;
    case 'PACKED':
      return copy.orderDrawer.ctaPacked;
    case 'SHIPPED':
      return copy.orderDrawer.ctaShipped;
    case 'COMPLETED':
      return copy.orderDrawer.ctaCompleted;
    case 'CANCELLED':
      return copy.orderDrawer.ctaCancelled;
    default:
      return getOrderStatusLabel(status, lang);
  }
}

export function OrderDetailDrawer({
  orderId,
  initialIntent = null,
  onClose,
  onUpdated,
}: OrderDetailDrawerProps): React.JSX.Element | null {
  const { lang } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);

  const [detail, setDetail] = useState<AdminOrderDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAction, setSelectedAction] = useState<OrderStatus | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [shippingCourier, setShippingCourier] = useState<ShippingCourierCode>('JNE_TRUCKING');
  const [note, setNote] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelConfirmed, setCancelConfirmed] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const prevFocusedRef = useRef<HTMLElement | null>(null);

  const loadOrderDetail = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      setError(null);
      setActionError(null);
      try {
        const response = await apiFetch<AdminOrderDetailResponse>(`/api/admin/orders/${id}`);
        setDetail(response);
        setShippingCourier(response.order.shippingCourier);
        setTrackingNumber(response.order.trackingNumber ?? '');
        setNote('');
        setCancelReason('');
        setCancelConfirmed(false);

        if (initialIntent && response.allowedNextStatuses.includes(initialIntent)) {
          setSelectedAction(initialIntent);
        } else {
          const forwardNext = response.allowedNextStatuses.find((st) => st !== 'CANCELLED') ?? null;
          setSelectedAction(forwardNext);
        }
      } catch (err) {
        if (err instanceof ApiRequestError) {
          setError(err.message);
        } else {
          setError(copy.orderDrawer.errorFallback);
        }
      } finally {
        setLoading(false);
      }
    },
    [initialIntent, copy.orderDrawer.errorFallback],
  );

  useEffect(() => {
    if (orderId === null) return;

    prevFocusedRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setActionNotice(null);
    void loadOrderDetail(orderId);

    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 10);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
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
  }, [orderId, loadOrderDetail, onClose]);

  const handleCopy = async (label: string, value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      window.setTimeout(() => {
        setCopiedField((prev) => (prev === label ? null : prev));
      }, 2000);
    } catch {
      // Ignore clipboard permission errors.
    }
  };

  const handleStatusSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!detail || !selectedAction) return;

    setActionError(null);
    setActionNotice(null);

    const payload: AdminOrderStatusUpdateRequest = {
      nextStatus: selectedAction,
      note: note.trim() ? note.trim() : undefined,
    };

    if (selectedAction === 'SHIPPED') {
      const cleanedTracking = trackingNumber.trim();
      if (cleanedTracking.length < 5) {
        setActionError(copy.orderDrawer.validationTracking);
        return;
      }
      payload.trackingNumber = cleanedTracking;
      payload.shippingCourier = shippingCourier;
    }

    if (selectedAction === 'CANCELLED') {
      const cleanedReason = cancelReason.trim();
      if (cleanedReason.length < 5) {
        setActionError(copy.orderDrawer.validationCancelReason);
        return;
      }
      if (!cancelConfirmed) {
        setActionError(copy.orderDrawer.validationCancelConfirm);
        return;
      }
      payload.cancelReason = cleanedReason;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch<AdminOrderStatusUpdateResponse>(
        `/api/admin/orders/${detail.order.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      const refreshed = await apiFetch<AdminOrderDetailResponse>(
        `/api/admin/orders/${detail.order.id}`,
      );
      setDetail(refreshed);
      setShippingCourier(refreshed.order.shippingCourier);
      setTrackingNumber(refreshed.order.trackingNumber ?? '');
      setNote('');
      setCancelReason('');
      setCancelConfirmed(false);
      setSelectedAction(refreshed.allowedNextStatuses.find((st) => st !== 'CANCELLED') ?? null);

      const successMsg =
        selectedAction === 'CANCELLED'
          ? copy.orderDrawer.cancelledSuccess(
              response.order.invoiceNumber,
              response.restockedItemsCount,
            )
          : copy.orderDrawer.updatedSuccess(
              response.order.invoiceNumber,
              getOrderStatusLabel(response.order.status, lang),
            );
      setActionNotice(successMsg);
      onUpdated(response);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setActionError(err.message);
      } else {
        setActionError(copy.orderDrawer.updateErrorFallback);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (orderId === null) return null;

  const order = detail?.order ?? null;
  const statusStyle = order ? getOrderStatusStyle(order.status) : null;
  const forwardStatuses = (detail?.allowedNextStatuses ?? []).filter((s) => s !== 'CANCELLED');
  const canCancel = (detail?.allowedNextStatuses ?? []).includes('CANCELLED');

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div
        className="fixed inset-0 bg-[var(--backdrop-scrim)]"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-drawer-title"
        className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)]"
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="min-w-0">
            <h2
              id="order-detail-drawer-title"
              className="font-[family-name:var(--font-mono)] text-lg font-semibold tabular-nums text-[var(--text-primary)]"
            >
              {order ? order.invoiceNumber : copy.orderDrawer.fallbackTitle(orderId)}
            </h2>
            {order && statusStyle && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  style={{
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                    borderColor: statusStyle.border,
                  }}
                  className="inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 font-[family-name:var(--font-mono)] text-xs font-semibold"
                >
                  <span>{statusStyle.symbol}</span>
                  <span>{getOrderStatusLabel(order.status, lang)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopy('invoice', order.invoiceNumber)}
                  className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {copiedField === 'invoice'
                    ? copy.orderDrawer.invoiceCopied
                    : copy.orderDrawer.copyInvoice}
                </button>
              </div>
            )}
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3.5 text-sm font-medium text-[var(--text-primary)]"
          >
            {copy.common.close}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-12">
          {loading ? (
            <LoadingState label={copy.orderDrawer.loadingLabel} />
          ) : error ? (
            <ErrorState
              title={copy.orderDrawer.errorTitle}
              message={error}
              onRetry={() => void loadOrderDetail(orderId)}
            />
          ) : order && detail ? (
            <>
              {actionNotice && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-[2px] border border-[var(--status-ok)] bg-[var(--status-ok-bg)] px-4 py-3 text-sm font-medium text-[var(--status-ok)]"
                >
                  {actionNotice}
                </div>
              )}

              {/* Block 1: Status Transition Actions */}
              <section
                aria-labelledby="order-transition-heading"
                className="rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] p-4 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3
                    id="order-transition-heading"
                    className="text-sm font-semibold uppercase tracking-[0.04em] text-[var(--text-primary)]"
                  >
                    {copy.orderDrawer.actionsHeading}
                  </h3>
                  <span className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-muted)]">
                    {copy.orderDrawer.receivedAt}: {formatDateTimeId(order.createdAt, lang)}
                  </span>
                </div>

                {detail.allowedNextStatuses.length === 0 ? (
                  <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-secondary)] space-y-1">
                    <p className="font-medium text-[var(--text-primary)]">
                      {copy.orderDrawer.finalStatusText(getOrderStatusLabel(order.status, lang))}
                    </p>
                    {order.status === 'CANCELLED' && (
                      <>
                        {order.cancelReason && (
                          <p>
                            {copy.orderDrawer.cancelReasonLabel}: {order.cancelReason}
                          </p>
                        )}
                        <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--status-ok)]">
                          {copy.orderDrawer.restockStatusLabel}:{' '}
                          {order.stockRestored
                            ? copy.orderDrawer.restockedYes
                            : copy.orderDrawer.restockedNo}
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {forwardStatuses.map((statusOption) => (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => {
                            setSelectedAction(statusOption);
                            setActionError(null);
                          }}
                          aria-pressed={selectedAction === statusOption}
                          className={[
                            'min-h-[44px] rounded-[4px] border px-3.5 text-sm font-medium transition-colors duration-150',
                            selectedAction === statusOption
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] font-semibold text-[var(--accent-foreground)]'
                              : 'border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
                          ].join(' ')}
                        >
                          {getTransitionCtaLabel(statusOption, copy, lang)}
                        </button>
                      ))}

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAction('CANCELLED');
                            setActionError(null);
                          }}
                          aria-pressed={selectedAction === 'CANCELLED'}
                          className={[
                            'min-h-[44px] rounded-[4px] border px-3.5 text-sm font-medium transition-colors duration-150',
                            selectedAction === 'CANCELLED'
                              ? 'border-[var(--status-danger)] bg-[var(--status-danger-bg)] font-semibold text-[var(--status-danger)]'
                              : 'border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)]',
                          ].join(' ')}
                        >
                          {copy.orderDrawer.cancelOrderBtn}
                        </button>
                      )}
                    </div>

                    {selectedAction && (
                      <form
                        onSubmit={(e) => void handleStatusSubmit(e)}
                        className="space-y-3 border-t border-[var(--border-subtle)] pt-3"
                        noValidate
                      >
                        {actionError && (
                          <div
                            role="alert"
                            className="rounded-[2px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-3 py-2 text-xs text-[var(--status-danger)]"
                          >
                            {actionError}
                          </div>
                        )}

                        {selectedAction === 'SHIPPED' && (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor="order-ship-courier"
                                className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                              >
                                {copy.orderDrawer.courierLabel}
                              </label>
                              <select
                                id="order-ship-courier"
                                value={shippingCourier}
                                onChange={(e) =>
                                  setShippingCourier(e.target.value as ShippingCourierCode)
                                }
                                className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                              >
                                {SHIPPING_COURIERS.map((courierCode) => (
                                  <option key={courierCode} value={courierCode}>
                                    {copy.couriers[courierCode]}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label
                                htmlFor="order-ship-tracking"
                                className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                              >
                                {copy.orderDrawer.trackingLabel}
                              </label>
                              <input
                                id="order-ship-tracking"
                                type="text"
                                required
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder={copy.orderDrawer.trackingPlaceholder}
                                className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 font-[family-name:var(--font-mono)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                              />
                            </div>
                          </div>
                        )}

                        {selectedAction === 'CANCELLED' ? (
                          <div className="space-y-3">
                            <div className="rounded-[2px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] p-3 text-xs text-[var(--status-danger)]">
                              <p className="font-semibold">{copy.orderDrawer.cancelWarnTitle}</p>
                              <p className="mt-1">{copy.orderDrawer.cancelWarnBody}</p>
                            </div>

                            <div>
                              <label
                                htmlFor="order-cancel-reason"
                                className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                              >
                                {copy.orderDrawer.cancelReasonInputLabel}
                              </label>
                              <textarea
                                id="order-cancel-reason"
                                rows={2}
                                required
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder={copy.orderDrawer.cancelReasonPlaceholder}
                                className="w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                              />
                            </div>

                            <label className="flex min-h-[44px] items-start gap-2.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 text-xs text-[var(--text-primary)]">
                              <input
                                type="checkbox"
                                checked={cancelConfirmed}
                                onChange={(e) => setCancelConfirmed(e.target.checked)}
                                className="mt-0.5 h-4 w-4 shrink-0"
                              />
                              <span>{copy.orderDrawer.cancelConfirmText(order.invoiceNumber)}</span>
                            </label>
                          </div>
                        ) : (
                          <div>
                            <label
                              htmlFor="order-transition-note"
                              className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]"
                            >
                              {copy.orderDrawer.noteLabel}
                            </label>
                            <input
                              id="order-transition-note"
                              type="text"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder={
                                selectedAction === 'PAID_VERIFIED'
                                  ? copy.orderDrawer.notePlaceholderVerify
                                  : selectedAction === 'PACKED'
                                    ? copy.orderDrawer.notePlaceholderPack
                                    : copy.orderDrawer.notePlaceholderDefault
                              }
                              className="min-h-[44px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                            />
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={
                              submitting ||
                              (selectedAction === 'SHIPPED' && trackingNumber.trim().length < 5) ||
                              (selectedAction === 'CANCELLED' &&
                                (cancelReason.trim().length < 5 || !cancelConfirmed))
                            }
                            className={[
                              'min-h-[44px] rounded-[4px] px-4 text-sm font-semibold transition-colors duration-150',
                              selectedAction === 'CANCELLED'
                                ? 'border border-[var(--status-danger)] bg-[var(--status-danger-bg)] text-[var(--status-danger)]'
                                : 'bg-[var(--accent-primary)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--text-primary)]',
                            ].join(' ')}
                          >
                            {submitting
                              ? copy.orderDrawer.submittingStatus
                              : getTransitionCtaLabel(selectedAction, copy, lang)}
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </section>

              {/* Block 2: Recipient & Shipping */}
              <section
                aria-labelledby="order-shipping-heading"
                className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 space-y-3"
              >
                <h3
                  id="order-shipping-heading"
                  className="text-sm font-semibold uppercase tracking-[0.04em] text-[var(--text-primary)]"
                >
                  {copy.orderDrawer.shippingHeading}
                </h3>

                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">
                      {copy.orderDrawer.recipientName}
                    </dt>
                    <dd className="mt-0.5 font-medium text-[var(--text-primary)]">
                      {order.customerName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">
                      {copy.orderDrawer.contact}
                    </dt>
                    <dd className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[var(--text-secondary)] break-all">
                      {order.customerEmail}
                      <br />
                      {order.customerPhone}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-[var(--text-muted)]">
                      {copy.orderDrawer.shippingAddress}
                    </dt>
                    <dd className="mt-0.5 text-sm text-[var(--text-primary)]">
                      {order.shippingAddress}, {copy.orderDrawer.districtPrefix}{' '}
                      {order.shippingDistrict}, {order.shippingCity} {order.shippingPostalCode} (
                      {copy.zones[order.shippingZone] ?? order.shippingZone})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">
                      {copy.orderDrawer.shippingClassCourier}
                    </dt>
                    <dd className="mt-0.5 text-sm text-[var(--text-primary)]">
                      <span className="block font-medium">
                        {copy.couriers[order.shippingCourier]}
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)]">
                        {getShippingClassLabel(order.shippingClass, lang)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">
                      {copy.orderDrawer.woodenAndPayment}
                    </dt>
                    <dd className="mt-0.5 text-sm text-[var(--text-primary)]">
                      <span className="block">
                        {copy.orderDrawer.woodenPackingLabel}:{' '}
                        {order.woodenPacking
                          ? `${copy.common.yes} (${formatIdr(order.woodenPackingCostIdr)})`
                          : copy.common.no}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {copy.orderDrawer.paymentLabel}: {copy.payments[order.paymentMethod]}
                      </span>
                    </dd>
                  </div>
                  {order.trackingNumber && (
                    <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-[2px] border border-[var(--brand-olive)] bg-[var(--brand-olive-surface)] px-3 py-2">
                      <div>
                        <dt className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[var(--brand-olive-tag-text)]">
                          {copy.orderDrawer.recordedTracking}
                        </dt>
                        <dd className="font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--text-primary)]">
                          {order.trackingNumber}
                        </dd>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleCopy('tracking', order.trackingNumber ?? '')}
                        className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)]"
                      >
                        {copiedField === 'tracking'
                          ? copy.orderDrawer.trackingCopied
                          : copy.orderDrawer.copyTracking}
                      </button>
                    </div>
                  )}
                  {order.shippingNotes && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-[var(--text-muted)]">
                        {copy.orderDrawer.buyerNotes}
                      </dt>
                      <dd className="mt-0.5 text-sm text-[var(--text-secondary)]">
                        {order.shippingNotes}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* Block 3: Order Items & Totals */}
              <section
                aria-labelledby="order-items-heading"
                className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 space-y-3"
              >
                <h3
                  id="order-items-heading"
                  className="text-sm font-semibold uppercase tracking-[0.04em] text-[var(--text-primary)]"
                >
                  {copy.orderDrawer.itemsHeading(order.items.length)}
                </h3>

                <ul className="divide-y divide-[var(--border-subtle)]">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      {item.imageUrlSnapshot ? (
                        <img
                          src={item.imageUrlSnapshot}
                          alt={item.nameSnapshot}
                          width={160}
                          height={90}
                          className="h-12 w-16 shrink-0 rounded-[2px] border border-[var(--border-subtle)] object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">
                          {copy.common.noImage}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)]">
                          {item.skuSnapshot}
                        </p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {item.nameSnapshot}
                        </p>
                        <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-secondary)]">
                          {item.quantity} x {formatIdr(item.unitPriceIdr)} |{' '}
                          {formatWeight(item.weightGramsSnapshot * item.quantity, lang)}
                        </p>
                      </div>
                      <p className="shrink-0 font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                        {formatIdr(item.lineTotalIdr)}
                      </p>
                    </li>
                  ))}
                </ul>

                <dl className="space-y-1.5 border-t border-[var(--border-subtle)] pt-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[var(--text-secondary)]">
                      {copy.orderDrawer.subtotalItems}
                    </dt>
                    <dd className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--text-primary)]">
                      {formatIdr(order.subtotalIdr)}
                    </dd>
                  </div>
                  {order.discountIdr > 0 && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--status-ok)]">
                        {copy.orderDrawer.voucherDiscount}{' '}
                        {order.voucherCode ? `(${order.voucherCode})` : ''}
                      </dt>
                      <dd className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--status-ok)]">
                        -{formatIdr(order.discountIdr)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <dt className="text-[var(--text-secondary)]">
                      {copy.orderDrawer.shippingCost}
                    </dt>
                    <dd className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--text-primary)]">
                      {formatIdr(order.shippingCostIdr)}
                    </dd>
                  </div>
                  {order.woodenPackingCostIdr > 0 && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--text-secondary)]">
                        {copy.orderDrawer.woodenPackingCost}
                      </dt>
                      <dd className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--text-primary)]">
                        {formatIdr(order.woodenPackingCostIdr)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-2 border-t border-[var(--border-subtle)] pt-2 text-base font-semibold">
                    <dt className="text-[var(--text-primary)]">{copy.orderDrawer.grandTotal}</dt>
                    <dd className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--accent-text)]">
                      {formatIdr(order.totalIdr)}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Block 4: Status Audit Timeline */}
              <section
                aria-labelledby="order-timeline-heading"
                className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 space-y-3"
              >
                <h3
                  id="order-timeline-heading"
                  className="text-sm font-semibold uppercase tracking-[0.04em] text-[var(--text-primary)]"
                >
                  {copy.orderDrawer.timelineHeading(detail.timeline.length)}
                </h3>
                <ol className="space-y-3">
                  {detail.timeline.map((entry) => (
                    <li
                      key={entry.id}
                      className="border-l-2 border-[var(--border-strong)] pl-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {entry.fromStatus
                            ? `${getOrderStatusLabel(entry.fromStatus, lang)} -> ${getOrderStatusLabel(entry.toStatus, lang)}`
                            : getOrderStatusLabel(entry.toStatus, lang)}
                        </span>
                        <span className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-muted)]">
                          {formatDateTimeId(entry.createdAt, lang)}
                        </span>
                      </div>
                      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)]">
                        {copy.orderDrawer.actorPrefix}: {entry.actor}
                      </p>
                      {entry.note && (
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">{entry.note}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
