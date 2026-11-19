import React, { useState } from 'react';
import type { CartResolvedItem, ShippingClass } from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';
import { getStoreCopy } from '../../i18n/store';
import { formatIdr, formatWeight } from '../../lib/format';
import { IconAlertOctagon, IconChevronDown } from '../ui/TacticalIcons';

export interface OrderSummaryPanelProps {
  resolvedItems: CartResolvedItem[];
  subtotalIdr: number;
  discountIdr: number;
  appliedVoucherCode: string | null;
  shippingCostIdr: number;
  woodenPacking: boolean;
  woodenPackingCostIdr: number;
  grandTotalIdr: number;
  totalWeightGrams: number;
  combinedShippingClass: ShippingClass;
  selectedCourierName: string;
  collapsibleMobile?: boolean;
}

export function OrderSummaryPanel({
  resolvedItems,
  subtotalIdr,
  discountIdr,
  appliedVoucherCode,
  shippingCostIdr,
  woodenPacking,
  woodenPackingCostIdr,
  grandTotalIdr,
  totalWeightGrams,
  selectedCourierName,
  collapsibleMobile = false,
}: OrderSummaryPanelProps): React.JSX.Element {
  const { lang } = useLanguage();
  const { checkout } = getStoreCopy(lang);
  const [expanded, setExpanded] = useState<boolean>(!collapsibleMobile);

  const totalUnits = resolvedItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <aside
      aria-label={checkout.summaryAria}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
        borderRadius: 'var(--radius-plate)',
      }}
      className="flex min-w-0 flex-col border"
    >
      {collapsibleMobile ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          className="flex min-h-[52px] w-full items-center justify-between gap-3 border-b px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <IconChevronDown
              size={16}
              className={`transition-transform duration-[120ms] ${expanded ? 'rotate-180' : ''}`}
            />
            <span>{checkout.summaryMobileToggle(totalUnits)}</span>
          </span>
          <span
            style={{ color: 'var(--accent-text)' }}
            className="font-mono-tech text-base font-semibold tabular-nums"
          >
            {formatIdr(grandTotalIdr)}
          </span>
        </button>
      ) : (
        <div
          style={{ borderColor: 'var(--border-subtle)' }}
          className="border-b px-5 py-4"
        >
          <h2 className="m-0 font-display text-xl font-bold tracking-wide uppercase">
            {checkout.summaryHeading}
          </h2>
          <p
            style={{ color: 'var(--text-muted)' }}
            className="mt-1 mb-0 font-mono-tech text-xs tabular-nums"
          >
            {checkout.summaryMeta(
              resolvedItems.length,
              totalUnits,
              formatWeight(totalWeightGrams, lang),
            )}
          </p>
        </div>
      )}

      {expanded ? (
        <div className="flex flex-col gap-4 p-5">
          <ul
            style={{ borderColor: 'var(--border-subtle)' }}
            className="m-0 flex max-h-[300px] list-none flex-col gap-3 overflow-y-auto border-b pb-4 p-0"
          >
            {resolvedItems.map((entry) => (
              <li key={entry.product.id} className="flex items-start gap-3">
                <div
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                  className="aspect-[4/3] w-16 shrink-0 overflow-hidden border border-[var(--border-subtle)]"
                >
                  <img
                    src={entry.product.primaryImageUrl}
                    alt={entry.product.primaryImageAlt || entry.product.name}
                    width={1600}
                    height={900}
                    loading="lazy"
                    className="block h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      style={{ color: 'var(--text-muted)' }}
                      className="font-mono-tech text-[11px] tabular-nums"
                    >
                      {entry.product.sku}
                    </span>
                    <span
                      style={{ color: 'var(--text-secondary)' }}
                      className="font-mono-tech text-xs tabular-nums"
                    >
                      x{entry.quantity}
                    </span>
                  </div>
                  <p
                    style={{ color: 'var(--text-primary)' }}
                    className="m-0 mt-0.5 line-clamp-2 text-xs font-semibold leading-snug"
                  >
                    {entry.product.name}
                  </p>
                  <p
                    style={{ color: 'var(--text-primary)' }}
                    className="mt-1 mb-0 font-mono-tech text-xs font-medium tabular-nums"
                  >
                    {formatIdr(entry.lineTotalIdr)}
                  </p>
                  {entry.outOfStock || entry.exceedsStock ? (
                    <p
                      role="alert"
                      style={{ color: 'var(--status-danger)' }}
                      className="mt-1 mb-0 flex items-center gap-1 text-[11px] font-medium"
                    >
                      <IconAlertOctagon size={12} />
                      <span>
                        {entry.outOfStock
                          ? checkout.itemOutOfStock
                          : checkout.itemRemainingStock(entry.product.stockQty)}
                      </span>
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          <dl className="m-0 flex flex-col gap-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <dt style={{ color: 'var(--text-secondary)' }}>{checkout.summarySubtotal}</dt>
              <dd
                style={{ color: 'var(--text-primary)' }}
                className="m-0 font-mono-tech tabular-nums"
              >
                {formatIdr(subtotalIdr)}
              </dd>
            </div>

            {appliedVoucherCode && discountIdr > 0 ? (
              <div className="flex items-baseline justify-between gap-2">
                <dt style={{ color: 'var(--status-ok)' }} className="font-medium">
                  {checkout.summaryVoucher(appliedVoucherCode)}
                </dt>
                <dd
                  style={{ color: 'var(--status-ok)' }}
                  className="m-0 font-mono-tech font-semibold tabular-nums"
                >
                  -{formatIdr(discountIdr)}
                </dd>
              </div>
            ) : null}

            <div className="flex items-baseline justify-between gap-2">
              <dt style={{ color: 'var(--text-secondary)' }} className="min-w-0 truncate">
                {checkout.summaryShipping(selectedCourierName)}
              </dt>
              <dd
                style={{ color: 'var(--text-primary)' }}
                className="m-0 shrink-0 font-mono-tech tabular-nums"
              >
                {formatIdr(shippingCostIdr)}
              </dd>
            </div>

            {woodenPacking && woodenPackingCostIdr > 0 ? (
              <div className="flex items-baseline justify-between gap-2">
                <dt style={{ color: 'var(--text-secondary)' }}>{checkout.summaryWoodenPacking}</dt>
                <dd
                  style={{ color: 'var(--text-primary)' }}
                  className="m-0 font-mono-tech tabular-nums"
                >
                  {formatIdr(woodenPackingCostIdr)}
                </dd>
              </div>
            ) : null}

            <div
              style={{ borderColor: 'var(--border-strong)' }}
              className="mt-2 flex items-baseline justify-between gap-2 border-t pt-3"
            >
              <dt style={{ color: 'var(--text-primary)' }} className="text-base font-semibold">
                {checkout.summaryTotal}
              </dt>
              <dd
                style={{ color: 'var(--accent-text)' }}
                className="m-0 font-mono-tech text-xl font-semibold tabular-nums"
              >
                {formatIdr(grandTotalIdr)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </aside>
  );
}
