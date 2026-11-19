import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { getAdminCopy } from '../../i18n/admin';
import { ApiRequestError } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

interface RedirectState {
  from?: {
    pathname?: string;
    search?: string;
  };
}

export function AdminLoginPage(): React.JSX.Element {
  const { lang, setLang } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);
  useDocumentTitle(copy.login.docTitle);

  const { admin, loading, login } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const usernameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!loading && !admin) {
      usernameRef.current?.focus();
    }
  }, [loading, admin]);

  if (!loading && admin) {
    const state = location.state as RedirectState | null;
    const targetPath =
      state?.from?.pathname && state.from.pathname.startsWith('/admin') && state.from.pathname !== '/admin/login'
        ? `${state.from.pathname}${state.from.search ?? ''}`
        : '/admin';
    return <Navigate to={targetPath} replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError(copy.login.validationRequired);
      return;
    }

    setSubmitting(true);
    try {
      await login(trimmedUser, password);
      const state = location.state as RedirectState | null;
      const targetPath =
        state?.from?.pathname && state.from.pathname.startsWith('/admin') && state.from.pathname !== '/admin/login'
          ? `${state.from.pathname}${state.from.search ?? ''}`
          : '/admin';
      navigate(targetPath, { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 429) {
          setError(copy.login.errorRateLimit);
        } else if (err.status === 401) {
          setError(copy.login.errorUnauthorized);
        } else {
          setError(err.message);
        }
      } else {
        setError(copy.login.errorNetwork);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[1000] focus:inline-flex focus:min-h-[44px] focus:items-center focus:rounded-[4px] focus:bg-[var(--accent-primary)] focus:px-4 focus:text-sm focus:font-semibold focus:text-[var(--accent-foreground)]"
      >
        {copy.login.skipToForm}
      </a>

      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex min-h-[60px] max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <Link to="/" className="inline-flex min-h-[44px] shrink-0 items-center">
            <span className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-[0.04em] text-[var(--text-primary)]">
              BRAKASA <span className="font-[family-name:var(--font-mono)] text-[var(--accent-text)]">//</span>{' '}
              <span className="font-[family-name:var(--font-mono)] text-xs font-medium tracking-[0.08em] text-[var(--text-secondary)]">
                TACTICAL
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[var(--border-subtle)] px-3 text-xs sm:text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <span className="hidden sm:inline">{copy.login.backToStorefront}</span>
              <span className="sm:hidden">{copy.login.backShort}</span>
            </Link>

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
              className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-xs font-medium text-[var(--text-primary)]"
            >
              {theme === 'dark' ? copy.layout.themeLightMode : copy.layout.themeDarkMode}
            </button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 items-center justify-center px-4 py-10 pb-28 sm:pb-16"
      >
        <div className="w-full max-w-[420px] rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase leading-tight tracking-[0.01em] text-[var(--text-primary)]">
              {copy.login.heading}
            </h1>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="rounded-[2px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-3.5 py-3 text-sm text-[var(--status-danger)]"
              >
                <span className="font-[family-name:var(--font-mono)] text-xs font-semibold">
                  {copy.login.errorBadge}
                </span>{' '}
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="admin-login-username"
                className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
              >
                {copy.login.usernameLabel}
              </label>
              <input
                ref={usernameRef}
                id="admin-login-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                placeholder={copy.login.usernamePlaceholder}
                className="min-h-[48px] w-full scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-login-password"
                className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
              >
                {copy.login.passwordLabel}
              </label>
              <div className="flex gap-2">
                <input
                  id="admin-login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  placeholder={copy.login.passwordPlaceholder}
                  className="min-h-[48px] flex-1 scroll-my-24 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-pressed={showPassword}
                  aria-label={
                    showPassword ? copy.login.hidePasswordAria : copy.login.showPasswordAria
                  }
                  className="inline-flex min-h-[48px] min-w-[76px] shrink-0 items-center justify-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-xs font-medium text-[var(--text-primary)]"
                >
                  {showPassword ? copy.login.hidePassword : copy.login.showPassword}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="mt-2 min-h-[48px] w-full rounded-[4px] bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--text-primary)]"
            >
              {submitting ? copy.login.submitting : copy.login.submit}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
