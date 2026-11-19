import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { getAdminCopy, type AdminDictionary } from '../../i18n/admin';

interface AdminNavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: (active: boolean) => React.JSX.Element;
}

interface AdminNavGroup {
  key: string;
  heading: string;
  items: AdminNavItem[];
}

function DashboardIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="7" height="7" stroke="currentColor" strokeWidth="1.75" />
      <rect x="11" y="2" width="7" height="4" stroke="currentColor" strokeWidth="1.75" />
      <rect x="11" y="8" width="7" height="10" stroke="currentColor" strokeWidth="1.75" />
      <rect x="2" y="11" width="7" height="7" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function OrdersIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 3H16V17H4V3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="miter" />
      <path d="M7 7H13M7 10.5H13M7 14H10.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

function ProductsIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2L17.5 6V14L10 18L2.5 14V6L10 2Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="miter" />
      <path d="M2.5 6L10 10L17.5 6M10 10V18" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function InventoryIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5H17V17H3V5Z" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 9H17M7 5V3H13V5M8 13H12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

function VoucherIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2.5 5.5H17.5V8.5C16.5 8.5 16 9.1 16 10C16 10.9 16.5 11.5 17.5 11.5V14.5H2.5V11.5C3.5 11.5 4 10.9 4 10C4 9.1 3.5 8.5 2.5 8.5V5.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="miter"
      />
      <path d="M8.5 5.5V14.5" stroke="currentColor" strokeWidth="1.75" strokeDasharray="2 2" />
    </svg>
  );
}

function SettingsIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <rect x="6" y="3.25" width="3.5" height="3.5" fill="var(--bg-surface)" stroke="currentColor" strokeWidth="1.75" />
      <rect x="11.5" y="8.25" width="3.5" height="3.5" fill="var(--bg-surface)" stroke="currentColor" strokeWidth="1.75" />
      <rect x="7" y="13.25" width="3.5" height="3.5" fill="var(--bg-surface)" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function StorefrontIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 8.5L4.5 3.5H15.5L17 8.5H3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="miter" />
      <path d="M4.5 8.5V16.5H15.5V8.5M8.5 16.5V12H11.5V16.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function ThemeIcon({ theme }: { theme: 'dark' | 'light' }): React.JSX.Element {
  if (theme === 'dark') {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="3.75" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M10 2V4.2M10 15.8V18M2 10H4.2M15.8 10H18M4.3 4.3L5.9 5.9M14.1 14.1L15.7 15.7M15.7 4.3L14.1 5.9M5.9 14.1L4.3 15.7"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="square"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M14.8 12.6A5.8 5.8 0 0 1 7.4 5.2A6.2 6.2 0 1 0 14.8 12.6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function LogoutIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M8 3H3.5V17H8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      <path d="M12.5 6.5L16.5 10L12.5 13.5M16 10H7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="3.5" width="15" height="13" stroke="currentColor" strokeWidth="1.75" />
      <path d="M7.5 3.5V16.5" stroke="currentColor" strokeWidth="1.75" />
      {collapsed ? (
        <path d="M10.5 7.5L13.5 10L10.5 12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      ) : (
        <path d="M13.5 7.5L10.5 10L13.5 12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
      )}
    </svg>
  );
}

function MenuIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

function CloseIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.5 4.5L15.5 15.5M15.5 4.5L4.5 15.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function getCurrentRouteLabel(pathname: string, copy: AdminDictionary): string {
  if (pathname === '/admin') return copy.layout.navItems.dashboard;
  if (pathname.startsWith('/admin/orders')) return copy.layout.navItems.orders;
  if (pathname.startsWith('/admin/products')) return copy.layout.navItems.products;
  if (pathname.startsWith('/admin/inventory')) return copy.layout.navItems.inventory;
  if (pathname.startsWith('/admin/vouchers')) return copy.layout.navItems.vouchers;
  if (pathname.startsWith('/admin/settings')) return copy.layout.navItems.settings;
  return copy.layout.adminTitle;
}

export function AdminLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { admin, logout } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, toggleLang } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768 && window.innerWidth < 1120;
  });
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseRef = useRef<HTMLButtonElement | null>(null);
  const mobileDrawerRef = useRef<HTMLDivElement | null>(null);

  const navGroups = useMemo<readonly AdminNavGroup[]>(
    () => [
      {
        key: 'operations',
        heading: copy.layout.navGroups.operations,
        items: [
          {
            to: '/admin',
            label: copy.layout.navItems.dashboard,
            end: true,
            icon: () => <DashboardIcon />,
          },
          {
            to: '/admin/orders',
            label: copy.layout.navItems.orders,
            icon: () => <OrdersIcon />,
          },
        ],
      },
      {
        key: 'catalogWarehouse',
        heading: copy.layout.navGroups.catalogWarehouse,
        items: [
          {
            to: '/admin/products',
            label: copy.layout.navItems.products,
            icon: () => <ProductsIcon />,
          },
          {
            to: '/admin/inventory',
            label: copy.layout.navItems.inventory,
            icon: () => <InventoryIcon />,
          },
        ],
      },
      {
        key: 'configuration',
        heading: copy.layout.navGroups.configuration,
        items: [
          {
            to: '/admin/vouchers',
            label: copy.layout.navItems.vouchers,
            icon: () => <VoucherIcon />,
          },
          {
            to: '/admin/settings',
            label: copy.layout.navItems.settings,
            icon: () => <SettingsIcon />,
          },
        ],
      },
    ],
    [copy],
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      mobileCloseRef.current?.focus();
    }, 10);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileOpen(false);
        mobileTriggerRef.current?.focus();
        return;
      }

      if (event.key === 'Tab' && mobileDrawerRef.current) {
        const focusables = mobileDrawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
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
    };
  }, [mobileOpen]);

  const handleCloseMobile = (): void => {
    setMobileOpen(false);
    window.setTimeout(() => {
      mobileTriggerRef.current?.focus();
    }, 0);
  };

  const handleLogout = async (): Promise<void> => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const currentSectionLabel = getCurrentRouteLabel(location.pathname, copy);
  const operatorInitials = getInitials(admin?.displayName ?? 'Admin');
  const operatorRoleLabel =
    admin?.role === 'SUPER_ADMIN' ? copy.layout.roleSuperAdmin : copy.layout.roleOperations;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col md:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[1000] focus:inline-flex focus:min-h-[44px] focus:items-center focus:rounded-[4px] focus:bg-[var(--accent-primary)] focus:px-4 focus:text-sm focus:font-semibold focus:text-[var(--accent-foreground)]"
      >
        {copy.layout.skipToContent}
      </a>

      {/* Compact mobile topbar (< 768px) */}
      <header className="md:hidden sticky top-0 z-30 flex min-h-[56px] items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            ref={mobileTriggerRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-nav"
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center gap-1.5 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--accent-primary)]"
          >
            <MenuIcon />
            <span>{copy.layout.mobileMenuBtn}</span>
          </button>
          <p className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">
            {currentSectionLabel}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div
            role="group"
            aria-label={copy.layout.langGroupAria}
            className="inline-flex min-h-[44px] items-center overflow-hidden rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)]"
          >
            <button
              type="button"
              onClick={() => setLang('id')}
              aria-pressed={lang === 'id'}
              className={[
                'inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-[family-name:var(--font-mono)] text-xs font-semibold uppercase transition-colors duration-150',
                lang === 'id'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-foreground)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              className={[
                'inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-[family-name:var(--font-mono)] text-xs font-semibold uppercase transition-colors duration-150',
                lang === 'en'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-foreground)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === 'light'}
            aria-label={theme === 'dark' ? copy.layout.themeToLightAria : copy.layout.themeToDarkAria}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
          >
            <ThemeIcon theme={theme} />
          </button>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[var(--backdrop-scrim)]"
            aria-hidden="true"
            onClick={handleCloseMobile}
          />
          <div
            ref={mobileDrawerRef}
            id="admin-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-mobile-nav-title"
            className="relative z-10 flex h-full w-[min(86vw,320px)] flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)]"
          >
            <div className="flex min-h-[60px] items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-4">
              <p
                id="admin-mobile-nav-title"
                className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-[0.04em] text-[var(--text-primary)]"
              >
                BRAKASA <span className="font-[family-name:var(--font-mono)] text-[var(--accent-text)]">//</span>{' '}
                <span className="font-[family-name:var(--font-mono)] text-xs font-medium tracking-[0.08em] text-[var(--text-secondary)]">
                  TACTICAL
                </span>
              </p>
              <button
                ref={mobileCloseRef}
                type="button"
                onClick={handleCloseMobile}
                aria-label={copy.layout.closeMenuAria}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2.5 text-sm font-medium text-[var(--text-primary)]"
              >
                <CloseIcon />
                <span>{copy.common.close}</span>
              </button>
            </div>

            <nav aria-label={copy.layout.mobileNavAria} className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {navGroups.map((group) => (
                <div key={group.key} className="space-y-1.5">
                  <p className="px-3 font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
                    {group.heading}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            [
                              'relative flex min-h-[48px] items-center gap-3 rounded-[2px] px-3 text-sm transition-colors duration-150',
                              isActive
                                ? 'bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
                                : 'font-normal text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
                            ].join(' ')
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <span
                                  aria-hidden="true"
                                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-[2px] bg-[var(--accent-primary)]"
                                />
                              )}
                              <span className={isActive ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'}>
                                {item.icon(isActive)}
                              </span>
                              <span className="truncate">{item.label}</span>
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="border-t border-[var(--border-subtle)] p-3 space-y-2">
              {admin && (
                <div className="flex items-center gap-3 rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--text-primary)]">
                    {operatorInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{admin.displayName}</p>
                    <p className="truncate font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                      {operatorRoleLabel}
                    </p>
                  </div>
                </div>
              )}

              <Link
                to="/"
                className="flex min-h-[44px] w-full items-center gap-3 rounded-[4px] border border-[var(--border-subtle)] px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              >
                <StorefrontIcon />
                <span>{copy.layout.viewStorefront}</span>
              </Link>

              <div
                role="group"
                aria-label={copy.layout.langGroupAria}
                className="grid grid-cols-2 gap-2"
              >
                <button
                  type="button"
                  onClick={() => setLang('id')}
                  aria-pressed={lang === 'id'}
                  className={[
                    'min-h-[44px] rounded-[4px] border px-2 text-xs font-semibold transition-colors duration-150',
                    lang === 'id'
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-foreground)]'
                      : 'border-[var(--border-strong)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {copy.layout.langIdLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  aria-pressed={lang === 'en'}
                  className={[
                    'min-h-[44px] rounded-[4px] border px-2 text-xs font-semibold transition-colors duration-150',
                    lang === 'en'
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-foreground)]'
                      : 'border-[var(--border-strong)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {copy.layout.langEnLabel}
                </button>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                aria-pressed={theme === 'light'}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-[4px] border border-[var(--border-subtle)] px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              >
                <ThemeIcon theme={theme} />
                <span>
                  {theme === 'dark' ? copy.layout.themeCurrentDark : copy.layout.themeCurrentLight}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-[4px] border border-[var(--border-strong)] bg-[var(--status-danger-bg)] px-3 text-sm font-medium text-[var(--status-danger)] transition-colors duration-150 hover:opacity-90"
              >
                <LogoutIcon />
                <span>{loggingOut ? copy.layout.loggingOut : copy.layout.logout}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop & Tablet Sidebar (>= 768px) */}
      <aside
        aria-label={copy.layout.sidebarAria}
        className={[
          'hidden md:flex md:flex-col md:shrink-0 md:sticky md:top-0 md:h-screen border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-[width] duration-[180ms] ease-[cubic-bezier(0.2,0,0,1)]',
          collapsed ? 'w-[72px]' : 'w-[256px]',
        ].join(' ')}
      >
        {/* Header Wordmark + Collapse toggle */}
        <div
          className={[
            'flex min-h-[60px] items-center border-b border-[var(--border-subtle)]',
            collapsed ? 'justify-center px-2' : 'justify-between px-4',
          ].join(' ')}
        >
          {collapsed ? (
            <Link
              to="/admin"
              aria-label={copy.layout.brandHomeAria}
              title={copy.layout.brandHomeAria}
              className="relative inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] font-[family-name:var(--font-display)] text-base font-bold tracking-[0.04em] text-[var(--text-primary)]"
            >
              <span
                aria-hidden="true"
                className="absolute top-0 right-0 h-[3px] w-3 bg-[var(--accent-primary)]"
              />
              BRK
            </Link>
          ) : (
            <Link to="/admin" className="inline-flex min-h-[44px] min-w-0 items-center py-1">
              <span className="block font-[family-name:var(--font-display)] text-[20px] font-bold uppercase leading-none tracking-[0.04em] text-[var(--text-primary)]">
                BRAKASA <span className="font-[family-name:var(--font-mono)] text-[var(--accent-text)]">//</span>{' '}
                <span className="font-[family-name:var(--font-mono)] text-[13px] font-medium tracking-[0.08em] text-[var(--text-secondary)]">
                  TACTICAL
                </span>
              </span>
            </Link>
          )}

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-expanded={true}
              aria-controls="admin-sidebar-nav"
              aria-label={copy.layout.collapseSidebarAria}
              title={copy.layout.collapseSidebarTitle}
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[4px] border border-transparent text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            >
              <CollapseIcon collapsed={false} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="flex justify-center border-b border-[var(--border-subtle)] py-2">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-expanded={false}
              aria-controls="admin-sidebar-nav"
              aria-label={copy.layout.expandSidebarAria}
              title={copy.layout.expandSidebarTitle}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[4px] border border-transparent text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            >
              <CollapseIcon collapsed={true} />
            </button>
          </div>
        )}

        {/* Grouped Navigation */}
        <nav
          id="admin-sidebar-nav"
          aria-label={copy.layout.mainNavAria}
          className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5"
        >
          {navGroups.map((group, groupIdx) => (
            <div
              key={group.key}
              className={groupIdx > 0 ? 'border-t border-[var(--border-subtle)] pt-4 space-y-1.5' : 'space-y-1.5'}
            >
              {!collapsed && (
                <p className="px-2.5 font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  {group.heading}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      aria-label={collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        [
                          'relative flex min-h-[44px] items-center rounded-[2px] text-sm transition-colors duration-150',
                          collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                          isActive
                            ? 'bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
                            : 'font-normal text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
                        ].join(' ')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-[2px] bg-[var(--accent-primary)]"
                            />
                          )}
                          <span className={isActive ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'}>
                            {item.icon(isActive)}
                          </span>
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom Utilities: Profile, Storefront, Language Toggle, Theme Toggle, Sign Out */}
        <div className="border-t border-[var(--border-subtle)] p-2.5 space-y-1.5">
          {admin && (
            <div
              className={[
                'flex items-center rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]',
                collapsed ? 'justify-center p-1.5' : 'gap-2.5 px-2.5 py-2',
              ].join(' ')}
              title={collapsed ? `${admin.displayName} (${operatorRoleLabel})` : undefined}
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--text-primary)]">
                {operatorInitials}
              </span>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{admin.displayName}</p>
                  <p className="truncate font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                    {operatorRoleLabel}
                  </p>
                </div>
              )}
            </div>
          )}

          <Link
            to="/"
            aria-label={collapsed ? copy.layout.viewStorefront : undefined}
            title={collapsed ? copy.layout.viewStorefront : undefined}
            className={[
              'flex min-h-[44px] items-center rounded-[4px] border border-transparent text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
              collapsed ? 'justify-center px-0' : 'gap-3 px-3',
            ].join(' ')}
          >
            <StorefrontIcon />
            {!collapsed && <span className="truncate">{copy.layout.viewStorefront}</span>}
          </Link>

          {collapsed ? (
            <button
              type="button"
              onClick={toggleLang}
              aria-label={copy.layout.langToggleAria}
              title={copy.layout.langToggleAria}
              className="flex min-h-[44px] w-full items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--accent-primary)] hover:bg-[var(--bg-elevated)]"
            >
              {lang.toUpperCase()}
            </button>
          ) : (
            <div
              role="group"
              aria-label={copy.layout.langGroupAria}
              className="grid grid-cols-2 overflow-hidden rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]"
            >
              <button
                type="button"
                onClick={() => setLang('id')}
                aria-pressed={lang === 'id'}
                className={[
                  'min-h-[44px] font-[family-name:var(--font-mono)] text-xs font-semibold uppercase transition-colors duration-150',
                  lang === 'id'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-foreground)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                className={[
                  'min-h-[44px] font-[family-name:var(--font-mono)] text-xs font-semibold uppercase transition-colors duration-150',
                  lang === 'en'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-foreground)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                EN
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === 'light'}
            aria-label={theme === 'dark' ? copy.layout.themeToLightAria : copy.layout.themeToDarkAria}
            title={theme === 'dark' ? copy.layout.themeLightMode : copy.layout.themeDarkMode}
            className={[
              'flex min-h-[44px] w-full items-center rounded-[4px] border border-transparent text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
              collapsed ? 'justify-center px-0' : 'gap-3 px-3',
            ].join(' ')}
          >
            <ThemeIcon theme={theme} />
            {!collapsed && (
              <span className="truncate">
                {theme === 'dark' ? copy.layout.themeLightMode : copy.layout.themeDarkMode}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            aria-label={collapsed ? copy.layout.logoutAria : undefined}
            title={collapsed ? copy.layout.logout : undefined}
            className={[
              'flex min-h-[44px] w-full items-center rounded-[4px] border border-[var(--border-subtle)] text-sm font-medium text-[var(--status-danger)] transition-colors duration-150 hover:border-[var(--status-danger)] hover:bg-[var(--status-danger-bg)]',
              collapsed ? 'justify-center px-0' : 'gap-3 px-3',
            ].join(' ')}
          >
            <LogoutIcon />
            {!collapsed && (
              <span className="truncate">
                {loggingOut ? copy.layout.loggingOut : copy.layout.logout}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 md:py-6 lg:px-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
