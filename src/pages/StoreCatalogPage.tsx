import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MISSION_TAGS,
  PLATFORM_TYPES,
  PROPULSION_TYPES,
  type MissionTag,
  type PlatformType,
  type ProductListResponse,
  type ProductSortOption,
  type PropulsionType,
} from '../../shared/types';
import {
  CatalogFilterPanel,
  type CatalogFilterValues,
} from '../components/store/CatalogFilterPanel';
import { ProductCard } from '../components/store/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';
import { IconClose, IconSearch, IconSliders } from '../components/ui/TacticalIcons';
import { useBootstrap } from '../context/BootstrapContext';
import { useLanguage } from '../context/LanguageContext';
import { getStoreCopy } from '../i18n/store';
import { apiFetch, ApiRequestError } from '../lib/api';
import { formatIdr } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const PAGE_LIMIT = 12;

const VALID_SORTS: ReadonlySet<ProductSortOption> = new Set([
  'featured',
  'newest',
  'price_asc',
  'price_desc',
  'fps_asc',
  'fps_desc',
]);

function parseFiltersFromParams(params: URLSearchParams): CatalogFilterValues & { page: number } {
  const rawMission = params.get('mission') || '';
  const mission = (MISSION_TAGS as readonly string[]).includes(rawMission)
    ? (rawMission as MissionTag)
    : '';

  const rawPlatform = params.get('platform') || '';
  const platform = (PLATFORM_TYPES as readonly string[]).includes(rawPlatform)
    ? (rawPlatform as PlatformType)
    : '';

  const rawPropulsion = params.get('propulsion') || '';
  const propulsion = (PROPULSION_TYPES as readonly string[]).includes(rawPropulsion)
    ? (rawPropulsion as PropulsionType)
    : '';

  const rawSort = params.get('sort') || 'featured';
  const sort: ProductSortOption = VALID_SORTS.has(rawSort as ProductSortOption)
    ? (rawSort as ProductSortOption)
    : 'featured';

  const rawPage = Number(params.get('page') || '1');
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const inStockRaw = params.get('inStock');
  const hasVideoRaw = params.get('hasVideo');

  return {
    q: params.get('q') || '',
    category: params.get('category') || '',
    mission,
    platform,
    propulsion,
    minFps: params.get('minFps') || '',
    maxFps: params.get('maxFps') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    inStock: inStockRaw === 'true' || inStockRaw === '1',
    hasVideo: hasVideoRaw === 'true' || hasVideoRaw === '1',
    sort,
    page,
  };
}

function buildSearchParams(
  values: CatalogFilterValues,
  page: number,
): URLSearchParams {
  const next = new URLSearchParams();
  if (values.q.trim()) next.set('q', values.q.trim());
  if (values.category) next.set('category', values.category);
  if (values.mission) next.set('mission', values.mission);
  if (values.platform) next.set('platform', values.platform);
  if (values.propulsion) next.set('propulsion', values.propulsion);
  if (values.minFps.trim()) next.set('minFps', values.minFps.trim());
  if (values.maxFps.trim()) next.set('maxFps', values.maxFps.trim());
  if (values.minPrice.trim()) next.set('minPrice', values.minPrice.trim());
  if (values.maxPrice.trim()) next.set('maxPrice', values.maxPrice.trim());
  if (values.inStock) next.set('inStock', 'true');
  if (values.hasVideo) next.set('hasVideo', 'true');
  if (values.sort && values.sort !== 'featured') next.set('sort', values.sort);
  if (page > 1) next.set('page', String(page));
  return next;
}

export function StoreCatalogPage(): React.JSX.Element {
  const { lang, getCategoryName } = useLanguage();
  const { catalog, filters } = getStoreCopy(lang);
  const { data: bootstrap } = useBootstrap();
  const [searchParams, setSearchParams] = useSearchParams();

  const parsed = useMemo(() => parseFiltersFromParams(searchParams), [searchParams]);
  const activeCategoryTitle = useMemo(() => {
    if (!parsed.category) return null;
    const fallback = bootstrap?.categories.find((c) => c.slug === parsed.category)?.name;
    return getCategoryName(parsed.category, fallback);
  }, [parsed.category, bootstrap?.categories, getCategoryName]);

  useDocumentTitle(
    activeCategoryTitle ? catalog.docTitleCategory(activeCategoryTitle) : catalog.docTitle,
  );

  const [searchInput, setSearchInput] = useState<string>(parsed.q);
  const [catalogData, setCatalogData] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState<number>(0);

  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const sheetCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setSearchInput(parsed.q);
  }, [parsed.q]);

  const applyFilterPatch = useCallback(
    (patch: Partial<CatalogFilterValues>, resetPage = true, replace = false) => {
      const merged: CatalogFilterValues = {
        q: parsed.q,
        category: parsed.category,
        mission: parsed.mission,
        platform: parsed.platform,
        propulsion: parsed.propulsion,
        minFps: parsed.minFps,
        maxFps: parsed.maxFps,
        minPrice: parsed.minPrice,
        maxPrice: parsed.maxPrice,
        inStock: parsed.inStock,
        hasVideo: parsed.hasVideo,
        sort: parsed.sort,
        ...patch,
      };
      const targetPage = resetPage ? 1 : parsed.page;
      setSearchParams(buildSearchParams(merged, targetPage), { replace });
    },
    [parsed, setSearchParams],
  );

  useEffect(() => {
    if (searchInput.trim() === parsed.q.trim()) return;
    const timer = window.setTimeout(() => {
      applyFilterPatch({ q: searchInput }, true, true);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput, parsed.q, applyFilterPatch]);

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    window.setTimeout(() => {
      filterTriggerRef.current?.focus();
    }, 20);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const focusTimer = window.setTimeout(() => {
      sheetCloseRef.current?.focus();
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSheet();
        return;
      }
      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sheetOpen, closeSheet]);

  const queryString = useMemo(() => {
    const apiParams = new URLSearchParams();
    if (parsed.q.trim()) apiParams.set('q', parsed.q.trim());
    if (parsed.category) apiParams.set('category', parsed.category);
    if (parsed.mission) apiParams.set('mission', parsed.mission);
    if (parsed.platform) apiParams.set('platform', parsed.platform);
    if (parsed.propulsion) apiParams.set('propulsion', parsed.propulsion);
    if (parsed.minFps.trim()) apiParams.set('minFps', parsed.minFps.trim());
    if (parsed.maxFps.trim()) apiParams.set('maxFps', parsed.maxFps.trim());
    if (parsed.minPrice.trim()) apiParams.set('minPrice', parsed.minPrice.trim());
    if (parsed.maxPrice.trim()) apiParams.set('maxPrice', parsed.maxPrice.trim());
    if (parsed.inStock) apiParams.set('inStock', 'true');
    if (parsed.hasVideo) apiParams.set('hasVideo', 'true');
    apiParams.set('sort', parsed.sort);
    apiParams.set('page', String(parsed.page));
    apiParams.set('limit', String(PAGE_LIMIT));
    return apiParams.toString();
  }, [parsed]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    apiFetch<ProductListResponse>(`/api/products?${queryString}`, {
      signal: controller.signal,
    })
      .then((res) => {
        setCatalogData(res);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof ApiRequestError) {
          setError(err.message);
        } else {
          setError(catalog.errorFallback);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [queryString, reloadTick, catalog.errorFallback]);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
    if (parsed.q.trim()) {
      chips.push({
        key: 'q',
        label: catalog.chipSearch(parsed.q.trim()),
        onClear: () => {
          setSearchInput('');
          applyFilterPatch({ q: '' });
        },
      });
    }
    if (parsed.category) {
      const fallbackName =
        bootstrap?.categories.find((c) => c.slug === parsed.category)?.name || parsed.category;
      chips.push({
        key: 'category',
        label: catalog.chipCategory(getCategoryName(parsed.category, fallbackName)),
        onClear: () => applyFilterPatch({ category: '' }),
      });
    }
    if (parsed.mission) {
      chips.push({
        key: 'mission',
        label: catalog.chipMission(filters.missionLabels[parsed.mission]),
        onClear: () => applyFilterPatch({ mission: '' }),
      });
    }
    if (parsed.platform) {
      chips.push({
        key: 'platform',
        label: catalog.chipPlatform(filters.platformLabels[parsed.platform]),
        onClear: () => applyFilterPatch({ platform: '' }),
      });
    }
    if (parsed.propulsion) {
      chips.push({
        key: 'propulsion',
        label: catalog.chipPropulsion(filters.propulsionLabels[parsed.propulsion]),
        onClear: () => applyFilterPatch({ propulsion: '' }),
      });
    }
    if (parsed.minFps || parsed.maxFps) {
      chips.push({
        key: 'fps',
        label: catalog.chipFps(parsed.minFps || '0', parsed.maxFps || '500'),
        onClear: () => applyFilterPatch({ minFps: '', maxFps: '' }),
      });
    }
    if (parsed.minPrice || parsed.maxPrice) {
      const minLabel = parsed.minPrice ? formatIdr(Number(parsed.minPrice)) : 'Rp 0';
      const maxLabel = parsed.maxPrice
        ? formatIdr(Number(parsed.maxPrice))
        : catalog.chipPriceMaxFallback;
      chips.push({
        key: 'price',
        label: catalog.chipPrice(minLabel, maxLabel),
        onClear: () => applyFilterPatch({ minPrice: '', maxPrice: '' }),
      });
    }
    if (parsed.inStock) {
      chips.push({
        key: 'inStock',
        label: catalog.chipInStock,
        onClear: () => applyFilterPatch({ inStock: false }),
      });
    }
    if (parsed.hasVideo) {
      chips.push({
        key: 'hasVideo',
        label: catalog.chipHasVideo,
        onClear: () => applyFilterPatch({ hasVideo: false }),
      });
    }
    return chips;
  }, [parsed, bootstrap?.categories, applyFilterPatch, catalog, filters, getCategoryName]);

  const totalPages = catalogData
    ? Math.max(1, Math.ceil(catalogData.total / catalogData.limit))
    : 1;

  const handleGoPage = (nextPage: number) => {
    const safe = Math.min(Math.max(1, nextPage), totalPages);
    setSearchParams(buildSearchParams(parsed, safe));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container-brakasa py-8 sm:py-10 lg:py-12">
      <header
        style={{ borderColor: 'var(--border-subtle)' }}
        className="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b pb-4"
      >
        <h1 className="m-0 font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-none tracking-tight uppercase">
          {activeCategoryTitle ?? catalog.defaultTitle}
        </h1>
        <div
          aria-live="polite"
          style={{ color: 'var(--text-muted)' }}
          className="shrink-0 font-mono-tech text-xs font-medium uppercase tabular-nums sm:text-sm"
        >
          {loading && !catalogData
            ? catalog.loadingCount
            : catalog.productCount(catalogData?.total ?? 0)}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <aside
          aria-label={catalog.desktopFilterAria}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            borderRadius: 'var(--radius-plate)',
          }}
          className="hidden border p-5 lg:sticky lg:top-24 lg:block"
        >
          <CatalogFilterPanel
            values={parsed}
            categories={bootstrap?.categories ?? []}
            facets={catalogData?.facets ?? null}
            activeFilterCount={activeChips.length}
            onChange={(patch) => applyFilterPatch(patch)}
            onReset={handleResetFilters}
            idPrefix="desktop-filter"
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <label htmlFor="store-search-input" className="sr-only-brakasa">
                {catalog.searchLabel}
              </label>
              <div className="relative">
                <span
                  style={{ color: 'var(--text-muted)' }}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
                >
                  <IconSearch size={16} />
                </span>
                <input
                  id="store-search-input"
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={catalog.searchPlaceholder}
                  className="input-brakasa pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                ref={filterTriggerRef}
                type="button"
                onClick={() => setSheetOpen(true)}
                aria-expanded={sheetOpen}
                aria-controls="store-filter-sheet"
                className="btn-brakasa btn-secondary flex-1 px-4 text-sm sm:flex-none lg:hidden"
              >
                <IconSliders size={16} />
                <span>
                  {catalog.filterButton}
                  {activeChips.length > 0 ? ` (${activeChips.length})` : ''}
                </span>
              </button>

              <div className="hidden min-w-[210px] sm:block">
                <label htmlFor="store-sort-select" className="sr-only-brakasa">
                  {catalog.sortLabel}
                </label>
                <select
                  id="store-sort-select"
                  value={parsed.sort}
                  onChange={(e) => applyFilterPatch({ sort: e.target.value as ProductSortOption })}
                  className="input-brakasa"
                >
                  {filters.sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {activeChips.length > 0 ? (
            <div
              aria-label={catalog.activeFiltersAria}
              className="flex flex-wrap items-center gap-2"
            >
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onClear}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-plate)',
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 border px-3 font-mono-tech text-xs font-medium hover:border-[var(--accent-primary)]"
                >
                  <span>{chip.label}</span>
                  <IconClose size={13} />
                </button>
              ))}
              <button
                type="button"
                onClick={handleResetFilters}
                style={{ color: 'var(--accent-text)' }}
                className="min-h-[44px] border-0 bg-transparent px-2 font-mono-tech text-xs font-semibold underline-offset-4 hover:underline"
              >
                {catalog.resetAll}
              </button>
            </div>
          ) : null}

          <h2 className="sr-only-brakasa">{catalog.productListSrHeading}</h2>

          {error ? (
            <ErrorState
              title={catalog.errorTitle}
              message={error}
              onRetry={() => setReloadTick((n) => n + 1)}
            />
          ) : loading && !catalogData ? (
            <LoadingState label={catalog.loadingLabel} />
          ) : catalogData && catalogData.items.length === 0 ? (
            <EmptyState
              title={catalog.emptyTitle}
              description={catalog.emptyDesc}
              actionLabel={catalog.resetAll}
              onAction={handleResetFilters}
            />
          ) : (
            <>
              <div
                aria-busy={loading}
                className={`grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 ${
                  loading ? 'opacity-70 transition-opacity' : ''
                }`}
              >
                {(catalogData?.items ?? []).map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priorityImage={index < 4}
                  />
                ))}
              </div>

              {totalPages > 1 && catalogData ? (
                <nav
                  aria-label={catalog.paginationAria}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: 'var(--radius-plate)',
                  }}
                  className="mt-2 flex flex-wrap items-center justify-between gap-3 border p-3.5"
                >
                  <button
                    type="button"
                    disabled={parsed.page <= 1}
                    onClick={() => handleGoPage(parsed.page - 1)}
                    className="btn-brakasa btn-secondary px-4 text-sm"
                  >
                    {catalog.prevPage}
                  </button>
                  <span
                    style={{ color: 'var(--text-secondary)' }}
                    className="font-mono-tech text-xs font-medium tabular-nums"
                  >
                    {catalog.pageInfo(parsed.page, totalPages, catalogData.total)}
                  </span>
                  <button
                    type="button"
                    disabled={parsed.page >= totalPages}
                    onClick={() => handleGoPage(parsed.page + 1)}
                    className="btn-brakasa btn-secondary px-4 text-sm"
                  >
                    {catalog.nextPage}
                  </button>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </div>

      {sheetOpen ? (
        <div
          style={{ backgroundColor: 'var(--backdrop-scrim)' }}
          className="fixed inset-0 z-50 flex items-end justify-start sm:items-stretch lg:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeSheet();
            }
          }}
        >
          <div
            ref={sheetRef}
            id="store-filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-filter-sheet-title"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
              boxShadow: 'var(--shadow-overlay)',
            }}
            className="flex h-[85dvh] w-full flex-col overflow-hidden rounded-t-[var(--radius-overlay)] border-t sm:h-full sm:w-[360px] sm:rounded-none sm:border-t-0 sm:border-r"
          >
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
              className="flex items-center justify-between gap-3 border-b px-4 py-3.5"
            >
              <h2
                id="store-filter-sheet-title"
                className="m-0 font-display text-xl font-bold tracking-wide uppercase"
              >
                {catalog.sheetTitle}
              </h2>
              <button
                ref={sheetCloseRef}
                type="button"
                onClick={closeSheet}
                aria-label={catalog.sheetCloseAria}
                className="btn-brakasa btn-secondary min-w-[44px] px-3 text-xs"
              >
                <IconClose size={15} />
                <span>{catalog.sheetCloseLabel}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <CatalogFilterPanel
                values={parsed}
                categories={bootstrap?.categories ?? []}
                facets={catalogData?.facets ?? null}
                activeFilterCount={activeChips.length}
                onChange={(patch) => applyFilterPatch(patch)}
                onReset={handleResetFilters}
                idPrefix="mobile-sheet-filter"
                showSortControl
                hideHeading
              />
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              }}
              className="grid grid-cols-2 gap-3 border-t px-4 pt-3"
            >
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-brakasa btn-secondary w-full text-sm"
              >
                {catalog.sheetReset}
              </button>
              <button
                type="button"
                onClick={closeSheet}
                className="btn-brakasa btn-primary w-full text-sm"
              >
                {catalog.sheetApply(catalogData?.total ?? 0)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
