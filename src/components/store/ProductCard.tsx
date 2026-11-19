import React from 'react';
import { Link } from 'react-router-dom';
import type { ProductSummary } from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';
import { getStoreCopy } from '../../i18n/store';
import { formatIdr } from '../../lib/format';

export interface ProductCardProps {
  product: ProductSummary;
  priorityImage?: boolean;
}

export function ProductCard({
  product,
  priorityImage = false,
}: ProductCardProps): React.JSX.Element {
  const { lang } = useLanguage();
  const copy = getStoreCopy(lang);

  const isSoldOut = product.stockQty <= 0 || product.stockStatus === 'OUT_OF_STOCK';
  const secondaryImageUrl = product.secondaryImageUrl || product.detailImageUrl || null;
  const hasHoverSwap = Boolean(
    secondaryImageUrl && secondaryImageUrl !== product.primaryImageUrl,
  );

  return (
    <Link
      to={`/store/${product.slug}`}
      aria-label={copy.card.viewProductAria(product.name)}
      className="group flex h-full min-w-0 flex-col rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 no-underline transition-colors duration-[180ms] hover:border-[var(--border-strong)] sm:p-3.5"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--bg-elevated)]">
        <img
          src={product.primaryImageUrl}
          alt={product.primaryImageAlt || product.name}
          width={1600}
          height={900}
          loading={priorityImage ? 'eager' : 'lazy'}
          decoding="async"
          className={`block h-full w-full object-cover transition-all duration-300 ${
            isSoldOut ? 'opacity-65' : ''
          } ${
            hasHoverSwap
              ? 'group-hover:opacity-0'
              : 'group-hover:scale-[1.03]'
          }`}
        />

        {hasHoverSwap && secondaryImageUrl ? (
          <img
            src={secondaryImageUrl}
            alt=""
            aria-hidden="true"
            width={1600}
            height={900}
            loading="lazy"
            decoding="async"
            className={`pointer-events-none absolute inset-0 block h-full w-full object-cover opacity-0 transition-all duration-300 group-hover:scale-[1.03] ${
              isSoldOut ? 'group-hover:opacity-65' : 'group-hover:opacity-100'
            }`}
          />
        ) : null}

        {isSoldOut ? (
          <span className="absolute top-2 right-2 rounded-[2px] bg-[#0F1110]/85 px-2 py-0.5 font-mono-tech text-[11px] font-medium uppercase text-[#F0EFEA]">
            {copy.card.soldOut}
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
  );
}
