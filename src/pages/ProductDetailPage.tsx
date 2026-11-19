import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ProductDetailResponse } from '../../shared/types';
import { ProductCard } from '../components/store/ProductCard';
import { ProductGallery } from '../components/store/ProductGallery';
import { SpecSheetTable } from '../components/store/SpecSheetTable';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';
import {
  IconCart,
  IconCheck,
  IconChevronLeft,
  IconMinus,
  IconPlus,
} from '../components/ui/TacticalIcons';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getLocalizedInTheBox,
  getLocalizedProductDescription,
  getStoreCopy,
} from '../i18n/store';
import { apiFetch, ApiRequestError } from '../lib/api';
import { formatIdr } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function ProductDetailPage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, setDrawerOpen } = useCart();
  const { lang, getCategoryName } = useLanguage();
  const { pdp } = getStoreCopy(lang);

  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState<number>(0);

  const [quantity, setQuantity] = useState<number>(1);
  const [addedQty, setAddedQty] = useState<number | null>(null);

  useDocumentTitle(
    data?.product ? `${data.product.name} | Brakasa Tactical` : pdp.docTitleDefault,
  );

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);
    setError(null);
    setQuantity(1);
    setAddedQty(null);

    apiFetch<ProductDetailResponse>(`/api/products/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof ApiRequestError && err.status === 404) {
          setNotFound(true);
        } else if (err instanceof ApiRequestError) {
          setError(err.message);
        } else {
          setError(pdp.errorFallback);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [slug, reloadTick, pdp.errorFallback]);

  const product = data?.product ?? null;
  const similarProducts = (data?.compatibleProducts ?? []).slice(0, 4);

  const handleBack = () => {
    const canGoBackInApp =
      typeof window !== 'undefined' &&
      window.history.state &&
      typeof window.history.state.idx === 'number' &&
      window.history.state.idx > 0;

    if (canGoBackInApp) {
      navigate(-1);
    } else {
      navigate('/store');
    }
  };

  const backButtonEl = (
    <button
      type="button"
      onClick={handleBack}
      aria-label={pdp.backAria}
      className="btn-brakasa btn-secondary min-h-[44px] min-w-[44px] shrink-0 gap-2 px-3.5 text-xs font-semibold sm:text-sm"
    >
      <IconChevronLeft size={16} />
      <span>{pdp.backButton}</span>
    </button>
  );

  const handleAddPrimary = () => {
    if (!product || product.stockQty <= 0) return;
    const clampedQty = Math.min(Math.max(1, quantity), product.stockQty);
    addItem(product.id, clampedQty);
    setAddedQty(clampedQty);
  };

  if (loading) {
    return (
      <div className="container-brakasa py-10">
        <LoadingState label={pdp.loadingLabel} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container-brakasa py-12">
        <div className="mb-5">{backButtonEl}</div>
        <h1 className="sr-only-brakasa">{pdp.notFoundPageHeading}</h1>
        <h2 className="sr-only-brakasa">{pdp.notFoundSectionSr}</h2>
        <EmptyState
          title={pdp.notFoundTitle}
          description={pdp.notFoundDesc}
          actionLabel={pdp.backToShop}
          onAction={() => navigate('/store')}
        />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-brakasa py-12">
        <div className="mb-5">{backButtonEl}</div>
        <h1 className="sr-only-brakasa">{pdp.errorPageHeading}</h1>
        <h2 className="sr-only-brakasa">{pdp.errorSectionSr}</h2>
        <ErrorState
          title={pdp.errorTitle}
          message={error || pdp.errorFallback}
          onRetry={() => setReloadTick((n) => n + 1)}
        />
      </div>
    );
  }

  const isOutOfStock = product.stockQty <= 0 || product.stockStatus === 'OUT_OF_STOCK';
  const localizedCategoryName = getCategoryName(product.categorySlug, product.categoryName);
  const localizedDescription = getLocalizedProductDescription(product, lang);
  const localizedInTheBox = getLocalizedInTheBox(product, lang);

  const stockColor = isOutOfStock
    ? 'var(--status-danger)'
    : product.stockStatus === 'LOW_STOCK'
      ? 'var(--status-warn)'
      : 'var(--status-ok)';

  const stockLabel = isOutOfStock
    ? pdp.stockOutOfStock
    : product.stockStatus === 'LOW_STOCK'
      ? pdp.stockLowStock(product.stockQty)
      : pdp.stockInStock(product.stockQty);

  return (
    <div className="container-brakasa py-6 sm:py-8 lg:py-10">
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        {backButtonEl}
        <nav aria-label={pdp.breadcrumbAria} className="min-w-0">
          <ol
            style={{ color: 'var(--text-muted)' }}
            className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-xs sm:text-sm"
          >
            <li>
              <Link
                to="/"
                style={{ color: 'var(--text-secondary)' }}
                className="inline-flex min-h-[44px] min-w-[44px] items-center hover:underline"
              >
                {pdp.breadcrumbHome}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                to="/store"
                style={{ color: 'var(--text-secondary)' }}
                className="inline-flex min-h-[44px] min-w-[44px] items-center hover:underline"
              >
                {pdp.breadcrumbShop}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                to={`/store?category=${encodeURIComponent(product.categorySlug)}`}
                style={{ color: 'var(--text-primary)' }}
                className="inline-flex min-h-[44px] min-w-[44px] items-center font-medium hover:underline"
              >
                {localizedCategoryName}
              </Link>
            </li>
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,1fr)] lg:items-start lg:gap-10">
        <div className="min-w-0">
          <ProductGallery product={product} />
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            borderRadius: 'var(--radius-plate)',
          }}
          className="flex min-w-0 flex-col gap-5 border p-5 sm:p-6 lg:sticky lg:top-24"
        >
          <p
            style={{ color: 'var(--text-muted)' }}
            className="m-0 font-mono-tech text-xs font-medium tracking-wide uppercase tabular-nums"
          >
            {product.brand} - {product.sku}
          </p>

          <h1 className="m-0 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[1.05] tracking-tight uppercase">
            {product.name}
          </h1>

          <div
            style={{ color: 'var(--accent-text)' }}
            className="font-mono-tech text-2xl font-semibold tabular-nums sm:text-3xl"
          >
            {formatIdr(product.priceIdr)}
          </div>

          <div
            style={{ borderColor: 'var(--border-subtle)' }}
            className="flex items-center gap-2.5 border-y py-3.5 text-sm font-medium"
          >
            <span
              aria-hidden="true"
              style={{ backgroundColor: stockColor }}
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-[4px]"
            />
            <span style={{ color: stockColor }} className="font-mono-tech text-xs font-semibold uppercase tabular-nums sm:text-sm">
              {stockLabel}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="pdp-qty-input" className="sr-only-brakasa">
                  {pdp.quantityLabel}
                </label>
                <button
                  type="button"
                  disabled={isOutOfStock || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label={pdp.decreaseQtyAria}
                  className="btn-brakasa btn-secondary min-h-[48px] min-w-[44px] px-0"
                >
                  <IconMinus size={15} />
                </button>
                <input
                  id="pdp-qty-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={Math.max(1, product.stockQty)}
                  disabled={isOutOfStock}
                  value={quantity}
                  onChange={(e) => {
                    const val = Math.floor(Number(e.target.value));
                    if (Number.isFinite(val)) {
                      setQuantity(Math.min(Math.max(1, val), Math.max(1, product.stockQty)));
                    }
                  }}
                  className="input-brakasa min-h-[48px] w-16 text-center font-mono-tech text-sm font-semibold tabular-nums"
                />
                <button
                  type="button"
                  disabled={isOutOfStock || quantity >= product.stockQty}
                  onClick={() => setQuantity((q) => Math.min(product.stockQty, q + 1))}
                  aria-label={pdp.increaseQtyAria}
                  className="btn-brakasa btn-secondary min-h-[48px] min-w-[44px] px-0"
                >
                  <IconPlus size={15} />
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddPrimary}
                className="btn-brakasa btn-primary min-h-[48px] flex-1 text-sm"
              >
                <IconCart size={17} />
                <span>{isOutOfStock ? pdp.outOfStockBtn : pdp.addToCart}</span>
              </button>
            </div>

            {addedQty !== null ? (
              <div
                role="status"
                aria-live="polite"
                style={{
                  backgroundColor: 'var(--status-ok-bg)',
                  borderColor: 'var(--status-ok)',
                  color: 'var(--status-ok)',
                  borderRadius: 'var(--radius-plate)',
                }}
                className="flex flex-wrap items-center justify-between gap-2 border px-3.5 py-2 text-xs font-medium"
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconCheck size={15} />
                  <span>{pdp.addedFeedback(addedQty, product.name)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  style={{ color: 'var(--text-primary)' }}
                  className="min-h-[44px] border-0 bg-transparent px-2 font-mono-tech text-xs font-semibold underline"
                >
                  {pdp.viewCart}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {localizedDescription || localizedInTheBox.length > 0 ? (
        <section aria-labelledby="pdp-description-heading" className="mt-10 sm:mt-12">
          <h2
            id="pdp-description-heading"
            style={{ borderColor: 'var(--border-subtle)' }}
            className="m-0 mb-5 border-b pb-3 font-display text-2xl font-bold tracking-tight uppercase"
          >
            {pdp.descriptionHeading}
          </h2>

          {localizedDescription ? (
            <p
              style={{ color: 'var(--text-secondary)' }}
              className="m-0 max-w-[74ch] text-sm leading-relaxed sm:text-base"
            >
              {localizedDescription}
            </p>
          ) : null}

          {localizedInTheBox.length > 0 ? (
            <div className="mt-6">
              <h3
                style={{ color: 'var(--text-primary)' }}
                className="m-0 mb-2.5 text-sm font-semibold tracking-wide uppercase"
              >
                {pdp.inTheBoxHeading}
              </h3>
              <ul
                style={{ color: 'var(--text-secondary)' }}
                className="m-0 flex max-w-[74ch] flex-col gap-1.5 pl-5 text-sm leading-relaxed"
              >
                {localizedInTheBox.map((item, idx) => (
                  <li key={`box-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="pdp-specs-heading" className="mt-10 sm:mt-12">
        <h2
          id="pdp-specs-heading"
          style={{ borderColor: 'var(--border-subtle)' }}
          className="m-0 mb-5 border-b pb-3 font-display text-2xl font-bold tracking-tight uppercase"
        >
          {pdp.specsHeading}
        </h2>
        <SpecSheetTable product={product} />
      </section>

      {similarProducts.length > 0 ? (
        <section aria-labelledby="pdp-similar-heading" className="mt-10 sm:mt-12">
          <h2
            id="pdp-similar-heading"
            style={{ borderColor: 'var(--border-subtle)' }}
            className="m-0 mb-5 border-b pb-3 font-display text-2xl font-bold tracking-tight uppercase"
          >
            {pdp.similarHeading}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {similarProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
