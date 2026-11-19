import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ProductListResponse, ProductSummary } from '../../../shared/types';
import { useBootstrap } from '../../context/BootstrapContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch, ApiRequestError } from '../../lib/api';
import { formatIdr } from '../../lib/format';
import { EmptyState, ErrorState, LoadingState } from '../ui/StateViews';
import { IconChevronLeft, IconChevronRight } from '../ui/TacticalIcons';

export function FeaturedProductsCarousel(): React.JSX.Element {
  const { data, loading: bootstrapLoading } = useBootstrap();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [fallbackProducts, setFallbackProducts] = useState<ProductSummary[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState<boolean>(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState<boolean>(false);
  const [canScrollNext, setCanScrollNext] = useState<boolean>(true);

  const trackRef = useRef<HTMLDivElement | null>(null);

  const bootstrapFeatured = data?.featuredProducts ?? [];
  const shouldFetchFallback = !bootstrapLoading && bootstrapFeatured.length === 0;

  const fetchFallback = useCallback(async () => {
    setFallbackLoading(true);
    setFallbackError(null);
    try {
      const response = await apiFetch<ProductListResponse>(
        '/api/products?featured=true&limit=8',
      );
      setFallbackProducts(response.items);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFallbackError(err.message);
      } else {
        setFallbackError(t.featuredProducts.errorTitle);
      }
    } finally {
      setFallbackLoading(false);
    }
  }, [t.featuredProducts.errorTitle]);

  useEffect(() => {
    if (shouldFetchFallback && fallbackProducts.length === 0 && !fallbackError) {
      void fetchFallback();
    }
  }, [shouldFetchFallback, fallbackProducts.length, fallbackError, fetchFallback]);

  const products = (
    bootstrapFeatured.length > 0 ? bootstrapFeatured : fallbackProducts
  ).slice(0, 8);

  const updateScrollButtons = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    setCanScrollPrev(track.scrollLeft > 4);
    setCanScrollNext(maxScrollLeft > 4 && track.scrollLeft < maxScrollLeft - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const track = trackRef.current;
    if (!track) return;

    const handleScroll = () => updateScrollButtons();
    track.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      track.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [products.length, updateScrollButtons]);

  const handleScrollStep = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const distance = Math.max(track.clientWidth * 0.75, 240);
    track.scrollBy({
      left: direction * distance,
      behavior: 'smooth',
    });
  };

  const isLoading = (bootstrapLoading && products.length === 0) || fallbackLoading;

  return (
    <section
      id="featured-products"
      className="scroll-mt-20 py-12 sm:py-16 lg:py-20"
    >
      <div className="container-brakasa">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
          <h2 className="m-0 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold uppercase tracking-tight">
            {t.featuredProducts.title}
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScrollStep(-1)}
              disabled={!canScrollPrev || products.length === 0}
              aria-label={t.featuredProducts.prevAria}
              className="btn-brakasa btn-secondary min-h-[44px] min-w-[44px] px-0"
            >
              <IconChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => handleScrollStep(1)}
              disabled={!canScrollNext || products.length === 0}
              aria-label={t.featuredProducts.nextAria}
              className="btn-brakasa btn-secondary min-h-[44px] min-w-[44px] px-0"
            >
              <IconChevronRight size={18} />
            </button>
            <Link
              to="/store"
              className="btn-brakasa btn-ghost min-h-[44px] px-3.5 text-sm font-semibold"
            >
              {t.featuredProducts.viewAll}
            </Link>
          </div>
        </div>

        {isLoading ? (
          <LoadingState label={t.featuredProducts.loadingLabel} />
        ) : fallbackError && products.length === 0 ? (
          <ErrorState
            title={t.featuredProducts.errorTitle}
            message={fallbackError}
            onRetry={() => {
              void fetchFallback();
            }}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title={t.featuredProducts.emptyTitle}
            description={t.featuredProducts.emptyDesc}
            actionLabel={t.featuredProducts.viewAll}
            onAction={() => navigate('/store')}
          />
        ) : (
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 sm:gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product) => {
              const isSoldOut = product.stockQty <= 0;

              return (
                <div
                  key={product.id}
                  className="w-[calc(50%-8px)] min-w-[162px] shrink-0 snap-start sm:w-[calc(33.333%-13.33px)] lg:w-[calc(25%-15px)]"
                >
                  <Link
                    to={`/store/${product.slug}`}
                    className="group flex h-full flex-col rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 no-underline transition-colors hover:border-[var(--border-strong)] sm:p-3.5"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--bg-elevated)]">
                      <img
                        src={product.primaryImageUrl}
                        alt={product.primaryImageAlt || product.name}
                        width={1600}
                        height={900}
                        loading="lazy"
                        decoding="async"
                        className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      {isSoldOut ? (
                        <span className="absolute top-2 right-2 rounded-[2px] bg-[#0F1110]/85 px-2 py-0.5 font-mono-tech text-[11px] font-medium uppercase text-[#F0EFEA]">
                          {t.stock.soldOut}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-3 mb-0 min-h-[2.75rem] line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-text)] sm:text-[0.9375rem]">
                      {product.name}
                    </h3>

                    <div className="mt-auto pt-2.5">
                      <div className="border-t border-[var(--border-subtle)] pt-2.5 font-mono-tech text-sm font-semibold tabular-nums text-[var(--text-primary)] sm:text-base">
                        {formatIdr(product.priceIdr)}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
