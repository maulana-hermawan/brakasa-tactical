import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { CartDrawer } from './CartDrawer';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { IconCheck, IconClose } from '../ui/TacticalIcons';

export function SiteLayout(): React.JSX.Element {
  const location = useLocation();
  const { t } = useLanguage();
  const { lastAnnouncement, drawerOpen, setDrawerOpen } = useCart();
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace(/^#/, '');
      if (!targetId) return;

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      const scrollToTarget = () => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start',
          });
          return true;
        }
        return false;
      };

      const rafId = window.requestAnimationFrame(() => {
        if (!scrollToTarget()) {
          window.setTimeout(scrollToTarget, 120);
        }
      });

      return () => window.cancelAnimationFrame(rafId);
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!lastAnnouncement || drawerOpen) {
      setToastMessage('');
      return;
    }
    setToastMessage(lastAnnouncement);
    const timer = window.setTimeout(() => {
      setToastMessage('');
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [lastAnnouncement, drawerOpen]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a href="#main-content" className="skip-link">
        {t.common.skipToContent}
      </a>

      <Navbar />

      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
        <Outlet />
      </main>

      <Footer />

      <CartDrawer />

      <div
        id="sr-polite-status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only-brakasa"
      >
        {lastAnnouncement}
      </div>

      {toastMessage && !drawerOpen ? (
        <div
          role="status"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-strong)',
            borderRadius: 'var(--radius-overlay)',
            boxShadow: 'var(--shadow-overlay)',
          }}
          className="no-print fixed right-4 bottom-4 z-40 flex max-w-[380px] items-center gap-3 border p-3"
        >
          <span style={{ color: 'var(--status-ok)' }} className="shrink-0">
            <IconCheck size={17} />
          </span>
          <p
            style={{ color: 'var(--text-primary)' }}
            className="m-0 min-w-0 flex-1 text-xs leading-snug"
          >
            {toastMessage}
          </p>
          <button
            type="button"
            onClick={() => {
              setToastMessage('');
              setDrawerOpen(true);
            }}
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-foreground)',
              borderRadius: 'var(--radius-control)',
            }}
            className="inline-flex min-h-[44px] shrink-0 items-center border-0 px-3 text-xs font-semibold"
          >
            {t.common.view}
          </button>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            aria-label={t.cart.closeToastAria}
            style={{ color: 'var(--text-muted)' }}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center border-0 bg-transparent"
          >
            <IconClose size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
