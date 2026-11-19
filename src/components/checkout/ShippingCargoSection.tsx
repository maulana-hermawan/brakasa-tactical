import React from 'react';
import type {
  ShippingClass,
  ShippingCourierCode,
  ShippingSettings,
  ShippingZoneCode,
} from '../../../shared/types';
import { useLanguage } from '../../context/LanguageContext';
import {
  getLocalizedCourierCopy,
  getLocalizedZoneLabel,
  getStoreCopy,
} from '../../i18n/store';
import { formatIdr, formatWeight, getShippingClassLabel } from '../../lib/format';
import { Badge } from '../ui/Badge';
import { IconAlertOctagon, IconTruck } from '../ui/TacticalIcons';

export interface ShippingCargoSectionProps {
  combinedShippingClass: ShippingClass;
  totalWeightGrams: number;
  shippingSettings: ShippingSettings;
  selectedZone: ShippingZoneCode;
  selectedCourier: ShippingCourierCode;
  woodenPacking: boolean;
  onZoneChange: (zone: ShippingZoneCode) => void;
  onCourierChange: (courier: ShippingCourierCode) => void;
  onWoodenPackingChange: (enabled: boolean) => void;
  estimateCourierShipping: (
    courierCode: ShippingCourierCode,
    zoneCode: ShippingZoneCode,
  ) => { costIdr: number; chargeableKg: number; allowed: boolean };
  errors: Record<string, string>;
}

export function ShippingCargoSection({
  combinedShippingClass,
  totalWeightGrams,
  shippingSettings,
  selectedZone,
  selectedCourier,
  woodenPacking,
  onZoneChange,
  onCourierChange,
  onWoodenPackingChange,
  estimateCourierShipping,
  errors,
}: ShippingCargoSectionProps): React.JSX.Element {
  const { lang } = useLanguage();
  const { checkout } = getStoreCopy(lang);

  const isPickupSelected = selectedCourier === 'ARMORY_PICKUP';
  const recommendWoodenPacking =
    combinedShippingClass === 'CARGO_REPLICA' || combinedShippingClass === 'CARGO_GAS';
  const shippingClassLabel = getShippingClassLabel(combinedShippingClass, lang);

  return (
    <section
      aria-labelledby="checkout-shipping-heading"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: errors.shippingCourier ? 'var(--status-danger)' : 'var(--border-subtle)',
        borderRadius: 'var(--radius-plate)',
      }}
      className="flex flex-col gap-5 border p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        <h2
          id="checkout-shipping-heading"
          className="m-0 font-display text-xl font-bold tracking-wide uppercase"
        >
          {checkout.shippingHeading}
        </h2>
        <Badge
          variant={combinedShippingClass === 'REGULAR' ? 'neutral' : 'warn'}
          icon={<IconTruck size={13} />}
        >
          {shippingClassLabel}
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="checkout-shipping-zone"
          style={{ color: 'var(--text-primary)' }}
          className="text-sm font-semibold"
        >
          {checkout.zoneLabel} <span style={{ color: 'var(--status-danger)' }}>*</span>
        </label>
        <select
          id="checkout-shipping-zone"
          name="shippingZone"
          value={selectedZone}
          onChange={(e) => onZoneChange(e.target.value as ShippingZoneCode)}
          className="input-brakasa min-h-[48px]"
        >
          {shippingSettings.zoneRates.map((zr) => (
            <option key={zr.zone} value={zr.zone}>
              {getLocalizedZoneLabel(zr.zone, zr.label, lang)}
            </option>
          ))}
        </select>
        <p style={{ color: 'var(--text-muted)' }} className="m-0 font-mono-tech text-xs tabular-nums">
          {checkout.totalWeightLabel(formatWeight(totalWeightGrams, lang))}
        </p>
      </div>

      <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
        <legend
          style={{ color: 'var(--text-primary)' }}
          className="mb-1.5 p-0 text-sm font-semibold"
        >
          {checkout.courierLegend} <span style={{ color: 'var(--status-danger)' }}>*</span>
        </legend>

        <div className="flex flex-col gap-2.5">
          {shippingSettings.couriers.map((courier) => {
            const estimate = estimateCourierShipping(courier.code, selectedZone);
            const isSelected = selectedCourier === courier.code && estimate.allowed;
            const isLocked = !estimate.allowed;
            const localizedCourier = getLocalizedCourierCopy(courier, lang);

            return (
              <label
                key={courier.code}
                htmlFor={`courier-${courier.code}`}
                aria-disabled={isLocked}
                style={{
                  backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-canvas)',
                  borderColor: isSelected
                    ? 'var(--accent-primary)'
                    : isLocked
                      ? 'var(--border-subtle)'
                      : 'var(--border-strong)',
                  borderRadius: 'var(--radius-control)',
                }}
                className={`flex min-h-[60px] flex-col justify-between gap-2 border p-3.5 sm:flex-row sm:items-center ${
                  isLocked ? 'opacity-60' : ''
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <input
                    id={`courier-${courier.code}`}
                    type="radio"
                    name="shippingCourier"
                    value={courier.code}
                    checked={isSelected}
                    disabled={isLocked}
                    onChange={() => onCourierChange(courier.code)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-primary)]"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        style={{ color: 'var(--text-primary)' }}
                        className="text-sm font-semibold"
                      >
                        {localizedCourier.name}
                      </span>
                      {isLocked ? (
                        <Badge variant="danger">{checkout.unavailableBadge}</Badge>
                      ) : courier.isPickup ? (
                        <Badge variant="olive">{checkout.freeBadge}</Badge>
                      ) : (
                        <Badge variant="ok">{checkout.availableBadge}</Badge>
                      )}
                    </div>
                    <p
                      style={{ color: 'var(--text-secondary)' }}
                      className="mt-0.5 mb-0 text-xs leading-snug"
                    >
                      {isLocked
                        ? checkout.courierLockedReason(shippingClassLabel)
                        : localizedCourier.description}
                    </p>
                    <p
                      style={{ color: 'var(--text-muted)' }}
                      className="mt-1 mb-0 font-mono-tech text-[11px] tabular-nums"
                    >
                      {checkout.etaPrefix} {localizedCourier.etaDays}
                      {!isLocked && !courier.isPickup
                        ? ` | ${checkout.chargeableWeightMeta(estimate.chargeableKg, courier.minChargeableKg)}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-7 sm:pl-0 sm:text-right">
                  {isLocked ? (
                    <span
                      style={{ color: 'var(--text-muted)' }}
                      className="font-mono-tech text-xs uppercase"
                    >
                      {checkout.unavailableBadge}
                    </span>
                  ) : (
                    <span
                      style={{ color: 'var(--text-primary)' }}
                      className="font-mono-tech text-sm font-semibold tabular-nums"
                    >
                      {courier.isPickup ? 'Rp 0' : formatIdr(estimate.costIdr)}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {errors.shippingCourier ? (
          <p
            role="alert"
            style={{ color: 'var(--status-danger)' }}
            className="m-0 flex items-start gap-1.5 text-xs font-medium"
          >
            <IconAlertOctagon size={14} className="mt-0.5 shrink-0" />
            <span>{errors.shippingCourier}</span>
          </p>
        ) : null}
      </fieldset>

      <div
        style={{
          backgroundColor: 'var(--bg-canvas)',
          borderColor:
            woodenPacking && !isPickupSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
          borderRadius: 'var(--radius-plate)',
        }}
        className="border p-4"
      >
        <label
          htmlFor="checkout-wooden-packing"
          aria-disabled={isPickupSelected}
          className="flex min-h-[48px] items-start justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <input
              id="checkout-wooden-packing"
              type="checkbox"
              checked={woodenPacking && !isPickupSelected}
              disabled={isPickupSelected}
              onChange={(e) => onWoodenPackingChange(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-primary)]"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">
                  {checkout.woodenPackingTitle}
                </span>
                {recommendWoodenPacking && !isPickupSelected ? (
                  <Badge variant="olive">{checkout.woodenPackingRecommended}</Badge>
                ) : null}
              </div>
              <p style={{ color: 'var(--text-secondary)' }} className="mt-1 mb-0 text-xs leading-snug">
                {isPickupSelected
                  ? checkout.woodenPackingPickupNote
                  : checkout.woodenPackingDesc}
              </p>
            </div>
          </div>
          <span
            style={{ color: 'var(--text-primary)' }}
            className="shrink-0 font-mono-tech text-sm font-semibold tabular-nums"
          >
            {isPickupSelected ? 'Rp 0' : `+${formatIdr(shippingSettings.woodenPackingFeeIdr)}`}
          </span>
        </label>
      </div>
    </section>
  );
}
