import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  INVENTORY_MUTATION_REASONS,
  type AdminInventoryAdjustResponse,
  type AdminInventoryListResponse,
  type AdminInventoryProductRow,
  type InventoryMutationReason,
  type StockStatus,
} from '../../../shared/types';
import {
  StockAdjustModal,
  type StockAdjustProductTarget,
} from '../../components/admin/StockAdjustModal';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateViews';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCopy, type AdminDictionary } from '../../i18n/admin';
import { ApiRequestError, apiFetch } from '../../lib/api';
import { formatDateTimeId, formatIdr } from '../../lib/format';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type InventoryTabId = 'positions' | 'ledger';

function getStockBadge(
  status: StockStatus,
  copy: AdminDictionary,
): { label: string; className: string } {
  switch (status) {
    case 'OUT_OF_STOCK':
      return {
        label: copy.inventory.badgeOut,
        className:
          'border-[var(--status-danger)] bg-[var(--status-danger-bg)] text-[var(--status-danger)]',
      };
    case 'LOW_STOCK':
      return {
        label: copy.inventory.badgeLow,
        className:
          'border-[var(--status-warn)] bg-[var(--status-warn-bg)] text-[var(--status-warn)]',
      };
    case 'IN_STOCK':
      return {
        label: copy.inventory.badgeSafe,
        className: 'border-[var(--status-ok)] bg-[var(--status-ok-bg)] text-[var(--status-ok)]',
      };
  }
}

export function AdminInventoryPage(): React.JSX.Element {
  const { lang } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);
  useDocumentTitle(copy.inventory.docTitle);

  const { refresh: refreshAuth } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<InventoryTabId>('positions');
  const [data, setData] = useState<AdminInventoryListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.get('q') ?? '');
  const [stockFilter, setStockFilter] = useState<'ALL' | StockStatus>('ALL');
  const [reasonFilter, setReasonFilter] = useState<'' | InventoryMutationReason>('');
  const [ledgerProductId, setLedgerProductId] = useState<number | null>(null);

  // Modal state
  const [adjustTarget, setAdjustTarget] = useState<StockAdjustProductTarget | null>(null);
  const [adjustReason, setAdjustReason] = useState<'MANUAL_RESTOCK' | 'AUDIT_ADJUSTMENT'>(
    'MANUAL_RESTOCK',
  );

  const tabRefs = useRef<Record<InventoryTabId, HTMLButtonElement | null>>({
    positions: null,
    ledger: null,
  });

  const loadInventory = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (reasonFilter) params.set('reason', reasonFilter);
      if (ledgerProductId !== null) params.set('productId', String(ledgerProductId));

      const qs = params.toString();
      const response = await apiFetch<AdminInventoryListResponse>(
        qs ? `/api/admin/inventory?${qs}` : '/api/admin/inventory',
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
        setError(copy.inventory.errorFallback);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, reasonFilter, ledgerProductId, refreshAuth, copy.inventory.errorFallback]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInventory();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [loadInventory]);

  const handleSearchChange = (value: string): void => {
    setSearchQuery(value);
    if (value.trim()) {
      setSearchParams({ q: value.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    if (stockFilter === 'ALL') return data.products;
    return data.products.filter((row) => row.stockStatus === stockFilter);
  }, [data, stockFilter]);

  const stockCounts = useMemo(() => {
    const rows = data?.products ?? [];
    return {
      total: rows.length,
      out: rows.filter((r) => r.stockStatus === 'OUT_OF_STOCK').length,
      low: rows.filter((r) => r.stockStatus === 'LOW_STOCK').length,
      safe: rows.filter((r) => r.stockStatus === 'IN_STOCK').length,
    };
  }, [data]);

  const openAdjustModal = (
    row: AdminInventoryProductRow,
    mode: 'MANUAL_RESTOCK' | 'AUDIT_ADJUSTMENT',
  ): void => {
    setAdjustTarget({
      id: row.id,
      sku: row.sku,
      name: row.name,
      stockQty: row.stockQty,
      lowStockThreshold: row.lowStockThreshold,
    });
    setAdjustReason(mode);
  };

  const handleAdjustSuccess = (res: AdminInventoryAdjustResponse): void => {
    const deltaStr =
      res.mutation.deltaQty > 0 ? `+${res.mutation.deltaQty}` : String(res.mutation.deltaQty);
    setNotice(
      copy.inventory.adjustNotice(
        res.product.sku,
        deltaStr,
        res.mutation.stockBefore,
        res.mutation.stockAfter,
      ),
    );
    void loadInventory();
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next: InventoryTabId = activeTab === 'positions' ? 'ledger' : 'positions';
      setActiveTab(next);
      tabRefs.current[next]?.focus();
    }
  };

  const selectedLedgerProduct = useMemo(
    () =>
      ledgerProductId !== null ? data?.products.find((p) => p.id === ledgerProductId) ?? null : null,
    [data, ledgerProductId],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase leading-none tracking-[0.01em] text-[var(--text-primary)] sm:text-4xl">
          {copy.inventory.title}
        </h1>

        <button
          type="button"
          onClick={() => void loadInventory()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
        >
          {loading ? copy.common.loading : copy.inventory.reloadBtn}
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

      {/* Real-Time Summary */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[var(--text-muted)]">
              {copy.inventory.kpiTotalValue}
            </p>
            <p className="mt-1.5 font-[family-name:var(--font-mono)] text-xl font-semibold tabular-nums text-[var(--text-primary)]">
              {formatIdr(data.totalInventoryValueIdr)}
            </p>
          </div>
          <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[var(--text-muted)]">
              {copy.inventory.kpiSafeSku}
            </p>
            <p className="mt-1.5 font-[family-name:var(--font-mono)] text-xl font-semibold tabular-nums text-[var(--status-ok)]">
              {stockCounts.safe} / {stockCounts.total} SKU
            </p>
          </div>
          <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[var(--text-muted)]">
              {copy.inventory.kpiLowSku}
            </p>
            <p className="mt-1.5 font-[family-name:var(--font-mono)] text-xl font-semibold tabular-nums text-[var(--status-warn)]">
              {stockCounts.low} SKU
            </p>
          </div>
          <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase text-[var(--text-muted)]">
              {copy.inventory.kpiOutSku}
            </p>
            <p className="mt-1.5 font-[family-name:var(--font-mono)] text-xl font-semibold tabular-nums text-[var(--status-danger)]">
              {stockCounts.out} SKU
            </p>
          </div>
        </div>
      )}

      {/* ARIA Tabs */}
      <div
        role="tablist"
        aria-label={copy.inventory.tablistAria}
        className="flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-3"
      >
        <button
          ref={(el) => {
            tabRefs.current.positions = el;
          }}
          id="inv-tab-positions"
          role="tab"
          type="button"
          aria-selected={activeTab === 'positions'}
          aria-controls="inv-panel-positions"
          tabIndex={activeTab === 'positions' ? 0 : -1}
          onClick={() => setActiveTab('positions')}
          onKeyDown={handleTabKeyDown}
          className={[
            'min-h-[44px] rounded-[4px] border px-4 text-sm transition-colors duration-150',
            activeTab === 'positions'
              ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
          ].join(' ')}
        >
          {copy.inventory.tabPositions} {data ? `(${data.products.length})` : ''}
        </button>

        <button
          ref={(el) => {
            tabRefs.current.ledger = el;
          }}
          id="inv-tab-ledger"
          role="tab"
          type="button"
          aria-selected={activeTab === 'ledger'}
          aria-controls="inv-panel-ledger"
          tabIndex={activeTab === 'ledger' ? 0 : -1}
          onClick={() => setActiveTab('ledger')}
          onKeyDown={handleTabKeyDown}
          className={[
            'min-h-[44px] rounded-[4px] border px-4 text-sm transition-colors duration-150',
            activeTab === 'ledger'
              ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
          ].join(' ')}
        >
          {copy.inventory.tabLedger} {data ? `(${data.mutations.length})` : ''}
        </button>
      </div>

      {loading && !data ? (
        <LoadingState label={copy.inventory.loadingLabel} />
      ) : error && !data ? (
        <ErrorState
          title={copy.inventory.errorTitle}
          message={error}
          onRetry={() => void loadInventory()}
        />
      ) : data ? (
        <>
          {/* TAB 1: STOCK POSITIONS */}
          <div
            id="inv-panel-positions"
            role="tabpanel"
            aria-labelledby="inv-tab-positions"
            hidden={activeTab !== 'positions'}
            className="space-y-4"
          >
            <div className="flex flex-col gap-3 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="inv-search"
                  className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                >
                  {copy.inventory.searchLabel}
                </label>
                <input
                  id="inv-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={copy.inventory.searchPlaceholder}
                  className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div className="sm:w-56">
                <label
                  htmlFor="inv-stock-filter"
                  className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                >
                  {copy.inventory.stockFilterLabel}
                </label>
                <select
                  id="inv-stock-filter"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as 'ALL' | StockStatus)}
                  className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                >
                  <option value="ALL">{copy.inventory.allStockStatuses}</option>
                  <option value="OUT_OF_STOCK">{copy.inventory.statusOut}</option>
                  <option value="LOW_STOCK">{copy.inventory.statusLow}</option>
                  <option value="IN_STOCK">{copy.inventory.statusSafe}</option>
                </select>
              </div>

              {(searchQuery.trim() || stockFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    handleSearchChange('');
                    setStockFilter('ALL');
                  }}
                  className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 text-xs font-medium text-[var(--text-primary)]"
                >
                  {copy.inventory.resetFilter}
                </button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <EmptyState
                title={copy.inventory.emptyPositionsTitle}
                description={copy.inventory.emptyPositionsDesc}
                actionLabel={copy.inventory.resetInventoryFilter}
                onAction={() => {
                  handleSearchChange('');
                  setStockFilter('ALL');
                }}
              />
            ) : (
              <>
                {/* Mobile Cards (< 768px) */}
                <div className="space-y-3 md:hidden">
                  {filteredProducts.map((row) => {
                    const badge = getStockBadge(row.stockStatus, copy);
                    return (
                      <article
                        key={row.id}
                        className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--text-secondary)]">
                              {row.sku}
                            </p>
                            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                              {row.name}
                            </h2>
                            <p className="text-xs text-[var(--text-muted)]">{row.categoryName}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-[2px] border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t border-[var(--border-subtle)] pt-2.5 font-[family-name:var(--font-mono)] text-xs tabular-nums">
                          <div>
                            <span className="block text-[10px] text-[var(--text-muted)]">
                              {copy.inventory.mobileStockMin}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {row.stockQty} / {row.lowStockThreshold}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[var(--text-muted)]">
                              {copy.inventory.mobileAssetValue}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {formatIdr(row.inventoryValueIdr)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => openAdjustModal(row, 'MANUAL_RESTOCK')}
                            className="min-h-[44px] rounded-[4px] bg-[var(--accent-primary)] px-2 text-xs font-semibold text-[var(--accent-foreground)]"
                          >
                            {copy.inventory.btnRestock}
                          </button>
                          <button
                            type="button"
                            onClick={() => openAdjustModal(row, 'AUDIT_ADJUSTMENT')}
                            className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2 text-xs font-medium text-[var(--text-primary)]"
                          >
                            {copy.inventory.btnAudit}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLedgerProductId(row.id);
                              setActiveTab('ledger');
                            }}
                            className="min-h-[44px] rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 text-xs font-medium text-[var(--text-secondary)]"
                          >
                            {copy.inventory.btnHistory}
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
                        <th className="px-3 py-3 font-medium">{copy.inventory.colSkuProduct}</th>
                        <th className="px-3 py-3 font-medium">{copy.inventory.colStockMin}</th>
                        <th className="px-3 py-3 font-medium">{copy.inventory.colPriceValue}</th>
                        <th className="px-3 py-3 font-medium">{copy.inventory.colLastMutation}</th>
                        <th className="px-3 py-3 text-right font-medium">{copy.inventory.colActions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {filteredProducts.map((row) => {
                        const badge = getStockBadge(row.stockStatus, copy);
                        return (
                          <tr
                            key={row.id}
                            className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
                          >
                            <td className="px-3 py-3 align-top">
                              <p className="font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--text-secondary)]">
                                {row.sku}
                              </p>
                              <p className="font-medium text-[var(--text-primary)]">{row.name}</p>
                              <p className="text-xs text-[var(--text-muted)]">{row.categoryName}</p>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 align-top">
                              <div className="flex items-center gap-2">
                                <span className="font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                                  {row.stockQty}
                                </span>
                                <span className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-muted)]">
                                  / {row.lowStockThreshold}
                                </span>
                                <span
                                  className={`rounded-[2px] border px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold ${badge.className}`}
                                >
                                  {badge.label}
                                </span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 align-top font-[family-name:var(--font-mono)] tabular-nums">
                              <p className="text-xs font-semibold text-[var(--text-primary)]">
                                {formatIdr(row.inventoryValueIdr)}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                                @ {formatIdr(row.priceIdr)}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 align-top font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-muted)]">
                              {row.lastMutationAt
                                ? formatDateTimeId(row.lastMutationAt, lang)
                                : copy.inventory.notRecorded}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 align-top text-right">
                              <div className="inline-flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openAdjustModal(row, 'MANUAL_RESTOCK')}
                                  className="min-h-[44px] rounded-[4px] bg-[var(--accent-primary)] px-3 text-xs font-semibold text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--text-primary)]"
                                >
                                  {copy.inventory.btnRestock}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openAdjustModal(row, 'AUDIT_ADJUSTMENT')}
                                  className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                                >
                                  {copy.inventory.btnAudit}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLedgerProductId(row.id);
                                    setActiveTab('ledger');
                                  }}
                                  className="min-h-[44px] rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                                >
                                  {copy.inventory.btnHistory}
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

          {/* TAB 2: MUTATION LEDGER */}
          <div
            id="inv-panel-ledger"
            role="tabpanel"
            aria-labelledby="inv-tab-ledger"
            hidden={activeTab !== 'ledger'}
            className="space-y-4"
          >
            <div className="flex flex-col gap-3 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:flex-row sm:items-end">
              <div className="sm:w-64">
                <label
                  htmlFor="inv-ledger-reason"
                  className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                >
                  {copy.inventory.reasonFilterLabel}
                </label>
                <select
                  id="inv-ledger-reason"
                  value={reasonFilter}
                  onChange={(e) => setReasonFilter(e.target.value as '' | InventoryMutationReason)}
                  className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                >
                  <option value="">{copy.inventory.allReasons}</option>
                  {INVENTORY_MUTATION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {copy.mutationReasons[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label
                  htmlFor="inv-ledger-product"
                  className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                >
                  {copy.inventory.productFilterLabel}
                </label>
                <select
                  id="inv-ledger-product"
                  value={ledgerProductId ?? ''}
                  onChange={(e) =>
                    setLedgerProductId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                >
                  <option value="">{copy.inventory.allProducts}</option>
                  {data.products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.sku} - {prod.name}
                    </option>
                  ))}
                </select>
              </div>

              {(reasonFilter || ledgerProductId !== null) && (
                <button
                  type="button"
                  onClick={() => {
                    setReasonFilter('');
                    setLedgerProductId(null);
                  }}
                  className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 text-xs font-medium text-[var(--text-primary)]"
                >
                  {copy.inventory.resetLedgerFilter}
                </button>
              )}
            </div>

            {selectedLedgerProduct && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-[2px] border border-[var(--brand-olive)] bg-[var(--brand-olive-surface)] px-4 py-2.5 text-xs text-[var(--brand-olive-tag-text)]">
                <span>
                  {copy.inventory.filteredForSku(
                    selectedLedgerProduct.sku,
                    selectedLedgerProduct.name,
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setLedgerProductId(null)}
                  className="min-h-[44px] rounded-[4px] border border-[var(--brand-olive)] px-3 font-semibold"
                >
                  {copy.inventory.showAllSkus}
                </button>
              </div>
            )}

            {data.mutations.length === 0 ? (
              <EmptyState
                title={copy.inventory.emptyLedgerTitle}
                description={copy.inventory.emptyLedgerDesc}
                actionLabel={
                  reasonFilter || ledgerProductId !== null
                    ? copy.inventory.resetLedgerFilter
                    : undefined
                }
                onAction={
                  reasonFilter || ledgerProductId !== null
                    ? () => {
                        setReasonFilter('');
                        setLedgerProductId(null);
                      }
                    : undefined
                }
              />
            ) : (
              <div className="overflow-x-auto rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-[family-name:var(--font-mono)] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                      <th className="px-3 py-3 font-medium">{copy.inventory.colTime}</th>
                      <th className="px-3 py-3 font-medium">{copy.inventory.colSkuProduct}</th>
                      <th className="px-3 py-3 font-medium">{copy.inventory.colDelta}</th>
                      <th className="px-3 py-3 font-medium">{copy.inventory.colBeforeAfter}</th>
                      <th className="px-3 py-3 font-medium">{copy.inventory.colTypeRef}</th>
                      <th className="px-3 py-3 font-medium">{copy.inventory.colNote}</th>
                      <th className="px-3 py-3 font-medium">{copy.inventory.colActor}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {data.mutations.map((mut) => (
                      <tr key={mut.id} className="hover:bg-[var(--bg-elevated)]">
                        <td className="whitespace-nowrap px-3 py-3 font-[family-name:var(--font-mono)] tabular-nums text-[var(--text-muted)]">
                          {formatDateTimeId(mut.createdAt, lang)}
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-[family-name:var(--font-mono)] font-semibold text-[var(--text-primary)]">
                            {mut.productSku}
                          </p>
                          <p className="max-w-[220px] truncate text-[var(--text-secondary)]">
                            {mut.productName}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums">
                          <span
                            className={
                              mut.deltaQty > 0
                                ? 'text-[var(--status-ok)]'
                                : 'text-[var(--status-danger)]'
                            }
                          >
                            {mut.deltaQty > 0 ? `+${mut.deltaQty}` : mut.deltaQty}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-[family-name:var(--font-mono)] tabular-nums text-[var(--text-secondary)]">
                          {mut.stockBefore} -&gt;{' '}
                          <strong className="text-[var(--text-primary)]">{mut.stockAfter}</strong>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-block rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-primary)]">
                            {copy.mutationReasons[mut.reason]}
                          </span>
                          {mut.referenceId && (
                            <p className="mt-1 font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                              {copy.inventory.refPrefix}: {mut.referenceId}
                            </p>
                          )}
                        </td>
                        <td className="max-w-[260px] px-3 py-3 text-[var(--text-secondary)]">
                          {mut.note || copy.inventory.noNote}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-[family-name:var(--font-mono)] text-[var(--text-muted)]">
                          {mut.actor}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      <StockAdjustModal
        open={adjustTarget !== null}
        product={adjustTarget}
        initialReason={adjustReason}
        onClose={() => setAdjustTarget(null)}
        onSuccess={handleAdjustSuccess}
      />
    </div>
  );
}
