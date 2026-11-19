import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdminSettingsResponse,
  AdminSettingsUpdateRequest,
  HeroSlideConfig,
  MediaLibraryAsset,
  SiteSettingsBundle,
} from '../../../shared/types';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { ErrorState, LoadingState } from '../../components/ui/StateViews';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useBootstrap } from '../../context/BootstrapContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminCopy } from '../../i18n/admin';
import {
  DEFAULT_HERO_SLIDES,
  DEFAULT_STORE_MAPS_DIRECTIONS_URL,
  DEFAULT_STORE_MAPS_EMBED_URL,
} from '../../i18n/common';
import { ApiRequestError, apiFetch } from '../../lib/api';
import { formatDateTimeId } from '../../lib/format';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type SettingsTabId = 'profile' | 'hero' | 'shipping';

type SettingsMediaPickerTarget =
  | { open: false }
  | { open: true; slideIndex: number };

const MAX_HERO_SLIDES = 8;

function isSafeHttpsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeLoadedSettings(raw: SiteSettingsBundle): SiteSettingsBundle {
  const slides: HeroSlideConfig[] =
    Array.isArray(raw.heroSlides) && raw.heroSlides.length > 0
      ? [...raw.heroSlides]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((slide, idx) => ({
            ...slide,
            sortOrder: idx + 1,
          }))
      : DEFAULT_HERO_SLIDES.map((s) => ({ ...s }));

  return {
    ...raw,
    armoryProfile: {
      ...raw.armoryProfile,
      operatingHoursEn: raw.armoryProfile.operatingHoursEn ?? '',
      mapsEmbedUrl: raw.armoryProfile.mapsEmbedUrl ?? DEFAULT_STORE_MAPS_EMBED_URL,
      mapsDirectionsUrl: raw.armoryProfile.mapsDirectionsUrl ?? DEFAULT_STORE_MAPS_DIRECTIONS_URL,
      announcementEnabled: false,
      announcementText: '',
      complianceNoticeShort: '',
    },
    heroSlides: slides,
  };
}

export function AdminSettingsPage(): React.JSX.Element {
  const { lang } = useLanguage();
  const copy = useMemo(() => getAdminCopy(lang), [lang]);
  useDocumentTitle(copy.settings.docTitle);

  const { refresh: refreshAuth } = useAdminAuth();
  const { reload: reloadBootstrap } = useBootstrap();

  const settingsTabs = useMemo<readonly { id: SettingsTabId; label: string }[]>(
    () => [
      { id: 'profile', label: copy.settings.tabProfile },
      { id: 'hero', label: copy.settings.tabHero },
      { id: 'shipping', label: copy.settings.tabShipping },
    ],
    [copy],
  );

  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');
  const [settings, setSettings] = useState<SiteSettingsBundle | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [mediaPicker, setMediaPicker] = useState<SettingsMediaPickerTarget>({ open: false });

  const tabRefs = useRef<Record<SettingsTabId, HTMLButtonElement | null>>({
    profile: null,
    hero: null,
    shipping: null,
  });

  const loadSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<AdminSettingsResponse>('/api/admin/settings');
      setSettings(normalizeLoadedSettings(response.settings));
      setUpdatedAt(response.updatedAt);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        await refreshAuth();
        return;
      }
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(copy.settings.errorFallback);
      }
    } finally {
      setLoading(false);
    }
  }, [refreshAuth, copy.settings.errorFallback]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, idx: number): void => {
    let nextIdx = idx;
    if (event.key === 'ArrowRight') nextIdx = (idx + 1) % settingsTabs.length;
    else if (event.key === 'ArrowLeft')
      nextIdx = (idx - 1 + settingsTabs.length) % settingsTabs.length;
    else if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = settingsTabs.length - 1;
    else return;

    event.preventDefault();
    const target = settingsTabs[nextIdx];
    setActiveTab(target.id);
    tabRefs.current[target.id]?.focus();
  };

  const handleMediaSelect = (asset: MediaLibraryAsset): void => {
    if (!settings || !mediaPicker.open) return;
    const targetIdx = mediaPicker.slideIndex;
    setSettings({
      ...settings,
      heroSlides: settings.heroSlides.map((slide, sIdx) =>
        sIdx === targetIdx ? { ...slide, imageUrl: asset.url } : slide,
      ),
    });
  };

  const updateHeroSlide = (idx: number, patch: Partial<HeroSlideConfig>): void => {
    if (!settings) return;
    setSettings({
      ...settings,
      heroSlides: settings.heroSlides.map((slide, sIdx) =>
        sIdx === idx ? { ...slide, ...patch } : slide,
      ),
    });
  };

  const moveHeroSlide = (idx: number, delta: -1 | 1): void => {
    if (!settings) return;
    const target = idx + delta;
    if (target < 0 || target >= settings.heroSlides.length) return;
    const copySlides = [...settings.heroSlides];
    const tmp = copySlides[idx];
    copySlides[idx] = copySlides[target];
    copySlides[target] = tmp;
    const reindexed = copySlides.map((slide, i) => ({
      ...slide,
      sortOrder: i + 1,
    }));
    setSettings({ ...settings, heroSlides: reindexed });
  };

  const addHeroSlide = (): void => {
    if (!settings || settings.heroSlides.length >= MAX_HERO_SLIDES) return;
    const nextNum = settings.heroSlides.length + 1;
    const fallbackImg =
      DEFAULT_HERO_SLIDES[(nextNum - 1) % DEFAULT_HERO_SLIDES.length]?.imageUrl ??
      '/media/images/hero/hero-scene-01.jpg';
    const newSlide: HeroSlideConfig = {
      id: `hero-slide-${Date.now()}-${nextNum}`,
      imageUrl: fallbackImg,
      altId: copy.settings.newSlideHeadlineId(nextNum),
      altEn: copy.settings.newSlideHeadlineEn(nextNum),
      headlineId: copy.settings.newSlideHeadlineId(nextNum),
      headlineEn: copy.settings.newSlideHeadlineEn(nextNum),
      ctaLabelId: copy.settings.newSlideCtaId,
      ctaLabelEn: copy.settings.newSlideCtaEn,
      ctaUrl: '/store',
      sortOrder: nextNum,
    };
    setSettings({
      ...settings,
      heroSlides: [...settings.heroSlides, newSlide],
    });
  };

  const removeHeroSlide = (idx: number): void => {
    if (!settings || settings.heroSlides.length <= 1) return;
    const filtered = settings.heroSlides
      .filter((_, sIdx) => sIdx !== idx)
      .map((slide, i) => ({
        ...slide,
        sortOrder: i + 1,
      }));
    setSettings({ ...settings, heroSlides: filtered });
  };

  const handleSaveSettings = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!settings) return;

    setSaveError(null);
    setSaveSuccess(null);

    const prof = settings.armoryProfile;
    if (
      !prof.storeName.trim() ||
      !prof.address.trim() ||
      !prof.city.trim() ||
      !prof.operatingHours.trim() ||
      !prof.whatsappNumber.trim() ||
      !prof.supportEmail.trim()
    ) {
      setActiveTab('profile');
      setSaveError(copy.settings.errProfileRequired);
      return;
    }

    const trimmedEmbed = (prof.mapsEmbedUrl ?? '').trim();
    const trimmedDirections = (prof.mapsDirectionsUrl ?? '').trim();
    if (
      (trimmedEmbed !== '' && !isSafeHttpsUrl(trimmedEmbed)) ||
      (trimmedDirections !== '' && !isSafeHttpsUrl(trimmedDirections))
    ) {
      setActiveTab('profile');
      setSaveError(copy.settings.errMapsHttps);
      return;
    }

    if (settings.heroSlides.length < 1 || settings.heroSlides.length > MAX_HERO_SLIDES) {
      setActiveTab('hero');
      setSaveError(copy.settings.errSlidesRange);
      return;
    }

    for (let i = 0; i < settings.heroSlides.length; i += 1) {
      const slide = settings.heroSlides[i];
      if (
        !slide.imageUrl.trim() ||
        !slide.headlineId.trim() ||
        !slide.headlineEn.trim() ||
        !slide.ctaLabelId.trim() ||
        !slide.ctaLabelEn.trim() ||
        !slide.ctaUrl.trim()
      ) {
        setActiveTab('hero');
        setSaveError(copy.settings.errSlideFields(i + 1));
        return;
      }
    }

    const normalizedSlides: HeroSlideConfig[] = settings.heroSlides.map((slide, idx) => ({
      id: slide.id.trim() || `hero-slide-${idx + 1}`,
      imageUrl: slide.imageUrl.trim(),
      altId: slide.altId.trim() || slide.headlineId.trim(),
      altEn: slide.altEn.trim() || slide.headlineEn.trim(),
      headlineId: slide.headlineId.trim(),
      headlineEn: slide.headlineEn.trim(),
      ctaLabelId: slide.ctaLabelId.trim(),
      ctaLabelEn: slide.ctaLabelEn.trim(),
      ctaUrl: slide.ctaUrl.trim(),
      sortOrder: idx + 1,
    }));

    const payload: AdminSettingsUpdateRequest = {
      armoryProfile: {
        storeName: prof.storeName.trim(),
        tagline: prof.tagline ?? '',
        address: prof.address.trim(),
        city: prof.city.trim(),
        whatsappNumber: prof.whatsappNumber.trim(),
        supportEmail: prof.supportEmail.trim(),
        operatingHours: prof.operatingHours.trim(),
        operatingHoursEn: (prof.operatingHoursEn ?? '').trim(),
        mapsEmbedUrl: trimmedEmbed,
        mapsDirectionsUrl: trimmedDirections,
        announcementEnabled: false,
        announcementText: '',
        complianceNoticeShort: '',
      },
      heroSlides: normalizedSlides,
      shippingSettings: settings.shippingSettings,
      inventoryDefaults: settings.inventoryDefaults,
    };

    setSaving(true);
    try {
      const response = await apiFetch<AdminSettingsResponse>('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setSettings(normalizeLoadedSettings(response.settings));
      setUpdatedAt(response.updatedAt);
      await reloadBootstrap();
      setSaveSuccess(copy.settings.saveSuccess);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setSaveError(err.message);
      } else {
        setSaveError(copy.settings.saveErrorFallback);
      }
    } finally {
      setSaving(false);
    }
  };

  const currentMapsEmbed = (settings?.armoryProfile.mapsEmbedUrl ?? '').trim();
  const hasInvalidEmbed = currentMapsEmbed !== '' && !isSafeHttpsUrl(currentMapsEmbed);
  const previewEmbedUrl =
    currentMapsEmbed !== '' && isSafeHttpsUrl(currentMapsEmbed)
      ? currentMapsEmbed
      : DEFAULT_STORE_MAPS_EMBED_URL;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase leading-none tracking-[0.01em] text-[var(--text-primary)] sm:text-4xl">
            {copy.settings.title}
          </h1>
          {updatedAt && (
            <p className="mt-2 font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-muted)]">
              {copy.settings.lastSaved}: {formatDateTimeId(updatedAt, lang)}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void loadSettings()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 text-sm font-medium text-[var(--text-primary)]"
        >
          {copy.settings.reloadBtn}
        </button>
      </header>

      {saveSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-2 rounded-[2px] border border-[var(--status-ok)] bg-[var(--status-ok-bg)] px-4 py-3 text-sm text-[var(--status-ok)]"
        >
          <span>{saveSuccess}</span>
          <button
            type="button"
            onClick={() => setSaveSuccess(null)}
            className="min-h-[44px] rounded-[4px] border border-[var(--status-ok)] px-3 text-xs font-semibold"
          >
            {copy.common.close}
          </button>
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          className="rounded-[2px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger)]"
        >
          {saveError}
        </div>
      )}

      {loading && !settings ? (
        <LoadingState label={copy.settings.loadingLabel} />
      ) : error && !settings ? (
        <ErrorState
          title={copy.settings.errorTitle}
          message={error}
          onRetry={() => void loadSettings()}
        />
      ) : settings ? (
        <form onSubmit={(e) => void handleSaveSettings(e)} className="space-y-6 pb-16" noValidate>
          {/* ARIA 3-Tab Strip */}
          <div
            role="tablist"
            aria-label={copy.settings.tablistAria}
            className="flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-3"
          >
            {settingsTabs.map((tab, idx) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  id={`settings-tab-${tab.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls={`settings-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={[
                    'min-h-[44px] rounded-[4px] border px-3.5 text-sm transition-colors duration-150',
                    selected
                      ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: STORE PROFILE & MAPS */}
          <section
            id="settings-panel-profile"
            role="tabpanel"
            aria-labelledby="settings-tab-profile"
            hidden={activeTab !== 'profile'}
            className="space-y-6"
          >
            <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-5">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {copy.settings.profileHeading}
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="set-store-name"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    {copy.settings.storeNameLabel}
                  </label>
                  <input
                    id="set-store-name"
                    type="text"
                    required
                    value={settings.armoryProfile.storeName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        armoryProfile: { ...settings.armoryProfile, storeName: e.target.value },
                      })
                    }
                    className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="set-city"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    {copy.settings.cityLabel}
                  </label>
                  <input
                    id="set-city"
                    type="text"
                    required
                    value={settings.armoryProfile.city}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        armoryProfile: { ...settings.armoryProfile, city: e.target.value },
                      })
                    }
                    className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="set-address"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    {copy.settings.addressLabel}
                  </label>
                  <textarea
                    id="set-address"
                    rows={2}
                    required
                    value={settings.armoryProfile.address}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        armoryProfile: { ...settings.armoryProfile, address: e.target.value },
                      })
                    }
                    className="w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] p-3 text-sm text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="set-hours-id"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    {copy.settings.hoursIdLabel}
                  </label>
                  <input
                    id="set-hours-id"
                    type="text"
                    required
                    value={settings.armoryProfile.operatingHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        armoryProfile: {
                          ...settings.armoryProfile,
                          operatingHours: e.target.value,
                        },
                      })
                    }
                    className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="set-hours-en"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    {copy.settings.hoursEnLabel}
                  </label>
                  <input
                    id="set-hours-en"
                    type="text"
                    value={settings.armoryProfile.operatingHoursEn ?? ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        armoryProfile: {
                          ...settings.armoryProfile,
                          operatingHoursEn: e.target.value,
                        },
                      })
                    }
                    placeholder={copy.settings.hoursEnPlaceholder}
                    className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="set-whatsapp"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    {copy.settings.whatsappLabel}
                  </label>
                  <input
                    id="set-whatsapp"
                    type="tel"
                    required
                    value={settings.armoryProfile.whatsappNumber}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        armoryProfile: {
                          ...settings.armoryProfile,
                          whatsappNumber: e.target.value,
                        },
                      })
                    }
                    className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="set-email"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    {copy.settings.emailLabel}
                  </label>
                  <input
                    id="set-email"
                    type="email"
                    required
                    value={settings.armoryProfile.supportEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        armoryProfile: { ...settings.armoryProfile, supportEmail: e.target.value },
                      })
                    }
                    className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Google Maps Configuration & Live Iframe Preview */}
            <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-5">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {copy.settings.mapsHeading}
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label
                    htmlFor="set-maps-embed"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    {copy.settings.mapsEmbedLabel}
                  </label>
                  <input
                    id="set-maps-embed"
                    type="url"
                    value={settings.armoryProfile.mapsEmbedUrl ?? ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        armoryProfile: {
                          ...settings.armoryProfile,
                          mapsEmbedUrl: e.target.value,
                        },
                      })
                    }
                    placeholder={copy.settings.mapsEmbedPlaceholder}
                    className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="set-maps-directions"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    {copy.settings.mapsDirectionsLabel}
                  </label>
                  <input
                    id="set-maps-directions"
                    type="url"
                    value={settings.armoryProfile.mapsDirectionsUrl ?? ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        armoryProfile: {
                          ...settings.armoryProfile,
                          mapsDirectionsUrl: e.target.value,
                        },
                      })
                    }
                    placeholder={copy.settings.mapsDirectionsPlaceholder}
                    className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  />
                </div>

                <div className="space-y-2">
                  <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">
                    {copy.settings.mapsPreviewLabel}
                  </p>
                  {hasInvalidEmbed ? (
                    <div
                      role="alert"
                      className="rounded-[2px] border border-[var(--status-warn)] bg-[var(--status-warn-bg)] px-3.5 py-3 text-xs text-[var(--status-warn)]"
                    >
                      {copy.settings.mapsInvalidWarning}
                    </div>
                  ) : (
                    <div className="aspect-[16/9] max-h-[380px] w-full overflow-hidden rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
                      <iframe
                        title={copy.settings.mapsIframeTitle}
                        src={previewEmbedUrl}
                        width={800}
                        height={450}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        className="block h-full w-full border-0"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* TAB 2: HERO SLIDER (1-8 STATIC IMAGE SLIDES) */}
          <section
            id="settings-panel-hero"
            role="tabpanel"
            aria-labelledby="settings-tab-hero"
            hidden={activeTab !== 'hero'}
            className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {copy.settings.heroHeading(settings.heroSlides.length)}
              </h2>
              <button
                type="button"
                onClick={addHeroSlide}
                disabled={settings.heroSlides.length >= MAX_HERO_SLIDES}
                className="min-h-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
              >
                {copy.settings.addSlideBtn}
              </button>
            </div>

            <div className="space-y-4">
              {settings.heroSlides.map((slide, idx) => (
                <article
                  key={`${slide.id}-${idx}`}
                  className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="rounded-[2px] border border-[var(--accent-primary)] bg-[var(--bg-elevated)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--accent-text)]">
                        {copy.settings.slideLabel(idx + 1)}
                      </span>
                      <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {lang === 'en' ? slide.headlineEn || slide.headlineId : slide.headlineId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveHeroSlide(idx, -1)}
                        disabled={idx === 0}
                        aria-label={copy.settings.moveSlideUpAria(idx + 1)}
                        className="min-h-[44px] min-w-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--text-primary)]"
                      >
                        {copy.common.up}
                      </button>
                      <button
                        type="button"
                        onClick={() => moveHeroSlide(idx, 1)}
                        disabled={idx === settings.heroSlides.length - 1}
                        aria-label={copy.settings.moveSlideDownAria(idx + 1)}
                        className="min-h-[44px] min-w-[44px] rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--text-primary)]"
                      >
                        {copy.common.down}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeHeroSlide(idx)}
                        disabled={settings.heroSlides.length <= 1}
                        aria-label={copy.settings.removeSlideAria(idx + 1)}
                        className="min-h-[44px] rounded-[4px] border border-[var(--status-danger)] bg-[var(--status-danger-bg)] px-3 text-xs font-medium text-[var(--status-danger)]"
                      >
                        {copy.common.delete}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                    <div className="space-y-2">
                      <div className="aspect-video w-full overflow-hidden rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                        <img
                          src={slide.imageUrl}
                          alt={lang === 'en' ? slide.altEn || slide.headlineEn : slide.altId || slide.headlineId}
                          width={320}
                          height={180}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setMediaPicker({ open: true, slideIndex: idx })}
                        className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                      >
                        {copy.settings.choosePhotoBtn}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`slide-image-url-${idx}`}
                          className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
                        >
                          {copy.settings.imageUrlLabel}
                        </label>
                        <input
                          id={`slide-image-url-${idx}`}
                          type="text"
                          required
                          value={slide.imageUrl}
                          onChange={(e) => updateHeroSlide(idx, { imageUrl: e.target.value })}
                          className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 font-[family-name:var(--font-mono)] text-xs text-[var(--text-primary)]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`slide-headline-id-${idx}`}
                          className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
                        >
                          {copy.settings.headlineIdLabel}
                        </label>
                        <input
                          id={`slide-headline-id-${idx}`}
                          type="text"
                          required
                          value={slide.headlineId}
                          onChange={(e) =>
                            updateHeroSlide(idx, {
                              headlineId: e.target.value,
                              altId: e.target.value,
                            })
                          }
                          className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`slide-headline-en-${idx}`}
                          className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
                        >
                          {copy.settings.headlineEnLabel}
                        </label>
                        <input
                          id={`slide-headline-en-${idx}`}
                          type="text"
                          required
                          value={slide.headlineEn}
                          onChange={(e) =>
                            updateHeroSlide(idx, {
                              headlineEn: e.target.value,
                              altEn: e.target.value,
                            })
                          }
                          className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`slide-cta-id-${idx}`}
                          className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
                        >
                          {copy.settings.ctaLabelIdLabel}
                        </label>
                        <input
                          id={`slide-cta-id-${idx}`}
                          type="text"
                          required
                          value={slide.ctaLabelId}
                          onChange={(e) => updateHeroSlide(idx, { ctaLabelId: e.target.value })}
                          className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`slide-cta-en-${idx}`}
                          className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
                        >
                          {copy.settings.ctaLabelEnLabel}
                        </label>
                        <input
                          id={`slide-cta-en-${idx}`}
                          type="text"
                          required
                          value={slide.ctaLabelEn}
                          onChange={(e) => updateHeroSlide(idx, { ctaLabelEn: e.target.value })}
                          className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`slide-cta-url-${idx}`}
                          className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
                        >
                          {copy.settings.ctaUrlLabel}
                        </label>
                        <input
                          id={`slide-cta-url-${idx}`}
                          type="text"
                          required
                          value={slide.ctaUrl}
                          onChange={(e) => updateHeroSlide(idx, { ctaUrl: e.target.value })}
                          placeholder={copy.settings.ctaUrlPlaceholder}
                          className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 font-[family-name:var(--font-mono)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* TAB 3: SHIPPING & INVENTORY */}
          <section
            id="settings-panel-shipping"
            role="tabpanel"
            aria-labelledby="settings-tab-shipping"
            hidden={activeTab !== 'shipping'}
            className="space-y-6"
          >
            <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {copy.settings.shippingDefaultsHeading}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="set-wooden-packing-fee"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    {copy.settings.woodenFeeLabel}
                  </label>
                  <input
                    id="set-wooden-packing-fee"
                    type="number"
                    min={0}
                    step={5000}
                    value={settings.shippingSettings.woodenPackingFeeIdr}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shippingSettings: {
                          ...settings.shippingSettings,
                          woodenPackingFeeIdr: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="set-default-low-stock"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    {copy.settings.lowStockDefaultLabel}
                  </label>
                  <input
                    id="set-default-low-stock"
                    type="number"
                    min={0}
                    step={1}
                    value={settings.inventoryDefaults.defaultLowStockThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        inventoryDefaults: {
                          defaultLowStockThreshold: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="min-h-[44px] w-full rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {copy.settings.zoneRatesHeading}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-[family-name:var(--font-mono)] uppercase text-[var(--text-muted)]">
                      <th className="px-3 py-2.5 font-medium">{copy.settings.colZone}</th>
                      <th className="px-3 py-2.5 font-medium">{copy.settings.colRegularRate}</th>
                      <th className="px-3 py-2.5 font-medium">{copy.settings.colCargoRate}</th>
                      <th className="px-3 py-2.5 font-medium">{copy.settings.colHazmatSurcharge}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {settings.shippingSettings.zoneRates.map((zr, idx) => {
                      const localizedZoneLabel = copy.zones[zr.zone] ?? zr.label;
                      return (
                        <tr key={zr.zone}>
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-[var(--text-primary)]">
                              {localizedZoneLabel}
                            </p>
                            <p className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-muted)]">
                              {zr.zone}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <label htmlFor={`zr-reg-${zr.zone}`} className="sr-only">
                              {copy.settings.zoneRegularAria(localizedZoneLabel)}
                            </label>
                            <input
                              id={`zr-reg-${zr.zone}`}
                              type="number"
                              min={0}
                              step={1000}
                              value={zr.regularPerKgIdr}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  shippingSettings: {
                                    ...settings.shippingSettings,
                                    zoneRates: settings.shippingSettings.zoneRates.map(
                                      (item, zIdx) =>
                                        zIdx === idx
                                          ? { ...item, regularPerKgIdr: Number(e.target.value) || 0 }
                                          : item,
                                    ),
                                  },
                                })
                              }
                              className="min-h-[44px] w-36 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-2.5 font-[family-name:var(--font-mono)] tabular-nums text-[var(--text-primary)]"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <label htmlFor={`zr-cargo-${zr.zone}`} className="sr-only">
                              {copy.settings.zoneCargoAria(localizedZoneLabel)}
                            </label>
                            <input
                              id={`zr-cargo-${zr.zone}`}
                              type="number"
                              min={0}
                              step={1000}
                              value={zr.cargoPerKgIdr}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  shippingSettings: {
                                    ...settings.shippingSettings,
                                    zoneRates: settings.shippingSettings.zoneRates.map(
                                      (item, zIdx) =>
                                        zIdx === idx
                                          ? { ...item, cargoPerKgIdr: Number(e.target.value) || 0 }
                                          : item,
                                    ),
                                  },
                                })
                              }
                              className="min-h-[44px] w-36 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-2.5 font-[family-name:var(--font-mono)] tabular-nums text-[var(--text-primary)]"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <label htmlFor={`zr-hazmat-${zr.zone}`} className="sr-only">
                              {copy.settings.zoneHazmatAria(localizedZoneLabel)}
                            </label>
                            <input
                              id={`zr-hazmat-${zr.zone}`}
                              type="number"
                              min={0}
                              step={1000}
                              value={zr.hazmatSurchargeIdr}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  shippingSettings: {
                                    ...settings.shippingSettings,
                                    zoneRates: settings.shippingSettings.zoneRates.map(
                                      (item, zIdx) =>
                                        zIdx === idx
                                          ? {
                                              ...item,
                                              hazmatSurchargeIdr: Number(e.target.value) || 0,
                                            }
                                          : item,
                                    ),
                                  },
                                })
                              }
                              className="min-h-[44px] w-36 rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-2.5 font-[family-name:var(--font-mono)] tabular-nums text-[var(--text-primary)]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Sticky Save Bar */}
          <div className="sticky bottom-3 z-20 flex justify-end rounded-[4px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[var(--shadow-overlay)]">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] rounded-[4px] bg-[var(--accent-primary)] px-5 text-sm font-semibold text-[var(--accent-foreground)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--text-primary)]"
            >
              {saving ? copy.settings.savingBtn : copy.settings.saveBtn}
            </button>
          </div>
        </form>
      ) : null}

      <MediaPickerModal
        open={mediaPicker.open}
        mediaTypeFilter="image"
        title={
          mediaPicker.open
            ? copy.settings.pickerSlideImageTitle(mediaPicker.slideIndex + 1)
            : copy.mediaPicker.defaultTitle
        }
        onSelect={handleMediaSelect}
        onClose={() => setMediaPicker({ open: false })}
      />
    </div>
  );
}
