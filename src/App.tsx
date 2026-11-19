import React from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { BootstrapProvider } from './context/BootstrapContext';
import { CartProvider } from './context/CartContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { SiteLayout } from './components/layout/SiteLayout';
import { AdminGuard } from './components/admin/AdminGuard';
import { useDocumentTitle } from './lib/useDocumentTitle';

import { LandingPage } from './pages/LandingPage';
import { StoreCatalogPage } from './pages/StoreCatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';

import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminVouchersPage } from './pages/admin/AdminVouchersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

function AdminAuthBoundary(): React.JSX.Element {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}

function NotFoundPage(): React.JSX.Element {
  const { t } = useLanguage();
  useDocumentTitle(t.notFound.docTitle);

  return (
    <section className="py-16 sm:py-24">
      <div className="container-brakasa">
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-strong)',
            borderRadius: 'var(--radius-plate)',
          }}
          className="max-w-[580px] space-y-4 border p-6 sm:p-8"
        >
          <span
            style={{ color: 'var(--accent-text)' }}
            className="block font-mono-tech text-sm font-semibold tabular-nums"
          >
            404
          </span>
          <h1
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.02 }}
            className="m-0 font-display font-bold uppercase"
          >
            {t.notFound.title}
          </h1>
          <p
            style={{ color: 'var(--text-secondary)' }}
            className="m-0 text-sm leading-relaxed sm:text-base"
          >
            {t.notFound.description}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/" className="btn-brakasa btn-primary">
              {t.notFound.backHome}
            </Link>
            <Link to="/store" className="btn-brakasa btn-secondary">
              {t.notFound.openShop}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BootstrapProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<SiteLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/store" element={<StoreCatalogPage />} />
                  <Route path="/store/:slug" element={<ProductDetailPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route path="/admin" element={<AdminAuthBoundary />}>
                  <Route path="login" element={<AdminLoginPage />} />
                  <Route element={<AdminGuard />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="inventory" element={<AdminInventoryPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="orders/:id" element={<AdminOrdersPage />} />
                    <Route path="vouchers" element={<AdminVouchersPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </BootstrapProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
