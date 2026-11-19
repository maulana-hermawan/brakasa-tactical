import type { OrderStatus, ShippingClass } from '../../shared/types';
import type { Language } from '../i18n/common';

export function formatIdr(amount: number): string {
  if (!Number.isFinite(amount)) {
    return 'Rp 0';
  }
  const rounded = Math.round(amount);
  const absFormatted = Math.abs(rounded).toLocaleString('id-ID');
  return rounded < 0 ? `-Rp ${absFormatted}` : `Rp ${absFormatted}`;
}

export function formatWeight(grams: number, lang: Language = 'id'): string {
  if (!Number.isFinite(grams) || grams < 0) {
    return '0 g';
  }
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  const rounded = Math.round(grams);
  const gramsStr = rounded.toLocaleString(locale);
  if (rounded >= 1000) {
    const kgStr = (rounded / 1000).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${gramsStr} g (${kgStr} kg)`;
  }
  return `${gramsStr} g`;
}

export function formatDateTimeId(isoString: string, lang: Language = 'id'): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  const locale = lang === 'en' ? 'en-GB' : 'id-ID';
  const formatted = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(date);
  return `${formatted} WIB`;
}

export function calculateJoule(fps: number, bbWeightGram: number): number {
  if (!Number.isFinite(fps) || !Number.isFinite(bbWeightGram) || fps <= 0 || bbWeightGram <= 0) {
    return 0;
  }
  const velocityMetersPerSecond = fps * 0.3048;
  const massKilograms = bbWeightGram / 1000;
  return 0.5 * massKilograms * velocityMetersPerSecond * velocityMetersPerSecond;
}

export function calculateEquivalentFps020(joule: number): number {
  if (!Number.isFinite(joule) || joule <= 0) {
    return 0;
  }
  const velocityAt020 = Math.sqrt(joule / (0.5 * 0.0002));
  return velocityAt020 / 0.3048;
}

export function getShippingClassLabel(cls: ShippingClass, lang: Language = 'id'): string {
  if (lang === 'en') {
    switch (cls) {
      case 'REGULAR':
        return 'Regular Courier / Land Cargo';
      case 'CARGO_BATTERY':
        return 'Land/Sea Cargo (LiPo Battery)';
      case 'CARGO_REPLICA':
        return 'Land/Sea Cargo (Unit)';
      case 'CARGO_GAS':
        return 'Specialized Land/Sea Cargo (Pressurized Gas)';
      default:
        return cls;
    }
  }
  switch (cls) {
    case 'REGULAR':
      return 'Kurir Reguler / Kargo Darat';
    case 'CARGO_BATTERY':
      return 'Kargo Darat/Laut (Baterai LiPo)';
    case 'CARGO_REPLICA':
      return 'Kargo Darat/Laut (Unit)';
    case 'CARGO_GAS':
      return 'Kargo Khusus Darat/Laut (Gas Bertekanan)';
    default:
      return cls;
  }
}

export function getOrderStatusLabel(status: OrderStatus, lang: Language = 'id'): string {
  if (lang === 'en') {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'Pending Payment';
      case 'PAID_VERIFIED':
        return 'Payment Verified';
      case 'PACKED':
        return 'Packed';
      case 'SHIPPED':
        return 'Shipped';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'Menunggu Pembayaran';
    case 'PAID_VERIFIED':
      return 'Pembayaran Diverifikasi';
    case 'PACKED':
      return 'Dikemas';
    case 'SHIPPED':
      return 'Dikirim';
    case 'COMPLETED':
      return 'Selesai';
    case 'CANCELLED':
      return 'Dibatalkan';
    default:
      return status;
  }
}
