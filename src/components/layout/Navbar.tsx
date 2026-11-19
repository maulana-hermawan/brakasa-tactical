import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useBootstrap } from '../../context/BootstrapContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { DEFAULT_CATEGORIES } from '../../i18n/common';
import {
  IconCart,
  IconChevronDown,
  IconClose,
  IconMenu,
  IconMoon,
  IconSearch,
  IconSun,
} from '../ui/TacticalIcons';

const POPULAR_SEARCH_SLUGS = [
  'assault-rifle',
  'smg-pdw',
  'optics-aiming',
  'plate-carrier-rig',
] as const;

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('hidden') && el.offsetParent !== null,
  );
}

export function Navbar(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t, getCategoryName } = useLanguage();
  const { totalCount, setDrawerOpen } = useCart();
  const { data } = useBootstrap();
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [catMenuOpen, setCatMenuOpen] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [mobileCatOpen, setMobileCatOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const catContainerRef = useRef<HTMLDivElement | null>(null);
  const catButtonRef = useRef<HTMLButtonElement | null>(null);
  const catCloseTimerRef = useRef<number | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileSheetRef = useRef<HTMLDivElement | null>(null);
  const mobileCloseRef = useRef<HTMLButtonElement | null>(null);
  const searchDialogRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const isHome = location.pathname === '/';
  const isOverHero = isHome && !isScrolled;
  const isLight = theme === 'light';

  const navCategories = useMemo(() => {
    if (data?.categories && data.categories.length > 0) {
      return data.categories.map((cat) => ({
        slug: cat.slug,
        label: getCategoryName(cat.slug, cat.name),
      }));
    }
    return DEFAULT_CATEGORIES.map((cat) => ({
      slug: cat.slug,
      label: getCategoryName(cat.slug),
    }));
  }, [data?.categories, getCategoryName]);

  const clearCatTimer = useCallback(() => {
    if (catCloseTimerRef.current !== null) {
      window.clearTimeout(catCloseTimerRef.current);
      catCloseTimerRef.current = null;
    }
  }, []);

  const handleCatMouseEnter = () => {
    clearCatTimer();
    setCatMenuOpen(true);
  };

  const handleCatMouseLeave = () => {
    clearCatTimer();
    catCloseTimerRef.current = window.setTimeout(() => {
      setCatMenuOpen(false);
    }, 180);
  };

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
    requestAnimationFrame(() => {
      menuButtonRef.current?.focus();
    });
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    requestAnimationFrame(() => {
      searchTriggerRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    const updateScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  useEffect(() => {
    return () => clearCatTimer();
  }, [clearCatTimer]);

  useEffect(() => {
    setMobileNavOpen(false);
    setSearchOpen(false);
    setCatMenuOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!catMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        catContainerRef.current &&
        event.target instanceof Node &&
        !catContainerRef.current.contains(event.target)
      ) {
        setCatMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setCatMenuOpen(false);
        catButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [catMenuOpen]);

  useEffect(() => {
    const handleGlobalKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      mobileCloseRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobileNav();
        return;
      }
      if (event.key === 'Tab' && mobileSheetRef.current) {
        const focusables = getFocusableElements(mobileSheetRef.current);
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
    };
  }, [mobileNavOpen, closeMobileNav]);

  useEffect(() => {
    if (!searchOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSearch();
        return;
      }
      if (event.key === 'Tab' && searchDialogRef.current) {
        const focusables = getFocusableElements(searchDialogRef.current);
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
    };
  }, [searchOpen, closeSearch]);

  const handleSectionLink = (sectionId: string) => {
    setMobileNavOpen(false);
    setCatMenuOpen(false);
    if (location.pathname === '/') {
      const target = document.getElementById(sectionId);
      if (target) {
        const prefersReduced =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
          behavior: prefersReduced ? 'auto' : 'smooth',
          block: 'start',
        });
      }
      window.history.replaceState(null, '', `/#${sectionId}`);
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    setSearchOpen(false);
    setMobileNavOpen(false);
    if (trimmed) {
      navigate(`/store?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/store');
    }
  };

  const navPrimaryColor = isOverHero ? '#F0EFEA' : 'var(--text-primary)';
  const navSecondaryColor = isOverHero ? '#D4D8D2' : 'var(--text-secondary)';
  const navAccentColor = isOverHero ? '#EBAC3B' : 'var(--accent-text)';
  const navActiveBorderColor = isOverHero ? '#E5A024' : 'var(--accent-primary)';
  const controlBg = isOverHero ? 'rgba(15, 17, 16, 0.56)' : 'var(--bg-surface)';
  const controlBorder = isOverHero ? 'rgba(240, 239, 234, 0.34)' : 'var(--border-strong)';
  const activeLangBg = isOverHero ? '#E5A024' : 'var(--accent-primary)';
  const activeLangFg = isOverHero ? '#121412' : 'var(--accent-foreground)';

  return (
    <>
      <header
        style={{
          borderBottomColor: isOverHero
            ? 'rgba(240, 239, 234, 0.14)'
            : 'var(--border-subtle)',
        }}
        className={`sticky top-0 z-40 box-border h-[56px] w-full border-b transition-colors duration-[180ms] lg:h-[68px] ${
          isOverHero ? 'navbar-hero-overlay' : 'navbar-glass'
        }`}
      >
        <div className="container-brakasa flex h-full items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 no-underline"
            aria-label={t.nav.homeAria}
          >
            <span
              style={{ color: navPrimaryColor }}
              className="font-display text-[1.1875rem] font-bold tracking-[0.04em] uppercase sm:text-[1.375rem]"
            >
              BRAKASA
            </span>
            <span
              style={{ color: navAccentColor }}
              className="font-mono-tech text-sm font-semibold sm:text-base"
              aria-hidden="true"
            >
              //
            </span>
            <span
              style={{ color: navSecondaryColor }}
              className="font-mono-tech text-[0.75rem] font-medium tracking-[0.08em] uppercase sm:text-[0.875rem]"
            >
              TACTICAL
            </span>
          </Link>

          <nav
            aria-label={t.nav.mainNavAria}
            className="hidden flex-1 items-center justify-center gap-1 lg:flex"
          >
            <NavLink
              to="/store"
              className={({ isActive }) =>
                `inline-flex min-h-[44px] items-center px-3.5 text-sm tracking-wide uppercase no-underline transition-colors ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? navPrimaryColor : navSecondaryColor,
                borderBottom: isActive
                  ? `2px solid ${navActiveBorderColor}`
                  : '2px solid transparent',
              })}
            >
              {t.nav.shop}
            </NavLink>

            <div
              ref={catContainerRef}
              className="relative"
              onMouseEnter={handleCatMouseEnter}
              onMouseLeave={handleCatMouseLeave}
            >
              <button
                ref={catButtonRef}
                type="button"
                onClick={() => setCatMenuOpen((prev) => !prev)}
                aria-expanded={catMenuOpen}
                aria-haspopup="true"
                aria-controls="desktop-categories-dropdown"
                style={{
                  color: catMenuOpen ? navPrimaryColor : navSecondaryColor,
                  borderBottom: catMenuOpen
                    ? `2px solid ${navActiveBorderColor}`
                    : '2px solid transparent',
                }}
                className="inline-flex min-h-[44px] items-center gap-1.5 border-x-0 border-t-0 bg-transparent px-3.5 text-sm font-medium tracking-wide uppercase transition-colors"
              >
                <span>{t.nav.categories}</span>
                <IconChevronDown
                  size={15}
                  className={`transition-transform duration-[180ms] ${
                    catMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {catMenuOpen ? (
                <div
                  id="desktop-categories-dropdown"
                  className="absolute top-full left-1/2 z-50 pt-2 -translate-x-1/2"
                >
                  <div
                    aria-hidden="true"
                    className="absolute -top-2 right-0 left-0 h-2 bg-transparent"
                  />
                  <div
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-strong)',
                      borderRadius: 'var(--radius-overlay)',
                      boxShadow: 'var(--shadow-overlay)',
                    }}
                    className="min-w-[390px] border p-2.5"
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {navCategories.map((cat) => (
                        <Link
                          key={cat.slug}
                          to={`/store?category=${encodeURIComponent(cat.slug)}`}
                          onClick={() => setCatMenuOpen(false)}
                          style={{
                            color: 'var(--text-primary)',
                            borderRadius: 'var(--radius-control)',
                          }}
                          className="flex min-h-[44px] items-center px-3 text-sm font-medium no-underline transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--accent-text)]"
                        >
                          {cat.label}
                        </Link>
                      ))}
                    </div>
                    <div
                      style={{ borderTopColor: 'var(--border-subtle)' }}
                      className="mt-2 border-t pt-2"
                    >
                      <Link
                        to="/store"
                        onClick={() => setCatMenuOpen(false)}
                        style={{
                          color: 'var(--accent-text)',
                          borderRadius: 'var(--radius-control)',
                        }}
                        className="flex min-h-[44px] items-center justify-between px-3 text-xs font-semibold uppercase tracking-wide no-underline transition-colors hover:bg-[var(--bg-surface)]"
                      >
                        <span>{t.nav.allProducts}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => handleSectionLink('featured-products')}
              style={{
                color:
                  isHome && location.hash === '#featured-products'
                    ? navPrimaryColor
                    : navSecondaryColor,
                borderBottom:
                  isHome && location.hash === '#featured-products'
                    ? `2px solid ${navActiveBorderColor}`
                    : '2px solid transparent',
              }}
              className="inline-flex min-h-[44px] items-center border-x-0 border-t-0 bg-transparent px-3.5 text-sm font-medium tracking-wide uppercase transition-colors"
            >
              {t.nav.featured}
            </button>

            <button
              type="button"
              onClick={() => handleSectionLink('our-store')}
              style={{
                color:
                  isHome && location.hash === '#our-store'
                    ? navPrimaryColor
                    : navSecondaryColor,
                borderBottom:
                  isHome && location.hash === '#our-store'
                    ? `2px solid ${navActiveBorderColor}`
                    : '2px solid transparent',
              }}
              className="inline-flex min-h-[44px] items-center border-x-0 border-t-0 bg-transparent px-3.5 text-sm font-medium tracking-wide uppercase transition-colors"
            >
              {t.nav.ourStore}
            </button>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              ref={searchTriggerRef}
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t.nav.searchAria}
              style={{
                backgroundColor: controlBg,
                borderColor: controlBorder,
                color: navPrimaryColor,
                borderRadius: 'var(--radius-control)',
              }}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 border px-2.5 text-sm font-medium transition-colors"
            >
              <IconSearch size={17} />
              <span className="hidden xl:inline">{t.nav.searchLabel}</span>
            </button>

            <div
              role="group"
              aria-label={t.nav.languageGroupAria}
              style={{
                backgroundColor: controlBg,
                borderColor: controlBorder,
                borderRadius: 'var(--radius-control)',
              }}
              className="hidden min-h-[44px] items-center overflow-hidden border sm:inline-flex"
            >
              <button
                type="button"
                onClick={() => setLang('id')}
                aria-pressed={lang === 'id'}
                style={{
                  backgroundColor: lang === 'id' ? activeLangBg : 'transparent',
                  color: lang === 'id' ? activeLangFg : navPrimaryColor,
                }}
                className="inline-flex min-h-[42px] min-w-[40px] items-center justify-center border-0 px-2.5 font-mono-tech text-xs font-semibold uppercase transition-colors"
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                style={{
                  backgroundColor: lang === 'en' ? activeLangBg : 'transparent',
                  color: lang === 'en' ? activeLangFg : navPrimaryColor,
                }}
                className="inline-flex min-h-[42px] min-w-[40px] items-center justify-center border-0 px-2.5 font-mono-tech text-xs font-semibold uppercase transition-colors"
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={isLight}
              aria-label={isLight ? t.nav.themeToDarkAria : t.nav.themeToLightAria}
              style={{
                backgroundColor: controlBg,
                borderColor: controlBorder,
                color: navPrimaryColor,
                borderRadius: 'var(--radius-control)',
              }}
              className="hidden min-h-[44px] min-w-[44px] items-center justify-center border transition-colors sm:inline-flex"
            >
              {isLight ? <IconMoon size={17} /> : <IconSun size={17} />}
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t.nav.openCartAria(totalCount)}
              style={{
                backgroundColor: totalCount > 0 ? 'var(--brand-olive)' : controlBg,
                borderColor: totalCount > 0 ? 'var(--brand-olive)' : controlBorder,
                color: totalCount > 0 ? '#FAF8F4' : navPrimaryColor,
                borderRadius: 'var(--radius-control)',
              }}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 border px-2.5 text-sm font-semibold transition-colors sm:px-3"
            >
              <IconCart size={17} />
              <span
                style={{
                  backgroundColor:
                    totalCount > 0
                      ? activeLangBg
                      : isOverHero
                        ? 'rgba(240, 239, 234, 0.16)'
                        : 'var(--bg-elevated)',
                  color: totalCount > 0 ? activeLangFg : navPrimaryColor,
                  borderRadius: 'var(--radius-plate)',
                }}
                className="inline-flex min-w-[22px] items-center justify-center px-1.5 py-0.5 font-mono-tech text-xs font-semibold tabular-nums"
              >
                {totalCount}
              </span>
            </button>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-expanded={mobileNavOpen}
              aria-controls="public-mobile-nav"
              style={{
                backgroundColor: controlBg,
                borderColor: controlBorder,
                color: navPrimaryColor,
                borderRadius: 'var(--radius-control)',
              }}
              className="inline-flex min-h-[44px] min-w-[74px] items-center justify-center gap-1.5 border px-2.5 text-sm font-semibold lg:hidden"
            >
              <IconMenu size={17} />
              <span>{t.nav.menu}</span>
            </button>
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-50 flex justify-end lg:hidden"
          style={{ backgroundColor: 'var(--backdrop-scrim)' }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeMobileNav();
            }
          }}
        >
          <div
            id="public-mobile-nav"
            ref={mobileSheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderLeftColor: 'var(--border-subtle)',
              boxShadow: 'var(--shadow-overlay)',
            }}
            className="flex h-[100dvh] w-[min(86vw,340px)] flex-col border-l"
          >
            <div
              style={{ borderBottomColor: 'var(--border-subtle)' }}
              className="flex items-center justify-between gap-2 border-b px-4 py-3"
            >
              <h2
                id="mobile-nav-title"
                style={{ color: 'var(--text-primary)' }}
                className="m-0 font-display text-xl font-bold tracking-[0.04em] uppercase"
              >
                BRAKASA
              </h2>
              <button
                ref={mobileCloseRef}
                type="button"
                onClick={closeMobileNav}
                aria-label={t.nav.closeMenuAria}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-control)',
                }}
                className="inline-flex min-h-[44px] items-center gap-1.5 border px-3 text-sm font-semibold"
              >
                <IconClose size={16} />
                <span>{t.common.close}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
                <label htmlFor="mobile-nav-search" className="sr-only-brakasa">
                  {t.nav.searchInputLabel}
                </label>
                <input
                  id="mobile-nav-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.nav.searchPlaceholder}
                  className="input-brakasa flex-1"
                />
                <button
                  type="submit"
                  className="btn-brakasa btn-primary shrink-0 px-3"
                  aria-label={t.nav.searchSubmit}
                >
                  <IconSearch size={17} />
                </button>
              </form>

              <nav aria-label={t.nav.mobileNavAria} className="flex flex-col gap-1">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `flex min-h-[48px] items-center px-3 text-[0.9375rem] no-underline ${
                      isActive ? 'font-semibold' : 'font-medium'
                    }`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderLeft: isActive
                      ? '3px solid var(--accent-primary)'
                      : '3px solid transparent',
                    borderRadius: 'var(--radius-plate)',
                  })}
                >
                  {t.nav.home}
                </NavLink>

                <NavLink
                  to="/store"
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `flex min-h-[48px] items-center px-3 text-[0.9375rem] no-underline ${
                      isActive ? 'font-semibold' : 'font-medium'
                    }`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderLeft: isActive
                      ? '3px solid var(--accent-primary)'
                      : '3px solid transparent',
                    borderRadius: 'var(--radius-plate)',
                  })}
                >
                  {t.nav.shop}
                </NavLink>

                <div>
                  <button
                    type="button"
                    onClick={() => setMobileCatOpen((prev) => !prev)}
                    aria-expanded={mobileCatOpen}
                    style={{
                      color: 'var(--text-secondary)',
                      borderRadius: 'var(--radius-plate)',
                    }}
                    className="flex min-h-[48px] w-full items-center justify-between border-0 bg-transparent px-3 text-left text-[0.9375rem] font-medium"
                  >
                    <span>{t.nav.categories}</span>
                    <IconChevronDown
                      size={16}
                      className={`transition-transform duration-[180ms] ${
                        mobileCatOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {mobileCatOpen ? (
                    <div
                      style={{ borderLeftColor: 'var(--border-subtle)' }}
                      className="mt-1 ml-3 flex flex-col gap-0.5 border-l pl-3"
                    >
                      {navCategories.map((cat) => (
                        <Link
                          key={cat.slug}
                          to={`/store?category=${encodeURIComponent(cat.slug)}`}
                          onClick={() => setMobileNavOpen(false)}
                          style={{ color: 'var(--text-secondary)' }}
                          className="flex min-h-[44px] items-center text-sm font-medium no-underline hover:text-[var(--text-primary)]"
                        >
                          {cat.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => handleSectionLink('featured-products')}
                  style={{
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-plate)',
                  }}
                  className="flex min-h-[48px] w-full items-center border-0 bg-transparent px-3 text-left text-[0.9375rem] font-medium"
                >
                  {t.nav.featured}
                </button>

                <button
                  type="button"
                  onClick={() => handleSectionLink('our-store')}
                  style={{
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-plate)',
                  }}
                  className="flex min-h-[48px] w-full items-center border-0 bg-transparent px-3 text-left text-[0.9375rem] font-medium"
                >
                  {t.nav.ourStore}
                </button>
              </nav>
            </div>

            <div
              style={{
                borderTopColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
              }}
              className="space-y-3 border-t px-4 py-4"
            >
              <div>
                <p
                  style={{ color: 'var(--text-muted)' }}
                  className="mt-0 mb-2 text-xs font-medium uppercase tracking-wider"
                >
                  {t.nav.languageHeading}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLang('id')}
                    aria-pressed={lang === 'id'}
                    style={{
                      backgroundColor:
                        lang === 'id' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                      borderColor:
                        lang === 'id' ? 'var(--accent-primary)' : 'var(--border-strong)',
                      color:
                        lang === 'id' ? 'var(--accent-foreground)' : 'var(--text-primary)',
                      borderRadius: 'var(--radius-control)',
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center border px-2 text-xs font-semibold"
                  >
                    {t.nav.langIdFull}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    aria-pressed={lang === 'en'}
                    style={{
                      backgroundColor:
                        lang === 'en' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                      borderColor:
                        lang === 'en' ? 'var(--accent-primary)' : 'var(--border-strong)',
                      color:
                        lang === 'en' ? 'var(--accent-foreground)' : 'var(--text-primary)',
                      borderRadius: 'var(--radius-control)',
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center border px-2 text-xs font-semibold"
                  >
                    {t.nav.langEnFull}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                aria-pressed={isLight}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-control)',
                }}
                className="flex min-h-[44px] w-full items-center justify-between border px-3 text-xs font-semibold"
              >
                <span className="inline-flex items-center gap-2">
                  {isLight ? <IconSun size={16} /> : <IconMoon size={16} />}
                  <span>{isLight ? t.nav.themeLightName : t.nav.themeDarkName}</span>
                </span>
                <span style={{ color: 'var(--accent-text)' }} className="uppercase">
                  {isLight ? t.nav.themeToDarkShort : t.nav.themeToLightShort}
                </span>
              </button>

              <Link
                to="/admin/login"
                onClick={() => setMobileNavOpen(false)}
                style={{
                  color: 'var(--text-muted)',
                  borderColor: 'var(--border-subtle)',
                  borderRadius: 'var(--radius-control)',
                }}
                className="flex min-h-[44px] items-center justify-center border text-xs font-medium no-underline hover:text-[var(--text-primary)]"
              >
                {t.nav.admin}
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {searchOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-24"
          style={{ backgroundColor: 'var(--backdrop-scrim)' }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeSearch();
            }
          }}
        >
          <div
            ref={searchDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-search-title"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-strong)',
              borderRadius: 'var(--radius-overlay)',
              boxShadow: 'var(--shadow-overlay)',
            }}
            className="w-full max-w-[540px] border p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2
                id="quick-search-title"
                style={{ color: 'var(--text-primary)' }}
                className="m-0 font-display text-2xl font-bold uppercase tracking-wide"
              >
                {t.nav.searchDialogTitle}
              </h2>
              <button
                type="button"
                onClick={closeSearch}
                aria-label={t.nav.closeSearchAria}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-control)',
                }}
                className="inline-flex min-h-[44px] items-center gap-1.5 border px-3 text-sm font-semibold"
              >
                <IconClose size={16} />
                <span>{t.common.close}</span>
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
              <div className="min-w-0 flex-1">
                <label htmlFor="quick-search-input" className="sr-only-brakasa">
                  {t.nav.searchInputLabel}
                </label>
                <input
                  ref={searchInputRef}
                  id="quick-search-input"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.nav.searchPlaceholder}
                  className="input-brakasa"
                />
              </div>
              <button
                type="submit"
                className="btn-brakasa btn-primary w-full shrink-0 sm:w-auto"
              >
                {t.nav.searchSubmit}
              </button>
            </form>

            <div
              style={{ borderTopColor: 'var(--border-subtle)' }}
              className="mt-4 border-t pt-3.5"
            >
              <p
                style={{ color: 'var(--text-muted)' }}
                className="mt-0 mb-2 text-xs font-medium uppercase tracking-wider"
              >
                {t.nav.popularCategories}
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCH_SLUGS.map((slug) => (
                  <Link
                    key={slug}
                    to={`/store?category=${encodeURIComponent(slug)}`}
                    onClick={() => setSearchOpen(false)}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      borderRadius: 'var(--radius-plate)',
                    }}
                    className="inline-flex min-h-[44px] items-center border px-3 text-xs font-medium no-underline transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  >
                    {getCategoryName(slug)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
