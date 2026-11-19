import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  PaymentMethodCode,
  ShippingCourierCode,
  ShippingSettings,
  ShippingZoneCode,
  VoucherValidateResponse,
} from '../../shared/types';
import { OrderSummaryPanel } from '../components/checkout/OrderSummaryPanel';
import { ShippingCargoSection } from '../components/checkout/ShippingCargoSection';
import { Badge } from '../components/ui/Badge';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateViews';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconShieldCheck,
  IconTruck,
} from '../components/ui/TacticalIcons';
import { useBootstrap } from '../context/BootstrapContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getLocalizedCourierNameByCode,
  getLocalizedPaymentInstruction,
  getStoreCopy,
} from '../i18n/store';
import { apiFetch, ApiRequestError } from '../lib/api';
import {
  formatDateTimeId,
  formatIdr,
  getOrderStatusLabel,
  getShippingClassLabel,
} from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const FALLBACK_SHIPPING_SETTINGS: ShippingSettings = {
  woodenPackingFeeIdr: 75000,
  couriers: [
    {
      code: 'JNE_REG',
      name: 'JNE Reguler',
      description: 'Pengiriman reguler khusus aksesoris, optik, apparel, rig, dan BB.',
      etaDays: '1-5 hari kerja',
      allowedClasses: ['REGULAR'],
      baseMultiplier: 1,
      minChargeableKg: 1,
      isPickup: false,
    },
    {
      code: 'SICEPAT_REG',
      name: 'SiCepat Reguler',
      description: 'Pengiriman reguler nasional untuk perlengkapan taktis non-unit.',
      etaDays: '1-5 hari kerja',
      allowedClasses: ['REGULAR'],
      baseMultiplier: 1,
      minChargeableKg: 1,
      isPickup: false,
    },
    {
      code: 'JNE_TRUCKING',
      name: 'JNE Trucking (JTR Kargo Darat/Laut)',
      description: 'Ekspedisi kargo darat/laut untuk unit airsoft, baterai LiPo, dan paket berat.',
      etaDays: '2-10 hari kerja',
      allowedClasses: ['REGULAR', 'CARGO_BATTERY', 'CARGO_REPLICA'],
      baseMultiplier: 1,
      minChargeableKg: 5,
      isPickup: false,
    },
    {
      code: 'INDAH_CARGO',
      name: 'Indah Cargo Darat',
      description: 'Kargo jalur darat dan laut aman untuk unit AEG/GBBR serta baterai LiPo.',
      etaDays: '3-12 hari kerja',
      allowedClasses: ['CARGO_BATTERY', 'CARGO_REPLICA'],
      baseMultiplier: 1,
      minChargeableKg: 5,
      isPickup: false,
    },
    {
      code: 'DAKOTA_CARGO',
      name: 'Dakota Cargo Darat',
      description: 'Kargo darat untuk pengiriman unit laras panjang dan hard case.',
      etaDays: '3-12 hari kerja',
      allowedClasses: ['CARGO_REPLICA'],
      baseMultiplier: 1,
      minChargeableKg: 5,
      isPickup: false,
    },
    {
      code: 'HAZMAT_LAND_CARGO',
      name: 'Kargo Khusus Darat/Laut Gas & Unit',
      description: 'Armada kargo darat/laut berizin khusus tabung Green Gas, unit, dan LiPo.',
      etaDays: '2-16 hari kerja',
      allowedClasses: ['CARGO_GAS', 'CARGO_REPLICA', 'CARGO_BATTERY'],
      baseMultiplier: 1,
      minChargeableKg: 5,
      isPickup: false,
    },
    {
      code: 'ARMORY_PICKUP',
      name: 'Ambil di Armory Brakasa (Jakarta Selatan)',
      description: 'Pengambilan langsung di showroom setelah pesanan dikemas.',
      etaDays: 'Siap ambil setelah dikemas',
      allowedClasses: ['REGULAR', 'CARGO_BATTERY', 'CARGO_REPLICA', 'CARGO_GAS'],
      baseMultiplier: 0,
      minChargeableKg: 0,
      isPickup: true,
    },
  ],
  zoneRates: [
    { zone: 'JABODETABEK', label: 'Jabodetabek', regularPerKgIdr: 15000, cargoPerKgIdr: 9000, hazmatSurchargeIdr: 10000 },
    { zone: 'JAWA', label: 'Pulau Jawa', regularPerKgIdr: 22000, cargoPerKgIdr: 13000, hazmatSurchargeIdr: 15000 },
    { zone: 'SUMATERA_BALI', label: 'Sumatera & Bali', regularPerKgIdr: 35000, cargoPerKgIdr: 22000, hazmatSurchargeIdr: 25000 },
    { zone: 'KALIMANTAN_SULAWESI', label: 'Kalimantan & Sulawesi', regularPerKgIdr: 48000, cargoPerKgIdr: 30000, hazmatSurchargeIdr: 35000 },
    { zone: 'INDONESIA_TIMUR', label: 'Indonesia Timur (NTB/NTT/Maluku/Papua)', regularPerKgIdr: 65000, cargoPerKgIdr: 42000, hazmatSurchargeIdr: 40000 },
  ],
};

export function CheckoutPage(): React.JSX.Element {
  const { lang, t } = useLanguage();
  const { checkout } = getStoreCopy(lang);
  useDocumentTitle(checkout.docTitle);

  const navigate = useNavigate();
  const { data: bootstrap } = useBootstrap();
  const {
    items,
    resolvedItems,
    loading: cartLoading,
    subtotalIdr,
    totalWeightGrams,
    combinedShippingClass,
    clearCart,
    refreshCart,
    error: cartError,
  } = useCart();

  const shippingSettings = bootstrap?.settings.shippingSettings ?? FALLBACK_SHIPPING_SETTINGS;
  const storeWhatsapp =
    bootstrap?.settings.armoryProfile.whatsappNumber || t.ourStore.defaultWhatsapp;

  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [shippingZone, setShippingZone] = useState<ShippingZoneCode>('JABODETABEK');
  const [shippingCity, setShippingCity] = useState<string>('');
  const [shippingDistrict, setShippingDistrict] = useState<string>('');
  const [shippingPostalCode, setShippingPostalCode] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [shippingNotes, setShippingNotes] = useState<string>('');

  const [shippingCourier, setShippingCourier] = useState<ShippingCourierCode>('JNE_TRUCKING');
  const [woodenPacking, setWoodenPacking] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>('VA_BCA');

  const [voucherInput, setVoucherInput] = useState<string>('');
  const [voucherLoading, setVoucherLoading] = useState<boolean>(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherValidateResponse | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [completedOrder, setCompletedOrder] = useState<CreateOrderResponse | null>(null);
  const [copiedField, setCopiedField] = useState<'invoice' | 'account' | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    const allowed = shippingSettings.couriers.filter((c) =>
      c.allowedClasses.includes(combinedShippingClass),
    );
    if (allowed.length === 0) return;
    const isCurrentAllowed = allowed.some((c) => c.code === shippingCourier);
    if (!isCurrentAllowed) {
      setShippingCourier(allowed[0].code);
    }
  }, [combinedShippingClass, shippingSettings.couriers, shippingCourier]);

  useEffect(() => {
    if (shippingCourier === 'ARMORY_PICKUP' && woodenPacking) {
      setWoodenPacking(false);
    }
  }, [shippingCourier, woodenPacking]);

  const estimateCourierShipping = useCallback(
    (
      courierCode: ShippingCourierCode,
      zoneCode: ShippingZoneCode,
    ): { costIdr: number; chargeableKg: number; allowed: boolean } => {
      const courier = shippingSettings.couriers.find((c) => c.code === courierCode);
      if (!courier) {
        return { costIdr: 0, chargeableKg: 0, allowed: false };
      }
      const allowed = courier.allowedClasses.includes(combinedShippingClass);
      if (!allowed) {
        return { costIdr: 0, chargeableKg: 0, allowed: false };
      }
      if (courier.isPickup || courier.code === 'ARMORY_PICKUP') {
        return { costIdr: 0, chargeableKg: 0, allowed: true };
      }

      const zoneRate =
        shippingSettings.zoneRates.find((z) => z.zone === zoneCode) ??
        shippingSettings.zoneRates[0];
      if (!zoneRate) {
        return { costIdr: 0, chargeableKg: 0, allowed: true };
      }

      const rawKg = Math.max(1, Math.ceil(totalWeightGrams / 1000));
      const chargeableKg = Math.max(courier.minChargeableKg, rawKg);
      const isRegularCourier = courier.code === 'JNE_REG' || courier.code === 'SICEPAT_REG';
      const perKgRate = isRegularCourier ? zoneRate.regularPerKgIdr : zoneRate.cargoPerKgIdr;
      const baseShipping = Math.round(chargeableKg * perKgRate * courier.baseMultiplier);
      const needsHazmatSurcharge =
        courier.code === 'HAZMAT_LAND_CARGO' || combinedShippingClass === 'CARGO_GAS';
      const costIdr = baseShipping + (needsHazmatSurcharge ? zoneRate.hazmatSurchargeIdr : 0);

      return { costIdr, chargeableKg, allowed: true };
    },
    [shippingSettings, combinedShippingClass, totalWeightGrams],
  );

  const selectedCourierName = useMemo(
    () => getLocalizedCourierNameByCode(shippingCourier, shippingSettings.couriers, lang),
    [shippingCourier, shippingSettings.couriers, lang],
  );

  const selectedShippingEstimate = useMemo(
    () => estimateCourierShipping(shippingCourier, shippingZone),
    [estimateCourierShipping, shippingCourier, shippingZone],
  );

  const shippingCostIdr = selectedShippingEstimate.costIdr;
  const isPickup = shippingCourier === 'ARMORY_PICKUP';
  const effectiveWoodenPacking = woodenPacking && !isPickup;
  const woodenPackingCostIdr = effectiveWoodenPacking ? shippingSettings.woodenPackingFeeIdr : 0;

  const kargoFreePickupConflict = Boolean(
    appliedVoucher?.valid &&
      appliedVoucher.code.toUpperCase() === 'KARGOFREE' &&
      shippingCostIdr === 0,
  );

  const effectiveDiscountIdr = useMemo(() => {
    if (!appliedVoucher?.valid) return 0;
    if (appliedVoucher.code.toUpperCase() === 'KARGOFREE') {
      return shippingCostIdr > 0 ? Math.min(appliedVoucher.discountIdr, shippingCostIdr) : 0;
    }
    return Math.min(appliedVoucher.discountIdr, subtotalIdr);
  }, [appliedVoucher, shippingCostIdr, subtotalIdr]);

  const grandTotalIdr = Math.max(
    0,
    subtotalIdr - effectiveDiscountIdr + shippingCostIdr + woodenPackingCostIdr,
  );

  const hasStockBlocker = resolvedItems.some((item) => item.outOfStock || item.exceedsStock);

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleApplyVoucher = async (overrideCode?: string) => {
    const raw = (overrideCode ?? voucherInput).trim().toUpperCase();
    if (!raw) {
      setVoucherError(checkout.validation.voucherEmpty);
      return;
    }

    setVoucherInput(raw);
    setVoucherLoading(true);
    setVoucherError(null);

    try {
      const result = await apiFetch<VoucherValidateResponse>('/api/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({ code: raw, subtotalIdr }),
      });

      if (!result.valid) {
        setAppliedVoucher(null);
        setVoucherError(result.reason || checkout.validation.voucherInvalid);
        return;
      }

      if (result.code.toUpperCase() === 'KARGOFREE' && shippingCostIdr === 0) {
        setAppliedVoucher(null);
        setVoucherError(checkout.validation.voucherKargoFreePickup);
        return;
      }

      setAppliedVoucher(result);
    } catch (err) {
      setAppliedVoucher(null);
      setVoucherError(
        err instanceof ApiRequestError ? err.message : checkout.validation.voucherNetworkError,
      );
    } finally {
      setVoucherLoading(false);
    }
  };

  const validateForm = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (customerName.trim().length < 2) {
      errs.customerName = checkout.validation.customerName;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      errs.customerEmail = checkout.validation.customerEmail;
    }
    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      errs.customerPhone = checkout.validation.customerPhone;
    }
    if (shippingCity.trim().length < 2) {
      errs.shippingCity = checkout.validation.shippingCity;
    }
    if (shippingDistrict.trim().length < 2) {
      errs.shippingDistrict = checkout.validation.shippingDistrict;
    }
    if (!/^\d{5}$/.test(shippingPostalCode.trim())) {
      errs.shippingPostalCode = checkout.validation.shippingPostalCode;
    }
    if (shippingAddress.trim().length < 10) {
      errs.shippingAddress = checkout.validation.shippingAddress;
    }
    if (!selectedShippingEstimate.allowed) {
      errs.shippingCourier = checkout.validation.shippingCourier;
    }
    return errs;
  };

  const focusFirstError = (errs: Record<string, string>) => {
    const fieldIdOrder: Array<[string, string]> = [
      ['customerName', 'checkout-name'],
      ['customerEmail', 'checkout-email'],
      ['customerPhone', 'checkout-phone'],
      ['shippingCity', 'checkout-city'],
      ['shippingDistrict', 'checkout-district'],
      ['shippingPostalCode', 'checkout-postal'],
      ['shippingAddress', 'checkout-address'],
    ];

    for (const [key, domId] of fieldIdOrder) {
      if (errs[key]) {
        const el = document.getElementById(domId);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (hasStockBlocker) {
      setSubmitError(checkout.validation.stockBlocker);
      return;
    }

    const errs = validateForm();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setSubmitError(checkout.validation.formBanner);
      focusFirstError(errs);
      return;
    }

    const payload: CreateOrderRequest = {
      items: resolvedItems.map((entry) => ({
        productId: entry.product.id,
        quantity: entry.quantity,
      })),
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      shippingZone,
      shippingCity: shippingCity.trim(),
      shippingDistrict: shippingDistrict.trim(),
      shippingPostalCode: shippingPostalCode.trim(),
      shippingAddress: shippingAddress.trim(),
      shippingNotes: shippingNotes.trim() || undefined,
      shippingCourier,
      woodenPacking: effectiveWoodenPacking,
      paymentMethod,
      voucherCode:
        appliedVoucher?.valid && !kargoFreePickupConflict ? appliedVoucher.code : null,
    };

    setSubmitting(true);
    try {
      const response = await apiFetch<CreateOrderResponse>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCompletedOrder(response);
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setSubmitError(err.message);
        if (err.code === 'OUT_OF_STOCK') {
          void refreshCart();
        }
        if (err.code === 'INVALID_VOUCHER' || err.code === 'VOUCHER_QUOTA_EXCEEDED') {
          setAppliedVoucher(null);
          setVoucherError(err.message);
        }
      } else {
        setSubmitError(checkout.validation.networkError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (value: string, target: 'invoice' | 'account') => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(value).catch(() => {
        // Ignore clipboard errors
      });
    }
    setCopiedField(target);
    window.setTimeout(() => setCopiedField(null), 2200);
  };

  if (completedOrder) {
    const { order, paymentInstruction } = completedOrder;
    const localizedPayment = getLocalizedPaymentInstruction(
      paymentInstruction,
      order,
      storeWhatsapp,
      lang,
    );
    const orderCourierName = getLocalizedCourierNameByCode(
      order.shippingCourier,
      shippingSettings.couriers,
      lang,
    );

    return (
      <div className="container-brakasa py-8 sm:py-10 lg:py-12">
        <div
          style={{
            backgroundColor: 'var(--status-ok-bg)',
            borderColor: 'var(--status-ok)',
            borderRadius: 'var(--radius-plate)',
          }}
          className="mb-6 flex flex-col gap-3 border p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span style={{ color: 'var(--status-ok)' }} className="inline-flex items-center">
              <IconShieldCheck size={18} />
            </span>
            <Badge variant="ok">{getOrderStatusLabel(order.status, lang)}</Badge>
          </div>
          <h1 className="m-0 font-display text-[clamp(1.75rem,3.6vw,2.75rem)] font-bold leading-tight uppercase">
            {checkout.invoice.heading(order.invoiceNumber)}
          </h1>
          <p style={{ color: 'var(--text-primary)' }} className="m-0 max-w-[66ch] text-sm leading-relaxed">
            {checkout.invoice.subtitle}
          </p>

          <div className="no-print mt-2 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => handleCopy(order.invoiceNumber, 'invoice')}
              className="btn-brakasa btn-secondary text-sm"
            >
              {copiedField === 'invoice'
                ? checkout.invoice.copiedInvoice
                : checkout.invoice.copyInvoice}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-brakasa btn-secondary text-sm"
            >
              {checkout.invoice.printInvoice}
            </button>
            <Link to="/store" className="btn-brakasa btn-primary text-sm">
              {checkout.invoice.backToShop}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,1fr)]">
          <section
            aria-labelledby="payment-instruction-heading"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              borderRadius: 'var(--radius-plate)',
            }}
            className="flex flex-col gap-4 border p-5 sm:p-6"
          >
            <h2
              id="payment-instruction-heading"
              className="m-0 font-display text-2xl font-bold uppercase"
            >
              {localizedPayment.methodLabel}
            </h2>

            <dl
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                borderRadius: 'var(--radius-plate)',
              }}
              className="m-0 flex flex-col gap-3 border p-4 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt style={{ color: 'var(--text-muted)' }}>
                  {checkout.invoice.paymentDestination}
                </dt>
                <dd style={{ color: 'var(--text-primary)' }} className="m-0 font-semibold">
                  {paymentInstruction.accountLabel}
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt style={{ color: 'var(--text-muted)' }}>
                  {checkout.invoice.accountNumberLabel}
                </dt>
                <dd className="m-0 flex items-center gap-2">
                  <span
                    style={{ color: 'var(--accent-text)' }}
                    className="font-mono-tech text-base font-semibold tabular-nums"
                  >
                    {paymentInstruction.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentInstruction.accountNumber, 'account')}
                    className="no-print btn-brakasa btn-ghost min-h-[44px] min-w-[44px] px-2.5 text-xs"
                  >
                    {copiedField === 'account'
                      ? checkout.invoice.copiedShort
                      : checkout.invoice.copyShort}
                  </button>
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt style={{ color: 'var(--text-muted)' }}>{checkout.invoice.exactAmountLabel}</dt>
                <dd
                  style={{ color: 'var(--text-primary)' }}
                  className="m-0 font-mono-tech text-lg font-semibold tabular-nums"
                >
                  {formatIdr(paymentInstruction.amountIdr)}
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt style={{ color: 'var(--text-muted)' }}>{checkout.invoice.deadlineLabel}</dt>
                <dd
                  style={{ color: 'var(--status-warn)' }}
                  className="m-0 font-mono-tech text-xs font-semibold tabular-nums"
                >
                  {formatDateTimeId(paymentInstruction.expiresAt, lang)}
                </dd>
              </div>
            </dl>

            <p style={{ color: 'var(--text-secondary)' }} className="m-0 text-sm leading-relaxed">
              {localizedPayment.note}
            </p>

            <div style={{ borderColor: 'var(--border-subtle)' }} className="border-t pt-4">
              <h3 className="mt-0 mb-3 text-sm font-semibold uppercase">
                {checkout.invoice.orderItemsHeading(order.items.length)}
              </h3>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: 'var(--radius-plate)',
                    }}
                    className="flex flex-wrap items-center justify-between gap-2 border p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <span
                        style={{ color: 'var(--text-muted)' }}
                        className="block font-mono-tech text-xs tabular-nums"
                      >
                        {item.skuSnapshot}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
                        {item.nameSnapshot}
                      </span>
                    </div>
                    <div className="font-mono-tech text-xs tabular-nums sm:text-right">
                      <span style={{ color: 'var(--text-muted)' }} className="block">
                        {item.quantity} x {formatIdr(item.unitPriceIdr)}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
                        {formatIdr(item.lineTotalIdr)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              borderRadius: 'var(--radius-plate)',
            }}
            className="flex flex-col gap-4 border p-5 sm:p-6"
          >
            <h2 className="m-0 font-display text-xl font-bold uppercase">
              {checkout.invoice.summaryHeading}
            </h2>

            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant={order.shippingClass === 'REGULAR' ? 'neutral' : 'warn'}
                icon={<IconTruck size={12} />}
              >
                {getShippingClassLabel(order.shippingClass, lang)}
              </Badge>
            </div>

            <div className="text-sm">
              <p
                style={{ color: 'var(--text-muted)' }}
                className="m-0 font-mono-tech text-xs uppercase"
              >
                {checkout.invoice.recipientLabel}
              </p>
              <p style={{ color: 'var(--text-primary)' }} className="mt-1 mb-0 font-semibold">
                {order.customerName}
              </p>
              <p style={{ color: 'var(--text-secondary)' }} className="mt-0.5 mb-0 text-xs">
                {order.customerEmail} | {order.customerPhone}
              </p>
              <p
                style={{ color: 'var(--text-secondary)' }}
                className="mt-1.5 mb-0 text-xs leading-relaxed"
              >
                {order.shippingAddress}, {order.shippingDistrict}, {order.shippingCity}{' '}
                {order.shippingPostalCode}
              </p>
            </div>

            <dl
              style={{ borderColor: 'var(--border-subtle)' }}
              className="m-0 flex flex-col gap-2 border-t pt-4 text-sm"
            >
              <div className="flex justify-between gap-2">
                <dt style={{ color: 'var(--text-secondary)' }}>{checkout.invoice.subtotalLabel}</dt>
                <dd className="m-0 font-mono-tech tabular-nums">{formatIdr(order.subtotalIdr)}</dd>
              </div>
              {order.discountIdr > 0 ? (
                <div className="flex justify-between gap-2">
                  <dt style={{ color: 'var(--status-ok)' }}>
                    {checkout.invoice.discountLabel(order.voucherCode)}
                  </dt>
                  <dd
                    style={{ color: 'var(--status-ok)' }}
                    className="m-0 font-mono-tech font-semibold tabular-nums"
                  >
                    -{formatIdr(order.discountIdr)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <dt style={{ color: 'var(--text-secondary)' }}>
                  {checkout.invoice.shippingLabel(orderCourierName)}
                </dt>
                <dd className="m-0 font-mono-tech tabular-nums">
                  {formatIdr(order.shippingCostIdr)}
                </dd>
              </div>
              {order.woodenPacking && order.woodenPackingCostIdr > 0 ? (
                <div className="flex justify-between gap-2">
                  <dt style={{ color: 'var(--text-secondary)' }}>
                    {checkout.invoice.woodenPackingLabel}
                  </dt>
                  <dd className="m-0 font-mono-tech tabular-nums">
                    {formatIdr(order.woodenPackingCostIdr)}
                  </dd>
                </div>
              ) : null}
              <div
                style={{ borderColor: 'var(--border-strong)' }}
                className="mt-1 flex justify-between gap-2 border-t pt-3 font-semibold"
              >
                <dt>{checkout.invoice.totalLabel}</dt>
                <dd
                  style={{ color: 'var(--accent-text)' }}
                  className="m-0 font-mono-tech text-lg tabular-nums"
                >
                  {formatIdr(order.totalIdr)}
                </dd>
              </div>
            </dl>

            <div className="no-print mt-2">
              <Link to="/store" className="btn-brakasa btn-secondary w-full text-sm">
                {checkout.invoice.backToShop}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (cartLoading && resolvedItems.length === 0 && items.length > 0) {
    return (
      <div className="container-brakasa py-12">
        <LoadingState label={checkout.loadingLabel} />
      </div>
    );
  }

  if (items.length === 0 || (!cartLoading && resolvedItems.length === 0)) {
    return (
      <div className="container-brakasa py-12">
        <h1 className="m-0 mb-6 font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-none tracking-tight uppercase">
          {checkout.pageTitle}
        </h1>
        <h2 className="sr-only-brakasa">{checkout.emptySectionSr}</h2>
        <EmptyState
          title={checkout.emptyTitle}
          description={checkout.emptyDesc}
          actionLabel={checkout.browseShop}
          onAction={() => navigate('/store')}
        />
      </div>
    );
  }

  return (
    <div className="container-brakasa pt-8 pb-24 sm:pt-10 lg:py-12">
      <header
        style={{ borderColor: 'var(--border-subtle)' }}
        className="mb-6 border-b pb-4"
      >
        <h1 className="m-0 font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-none tracking-tight uppercase">
          {checkout.pageTitle}
        </h1>
      </header>

      {cartError ? (
        <div className="mb-5">
          <h2 className="sr-only-brakasa">{checkout.cartErrorSrHeading}</h2>
          <ErrorState
            title={checkout.cartErrorTitle}
            message={cartError}
            onRetry={() => void refreshCart()}
          />
        </div>
      ) : null}

      <div className="mb-6 lg:hidden">
        <OrderSummaryPanel
          resolvedItems={resolvedItems}
          subtotalIdr={subtotalIdr}
          discountIdr={effectiveDiscountIdr}
          appliedVoucherCode={
            appliedVoucher?.valid && !kargoFreePickupConflict ? appliedVoucher.code : null
          }
          shippingCostIdr={shippingCostIdr}
          woodenPacking={effectiveWoodenPacking}
          woodenPackingCostIdr={woodenPackingCostIdr}
          grandTotalIdr={grandTotalIdr}
          totalWeightGrams={totalWeightGrams}
          combinedShippingClass={combinedShippingClass}
          selectedCourierName={selectedCourierName}
          collapsibleMobile
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)] lg:items-start">
        <form
          ref={formRef}
          onSubmit={handleSubmitOrder}
          noValidate
          className="flex min-w-0 flex-col gap-6"
        >
          {submitError ? (
            <div
              role="alert"
              style={{
                backgroundColor: 'var(--status-danger-bg)',
                borderColor: 'var(--status-danger)',
                borderRadius: 'var(--radius-plate)',
              }}
              className="flex items-start gap-3 border p-4 text-sm"
            >
              <span style={{ color: 'var(--status-danger)' }} className="mt-0.5 shrink-0">
                <IconAlertOctagon size={18} />
              </span>
              <p style={{ color: 'var(--text-primary)' }} className="m-0 font-medium leading-relaxed">
                {submitError}
              </p>
            </div>
          ) : null}

          <section
            aria-labelledby="checkout-address-heading"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              borderRadius: 'var(--radius-plate)',
            }}
            className="flex flex-col gap-4 border p-5 sm:p-6"
          >
            <div className="border-b border-[var(--border-subtle)] pb-3">
              <h2
                id="checkout-address-heading"
                className="m-0 font-display text-xl font-bold tracking-wide uppercase"
              >
                {checkout.addressHeading}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor="checkout-name"
                  style={{ color: 'var(--text-primary)' }}
                  className="text-sm font-semibold"
                >
                  {checkout.fullNameLabel} <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <input
                  id="checkout-name"
                  name="customerName"
                  type="text"
                  autoComplete="name"
                  required
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    clearFieldError('customerName');
                  }}
                  placeholder={checkout.fullNamePlaceholder}
                  aria-invalid={Boolean(fieldErrors.customerName)}
                  aria-describedby={fieldErrors.customerName ? 'checkout-name-err' : undefined}
                  className="input-brakasa min-h-[48px]"
                />
                {fieldErrors.customerName ? (
                  <p
                    id="checkout-name-err"
                    role="alert"
                    style={{ color: 'var(--status-danger)' }}
                    className="m-0 flex items-center gap-1.5 text-xs font-medium"
                  >
                    <IconAlertOctagon size={13} />
                    <span>{fieldErrors.customerName}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="checkout-email"
                  style={{ color: 'var(--text-primary)' }}
                  className="text-sm font-semibold"
                >
                  {checkout.emailLabel} <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <input
                  id="checkout-email"
                  name="customerEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    clearFieldError('customerEmail');
                  }}
                  placeholder={checkout.emailPlaceholder}
                  aria-invalid={Boolean(fieldErrors.customerEmail)}
                  aria-describedby={fieldErrors.customerEmail ? 'checkout-email-err' : undefined}
                  className="input-brakasa min-h-[48px]"
                />
                {fieldErrors.customerEmail ? (
                  <p
                    id="checkout-email-err"
                    role="alert"
                    style={{ color: 'var(--status-danger)' }}
                    className="m-0 flex items-center gap-1.5 text-xs font-medium"
                  >
                    <IconAlertOctagon size={13} />
                    <span>{fieldErrors.customerEmail}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="checkout-phone"
                  style={{ color: 'var(--text-primary)' }}
                  className="text-sm font-semibold"
                >
                  {checkout.phoneLabel} <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <input
                  id="checkout-phone"
                  name="customerPhone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    clearFieldError('customerPhone');
                  }}
                  placeholder={checkout.phonePlaceholder}
                  aria-invalid={Boolean(fieldErrors.customerPhone)}
                  aria-describedby={fieldErrors.customerPhone ? 'checkout-phone-err' : undefined}
                  className="input-brakasa min-h-[48px] font-mono-tech tabular-nums"
                />
                {fieldErrors.customerPhone ? (
                  <p
                    id="checkout-phone-err"
                    role="alert"
                    style={{ color: 'var(--status-danger)' }}
                    className="m-0 flex items-center gap-1.5 text-xs font-medium"
                  >
                    <IconAlertOctagon size={13} />
                    <span>{fieldErrors.customerPhone}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="checkout-city"
                  style={{ color: 'var(--text-primary)' }}
                  className="text-sm font-semibold"
                >
                  {checkout.cityLabel} <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <input
                  id="checkout-city"
                  name="shippingCity"
                  type="text"
                  autoComplete="address-level2"
                  required
                  value={shippingCity}
                  onChange={(e) => {
                    setShippingCity(e.target.value);
                    clearFieldError('shippingCity');
                  }}
                  placeholder={checkout.cityPlaceholder}
                  aria-invalid={Boolean(fieldErrors.shippingCity)}
                  aria-describedby={fieldErrors.shippingCity ? 'checkout-city-err' : undefined}
                  className="input-brakasa min-h-[48px]"
                />
                {fieldErrors.shippingCity ? (
                  <p
                    id="checkout-city-err"
                    role="alert"
                    style={{ color: 'var(--status-danger)' }}
                    className="m-0 flex items-center gap-1.5 text-xs font-medium"
                  >
                    <IconAlertOctagon size={13} />
                    <span>{fieldErrors.shippingCity}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="checkout-district"
                  style={{ color: 'var(--text-primary)' }}
                  className="text-sm font-semibold"
                >
                  {checkout.districtLabel} <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <input
                  id="checkout-district"
                  name="shippingDistrict"
                  type="text"
                  required
                  value={shippingDistrict}
                  onChange={(e) => {
                    setShippingDistrict(e.target.value);
                    clearFieldError('shippingDistrict');
                  }}
                  placeholder={checkout.districtPlaceholder}
                  aria-invalid={Boolean(fieldErrors.shippingDistrict)}
                  aria-describedby={
                    fieldErrors.shippingDistrict ? 'checkout-district-err' : undefined
                  }
                  className="input-brakasa min-h-[48px]"
                />
                {fieldErrors.shippingDistrict ? (
                  <p
                    id="checkout-district-err"
                    role="alert"
                    style={{ color: 'var(--status-danger)' }}
                    className="m-0 flex items-center gap-1.5 text-xs font-medium"
                  >
                    <IconAlertOctagon size={13} />
                    <span>{fieldErrors.shippingDistrict}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="checkout-postal"
                  style={{ color: 'var(--text-primary)' }}
                  className="text-sm font-semibold"
                >
                  {checkout.postalCodeLabel} <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <input
                  id="checkout-postal"
                  name="shippingPostalCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  required
                  value={shippingPostalCode}
                  onChange={(e) => {
                    setShippingPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5));
                    clearFieldError('shippingPostalCode');
                  }}
                  placeholder={checkout.postalCodePlaceholder}
                  aria-invalid={Boolean(fieldErrors.shippingPostalCode)}
                  aria-describedby={
                    fieldErrors.shippingPostalCode ? 'checkout-postal-err' : undefined
                  }
                  className="input-brakasa min-h-[48px] font-mono-tech tabular-nums"
                />
                {fieldErrors.shippingPostalCode ? (
                  <p
                    id="checkout-postal-err"
                    role="alert"
                    style={{ color: 'var(--status-danger)' }}
                    className="m-0 flex items-center gap-1.5 text-xs font-medium"
                  >
                    <IconAlertOctagon size={13} />
                    <span>{fieldErrors.shippingPostalCode}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor="checkout-address"
                  style={{ color: 'var(--text-primary)' }}
                  className="text-sm font-semibold"
                >
                  {checkout.streetAddressLabel}{' '}
                  <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <textarea
                  id="checkout-address"
                  name="shippingAddress"
                  autoComplete="street-address"
                  rows={3}
                  required
                  value={shippingAddress}
                  onChange={(e) => {
                    setShippingAddress(e.target.value);
                    clearFieldError('shippingAddress');
                  }}
                  placeholder={checkout.streetAddressPlaceholder}
                  aria-invalid={Boolean(fieldErrors.shippingAddress)}
                  aria-describedby={fieldErrors.shippingAddress ? 'checkout-address-err' : undefined}
                  className="input-brakasa"
                />
                {fieldErrors.shippingAddress ? (
                  <p
                    id="checkout-address-err"
                    role="alert"
                    style={{ color: 'var(--status-danger)' }}
                    className="m-0 flex items-center gap-1.5 text-xs font-medium"
                  >
                    <IconAlertOctagon size={13} />
                    <span>{fieldErrors.shippingAddress}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor="checkout-notes"
                  style={{ color: 'var(--text-primary)' }}
                  className="text-sm font-semibold"
                >
                  {checkout.notesLabel}
                </label>
                <input
                  id="checkout-notes"
                  name="shippingNotes"
                  type="text"
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                  placeholder={checkout.notesPlaceholder}
                  className="input-brakasa min-h-[48px]"
                />
              </div>
            </div>
          </section>

          <ShippingCargoSection
            combinedShippingClass={combinedShippingClass}
            totalWeightGrams={totalWeightGrams}
            shippingSettings={shippingSettings}
            selectedZone={shippingZone}
            selectedCourier={shippingCourier}
            woodenPacking={woodenPacking}
            onZoneChange={(zone) => setShippingZone(zone)}
            onCourierChange={(courier) => {
              setShippingCourier(courier);
              clearFieldError('shippingCourier');
            }}
            onWoodenPackingChange={(enabled) => setWoodenPacking(enabled)}
            estimateCourierShipping={estimateCourierShipping}
            errors={fieldErrors}
          />

          <section
            aria-labelledby="checkout-payment-heading"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              borderRadius: 'var(--radius-plate)',
            }}
            className="flex flex-col gap-5 border p-5 sm:p-6"
          >
            <div className="border-b border-[var(--border-subtle)] pb-3">
              <h2
                id="checkout-payment-heading"
                className="m-0 font-display text-xl font-bold tracking-wide uppercase"
              >
                {checkout.voucherPaymentHeading}
              </h2>
            </div>

            <div className="flex flex-col gap-2.5">
              <label
                htmlFor="checkout-voucher-code"
                style={{ color: 'var(--text-primary)' }}
                className="text-sm font-semibold"
              >
                {checkout.voucherLabel}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="checkout-voucher-code"
                  type="text"
                  value={voucherInput}
                  onChange={(e) => {
                    setVoucherInput(e.target.value.toUpperCase());
                    setVoucherError(null);
                  }}
                  placeholder={checkout.voucherPlaceholder}
                  className="input-brakasa min-h-[48px] flex-1 font-mono-tech uppercase"
                />
                <button
                  type="button"
                  disabled={voucherLoading}
                  onClick={() => void handleApplyVoucher()}
                  className="btn-brakasa btn-secondary min-h-[48px] shrink-0 px-5 text-sm"
                >
                  {voucherLoading ? checkout.voucherChecking : checkout.voucherApplyBtn}
                </button>
              </div>

              {bootstrap?.activePromos && bootstrap.activePromos.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span style={{ color: 'var(--text-muted)' }} className="font-mono-tech text-xs">
                    {checkout.activePromosLabel}
                  </span>
                  {bootstrap.activePromos.map((promo) => (
                    <button
                      key={promo.code}
                      type="button"
                      onClick={() => void handleApplyVoucher(promo.code)}
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                        borderRadius: 'var(--radius-plate)',
                      }}
                      className="min-h-[44px] border px-2.5 font-mono-tech text-xs font-semibold hover:border-[var(--accent-primary)]"
                    >
                      {promo.code}
                    </button>
                  ))}
                </div>
              ) : null}

              {voucherError ? (
                <p
                  role="alert"
                  style={{ color: 'var(--status-danger)' }}
                  className="m-0 flex items-start gap-1.5 text-xs font-medium"
                >
                  <IconAlertOctagon size={14} className="mt-0.5 shrink-0" />
                  <span>{voucherError}</span>
                </p>
              ) : null}

              {appliedVoucher?.valid ? (
                <div
                  style={{
                    backgroundColor: kargoFreePickupConflict
                      ? 'var(--status-warn-bg)'
                      : 'var(--status-ok-bg)',
                    borderColor: kargoFreePickupConflict
                      ? 'var(--status-warn)'
                      : 'var(--status-ok)',
                    borderRadius: 'var(--radius-plate)',
                  }}
                  className="flex flex-wrap items-center justify-between gap-2 border p-3 text-xs"
                >
                  <div className="flex items-start gap-2">
                    <span
                      style={{
                        color: kargoFreePickupConflict
                          ? 'var(--status-warn)'
                          : 'var(--status-ok)',
                      }}
                      className="mt-0.5 shrink-0"
                    >
                      {kargoFreePickupConflict ? (
                        <IconAlertTriangle size={15} />
                      ) : (
                        <IconShieldCheck size={15} />
                      )}
                    </span>
                    <div>
                      <strong
                        style={{ color: 'var(--text-primary)' }}
                        className="font-mono-tech uppercase"
                      >
                        {checkout.voucherAppliedTitle(appliedVoucher.code)}
                      </strong>
                      <p style={{ color: 'var(--text-secondary)' }} className="mt-0.5 mb-0">
                        {kargoFreePickupConflict
                          ? checkout.voucherKargoFreeConflict
                          : checkout.voucherDiscountApplied(formatIdr(effectiveDiscountIdr))}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedVoucher(null);
                      setVoucherInput('');
                      setVoucherError(null);
                    }}
                    className="btn-brakasa btn-ghost min-h-[44px] min-w-[44px] px-3 text-xs"
                  >
                    {checkout.voucherRemoveBtn}
                  </button>
                </div>
              ) : null}
            </div>

            <fieldset
              style={{ borderColor: 'var(--border-subtle)' }}
              className="m-0 flex flex-col gap-2.5 border-t pt-4 p-0"
            >
              <legend
                style={{ color: 'var(--text-primary)' }}
                className="mb-2 p-0 text-sm font-semibold"
              >
                {checkout.paymentMethodLegend}{' '}
                <span style={{ color: 'var(--status-danger)' }}>*</span>
              </legend>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {checkout.paymentOptions.map((opt) => {
                  const isSelected = paymentMethod === opt.code;
                  return (
                    <label
                      key={opt.code}
                      htmlFor={`pay-${opt.code}`}
                      style={{
                        backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-canvas)',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        borderRadius: 'var(--radius-control)',
                      }}
                      className="flex min-h-[60px] items-start gap-3 border p-3.5 text-sm"
                    >
                      <input
                        id={`pay-${opt.code}`}
                        type="radio"
                        name="paymentMethod"
                        value={opt.code}
                        checked={isSelected}
                        onChange={() => setPaymentMethod(opt.code)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-primary)]"
                      />
                      <span className="flex flex-col gap-0.5">
                        <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
                          {opt.label}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }} className="text-xs leading-snug">
                          {opt.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || hasStockBlocker}
                className="btn-brakasa btn-primary min-h-[52px] w-full text-base"
              >
                {submitting
                  ? checkout.submitLoading
                  : checkout.submitLabel(formatIdr(grandTotalIdr))}
              </button>
            </div>
          </section>
        </form>

        <div className="hidden lg:sticky lg:top-24 lg:block">
          <OrderSummaryPanel
            resolvedItems={resolvedItems}
            subtotalIdr={subtotalIdr}
            discountIdr={effectiveDiscountIdr}
            appliedVoucherCode={
              appliedVoucher?.valid && !kargoFreePickupConflict ? appliedVoucher.code : null
            }
            shippingCostIdr={shippingCostIdr}
            woodenPacking={effectiveWoodenPacking}
            woodenPackingCostIdr={woodenPackingCostIdr}
            grandTotalIdr={grandTotalIdr}
            totalWeightGrams={totalWeightGrams}
            combinedShippingClass={combinedShippingClass}
            selectedCourierName={selectedCourierName}
          />
        </div>
      </div>
    </div>
  );
}
