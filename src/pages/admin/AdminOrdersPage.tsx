import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ORDER_STATUSES,
  type AdminOrderListResponse,
  type OrderStatus,
  type OrderSummary,
} from '../../../shared/types';
import { OrderDetailDrawer } from '../../components/admin/OrderDetailDrawer';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateViews';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCopy, type AdminDictionary } from '../../i18n/admin';
import { ApiRequestError, apiFetch } from '../../lib/api';
import {
  formatDateTimeId,
  formatIdr,
  getOrderStatusLabel,
  getShippingClassLabel,
} from '../../lib/format';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type OrderFilterStatus = OrderStatus | 'ALL';

function isOrderStatus(val: string | null): val is OrderStatus {
  return val !== null && (ORDER_STATUSES as readonly string[]).includes(val);
}

function getStatusBadge(status: OrderStatus): {
  bg: string;
  color: string;
  border: string;
  marker: string;
} {
  switch (status) {
    case 'PENDING_PAYMENT':
      return {
        bg: 'var(--status-warn-bg)',
        color: 'var(--status-warn)',
        border: 'var(--status-warn)',
        marker: '[!]',
      };
    case 'PAID_VERIFIED':
      return {
        bg: 'var(--brand-olive-surface)',
        color: 'var(--brand-olive-tag-text)',
        border: 'var(--brand-olive)',
        marker: '[V]',
      };
    case 'PACKED':
      return {
        bg: 'var(--brand-coyote-surface)',
        color: 'var(--brand-coyote-tag-text)',
        border: 'var(--brand-coyote)',
        marker: '[P]',
      };
    case 'SHIPPED':
      return {
        bg: 'var(--brand-olive-surface)',
        color: 'var(--brand-olive-tag-text)',
        border: 'var(--brand-olive)',
        marker: '[>]',
      };
    case 'COMPLETED':
      return {
        bg: 'var(--status-ok-bg)',
        color: 'var(--status-ok)',
        border: 'var(--status-ok)',
        marker: '[OK]',
      };
    case 'CANCELLED':
      return {
        bg: 'var(--status-danger-bg)',
        color: 'var(--status-danger)',
        border: 'var(--status-danger)',
        marker: '[X]',
      };
  }
}

function getQuickAction(
  status: OrderStatus,
  copy: AdminDictionary,
): {
  nextStatus: OrderStatus;
  label: string;
} | null {
  switch (status) {
    case 'PENDING_PAYMENT':
      return { nextStatus: 'PAID_VERIFIED', label: copy.orders.quickVerify };
    case 'PAID_VERIFIED':
      return { nextStatus: 'PACKED', label: copy.orders.quickPack };
    case 'PACKED':
      return { nextStatus: 'SHIPPED', label: copy.orders.quickShip };
    case 'SHIPPED':
      return { nextStatus: 'COMPLETED', label: copy.orders.quickComplete };
    default:
      return null;
  }
}

export function AdminOrdersPage(): React.JSX.Element {
  const { lang } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);
  useDocumentTitle(copy.orders.docTitle);

  const { refresh: refreshAuth } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: routeOrderIdParam } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const initialStatusParam = searchParams.get('status');
  const [statusFilter, setStatusFilter] = useState<OrderFilterStatus>(() =>
    isOrderStatus(initialStatusParam) ? initialStatusParam : 'ALL',
  );
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.get('q') ?? '');

  const [data, setData] = useState<AdminOrderListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [drawerOrderId, setDrawerOrderId] = useState<number | null>(() => {
    if (!routeOrderIdParam) return null;
    const parsed = Number.parseInt(routeOrderIdParam, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  });
  const [drawerIntent, setDrawerIntent] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!routeOrderIdParam) return;
    const parsed = Number.parseInt(routeOrderIdParam, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      setDrawerOrderId(parsed);
    }
  }, [routeOrderIdParam]);

  const loadOrders = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const qs = params.toString();
      const response = await apiFetch<AdminOrderListResponse>(
        qs ? `/api/admin/orders?${qs}` : '/api/admin/orders',
      );
      setData(response);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        await refreshAuth();
        return;
      }
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(copy.orders.errorFallback);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, refreshAuth, copy.orders.errorFallback]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const handleSelectStatus = (nextStatus: OrderFilterStatus): void => {
    setStatusFilter(nextStatus);
    const nextParams = new URLSearchParams(searchParams);
    if (nextStatus === 'ALL') nextParams.delete('status');
    else nextParams.set('status', nextStatus);
    setSearchParams(nextParams, { replace: true });
  };

  const handleOpenDrawer = (order: OrderSummary, intent: OrderStatus | null): void => {
    setDrawerOrderId(order.id);
    setDrawerIntent(intent);
  };

  const totalAllStatuses = data
    ? ORDER_STATUSES.reduce((acc, st) => acc + (data.countsByStatus[st] ?? 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase leading-none tracking-[0.01em] text-[var(--text-primary)] sm:text-4xl">
          {copy.orders.title}
        </h1>

        <button
          type="button"
          onClick={() => void loadOrders()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
        >
          {loading ? copy.common.loading : copy.orders.reloadBtn}
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

      {/* Status Filter Tabs & Search */}
      <section
        aria-label={copy.orders.filterSectionAria}
        className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-4"
      >
        <div className="flex flex-wrap gap-2" role="group" aria-label={copy.orders.statusGroupAria}>
          <button
            type="button"
            onClick={() => handleSelectStatus('ALL')}
            aria-pressed={statusFilter === 'ALL'}
            className={[
              'min-h-[44px] rounded-[4px] border px-3 text-xs font-medium transition-colors duration-150',
              statusFilter === 'ALL'
                ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
            ].join(' ')}
          >
            {copy.common.all}{' '}
            <span className="ml-1 font-[family-name:var(--font-mono)] tabular-nums text-[var(--text-muted)]">
              ({totalAllStatuses})
            </span>
          </button>

          {ORDER_STATUSES.map((st) => {
            const count = data?.countsByStatus[st] ?? 0;
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => handleSelectStatus(st)}
                aria-pressed={active}
                className={[
                  'min-h-[44px] rounded-[4px] border px-3 text-xs font-medium transition-colors duration-150',
                  active
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
                ].join(' ')}
              >
                {getOrderStatusLabel(st, lang)}{' '}
                <span className="ml-1 font-[family-name:var(--font-mono)] tabular-nums text-[var(--text-muted)]">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="admin-orders-search"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              {copy.orders.searchLabel}
            </label>
            <input
              id="admin-orders-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.orders.searchPlaceholder}
              className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          {(statusFilter !== 'ALL' || searchQuery.trim()) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                handleSelectStatus('ALL');
              }}
              className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 text-xs font-medium text-[var(--text-primary)]"
            >
              {copy.orders.showAllOrders}
            </button>
          )}
        </div>
      </section>

      {/* Order List */}
      {loading && !data ? (
        <LoadingState label={copy.orders.loadingLabel} />
      ) : error && !data ? (
        <ErrorState
          title={copy.orders.errorTitle}
          message={error}
          onRetry={() => void loadOrders()}
        />
      ) : data && data.orders.length === 0 ? (
        <EmptyState
          title={
            statusFilter !== 'ALL'
              ? copy.orders.emptyStatusTitle(getOrderStatusLabel(statusFilter, lang))
              : copy.orders.emptyDefaultTitle
          }
          description={
            searchQuery.trim() || statusFilter !== 'ALL'
              ? copy.orders.emptyFilteredDesc
              : copy.orders.emptyDefaultDesc
          }
          actionLabel={
            searchQuery.trim() || statusFilter !== 'ALL' ? copy.orders.showAllOrders : undefined
          }
          onAction={
            searchQuery.trim() || statusFilter !== 'ALL'
              ? () => {
                  setSearchQuery('');
                  handleSelectStatus('ALL');
                }
              : undefined
          }
        />
      ) : data ? (
        <>
          {/* Mobile Action Cards (< 768px) */}
          <div className="space-y-3 md:hidden">
            {data.orders.map((order) => {
              const badge = getStatusBadge(order.status);
              const quick = getQuickAction(order.status, copy);
              return (
                <article
                  key={order.id}
                  className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                        {order.invoiceNumber}
                      </p>
                      <p className="font-[family-name:var(--font-mono)] text-[11px] tabular-nums text-[var(--text-muted)]">
                        {formatDateTimeId(order.createdAt, lang)}
                      </p>
                    </div>
                    <span
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        borderColor: badge.border,
                      }}
                      className="shrink-0 rounded-[2px] border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold"
                    >
                      {badge.marker} {getOrderStatusLabel(order.status, lang)}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {order.customerName}
                    </p>
                    <p>
                      {order.shippingCity} ({order.shippingCourier}) |{' '}
                      {getShippingClassLabel(order.shippingClass, lang)}
                    </p>
                    {order.trackingNumber && (
                      <p className="font-[family-name:var(--font-mono)] text-[var(--accent-text)]">
                        {copy.orders.trackingPrefix}: {order.trackingNumber}
                      </p>
                    )}
                    <p className="font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                      {formatIdr(order.totalIdr)} ({order.itemCount} {copy.common.items})
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {quick && (
                      <button
                        type="button"
                        onClick={() => handleOpenDrawer(order, quick.nextStatus)}
                        className="min-h-[44px] w-full rounded-[4px] bg-[var(--accent-primary)] px-3 text-sm font-semibold text-[var(--accent-foreground)]"
                      >
                        {quick.label}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenDrawer(order, null)}
                      className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm font-medium text-[var(--text-primary)]"
                    >
                      {copy.orders.inspectDetail}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop Table (>= 768px) */}
          <div className="hidden md:block overflow-x-auto rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                  <th className="px-3 py-3 font-medium">{copy.orders.colInvoiceTime}</th>
                  <th className="px-3 py-3 font-medium">{copy.orders.colCustomer}</th>
                  <th className="px-3 py-3 font-medium">{copy.orders.colShippingTracking}</th>
                  <th className="px-3 py-3 font-medium">{copy.orders.colTotal}</th>
                  <th className="px-3 py-3 font-medium">{copy.orders.colStatus}</th>
                  <th className="px-3 py-3 text-right font-medium">{copy.orders.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {data.orders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  const quick = getQuickAction(order.status, copy);
                  return (
                    <tr
                      key={order.id}
                      className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
                    >
                      <td className="whitespace-nowrap px-3 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(order, null)}
                          className="inline-flex min-h-[44px] items-center font-[family-name:var(--font-mono)] text-xs font-semibold tabular-nums text-[var(--accent-text)] underline-offset-2 hover:underline"
                        >
                          {order.invoiceNumber}
                        </button>
                        <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] tabular-nums text-[var(--text-muted)]">
                          {formatDateTimeId(order.createdAt, lang)}
                        </p>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <p className="font-medium text-[var(--text-primary)]">
                          {order.customerName}
                        </p>
                        <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                          {order.customerPhone}
                        </p>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <p className="text-xs font-medium text-[var(--text-primary)]">
                          {order.shippingCourier} ({order.shippingCity})
                        </p>
                        <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                          {getShippingClassLabel(order.shippingClass, lang)}
                          {order.woodenPacking ? copy.orders.woodenPackingTag : ''}
                        </p>
                        {order.trackingNumber && (
                          <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] font-semibold text-[var(--accent-text)]">
                            {copy.orders.trackingPrefix}: {order.trackingNumber}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 align-top font-[family-name:var(--font-mono)] tabular-nums">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          {formatIdr(order.totalIdr)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {order.itemCount} {copy.common.items}
                          {order.voucherCode ? ` | ${order.voucherCode}` : ''}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 align-top">
                        <span
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            borderColor: badge.border,
                          }}
                          className="inline-flex items-center gap-1 rounded-[2px] border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[11px] font-semibold"
                        >
                          <span>{badge.marker}</span>
                          <span>{getOrderStatusLabel(order.status, lang)}</span>
                        </span>
                        {order.status === 'CANCELLED' && order.stockRestored && (
                          <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-[var(--status-ok)]">
                            {copy.orders.stockRestoredTag}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 align-top text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {quick && (
                            <button
                              type="button"
                              onClick={() => handleOpenDrawer(order, quick.nextStatus)}
                              className="min-h-[44px] rounded-[4px] bg-[var(--accent-primary)] px-3 text-xs font-semibold text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--text-primary)]"
                            >
                              {quick.label}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(order, null)}
                            className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                          >
                            {copy.common.detail}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <OrderDetailDrawer
        orderId={drawerOrderId}
        initialIntent={drawerIntent}
        onClose={() => {
          setDrawerOrderId(null);
          setDrawerIntent(null);
          if (routeOrderIdParam) {
            navigate('/admin/orders', { replace: true });
          }
        }}
        onUpdated={(res) => {
          setNotice(
            res.order.status === 'CANCELLED'
              ? copy.orders.cancelledNotice(res.order.invoiceNumber, res.restockedItemsCount)
              : copy.orders.updatedNotice(
                  res.order.invoiceNumber,
                  getOrderStatusLabel(res.order.status, lang),
                ),
          );
          void loadOrders();
        }}
      />
    </div>
  );
}
