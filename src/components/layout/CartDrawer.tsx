import React, { useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatIdr } from '../../lib/format';
import { EmptyState, ErrorState, LoadingState } from '../ui/StateViews';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconClose,
  IconMinus,
  IconPlus,
  IconTrash,
} from '../ui/TacticalIcons';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('hidden') && el.offsetParent !== null,
  );
}

export function CartDrawer(): React.JSX.Element | null {
  const {
    items,
    resolvedItems,
    loading,
    error,
    drawerOpen,
    setDrawerOpen,
    totalCount,
    subtotalIdr,
    updateQuantity,
    removeItem,
    refreshCart,
    adjustmentNotice,
    dismissAdjustmentNotice,
  } = useCart();

  const { t } = useLanguage();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    setDrawerOpen(false);
  }, [setDrawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    void refreshCart();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key === 'Tab' && drawerRef.current) {
        const focusables = getFocusableElements(drawerRef.current);
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

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      requestAnimationFrame(() => {
        previousFocusRef.current?.focus();
      });
    };
  }, [drawerOpen, handleClose, refreshCart]);

  if (!drawerOpen) {
    return null;
  }

  const hasOutOfStock = resolvedItems.some((item) => item.outOfStock);
  const checkoutBlocked =
    loading || Boolean(error) || resolvedItems.length === 0 || hasOutOfStock;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: 'var(--backdrop-scrim)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderLeftColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-overlay)',
        }}
        className="flex h-[100dvh] w-full max-w-[420px] flex-col border-l"
      >
        <div
          style={{ borderBottomColor: 'var(--border-subtle)' }}
          className="flex items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-5"
        >
          <h2
            id="cart-drawer-title"
            style={{ color: 'var(--text-primary)' }}
            className="m-0 font-display text-2xl font-bold uppercase tracking-wide tabular-nums"
          >
            {t.cart.title(totalCount)}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label={t.cart.closeAria}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-control)',
            }}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 border px-3 text-sm font-semibold"
          >
            <IconClose size={16} />
            <span>{t.common.close}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {adjustmentNotice ? (
            <div
              role="status"
              style={{
                backgroundColor: 'var(--status-warn-bg)',
                borderColor: 'var(--status-warn)',
                borderRadius: 'var(--radius-plate)',
              }}
              className="mb-4 flex items-start justify-between gap-3 border p-3"
            >
              <div className="flex items-start gap-2">
                <span style={{ color: 'var(--status-warn)' }} className="mt-0.5 shrink-0">
                  <IconAlertTriangle size={16} />
                </span>
                <p
                  style={{ color: 'var(--text-primary)' }}
                  className="m-0 text-xs leading-relaxed"
                >
                  {adjustmentNotice}
                </p>
              </div>
              <button
                type="button"
                onClick={dismissAdjustmentNotice}
                aria-label={t.cart.dismissNoticeAria}
                style={{ color: 'var(--text-secondary)' }}
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center border-0 bg-transparent"
              >
                <IconClose size={14} />
              </button>
            </div>
          ) : null}

          {error ? (
            <ErrorState
              title={t.cart.errorTitle}
              message={error}
              onRetry={() => {
                void refreshCart();
              }}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title={t.cart.emptyTitle}
              description={t.cart.emptyDesc}
              actionLabel={t.cart.browseCatalog}
              onAction={() => {
                handleClose();
                navigate('/store');
              }}
            />
          ) : loading && resolvedItems.length === 0 ? (
            <LoadingState label={t.cart.syncing} />
          ) : (
            <div className="space-y-4">
              {loading ? (
                <p
                  role="status"
                  aria-live="polite"
                  style={{
                    color: 'var(--text-muted)',
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-plate)',
                  }}
                  className="m-0 border px-3 py-2 font-mono-tech text-xs"
                >
                  {t.cart.syncing}
                </p>
              ) : null}

              {hasOutOfStock ? (
                <div
                  role="alert"
                  style={{
                    backgroundColor: 'var(--status-danger-bg)',
                    borderColor: 'var(--status-danger)',
                    borderRadius: 'var(--radius-plate)',
                  }}
                  className="flex items-start gap-2 border p-3"
                >
                  <span style={{ color: 'var(--status-danger)' }} className="mt-0.5 shrink-0">
                    <IconAlertOctagon size={16} />
                  </span>
                  <p
                    style={{ color: 'var(--text-primary)' }}
                    className="m-0 text-xs leading-relaxed"
                  >
                    {t.cart.outOfStockAlert}
                  </p>
                </div>
              ) : null}

              <ul className="m-0 list-none space-y-3 p-0">
                {resolvedItems.map((entry) => {
                  const { product, quantity, lineTotalIdr, outOfStock } = entry;
                  const canIncrement = !outOfStock && quantity < product.stockQty;

                  return (
                    <li
                      key={product.id}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: outOfStock
                          ? 'var(--status-danger)'
                          : 'var(--border-subtle)',
                        borderRadius: 'var(--radius-plate)',
                      }}
                      className="border p-3"
                    >
                      <div className="flex gap-3">
                        <Link
                          to={`/store/${product.slug}`}
                          onClick={handleClose}
                          aria-label={t.cart.viewItemAria(product.name)}
                          className="block aspect-[4/3] w-20 shrink-0 overflow-hidden"
                          style={{
                            borderRadius: 'var(--radius-plate)',
                            backgroundColor: 'var(--bg-canvas)',
                          }}
                        >
                          <img
                            src={product.primaryImageUrl}
                            alt={product.primaryImageAlt || product.name}
                            width={160}
                            height={120}
                            className="block h-full w-full object-cover"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          {outOfStock ? (
                            <span
                              style={{
                                backgroundColor: 'var(--status-danger-bg)',
                                color: 'var(--status-danger)',
                                borderRadius: 'var(--radius-plate)',
                              }}
                              className="mb-1 inline-block px-2 py-0.5 font-mono-tech text-[11px] font-semibold uppercase"
                            >
                              {t.cart.soldOutBadge}
                            </span>
                          ) : null}
                          <Link
                            to={`/store/${product.slug}`}
                            onClick={handleClose}
                            style={{ color: 'var(--text-primary)' }}
                            className="block text-sm font-semibold leading-snug no-underline hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p
                            style={{ color: 'var(--text-secondary)' }}
                            className="mt-1.5 mb-0 font-mono-tech text-xs tabular-nums"
                          >
                            {formatIdr(product.priceIdr)} x {quantity} ={' '}
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {formatIdr(lineTotalIdr)}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            aria-label={t.cart.decreaseQtyAria(product.name)}
                            style={{
                              backgroundColor: 'var(--bg-elevated)',
                              borderColor: 'var(--border-strong)',
                              color: 'var(--text-primary)',
                              borderRadius: 'var(--radius-control)',
                            }}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border"
                          >
                            <IconMinus size={15} />
                          </button>
                          <span
                            style={{ color: 'var(--text-primary)' }}
                            className="min-w-[32px] text-center font-mono-tech text-sm font-semibold tabular-nums"
                          >
                            {quantity}
                          </span>
                          <button
                            type="button"
                            disabled={!canIncrement}
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            aria-label={t.cart.increaseQtyAria(product.name)}
                            style={{
                              backgroundColor: 'var(--bg-elevated)',
                              borderColor: 'var(--border-strong)',
                              color: 'var(--text-primary)',
                              borderRadius: 'var(--radius-control)',
                            }}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border"
                          >
                            <IconPlus size={15} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(product.id)}
                          aria-label={t.cart.removeItemAria(product.name)}
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--status-danger)',
                            borderRadius: 'var(--radius-control)',
                          }}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 border px-3 text-xs font-semibold"
                        >
                          <IconTrash size={15} />
                          <span>{t.common.remove}</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {items.length > 0 ? (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderTopColor: 'var(--border-subtle)',
            }}
            className="space-y-3 border-t px-4 py-4 sm:px-5"
          >
            <div className="flex items-center justify-between">
              <span
                style={{ color: 'var(--text-primary)' }}
                className="text-sm font-semibold"
              >
                {t.cart.subtotal}
              </span>
              <span
                style={{ color: 'var(--text-primary)' }}
                className="font-mono-tech text-lg font-semibold tabular-nums"
              >
                {formatIdr(subtotalIdr)}
              </span>
            </div>

            <button
              type="button"
              disabled={checkoutBlocked}
              onClick={() => {
                handleClose();
                navigate('/checkout');
              }}
              className="btn-brakasa btn-primary min-h-[48px] w-full"
            >
              {t.cart.checkout}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
