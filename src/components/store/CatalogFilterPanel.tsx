import React from 'react';
import {
  MISSION_TAGS,
  PLATFORM_TYPES,
  PROPULSION_TYPES,
  type CategoryWithCount,
  type MissionTag,
  type PlatformType,
  type ProductFilterFacets,
  type ProductSortOption,
  type PropulsionType,
} from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';
import { getStoreCopy } from '../../i18n/store';
import { IconVideo } from '../ui/TacticalIcons';

export interface CatalogFilterValues {
  q: string;
  category: string;
  mission: MissionTag | '';
  platform: PlatformType | '';
  propulsion: PropulsionType | '';
  minFps: string;
  maxFps: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  hasVideo: boolean;
  sort: ProductSortOption;
}

export interface CatalogFilterPanelProps {
  values: CatalogFilterValues;
  categories: CategoryWithCount[];
  facets: ProductFilterFacets | null;
  activeFilterCount: number;
  onChange: (patch: Partial<CatalogFilterValues>) => void;
  onReset: () => void;
  idPrefix: string;
  showSortControl?: boolean;
  hideHeading?: boolean;
}

export function CatalogFilterPanel({
  values,
  categories,
  facets,
  activeFilterCount,
  onChange,
  onReset,
  idPrefix,
  showSortControl = false,
  hideHeading = false,
}: CatalogFilterPanelProps): React.JSX.Element {
  const { lang, getCategoryName } = useLanguage();
  const { filters } = getStoreCopy(lang);

  const categoryItems =
    facets && facets.categories.length > 0
      ? facets.categories
      : categories.map((c) => ({ slug: c.slug, name: c.name, count: c.activeProductCount }));

  const platformCountMap = new Map<PlatformType, number>();
  if (facets) {
    for (const item of facets.platforms) {
      platformCountMap.set(item.value, item.count);
    }
  }

  const propulsionCountMap = new Map<PropulsionType, number>();
  if (facets) {
    for (const item of facets.propulsions) {
      propulsionCountMap.set(item.value, item.count);
    }
  }

  const isCqbPreset = values.maxFps === '350' && !values.minFps;
  const isOutdoorPreset = values.minFps === '351' && values.maxFps === '420';
  const isSniperPreset = values.minFps === '401' && values.maxFps === '463';

  return (
    <div className="flex flex-col gap-5">
      {!hideHeading ? (
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <h2 className="m-0 font-display text-lg font-bold tracking-wide uppercase">
            {filters.heading}
          </h2>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onReset}
              style={{ color: 'var(--accent-text)' }}
              className="min-h-[44px] border-0 bg-transparent px-2 font-mono-tech text-xs font-semibold underline-offset-4 hover:underline"
            >
              {filters.reset(activeFilterCount)}
            </button>
          ) : null}
        </div>
      ) : null}

      {showSortControl ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${idPrefix}-sort`}
            style={{ color: 'var(--text-primary)' }}
            className="text-xs font-semibold tracking-wide uppercase"
          >
            {filters.sortLabel}
          </label>
          <select
            id={`${idPrefix}-sort`}
            value={values.sort}
            onChange={(e) => onChange({ sort: e.target.value as ProductSortOption })}
            className="input-brakasa"
          >
            {filters.sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-category`}
          style={{ color: 'var(--text-primary)' }}
          className="text-xs font-semibold tracking-wide uppercase"
        >
          {filters.categoryLabel}
        </label>
        <select
          id={`${idPrefix}-category`}
          value={values.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="input-brakasa"
        >
          <option value="">{filters.allCategories}</option>
          {categoryItems.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {getCategoryName(cat.slug, cat.name)} ({cat.count})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-mission`}
          style={{ color: 'var(--text-primary)' }}
          className="text-xs font-semibold tracking-wide uppercase"
        >
          {filters.missionLabel}
        </label>
        <select
          id={`${idPrefix}-mission`}
          value={values.mission}
          onChange={(e) => onChange({ mission: e.target.value as MissionTag | '' })}
          className="input-brakasa"
        >
          <option value="">{filters.allMissions}</option>
          {MISSION_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {filters.missionLabels[tag]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-platform`}
          style={{ color: 'var(--text-primary)' }}
          className="text-xs font-semibold tracking-wide uppercase"
        >
          {filters.platformLabel}
        </label>
        <select
          id={`${idPrefix}-platform`}
          value={values.platform}
          onChange={(e) => onChange({ platform: e.target.value as PlatformType | '' })}
          className="input-brakasa"
        >
          <option value="">{filters.allPlatforms}</option>
          {PLATFORM_TYPES.map((platform) => {
            const count = platformCountMap.get(platform);
            return (
              <option key={platform} value={platform}>
                {filters.platformLabels[platform]}
                {count !== undefined ? ` (${count})` : ''}
              </option>
            );
          })}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-propulsion`}
          style={{ color: 'var(--text-primary)' }}
          className="text-xs font-semibold tracking-wide uppercase"
        >
          {filters.propulsionLabel}
        </label>
        <select
          id={`${idPrefix}-propulsion`}
          value={values.propulsion}
          onChange={(e) => onChange({ propulsion: e.target.value as PropulsionType | '' })}
          className="input-brakasa"
        >
          <option value="">{filters.allPropulsions}</option>
          {PROPULSION_TYPES.map((prop) => {
            const count = propulsionCountMap.get(prop);
            return (
              <option key={prop} value={prop}>
                {filters.propulsionLabels[prop]}
                {count !== undefined ? ` (${count})` : ''}
              </option>
            );
          })}
        </select>
      </div>

      <fieldset
        style={{ borderColor: 'var(--border-subtle)' }}
        className="m-0 flex flex-col gap-2.5 border-t pt-4"
      >
        <legend
          style={{ color: 'var(--text-primary)' }}
          className="mb-1 p-0 text-xs font-semibold tracking-wide uppercase"
        >
          {filters.fpsLegend}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${idPrefix}-min-fps`}
              style={{ color: 'var(--text-muted)' }}
              className="font-mono-tech text-[11px]"
            >
              {filters.fpsMinLabel}
            </label>
            <input
              id={`${idPrefix}-min-fps`}
              type="number"
              inputMode="numeric"
              min={0}
              max={500}
              placeholder={filters.fpsMinPlaceholder}
              value={values.minFps}
              onChange={(e) => onChange({ minFps: e.target.value })}
              className="input-brakasa font-mono-tech text-sm tabular-nums"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${idPrefix}-max-fps`}
              style={{ color: 'var(--text-muted)' }}
              className="font-mono-tech text-[11px]"
            >
              {filters.fpsMaxLabel}
            </label>
            <input
              id={`${idPrefix}-max-fps`}
              type="number"
              inputMode="numeric"
              min={0}
              max={500}
              placeholder={filters.fpsMaxPlaceholder}
              value={values.maxFps}
              onChange={(e) => onChange({ maxFps: e.target.value })}
              className="input-brakasa font-mono-tech text-sm tabular-nums"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ minFps: '', maxFps: '350' })}
            aria-pressed={isCqbPreset}
            style={{
              backgroundColor: isCqbPreset ? 'var(--brand-olive-surface)' : 'var(--bg-elevated)',
              borderColor: isCqbPreset ? 'var(--brand-olive)' : 'var(--border-subtle)',
              color: isCqbPreset ? 'var(--brand-olive-tag-text)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-control)',
            }}
            className="min-h-[44px] border px-2.5 font-mono-tech text-xs font-medium"
          >
            {filters.fpsPresetCqb}
          </button>
          <button
            type="button"
            onClick={() => onChange({ minFps: '351', maxFps: '420' })}
            aria-pressed={isOutdoorPreset}
            style={{
              backgroundColor: isOutdoorPreset ? 'var(--brand-olive-surface)' : 'var(--bg-elevated)',
              borderColor: isOutdoorPreset ? 'var(--brand-olive)' : 'var(--border-subtle)',
              color: isOutdoorPreset ? 'var(--brand-olive-tag-text)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-control)',
            }}
            className="min-h-[44px] border px-2.5 font-mono-tech text-xs font-medium"
          >
            {filters.fpsPresetOutdoor}
          </button>
          <button
            type="button"
            onClick={() => onChange({ minFps: '401', maxFps: '463' })}
            aria-pressed={isSniperPreset}
            style={{
              backgroundColor: isSniperPreset ? 'var(--brand-olive-surface)' : 'var(--bg-elevated)',
              borderColor: isSniperPreset ? 'var(--brand-olive)' : 'var(--border-subtle)',
              color: isSniperPreset ? 'var(--brand-olive-tag-text)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-control)',
            }}
            className="min-h-[44px] border px-2.5 font-mono-tech text-xs font-medium"
          >
            {filters.fpsPresetSniper}
          </button>
        </div>
      </fieldset>

      <fieldset
        style={{ borderColor: 'var(--border-subtle)' }}
        className="m-0 flex flex-col gap-2.5 border-t pt-4"
      >
        <legend
          style={{ color: 'var(--text-primary)' }}
          className="mb-1 p-0 text-xs font-semibold tracking-wide uppercase"
        >
          {filters.priceLegend}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${idPrefix}-min-price`}
              style={{ color: 'var(--text-muted)' }}
              className="font-mono-tech text-[11px]"
            >
              {filters.priceMinLabel}
            </label>
            <input
              id={`${idPrefix}-min-price`}
              type="number"
              inputMode="numeric"
              min={0}
              step={100000}
              placeholder="0"
              value={values.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
              className="input-brakasa font-mono-tech text-sm tabular-nums"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${idPrefix}-max-price`}
              style={{ color: 'var(--text-muted)' }}
              className="font-mono-tech text-[11px]"
            >
              {filters.priceMaxLabel}
            </label>
            <input
              id={`${idPrefix}-max-price`}
              type="number"
              inputMode="numeric"
              min={0}
              step={100000}
              placeholder="20000000"
              value={values.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
              className="input-brakasa font-mono-tech text-sm tabular-nums"
            />
          </div>
        </div>
      </fieldset>

      <fieldset
        style={{ borderColor: 'var(--border-subtle)' }}
        className="m-0 flex flex-col gap-2 border-t pt-4"
      >
        <legend
          style={{ color: 'var(--text-primary)' }}
          className="mb-1 p-0 text-xs font-semibold tracking-wide uppercase"
        >
          {filters.availabilityLegend}
        </legend>

        <label
          htmlFor={`${idPrefix}-instock`}
          style={{
            backgroundColor: values.inStock ? 'var(--bg-elevated)' : 'transparent',
            borderColor: values.inStock ? 'var(--border-strong)' : 'var(--border-subtle)',
            borderRadius: 'var(--radius-control)',
          }}
          className="flex min-h-[44px] items-center gap-3 border px-3 py-2 text-sm"
        >
          <input
            id={`${idPrefix}-instock`}
            type="checkbox"
            checked={values.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked })}
            className="h-4 w-4 shrink-0 accent-[var(--accent-primary)]"
          />
          <span style={{ color: 'var(--text-primary)' }} className="flex-1">
            {filters.inStockOnly}
          </span>
          {facets ? (
            <span
              style={{ color: 'var(--text-muted)' }}
              className="font-mono-tech text-xs tabular-nums"
            >
              ({facets.inStockCount})
            </span>
          ) : null}
        </label>

        <label
          htmlFor={`${idPrefix}-hasvideo`}
          style={{
            backgroundColor: values.hasVideo ? 'var(--bg-elevated)' : 'transparent',
            borderColor: values.hasVideo ? 'var(--border-strong)' : 'var(--border-subtle)',
            borderRadius: 'var(--radius-control)',
          }}
          className="flex min-h-[44px] items-center gap-3 border px-3 py-2 text-sm"
        >
          <input
            id={`${idPrefix}-hasvideo`}
            type="checkbox"
            checked={values.hasVideo}
            onChange={(e) => onChange({ hasVideo: e.target.checked })}
            className="h-4 w-4 shrink-0 accent-[var(--accent-primary)]"
          />
          <span
            style={{ color: 'var(--text-primary)' }}
            className="inline-flex flex-1 items-center gap-1.5"
          >
            <IconVideo size={15} />
            <span>{filters.hasVideoOnly}</span>
          </span>
          {facets ? (
            <span
              style={{ color: 'var(--text-muted)' }}
              className="font-mono-tech text-xs tabular-nums"
            >
              ({facets.withVideoCount})
            </span>
          ) : null}
        </label>
      </fieldset>
    </div>
  );
}
