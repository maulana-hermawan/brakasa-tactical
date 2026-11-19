import React from 'react';
import { useBootstrap } from '../../context/BootstrapContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  DEFAULT_STORE_MAPS_DIRECTIONS_URL,
  DEFAULT_STORE_MAPS_EMBED_URL,
} from '../../i18n/common';
import {
  IconClock,
  IconExternalLink,
  IconMapPin,
  IconPhone,
} from '../ui/TacticalIcons';

function getSafeHttpsUrl(candidate: string | undefined, fallback: string): string {
  if (candidate && candidate.trim().startsWith('https://')) {
    return candidate.trim();
  }
  return fallback;
}

export function OurStoreSection(): React.JSX.Element {
  const { data } = useBootstrap();
  const { lang, t } = useLanguage();
  const profile = data?.settings.armoryProfile;

  const address = profile?.address
    ? profile.city && !profile.address.toLowerCase().includes(profile.city.toLowerCase())
      ? `${profile.address}, ${profile.city}`
      : profile.address
    : t.ourStore.defaultAddress;

  const operatingHours =
    lang === 'en'
      ? profile?.operatingHoursEn || t.ourStore.defaultHours
      : profile?.operatingHours || t.ourStore.defaultHours;

  const whatsapp = profile?.whatsappNumber || t.ourStore.defaultWhatsapp;

  const mapsEmbedUrl = getSafeHttpsUrl(
    profile?.mapsEmbedUrl,
    DEFAULT_STORE_MAPS_EMBED_URL,
  );
  const mapsDirectionsUrl = getSafeHttpsUrl(
    profile?.mapsDirectionsUrl,
    DEFAULT_STORE_MAPS_DIRECTIONS_URL,
  );

  return (
    <section
      id="our-store"
      className="scroll-mt-20 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]"
    >
      <div className="grid grid-cols-1 lg:min-h-[460px] lg:grid-cols-2">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="order-2 flex flex-col justify-center gap-5 bg-[var(--bg-surface)] p-6 sm:order-1 sm:p-8 lg:p-10">
            <h2 className="m-0 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold uppercase tracking-tight">
              {t.ourStore.title}
            </h2>

            <dl className="m-0 space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="flex items-start gap-2.5">
                <span
                  style={{ color: 'var(--accent-text)' }}
                  className="mt-0.5 shrink-0"
                >
                  <IconMapPin size={16} />
                </span>
                <div className="min-w-0">
                  <dt className="sr-only-brakasa">{t.ourStore.addressLabel}</dt>
                  <dd className="m-0 leading-relaxed">{address}</dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span
                  style={{ color: 'var(--accent-text)' }}
                  className="mt-0.5 shrink-0"
                >
                  <IconClock size={16} />
                </span>
                <div className="min-w-0">
                  <dt className="sr-only-brakasa">{t.ourStore.hoursLabel}</dt>
                  <dd className="m-0 leading-relaxed">{operatingHours}</dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span
                  style={{ color: 'var(--accent-text)' }}
                  className="mt-0.5 shrink-0"
                >
                  <IconPhone size={16} />
                </span>
                <div className="min-w-0">
                  <dt className="sr-only-brakasa">{t.ourStore.contactLabel}</dt>
                  <dd className="m-0 font-mono-tech tabular-nums">{whatsapp}</dd>
                </div>
              </div>
            </dl>

            <a
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brakasa btn-primary mt-1 min-h-[48px] w-fit px-5 text-sm font-semibold"
            >
              <span>{t.ourStore.directionsCta}</span>
              <IconExternalLink size={16} />
            </a>
          </div>

          <div className="relative order-1 min-h-[260px] overflow-hidden bg-[#0F1110] sm:order-2 sm:min-h-full">
            <img
              src="/media/images/hero/hero-scene-01.jpg"
              alt={t.ourStore.showroomImageAlt}
              width={2400}
              height={1350}
              loading="lazy"
              decoding="async"
              className="block h-full w-full object-cover object-center"
            />
          </div>
        </div>

        <div className="relative min-h-[340px] border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] lg:min-h-full lg:border-t-0 lg:border-l">
          <iframe
            title={t.ourStore.mapTitle}
            src={mapsEmbedUrl}
            width={800}
            height={450}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-full min-h-[340px] w-full border-0"
          />
        </div>
      </div>
    </section>
  );
}
