import React from 'react';
import { Link } from 'react-router-dom';
import { useBootstrap } from '../../context/BootstrapContext';
import { useLanguage } from '../../context/LanguageContext';
import { DEFAULT_STORE_MAPS_DIRECTIONS_URL } from '../../i18n/common';
import { IconExternalLink } from '../ui/TacticalIcons';

function getSafeExternalUrl(candidate: string | undefined, fallback: string): string {
  if (candidate && candidate.trim().startsWith('https://')) {
    return candidate.trim();
  }
  return fallback;
}

export function Footer(): React.JSX.Element {
  const { data } = useBootstrap();
  const { lang, t, getCategoryName } = useLanguage();
  const profile = data?.settings.armoryProfile;

  const storeAddress = profile?.address
    ? profile.city && !profile.address.toLowerCase().includes(profile.city.toLowerCase())
      ? `${profile.address}, ${profile.city}`
      : profile.address
    : t.ourStore.defaultAddress;

  const operatingHours =
    lang === 'en'
      ? profile?.operatingHoursEn || t.ourStore.defaultHours
      : profile?.operatingHours || t.ourStore.defaultHours;

  const whatsappNumber = profile?.whatsappNumber || t.ourStore.defaultWhatsapp;
  const supportEmail = profile?.supportEmail || t.ourStore.defaultEmail;
  const mapsDirectionsUrl = getSafeExternalUrl(
    profile?.mapsDirectionsUrl,
    DEFAULT_STORE_MAPS_DIRECTIONS_URL,
  );

  const shopLinks = [
    { label: t.footer.allProducts, to: '/store' },
    { label: getCategoryName('assault-rifle'), to: '/store?category=assault-rifle' },
    { label: getCategoryName('smg-pdw'), to: '/store?category=smg-pdw' },
    { label: getCategoryName('optics-aiming'), to: '/store?category=optics-aiming' },
    { label: getCategoryName('plate-carrier-rig'), to: '/store?category=plate-carrier-rig' },
  ];

  const exploreLinks = [
    { label: t.footer.home, to: '/' },
    { label: t.footer.featuredProducts, to: '/#featured-products' },
    { label: t.footer.categories, to: '/#categories' },
    { label: t.footer.ourStore, to: '/#our-store' },
    { label: t.footer.adminPortal, to: '/admin/login' },
  ];

  return (
    <footer
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTopColor: 'var(--border-subtle)',
      }}
      className="mt-auto border-t"
    >
      <div className="container-brakasa py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 space-y-3">
            <Link
              to="/"
              className="inline-flex min-h-[44px] items-center gap-1.5 no-underline"
              aria-label={t.nav.homeAria}
            >
              <span
                style={{ color: 'var(--text-primary)' }}
                className="font-display text-2xl font-bold tracking-[0.04em] uppercase"
              >
                BRAKASA
              </span>
              <span
                style={{ color: 'var(--accent-text)' }}
                className="font-mono-tech text-base font-semibold"
                aria-hidden="true"
              >
                //
              </span>
              <span
                style={{ color: 'var(--text-secondary)' }}
                className="font-mono-tech text-sm font-medium tracking-[0.08em] uppercase"
              >
                TACTICAL
              </span>
            </Link>

            <p
              style={{ color: 'var(--text-secondary)' }}
              className="m-0 text-sm leading-relaxed"
            >
              {storeAddress}
            </p>
            <p
              style={{ color: 'var(--text-muted)' }}
              className="m-0 text-xs leading-relaxed"
            >
              {operatingHours}
            </p>
          </div>

          <div className="min-w-0">
            <h2
              style={{ color: 'var(--text-primary)' }}
              className="mt-0 mb-3 font-sans-body text-xs font-semibold uppercase tracking-wider"
            >
              {t.footer.shopHeading}
            </h2>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {shopLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    style={{ color: 'var(--text-secondary)' }}
                    className="inline-flex min-h-[44px] items-center text-sm no-underline transition-colors hover:text-[var(--text-primary)] hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h2
              style={{ color: 'var(--text-primary)' }}
              className="mt-0 mb-3 font-sans-body text-xs font-semibold uppercase tracking-wider"
            >
              {t.footer.exploreHeading}
            </h2>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {exploreLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    style={{ color: 'var(--text-secondary)' }}
                    className="inline-flex min-h-[44px] items-center text-sm no-underline transition-colors hover:text-[var(--text-primary)] hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h2
              style={{ color: 'var(--text-primary)' }}
              className="mt-0 mb-3 font-sans-body text-xs font-semibold uppercase tracking-wider"
            >
              {t.footer.contactHeading}
            </h2>
            <ul className="m-0 list-none space-y-1 p-0 text-sm">
              <li
                style={{ color: 'var(--text-secondary)' }}
                className="flex min-h-[44px] items-center font-mono-tech tabular-nums"
              >
                {whatsappNumber}
              </li>
              <li>
                <a
                  href={`mailto:${supportEmail}`}
                  style={{ color: 'var(--text-secondary)' }}
                  className="inline-flex min-h-[44px] items-center no-underline transition-colors hover:text-[var(--text-primary)] hover:underline"
                >
                  {supportEmail}
                </a>
              </li>
              <li>
                <a
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-text)' }}
                  className="inline-flex min-h-[44px] items-center gap-1.5 font-medium no-underline hover:underline"
                >
                  <span>{t.footer.googleMaps}</span>
                  <IconExternalLink size={14} />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTopColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
        className="border-t py-4 text-xs"
      >
        <div className="container-brakasa">
          <span>{t.footer.copyright}</span>
        </div>
      </div>
    </footer>
  );
}
