import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  AdminDeleteProductResponse,
  AdminProductListResponse,
  BootstrapResponse,
  CategoryWithCount,
  ProductDetail,
} from '../../../shared/types';
import { ProductEditorModal } from '../../components/admin/ProductEditorModal';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateViews';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCopy } from '../../i18n/admin';
import { ApiRequestError, apiFetch } from '../../lib/api';
import { formatIdr, formatWeight, getShippingClassLabel } from '../../lib/format';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type StatusFilter = 'all' | 'active' | 'inactive';
type StockFilter = 'all' | 'in' | 'low' | 'out';

export function AdminProductsPage(): React.JSX.Element {
  const { lang, getCategoryName } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);
  useDocumentTitle(copy.products.docTitle);

  const { refresh: refreshAuth } = useAdminAuth();

  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [onlyWithVideo, setOnlyWithVideo] = useState<boolean>(false);

  // Editor & Delete modal state
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductDetail | null>(null);
  const [deletePending, setDeletePending] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteDialogRef = useRef<HTMLDivElement | null>(null);
  const deleteCancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const deletePrevFocusRef = useRef<HTMLElement | null>(null);

  const loadCategories = useCallback(async (): Promise<void> => {
    try {
      const boot = await apiFetch<BootstrapResponse>('/api/bootstrap');
      setCategories(boot.categories);
    } catch {
      // Categories remain fallback-available if bootstrap temporarily fails.
    }
  }, []);

  const loadProducts = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (stockFilter !== 'all') params.set('stockFilter', stockFilter);
      if (onlyWithVideo) params.set('hasVideo', 'true');

      const qs = params.toString();
      const response = await apiFetch<AdminProductListResponse>(
        qs ? `/api/admin/products?${qs}` : '/api/admin/products',
      );
      setProducts(response.items);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        await refreshAuth();
        return;
      }
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(copy.products.errorFallback);
      }
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    categoryFilter,
    statusFilter,
    stockFilter,
    onlyWithVideo,
    refreshAuth,
    copy.products.errorFallback,
  ]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  useEffect(() => {
    if (!deletingProduct) return;

    deletePrevFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      deleteCancelBtnRef.current?.focus();
    }, 10);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDeletingProduct(null);
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
  }, [deletingProduct]);

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deletingProduct) return;
    setDeletePending(true);
    setDeleteError(null);
    try {
      const res = await apiFetch<AdminDeleteProductResponse>(
        `/api/admin/products/${deletingProduct.id}`,
        {
          method: 'DELETE',
        },
      );
      setNotice(
        res.mode === 'soft_archived'
          ? copy.products.archivedNotice(deletingProduct.sku)
          : copy.products.deletedNotice(deletingProduct.sku),
      );
      setDeletingProduct(null);
      void loadProducts();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setDeleteError(err.message);
      } else {
        setDeleteError(copy.products.deleteErrorFallback);
      }
    } finally {
      setDeletePending(false);
    }
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    Boolean(categoryFilter) ||
    statusFilter !== 'all' ||
    stockFilter !== 'all' ||
    onlyWithVideo;

  const resetFilters = (): void => {
    setSearchQuery('');
    setCategoryFilter('');
    setStatusFilter('all');
    setStockFilter('all');
    setOnlyWithVideo(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase leading-none tracking-[0.01em] text-[var(--text-primary)] sm:text-4xl">
          {copy.products.title}
        </h1>

        <button
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setEditorOpen(true);
          }}
          className="inline-flex min-h-[44px] items-center justify-center rounded-[4px] bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--text-primary)]"
        >
          {copy.products.addNew}
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

      {/* Search & Filter Toolbar */}
      <section
        aria-label={copy.products.filterSectionAria}
        className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="admin-prod-search"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              {copy.products.searchLabel}
            </label>
            <input
              id="admin-prod-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.products.searchPlaceholder}
              className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-prod-category"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              {copy.products.categoryLabel}
            </label>
            <select
              id="admin-prod-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
            >
              <option value="">{copy.products.allCategories}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {getCategoryName(cat.slug, cat.name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-prod-status"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              {copy.products.statusLabel}
            </label>
            <select
              id="admin-prod-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
            >
              <option value="all">{copy.products.allStatuses}</option>
              <option value="active">{copy.products.statusActive}</option>
              <option value="inactive">{copy.products.statusInactive}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-prod-stock"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              {copy.products.stockLabel}
            </label>
            <select
              id="admin-prod-stock"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
            >
              <option value="all">{copy.products.allStocks}</option>
              <option value="in">{copy.products.stockSafe}</option>
              <option value="low">{copy.products.stockLow}</option>
              <option value="out">{copy.products.stockOut}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="inline-flex min-h-[44px] items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={onlyWithVideo}
              onChange={(e) => setOnlyWithVideo(e.target.checked)}
              className="h-4 w-4"
            />
            <span>{copy.products.onlyWithVideo}</span>
          </label>

          <div className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-muted)]">
              {copy.products.showingCount(products.length)}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-xs font-medium text-[var(--text-primary)]"
              >
                {copy.products.resetFilter}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Product List */}
      {loading ? (
        <LoadingState label={copy.products.loadingLabel} />
      ) : error ? (
        <ErrorState
          title={copy.products.errorTitle}
          message={error}
          onRetry={() => void loadProducts()}
        />
      ) : products.length === 0 ? (
        <EmptyState
          title={
            hasActiveFilters ? copy.products.emptyFilteredTitle : copy.products.emptyDefaultTitle
          }
          description={
            hasActiveFilters ? copy.products.emptyFilteredDesc : copy.products.emptyDefaultDesc
          }
          actionLabel={hasActiveFilters ? copy.products.resetAllFilters : copy.products.addNew}
          onAction={
            hasActiveFilters
              ? resetFilters
              : () => {
                  setEditingProduct(null);
                  setEditorOpen(true);
                }
          }
        />
      ) : (
        <>
          {/* Mobile Cards (< 768px) */}
          <div className="space-y-3 md:hidden">
            {products.map((item) => (
              <article
                key={item.id}
                className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-3"
              >
                <div className="flex gap-3">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                    {item.primaryImageUrl ? (
                      <img
                        src={item.primaryImageUrl}
                        alt={item.primaryImageAlt || item.name}
                        width={160}
                        height={90}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">
                        {copy.common.noImage}
                      </div>
                    )}
                    {item.hasVideo && (
                      <span className="absolute top-1 left-1 rounded-[2px] bg-[var(--bg-canvas)] px-1 py-0.5 font-[family-name:var(--font-mono)] text-[9px] font-semibold text-[var(--accent-text)]">
                        VID
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--text-secondary)]">
                        {item.sku}
                      </span>
                      <span
                        className={[
                          'rounded-[2px] border px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold',
                          item.isActive
                            ? 'border-[var(--status-ok)] bg-[var(--status-ok-bg)] text-[var(--status-ok)]'
                            : 'border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-muted)]',
                        ].join(' ')}
                      >
                        {item.isActive ? copy.products.activeBadge : copy.products.inactiveBadge}
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</h2>
                    <p className="font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--accent-text)]">
                      {formatIdr(item.priceIdr)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2.5 text-xs text-[var(--text-secondary)]">
                  <span className="font-[family-name:var(--font-mono)] tabular-nums">
                    {copy.products.stockSummaryMobile(item.stockQty, item.lowStockThreshold)}
                  </span>
                  <span className="font-[family-name:var(--font-mono)]">
                    {getCategoryName(item.categorySlug, item.categoryName)} |{' '}
                    {copy.products.mediaCountShort(item.media.length)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(item);
                      setEditorOpen(true);
                    }}
                    className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2 text-xs font-semibold text-[var(--text-primary)]"
                  >
                    {copy.common.edit}
                  </button>
                  <Link
                    to={`/admin/inventory?q=${encodeURIComponent(item.sku)}`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-2 text-xs font-medium text-[var(--text-primary)]"
                  >
                    {copy.products.stockBtn}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingProduct(item);
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
                  <th className="px-3 py-3 font-medium">{copy.products.colProductSku}</th>
                  <th className="px-3 py-3 font-medium">{copy.products.colCategorySpecs}</th>
                  <th className="px-3 py-3 font-medium">{copy.products.colPriceWeight}</th>
                  <th className="px-3 py-3 font-medium">{copy.products.colStock}</th>
                  <th className="px-3 py-3 font-medium">{copy.products.colMediaStatus}</th>
                  <th className="px-3 py-3 text-right font-medium">{copy.products.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {products.map((item) => {
                  const stockBadgeStyle =
                    item.stockStatus === 'OUT_OF_STOCK'
                      ? 'border-[var(--status-danger)] bg-[var(--status-danger-bg)] text-[var(--status-danger)]'
                      : item.stockStatus === 'LOW_STOCK'
                        ? 'border-[var(--status-warn)] bg-[var(--status-warn-bg)] text-[var(--status-warn)]'
                        : 'border-[var(--status-ok)] bg-[var(--status-ok-bg)] text-[var(--status-ok)]';

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
                    >
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-start gap-3">
                          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
                            {item.primaryImageUrl ? (
                              <img
                                src={item.primaryImageUrl}
                                alt={item.primaryImageAlt || item.name}
                                width={160}
                                height={90}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">
                                {copy.common.noImage}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--text-secondary)]">
                              {item.sku}
                            </p>
                            <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{item.brand}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <p className="text-xs font-medium text-[var(--text-primary)]">
                          {getCategoryName(item.categorySlug, item.categoryName)}
                        </p>
                        <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-secondary)]">
                          {item.propulsion}
                          {item.fpsMin !== null && item.fpsMax !== null
                            ? ` | ${item.fpsMin}-${item.fpsMax} FPS`
                            : ''}
                        </p>
                        <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                          {getShippingClassLabel(item.shippingClass, lang)}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 align-top font-[family-name:var(--font-mono)] tabular-nums">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          {formatIdr(item.priceIdr)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {formatWeight(item.weightGrams, lang)}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 align-top">
                        <span
                          className={`inline-flex items-center rounded-[2px] border px-2 py-0.5 font-[family-name:var(--font-mono)] text-xs font-semibold tabular-nums ${stockBadgeStyle}`}
                        >
                          {item.stockQty} / {item.lowStockThreshold}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={[
                              'rounded-[2px] border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold',
                              item.isActive
                                ? 'border-[var(--status-ok)] bg-[var(--status-ok-bg)] text-[var(--status-ok)]'
                                : 'border-[var(--border-strong)] bg-[var(--bg-canvas)] text-[var(--text-muted)]',
                            ].join(' ')}
                          >
                            {item.isActive ? copy.products.activeBadge : copy.products.inactiveBadge}
                          </span>
                          {item.hasVideo && (
                            <span className="rounded-[2px] border border-[var(--brand-olive)] bg-[var(--brand-olive-surface)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold text-[var(--brand-olive-tag-text)]">
                              {copy.products.videoBadge}
                            </span>
                          )}
                          <span className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] tabular-nums text-[var(--text-muted)]">
                            {copy.products.assetsCountShort(item.media.length)}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 align-top text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(item);
                              setEditorOpen(true);
                            }}
                            className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                          >
                            {copy.common.edit}
                          </button>
                          <Link
                            to={`/admin/inventory?q=${encodeURIComponent(item.sku)}`}
                            className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                          >
                            {copy.products.stockBtn}
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingProduct(item);
                              setDeleteError(null);
                            }}
                            className="min-h-[44px] rounded-[4px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-3 text-xs font-medium text-[var(--status-danger)]"
                          >
                            {copy.common.delete}
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

      {/* Product Editor Modal */}
      <ProductEditorModal
        open={editorOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => setEditorOpen(false)}
        onSaved={(saved) => {
          setNotice(
            editingProduct
              ? copy.products.savedEditNotice(saved.sku, saved.name)
              : copy.products.savedCreateNotice(saved.sku, saved.name),
          );
          void loadProducts();
        }}
      />

      {/* Delete / Archive Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[var(--backdrop-scrim)]"
            aria-hidden="true"
            onClick={() => setDeletingProduct(null)}
          />
          <div
            ref={deleteDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            className="relative z-10 w-full max-w-md rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-overlay)] space-y-4"
          >
            <div>
              <h2 id="delete-product-title" className="text-lg font-semibold text-[var(--text-primary)]">
                {copy.products.deleteDialogTitle}
              </h2>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--status-danger)]">
                {deletingProduct.sku}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {copy.products.deleteDialogBody(deletingProduct.name)}
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
                ref={deleteCancelBtnRef}
                type="button"
                onClick={() => setDeletingProduct(null)}
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
                {deletePending ? copy.common.processing : copy.products.deleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
