import React from 'react';
import type { ProductDetail } from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';
import { getStoreCopy, localizeSpecValue } from '../../i18n/store';
import { formatWeight, getShippingClassLabel } from '../../lib/format';

export interface SpecSheetTableProps {
  product: ProductDetail;
}

export function SpecSheetTable({ product }: SpecSheetTableProps): React.JSX.Element {
  const { lang, getCategoryName } = useLanguage();
  const copy = getStoreCopy(lang);
  const { specs: specCopy, filters: filterCopy } = copy;
  const { specs } = product;

  const rows: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: specCopy.labels.sku, value: product.sku, mono: true },
    { label: specCopy.labels.brand, value: product.brand },
    {
      label: specCopy.labels.category,
      value: getCategoryName(product.categorySlug, product.categoryName),
    },
    {
      label: specCopy.labels.platform,
      value: filterCopy.platformLabels[product.platform] || product.platform,
    },
    {
      label: specCopy.labels.propulsion,
      value: filterCopy.propulsionLabels[product.propulsion] || product.propulsion,
    },
  ];

  if (product.fpsMin !== null || product.fpsMax !== null) {
    const bbTest = specs.fps_test_bb_gram ?? 0.2;
    const fpsText =
      product.fpsMin !== null && product.fpsMax !== null
        ? `${product.fpsMin} - ${product.fpsMax} FPS (@ ${bbTest.toFixed(2)} g BB)`
        : `${product.fpsMax ?? product.fpsMin} FPS (@ ${bbTest.toFixed(2)} g BB)`;
    rows.push({ label: specCopy.labels.chronographVelocity, value: fpsText, mono: true });
  }

  if (product.energyJoule !== null) {
    rows.push({
      label: specCopy.labels.kineticEnergy,
      value: `${product.energyJoule.toFixed(2)} Joule`,
      mono: true,
    });
  }

  if (specs.field_role) {
    rows.push({
      label: specCopy.labels.fieldClass,
      value: specCopy.fieldRoles[specs.field_role] ?? specs.field_role,
    });
  }

  if (specs.gearbox_or_system) {
    rows.push({
      label: specCopy.labels.gearboxOrSystem,
      value: localizeSpecValue(specs.gearbox_or_system, lang),
    });
  }
  if (specs.fire_modes && specs.fire_modes.length > 0) {
    rows.push({ label: specCopy.labels.fireModes, value: specs.fire_modes.join(' / ') });
  }
  if (specs.hop_up) {
    rows.push({ label: specCopy.labels.hopUp, value: specs.hop_up });
  }
  if (specs.inner_barrel) {
    rows.push({ label: specCopy.labels.innerBarrel, value: specs.inner_barrel, mono: true });
  }
  if (specs.magazine_capacity_rds) {
    rows.push({
      label: specCopy.labels.magazineCapacity,
      value: specCopy.roundsUnit(specs.magazine_capacity_rds),
      mono: true,
    });
  }

  if (specs.connector && specs.connector !== 'NONE') {
    rows.push({
      label: specCopy.labels.batteryConnector,
      value: specCopy.connectors[specs.connector] ?? specs.connector,
      mono: true,
    });
  }
  if (specs.has_mosfet !== null && specs.has_mosfet !== undefined) {
    rows.push({
      label: specCopy.labels.mosfetEtu,
      value: specs.has_mosfet ? specCopy.mosfetYes : specCopy.mosfetNo,
    });
  }
  if (specs.battery_voltage_rec) {
    rows.push({
      label: specCopy.labels.batteryRecommendation,
      value: localizeSpecValue(specs.battery_voltage_rec, lang),
      mono: true,
    });
  }
  if (specs.battery_form_factor && specs.battery_form_factor !== 'NONE') {
    rows.push({
      label: specCopy.labels.batteryFormFactor,
      value: specCopy.formFactors[specs.battery_form_factor] ?? specs.battery_form_factor,
    });
  }
  if (specs.gas_type && specs.gas_type !== 'NONE') {
    rows.push({
      label: specCopy.labels.gasType,
      value: specCopy.gasTypes[specs.gas_type] ?? specs.gas_type,
    });
  }
  if (specs.muzzle_thread && specs.muzzle_thread !== 'NONE') {
    rows.push({
      label: specCopy.labels.muzzleThread,
      value: specCopy.muzzleThreads[specs.muzzle_thread] ?? specs.muzzle_thread,
      mono: true,
    });
  }

  const validRails = (specs.rail_type || []).filter(
    (r): r is Exclude<typeof r, 'NONE'> => r !== 'NONE',
  );
  if (validRails.length > 0) {
    rows.push({
      label: specCopy.labels.railMounting,
      value: validRails.map((r) => specCopy.rails[r] ?? r).join(', '),
    });
  }

  if (specs.optic_magnification) {
    rows.push({
      label: specCopy.labels.opticMagnification,
      value: specs.optic_magnification,
      mono: true,
    });
  }
  if (specs.optic_mount && specs.optic_mount !== 'NONE') {
    rows.push({
      label: specCopy.labels.opticMount,
      value: specCopy.rails[specs.optic_mount] ?? specs.optic_mount,
    });
  }
  if (specs.material) {
    rows.push({
      label: specCopy.labels.material,
      value: localizeSpecValue(specs.material, lang),
    });
  }
  if (specs.cordura_denier && specs.cordura_denier !== 'NONE') {
    rows.push({
      label: specCopy.labels.textileSpec,
      value: specCopy.cordura[specs.cordura_denier] ?? specs.cordura_denier,
    });
  }
  if (specs.bb_weight_gram) {
    rows.push({
      label: specCopy.labels.bbWeight,
      value: `${specs.bb_weight_gram.toFixed(2)} g`,
      mono: true,
    });
  }
  if (specs.bb_weight_rec) {
    rows.push({
      label: specCopy.labels.recommendedBbWeight,
      value: specs.bb_weight_rec,
      mono: true,
    });
  }
  if (specs.dimensions_mm) {
    rows.push({
      label: specCopy.labels.dimensions,
      value: localizeSpecValue(specs.dimensions_mm, lang),
      mono: true,
    });
  }
  if (specs.safety_certification) {
    rows.push({
      label: specCopy.labels.certification,
      value: localizeSpecValue(specs.safety_certification, lang),
    });
  }
  if (specs.color_options && specs.color_options.length > 0) {
    rows.push({
      label: specCopy.labels.colorOptions,
      value: specs.color_options.join(', '),
    });
  }

  rows.push({
    label: specCopy.labels.netWeight,
    value: formatWeight(product.weightGrams, lang),
    mono: true,
  });
  rows.push({
    label: specCopy.labels.shippingClass,
    value: getShippingClassLabel(product.shippingClass, lang),
  });

  if (specs.extra) {
    for (const [k, v] of Object.entries(specs.extra)) {
      if (v === undefined || v === null || v === '') continue;
      rows.push({
        label: k.replace(/_/g, ' '),
        value: typeof v === 'boolean' ? (v ? specCopy.yes : specCopy.no) : String(v),
      });
    }
  }

  return (
    <div
      style={{
        borderColor: 'var(--border-subtle)',
        borderRadius: 'var(--radius-plate)',
      }}
      className="w-full overflow-x-auto border"
    >
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only-brakasa">{specCopy.caption(product.name)}</caption>
        <thead>
          <tr
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
            className="border-b"
          >
            <th
              scope="col"
              style={{ color: 'var(--text-muted)' }}
              className="w-[38%] min-w-[150px] px-4 py-3 font-mono-tech text-xs font-semibold tracking-wider uppercase"
            >
              {specCopy.paramHeader}
            </th>
            <th
              scope="col"
              style={{ color: 'var(--text-muted)' }}
              className="px-4 py-3 font-mono-tech text-xs font-semibold tracking-wider uppercase"
            >
              {specCopy.valueHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${row.label}-${index}`}
              style={{
                backgroundColor: index % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
              className="border-b last:border-b-0"
            >
              <th
                scope="row"
                style={{ color: 'var(--text-secondary)' }}
                className="px-4 py-3 align-top font-medium"
              >
                {row.label}
              </th>
              <td
                style={{ color: 'var(--text-primary)' }}
                className={`px-4 py-3 align-top ${row.mono ? 'font-mono-tech tabular-nums' : ''}`}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
