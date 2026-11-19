import {
  SHIPPING_CLASS_PRIORITY,
  type ShippingClass,
  type ShippingCourierCode,
  type ShippingCourierConfig,
  type ShippingSettings,
  type ShippingZoneCode,
} from '../../shared/types.ts';
import { AppError } from '../db/helpers.ts';

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  woodenPackingFeeIdr: 75000,
  couriers: [
    {
      code: 'JNE_REG',
      name: 'JNE Reguler',
      description: 'Pengiriman reguler khusus aksesoris, optik, apparel, rig, dan BB tanpa replika/gas/LiPo.',
      etaDays: '1-5 hari kerja',
      allowedClasses: ['REGULAR'],
      baseMultiplier: 1.0,
      minChargeableKg: 1,
      isPickup: false,
    },
    {
      code: 'SICEPAT_REG',
      name: 'SiCepat Reguler',
      description: 'Pengiriman reguler nasional khusus aksesoris non-replika dan tactical gear.',
      etaDays: '1-5 hari kerja',
      allowedClasses: ['REGULAR'],
      baseMultiplier: 1.0,
      minChargeableKg: 1,
      isPickup: false,
    },
    {
      code: 'JNE_TRUCKING',
      name: 'JNE Trucking (JTR Kargo Darat/Laut)',
      description: 'Ekspedisi kargo darat/laut untuk unit replika airsoft, baterai LiPo, dan paket berat.',
      etaDays: '2-10 hari kerja',
      allowedClasses: ['REGULAR', 'CARGO_BATTERY', 'CARGO_REPLICA'],
      baseMultiplier: 1.0,
      minChargeableKg: 5,
      isPickup: false,
    },
    {
      code: 'INDAH_CARGO',
      name: 'Indah Cargo Darat',
      description: 'Kargo jalur darat dan laut aman untuk unit replika AEG/GBBR serta baterai LiPo.',
      etaDays: '3-12 hari kerja',
      allowedClasses: ['CARGO_BATTERY', 'CARGO_REPLICA'],
      baseMultiplier: 1.0,
      minChargeableKg: 5,
      isPickup: false,
    },
    {
      code: 'DAKOTA_CARGO',
      name: 'Dakota Cargo Darat',
      description: 'Kargo darat terukur untuk pengiriman unit laras panjang dan hard case ke berbagai pulau.',
      etaDays: '3-12 hari kerja',
      allowedClasses: ['CARGO_REPLICA'],
      baseMultiplier: 1.0,
      minChargeableKg: 5,
      isPickup: false,
    },
    {
      code: 'HAZMAT_LAND_CARGO',
      name: 'Kargo Khusus Darat/Laut Gas & Replika',
      description: 'Armada kargo darat/laut berizin khusus tabung Green Gas bertekanan, unit replika, dan LiPo.',
      etaDays: '2-16 hari kerja',
      allowedClasses: ['CARGO_GAS', 'CARGO_REPLICA', 'CARGO_BATTERY'],
      baseMultiplier: 1.0,
      minChargeableKg: 5,
      isPickup: false,
    },
    {
      code: 'ARMORY_PICKUP',
      name: 'Ambil di Armory Brakasa (Jakarta Selatan)',
      description: 'Pengambilan langsung di showroom setelah status PACKED dan uji QC chronograph selesai.',
      etaDays: 'Siap ambil setelah PACKED',
      allowedClasses: ['REGULAR', 'CARGO_BATTERY', 'CARGO_REPLICA', 'CARGO_GAS'],
      baseMultiplier: 0,
      minChargeableKg: 0,
      isPickup: true,
    },
  ],
  zoneRates: [
    {
      zone: 'JABODETABEK',
      label: 'Jabodetabek',
      regularPerKgIdr: 15000,
      cargoPerKgIdr: 9000,
      hazmatSurchargeIdr: 10000,
    },
    {
      zone: 'JAWA',
      label: 'Pulau Jawa',
      regularPerKgIdr: 22000,
      cargoPerKgIdr: 13000,
      hazmatSurchargeIdr: 15000,
    },
    {
      zone: 'SUMATERA_BALI',
      label: 'Sumatera & Bali',
      regularPerKgIdr: 35000,
      cargoPerKgIdr: 22000,
      hazmatSurchargeIdr: 25000,
    },
    {
      zone: 'KALIMANTAN_SULAWESI',
      label: 'Kalimantan & Sulawesi',
      regularPerKgIdr: 48000,
      cargoPerKgIdr: 30000,
      hazmatSurchargeIdr: 35000,
    },
    {
      zone: 'INDONESIA_TIMUR',
      label: 'Indonesia Timur (NTB/NTT/Maluku/Papua)',
      regularPerKgIdr: 65000,
      cargoPerKgIdr: 42000,
      hazmatSurchargeIdr: 40000,
    },
  ],
};

export function resolveCombinedShippingClass(classes: ShippingClass[]): ShippingClass {
  let highest: ShippingClass = 'REGULAR';
  for (const cls of classes) {
    if (SHIPPING_CLASS_PRIORITY[cls] > SHIPPING_CLASS_PRIORITY[highest]) {
      highest = cls;
    }
  }
  return highest;
}

export interface ShippingCalculationResult {
  courier: ShippingCourierConfig;
  shippingCostIdr: number;
  woodenPacking: boolean;
  woodenPackingCostIdr: number;
  chargeableKg: number;
}

export function calculateShippingCost(params: {
  shippingSettings: ShippingSettings;
  shippingClass: ShippingClass;
  shippingZone: ShippingZoneCode;
  shippingCourier: ShippingCourierCode;
  totalWeightGrams: number;
  woodenPacking: boolean;
}): ShippingCalculationResult {
  const {
    shippingSettings,
    shippingClass,
    shippingZone,
    shippingCourier,
    totalWeightGrams,
    woodenPacking,
  } = params;

  const couriers =
    shippingSettings.couriers.length > 0
      ? shippingSettings.couriers
      : DEFAULT_SHIPPING_SETTINGS.couriers;
  const zoneRates =
    shippingSettings.zoneRates.length > 0
      ? shippingSettings.zoneRates
      : DEFAULT_SHIPPING_SETTINGS.zoneRates;

  const courier = couriers.find((c) => c.code === shippingCourier);
  if (!courier) {
    throw new AppError(400, 'INVALID_COURIER', 'Ekspedisi pengiriman yang dipilih tidak tersedia.');
  }

  if (!courier.allowedClasses.includes(shippingClass)) {
    throw new AppError(
      400,
      'COURIER_RESTRICTED_FOR_SHIPPING_CLASS',
      `Ekspedisi ${courier.name} tidak diizinkan untuk kelas pengiriman ${shippingClass}. Pilih kargo darat/laut yang kompatibel atau Ambil di Armory.`,
    );
  }

  if (courier.isPickup || courier.code === 'ARMORY_PICKUP') {
    return {
      courier,
      shippingCostIdr: 0,
      woodenPacking: false,
      woodenPackingCostIdr: 0,
      chargeableKg: 0,
    };
  }

  const zoneRate = zoneRates.find((z) => z.zone === shippingZone);
  if (!zoneRate) {
    throw new AppError(400, 'INVALID_SHIPPING_ZONE', 'Zona pengiriman tidak valid.');
  }

  const rawKg = Math.max(1, Math.ceil(totalWeightGrams / 1000));
  const chargeableKg = Math.max(courier.minChargeableKg, rawKg);

  const isRegularCourier = courier.code === 'JNE_REG' || courier.code === 'SICEPAT_REG';
  const perKgRate = isRegularCourier ? zoneRate.regularPerKgIdr : zoneRate.cargoPerKgIdr;

  const baseShipping = Math.round(chargeableKg * perKgRate * courier.baseMultiplier);
  const needsHazmatSurcharge =
    courier.code === 'HAZMAT_LAND_CARGO' || shippingClass === 'CARGO_GAS';
  const shippingCostIdr = baseShipping + (needsHazmatSurcharge ? zoneRate.hazmatSurchargeIdr : 0);

  const woodenPackingCostIdr = woodenPacking
    ? Math.max(0, Math.round(shippingSettings.woodenPackingFeeIdr))
    : 0;

  return {
    courier,
    shippingCostIdr,
    woodenPacking,
    woodenPackingCostIdr,
    chargeableKg,
  };
}
