import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ORDER_STATUSES,
  type AdminDashboardResponse,
  type AdminInventoryAdjustResponse,
  type AdminLowStockItem,
  type OrderStatus,
  type OrderSummary,
} from '../../../shared/types';
import { OrderDetailDrawer } from '../../components/admin/OrderDetailDrawer';
import {
  StockAdjustModal,
  type StockAdjustProductTarget,
} from '../../components/admin/StockAdjustModal';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateViews';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCopy, type AdminDictionary } from '../../i18n/admin';
import { ApiRequestError, apiFetch } from '../../lib/api';
import { formatDateTimeId, formatIdr, getOrderStatusLabel } from '../../lib/format';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

function getNextPrimaryAction(
  status: OrderStatus,
  copy: AdminDictionary,
): {
  nextStatus: OrderStatus;
  label: string;
} | null {
  switch (status) {
    case 'PENDING_PAYMENT':
      return { nextStatus: 'PAID_VERIFIED', label: copy.dashboard.nextActionVerify };
    case 'PAID_VERIFIED':
      return { nextStatus: 'PACKED', label: copy.dashboard.nextActionPack };
    case 'PACKED':
      return { nextStatus: 'SHIPPED', label: copy.dashboard.nextActionShip };
    default:
      return null;
  }
}

function getOrderStatusBadge(status: OrderStatus): {
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

export function AdminDashboardPage(): React.JSX.Element {
  const { lang } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);
  useDocumentTitle(copy.dashboard.docTitle);

  const { refresh: refreshAuth } = useAdminAuth();

  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [drawerOrderId, setDrawerOrderId] = useState<number | null>(null);
  const [drawerIntent, setDrawerIntent] = useState<OrderStatus | null>(null);
  const [restockTarget, setRestockTarget] = useState<StockAdjustProductTarget | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<AdminDashboardResponse>('/api/admin/dashboard');
      setData(response);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        await refreshAuth();
        return;
      }
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(copy.dashboard.errorFallback);
      }
    } finally {
      setLoading(false);
    }
  }, [refreshAuth, copy.dashboard.errorFallback]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleOpenOrder = (order: OrderSummary, intent: OrderStatus | null): void => {
    setDrawerOrderId(order.id);
    setDrawerIntent(intent);
  };

  const handleOpenRestock = (item: AdminLowStockItem): void => {
    setRestockTarget({
      id: item.id,
      sku: item.sku,
      name: item.name,
      stockQty: item.stockQty,
      lowStockThreshold: item.lowStockThreshold,
    });
  };

  const handleRestockSuccess = (res: AdminInventoryAdjustResponse): void => {
    setNotice(
      copy.dashboard.restockNotice(
        res.product.sku,
        res.mutation.stockBefore,
        res.mutation.stockAfter,
      ),
    );
    void loadDashboard();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase leading-none tracking-[0.01em] text-[var(--text-primary)] sm:text-4xl">
            {copy.dashboard.title}
          </h1>
          {data && (
            <p className="mt-2 font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-muted)]">
              {copy.dashboard.syncedAt}: {formatDateTimeId(data.generatedAt, lang)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/orders"
            className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            {copy.dashboard.allOrders}
          </Link>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3.5 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
          >
            {loading ? copy.common.loading : copy.dashboard.reloadData}
          </button>
        </div>
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
            {copy.common.dismissNotice}
          </button>
        </div>
      )}

      {loading && !data ? (
        <LoadingState label={copy.dashboard.loadingLabel} />
      ) : error && !data ? (
        <ErrorState
          title={copy.dashboard.errorTitle}
          message={error}
          onRetry={() => void loadDashboard()}
        />
      ) : data ? (
        <>
          {/* Priority Action Strip */}
          <div className="flex flex-wrap items-center gap-3 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-sm">
            <span className="font-[family-name:var(--font-mono)] text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              {copy.dashboard.priorityLabel}:
            </span>
            <a
              href="#queue-orders"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[2px] border border-[var(--status-warn)] bg-[var(--status-warn-bg)] px-3 font-[family-name:var(--font-mono)] text-xs font-semibold tabular-nums text-[var(--status-warn)]"
            >
              <span>[{data.kpis.actionRequiredOrdersCount}]</span>
              <span>{copy.dashboard.priorityOrders}</span>
            </a>
            <a
              href="#critical-stock"
              className={[
                'inline-flex min-h-[44px] items-center gap-2 rounded-[2px] border px-3 font-[family-name:var(--font-mono)] text-xs font-semibold tabular-nums',
                data.kpis.lowStockSkuCount + data.kpis.outOfStockSkuCount > 0
                  ? 'border-[var(--status-danger)] bg-[var(--status-danger-bg)] text-[var(--status-danger)]'
                  : 'border-[var(--status-ok)] bg-[var(--status-ok-bg)] text-[var(--status-ok)]',
              ].join(' ')}
            >
              <span>[{data.kpis.lowStockSkuCount + data.kpis.outOfStockSkuCount}]</span>
              <span>{copy.dashboard.priorityCriticalStock}</span>
            </a>
          </div>

          {/* Zone 1: Action Queue + Critical Stock */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_1fr]">
            {/* Action Queue */}
            <section
              id="queue-orders"
              aria-labelledby="queue-orders-heading"
              className="flex min-w-0 flex-col rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-4 py-3.5">
                <h2
                  id="queue-orders-heading"
                  className="text-base font-semibold text-[var(--text-primary)]"
                >
                  {copy.dashboard.queueHeading(data.priorityOrders.length)}
                </h2>
                <Link
                  to="/admin/orders"
                  className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                >
                  {copy.dashboard.manageOrders}
                </Link>
              </div>

              <div className="p-4">
                {data.priorityOrders.length === 0 ? (
                  <EmptyState
                    title={copy.dashboard.queueEmptyTitle}
                    description={copy.dashboard.queueEmptyDesc}
                  />
                ) : (
                  <>
                    {/* Mobile Cards (< 640px) */}
                    <div className="space-y-3 sm:hidden">
                      {data.priorityOrders.map((order) => {
                        const badge = getOrderStatusBadge(order.status);
                        const nextAction = getNextPrimaryAction(order.status, copy);
                        return (
                          <article
                            key={order.id}
                            className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5 space-y-3"
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
                                className="shrink-0 rounded-[2px] border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[11px] font-semibold"
                              >
                                {badge.marker} {getOrderStatusLabel(order.status, lang)}
                              </span>
                            </div>

                            <div className="text-sm text-[var(--text-secondary)] space-y-1">
                              <p className="font-medium text-[var(--text-primary)]">
                                {order.customerName}
                              </p>
                              <p className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-primary)]">
                                {formatIdr(order.totalIdr)} | {order.itemCount} {copy.common.items} |{' '}
                                {order.shippingCourier}
                              </p>
                            </div>

                            <div className="flex flex-col gap-2">
                              {nextAction && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenOrder(order, nextAction.nextStatus)}
                                  className="min-h-[44px] w-full rounded-[4px] bg-[var(--accent-primary)] px-3 text-sm font-semibold text-[var(--accent-foreground)]"
                                >
                                  {nextAction.label}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenOrder(order, null)}
                                className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm font-medium text-[var(--text-primary)]"
                              >
                                {copy.dashboard.openOrderDetail}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {/* Desktop & Tablet Table (>= 640px) */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                            <th className="px-3 py-2.5 font-medium">{copy.dashboard.colInvoiceTime}</th>
                            <th className="px-3 py-2.5 font-medium">{copy.dashboard.colCustomer}</th>
                            <th className="px-3 py-2.5 font-medium">{copy.dashboard.colTotalShipping}</th>
                            <th className="px-3 py-2.5 font-medium">{copy.dashboard.colStatus}</th>
                            <th className="px-3 py-2.5 text-right font-medium">{copy.dashboard.colNextAction}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {data.priorityOrders.map((order) => {
                            const badge = getOrderStatusBadge(order.status);
                            const nextAction = getNextPrimaryAction(order.status, copy);
                            return (
                              <tr
                                key={order.id}
                                className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
                              >
                                <td className="px-3 py-3 align-top">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenOrder(order, null)}
                                    className="inline-flex min-h-[44px] items-center text-left font-[family-name:var(--font-mono)] text-xs font-semibold tabular-nums text-[var(--accent-text)] underline-offset-2 hover:underline"
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
                                  <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                                    {order.shippingCity}
                                  </p>
                                </td>
                                <td className="px-3 py-3 align-top">
                                  <p className="font-[family-name:var(--font-mono)] text-xs font-semibold tabular-nums text-[var(--text-primary)]">
                                    {formatIdr(order.totalIdr)}
                                  </p>
                                  <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                                    {order.shippingCourier}
                                    {order.woodenPacking ? copy.dashboard.woodenCratedShort : ''}
                                  </p>
                                </td>
                                <td className="px-3 py-3 align-top">
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
                                </td>
                                <td className="px-3 py-3 align-top text-right">
                                  <div className="inline-flex flex-wrap justify-end gap-2">
                                    {nextAction && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenOrder(order, nextAction.nextStatus)}
                                        className="min-h-[44px] rounded-[4px] bg-[var(--accent-primary)] px-3 text-xs font-semibold text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--text-primary)]"
                                      >
                                        {nextAction.label}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenOrder(order, null)}
                                      className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
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
                )}
              </div>
            </section>

            {/* Critical Stock Alerts */}
            <section
              id="critical-stock"
              aria-labelledby="critical-stock-heading"
              className="flex min-w-0 flex-col rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-4 py-3.5">
                <h2
                  id="critical-stock-heading"
                  className="text-base font-semibold text-[var(--text-primary)]"
                >
                  {copy.dashboard.criticalStockHeading(data.lowStockProducts.length)}
                </h2>
                <Link
                  to="/admin/inventory"
                  className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                >
                  {copy.dashboard.inventoryLedgerLink}
                </Link>
              </div>

              <div className="p-4">
                {data.lowStockProducts.length === 0 ? (
                  <EmptyState
                    title={copy.dashboard.criticalEmptyTitle}
                    description={copy.dashboard.criticalEmptyDesc}
                  />
                ) : (
                  <ul className="divide-y divide-[var(--border-subtle)]">
                    {data.lowStockProducts.map((item) => {
                      const isOut = item.stockQty === 0;
                      return (
                        <li
                          key={item.id}
                          className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--text-secondary)]">
                                {item.sku}
                              </span>
                              <span
                                className={[
                                  'rounded-[2px] border px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold',
                                  isOut
                                    ? 'border-[var(--status-danger)] bg-[var(--status-danger-bg)] text-[var(--status-danger)]'
                                    : 'border-[var(--status-warn)] bg-[var(--status-warn-bg)] text-[var(--status-warn)]',
                                ].join(' ')}
                              >
                                {isOut ? copy.dashboard.stockOutBadge : copy.dashboard.stockLowBadge}
                              </span>
                            </div>
                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                              {item.name}
                            </p>
                            <p className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-muted)]">
                              {copy.dashboard.stockRemaining}:{' '}
                              <strong className="text-[var(--text-primary)]">{item.stockQty}</strong> /{' '}
                              {copy.dashboard.minShort} {item.lowStockThreshold} | {item.categoryName}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenRestock(item)}
                            className="min-h-[44px] shrink-0 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3.5 text-xs font-semibold text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--accent-primary)] hover:bg-[var(--bg-canvas)]"
                          >
                            {copy.dashboard.quickRestock}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>

          {/* Zone 2: Real-Time KPI Summary */}
          <section aria-labelledby="kpi-summary-heading" className="space-y-3">
            <h2
              id="kpi-summary-heading"
              className="text-sm font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]"
            >
              {copy.dashboard.metricsHeading}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                  {copy.dashboard.kpiConfirmedRevenue}
                </p>
                <p className="mt-2 font-[family-name:var(--font-mono)] text-xl font-semibold tabular-nums text-[var(--text-primary)]">
                  {formatIdr(data.kpis.confirmedRevenueIdr)}
                </p>
                <p className="mt-1.5 font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-secondary)]">
                  {copy.dashboard.kpiPendingRevenue}: {formatIdr(data.kpis.pendingPaymentRevenueIdr)}
                </p>
              </div>

              <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                  {copy.dashboard.kpiTotalOrders}
                </p>
                <p className="mt-2 font-[family-name:var(--font-mono)] text-xl font-semibold tabular-nums text-[var(--text-primary)]">
                  {data.kpis.totalOrdersCount}
                </p>
                <p className="mt-1.5 font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-secondary)]">
                  {copy.dashboard.kpiActionRequired(data.kpis.actionRequiredOrdersCount)}
                </p>
              </div>

              <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                  {copy.dashboard.kpiActiveCatalog}
                </p>
                <p className="mt-2 font-[family-name:var(--font-mono)] text-xl font-semibold tabular-nums text-[var(--text-primary)]">
                  {data.kpis.activeSkuCount} SKU
                </p>
                <p className="mt-1.5 font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-secondary)]">
                  {copy.dashboard.kpiWithVideo(data.kpis.productsWithVideoCount)}
                </p>
              </div>

              <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                  {copy.dashboard.kpiInventoryValue}
                </p>
                <p className="mt-2 font-[family-name:var(--font-mono)] text-xl font-semibold tabular-nums text-[var(--text-primary)]">
                  {formatIdr(data.kpis.totalInventoryValueIdr)}
                </p>
                <p className="mt-1.5 font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-secondary)]">
                  {copy.dashboard.kpiLowOutSummary(
                    data.kpis.lowStockSkuCount,
                    data.kpis.outOfStockSkuCount,
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Zone 3: Order Status Breakdown + Recent Stock Mutations */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            <section
              aria-labelledby="status-breakdown-heading"
              className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
            >
              <div className="border-b border-[var(--border-subtle)] px-4 py-3.5">
                <h2
                  id="status-breakdown-heading"
                  className="text-sm font-semibold uppercase tracking-[0.04em] text-[var(--text-primary)]"
                >
                  {copy.dashboard.statusBreakdownHeading}
                </h2>
              </div>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {ORDER_STATUSES.map((st) => {
                  const count = data.orderStatusBreakdown[st] ?? 0;
                  const badge = getOrderStatusBadge(st);
                  return (
                    <li key={st}>
                      <Link
                        to={`/admin/orders?status=${st}`}
                        className="flex min-h-[44px] items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
                      >
                        <span className="flex items-center gap-2 text-[var(--text-primary)]">
                          <span
                            style={{ color: badge.color }}
                            className="font-[family-name:var(--font-mono)] text-xs font-semibold"
                          >
                            {badge.marker}
                          </span>
                          <span>{getOrderStatusLabel(st, lang)}</span>
                        </span>
                        <span className="font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                          {count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section
              aria-labelledby="recent-mutations-heading"
              className="min-w-0 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-4 py-3.5">
                <h2
                  id="recent-mutations-heading"
                  className="text-sm font-semibold uppercase tracking-[0.04em] text-[var(--text-primary)]"
                >
                  {copy.dashboard.recentMutationsHeading(data.recentMutations.length)}
                </h2>
                <Link
                  to="/admin/inventory"
                  className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                >
                  {copy.dashboard.viewFullLedger}
                </Link>
              </div>

              <div className="p-4">
                {data.recentMutations.length === 0 ? (
                  <EmptyState
                    title={copy.dashboard.mutationsEmptyTitle}
                    description={copy.dashboard.mutationsEmptyDesc}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-[family-name:var(--font-mono)] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                          <th className="px-3 py-2 font-medium">{copy.dashboard.colTime}</th>
                          <th className="px-3 py-2 font-medium">{copy.dashboard.colSkuProduct}</th>
                          <th className="px-3 py-2 font-medium">{copy.dashboard.colMutation}</th>
                          <th className="px-3 py-2 font-medium">{copy.dashboard.colReasonNote}</th>
                          <th className="px-3 py-2 font-medium">{copy.dashboard.colActor}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {data.recentMutations.map((mut) => (
                          <tr key={mut.id} className="hover:bg-[var(--bg-elevated)]">
                            <td className="whitespace-nowrap px-3 py-2.5 font-[family-name:var(--font-mono)] tabular-nums text-[var(--text-muted)]">
                              {formatDateTimeId(mut.createdAt, lang)}
                            </td>
                            <td className="px-3 py-2.5">
                              <p className="font-[family-name:var(--font-mono)] font-semibold text-[var(--text-primary)]">
                                {mut.productSku}
                              </p>
                              <p className="max-w-[220px] truncate text-[var(--text-secondary)]">
                                {mut.productName}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 font-[family-name:var(--font-mono)] tabular-nums">
                              <span
                                className={[
                                  'font-semibold',
                                  mut.deltaQty > 0
                                    ? 'text-[var(--status-ok)]'
                                    : 'text-[var(--status-danger)]',
                                ].join(' ')}
                              >
                                {mut.deltaQty > 0 ? `+${mut.deltaQty}` : mut.deltaQty}
                              </span>
                              <span className="ml-2 text-[var(--text-muted)]">
                                ({mut.stockBefore} -&gt; {mut.stockAfter})
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="inline-block rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-secondary)]">
                                {copy.mutationReasons[mut.reason]}
                              </span>
                              {mut.referenceId && (
                                <span className="ml-1.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                                  {mut.referenceId}
                                </span>
                              )}
                              {mut.note && (
                                <p className="mt-1 max-w-[260px] text-[var(--text-secondary)]">
                                  {mut.note}
                                </p>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 font-[family-name:var(--font-mono)] text-[var(--text-muted)]">
                              {mut.actor}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}

      <OrderDetailDrawer
        orderId={drawerOrderId}
        initialIntent={drawerIntent}
        onClose={() => {
          setDrawerOrderId(null);
          setDrawerIntent(null);
        }}
        onUpdated={(res) => {
          setNotice(
            copy.dashboard.orderUpdatedNotice(
              res.order.invoiceNumber,
              getOrderStatusLabel(res.order.status, lang),
            ),
          );
          void loadDashboard();
        }}
      />

      <StockAdjustModal
        open={restockTarget !== null}
        product={restockTarget}
        initialReason="MANUAL_RESTOCK"
        onClose={() => setRestockTarget(null)}
        onSuccess={handleRestockSuccess}
      />
    </div>
  );
}
