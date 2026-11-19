import type { Response } from 'express';
import { db } from './connection.ts';
import {
  HERO_KEYFRAME_PATHS,
  type ApiErrorResponse,
  type ArmoryProfileSettings,
  type HeroConfig,
  type HeroSceneTelemetry,
  type HeroSlideConfig,
  type InventoryDefaultSettings,
  type InventoryMutationItem,
  type InventoryMutationReason,
  type LoadoutSlotType,
  type LoadoutSpotlightConfig,
  type MediaType,
  type MissionTag,
  type OrderComplianceData,
  type OrderDetail,
  type OrderItem,
  type OrderStatus,
  type OrderStatusLogItem,
  type OrderSummary,
  type PaymentMethodCode,
  type PlatformType,
  type ProductCompatibility,
  type ProductDetail,
  type ProductMediaItem,
  type ProductSpecs,
  type ProductSummary,
  type PropulsionType,
  type ReplicaUsagePurpose,
  type ShippingClass,
  type ShippingCourierCode,
  type ShippingSettings,
  type ShippingZoneCode,
  type SiteSettingsBundle,
  type StockStatus,
  type Voucher,
  type VoucherDiscountType,
} from '../../shared/types.ts';

export const DEFAULT_MAPS_EMBED_URL =
  'https://maps.google.com/maps?q=Jl.%20Kemang%20Raya%20No.%2048%2C%20Jakarta%20Selatan%2012730&t=&z=15&ie=UTF8&iwloc=&output=embed';

export const DEFAULT_MAPS_DIRECTIONS_URL =
  'https://maps.google.com/?q=Jl.+Kemang+Raya+No.+48,+Jakarta+Selatan';

export const CATEGORY_IMAGE_MAP: Readonly<Record<string, string>> = {
  'assault-rifle': '/media/images/products/brk-ar-001.jpg',
  'smg-pdw': '/media/images/products/brk-smg-001.jpg',
  'sniper-rifle': '/media/images/products/brk-snp-001.jpg',
  'sidearm-pistol': '/media/images/products/brk-pst-001.jpg',
  'optics-aiming': '/media/images/products/brk-opt-002.jpg',
  'plate-carrier-rig': '/media/images/products/brk-rig-001.jpg',
  'helmet-comms': '/media/images/products/brk-hlm-001.jpg',
  'apparel-footwear': '/media/images/products/brk-app-001.jpg',
  'consumables-upgrades': '/media/images/products/brk-upg-001.jpg',
};

export const DEFAULT_ARMORY_PROFILE: ArmoryProfileSettings = {
  storeName: 'Brakasa Tactical',
  tagline: 'Armory Olahraga Airsoft & Perlengkapan Taktis Presisi',
  address: 'Jl. Kemang Raya No. 48, Jakarta Selatan 12730',
  city: 'Jakarta Selatan',
  whatsappNumber: '+62 812-8800-4418',
  supportEmail: 'armory@brakasa.id',
  operatingHours: 'Senin - Sabtu, 10:00 - 19:00 WIB',
  operatingHoursEn: 'Monday - Saturday, 10:00 - 19:00 WIB',
  mapsEmbedUrl: DEFAULT_MAPS_EMBED_URL,
  mapsDirectionsUrl: DEFAULT_MAPS_DIRECTIONS_URL,
  announcementEnabled: false,
  announcementText: '',
  complianceNoticeShort: '',
};

export const DEFAULT_HERO_SLIDES: HeroSlideConfig[] = [
  {
    id: 'slide-1',
    imageUrl: HERO_KEYFRAME_PATHS[0],
    altId: 'Unit airsoft presisi di meja kerja armory Brakasa Tactical',
    altEn: 'Precision airsoft replica on the Brakasa Tactical armory bench',
    headlineId: 'PRESISI ARMORY LAPANGAN',
    headlineEn: 'FIELD ARMORY PRECISION',
    ctaLabelId: 'Belanja Sekarang',
    ctaLabelEn: 'Shop Now',
    ctaUrl: '/store',
    sortOrder: 1,
  },
  {
    id: 'slide-2',
    imageUrl: HERO_KEYFRAME_PATHS[1],
    altId: 'Sistem plate carrier Cordura 500D dan perlengkapan proteksi modular',
    altEn: 'Cordura 500D plate carrier and modular tactical rig system',
    headlineId: 'SISTEM RIG & PROTEKSI',
    headlineEn: 'MODULAR RIG SYSTEMS',
    ctaLabelId: 'Lihat Plate Carrier',
    ctaLabelEn: 'Explore Plate Carriers',
    ctaUrl: '/store?category=plate-carrier-rig',
    sortOrder: 2,
  },
  {
    id: 'slide-3',
    imageUrl: HERO_KEYFRAME_PATHS[4],
    altId: 'Optik red dot dan LPVO presisi pada rail Picatinny Brakasa Tactical',
    altEn: 'Precision red dot and LPVO optics mounted on Picatinny rail',
    headlineId: 'OPTIK & AKUISISI TARGET',
    headlineEn: 'OPTICS & TARGETING',
    ctaLabelId: 'Lihat Optik',
    ctaLabelEn: 'Explore Optics',
    ctaUrl: '/store?category=optics-aiming',
    sortOrder: 3,
  },
  {
    id: 'slide-4',
    imageUrl: HERO_KEYFRAME_PATHS[6],
    altId: 'Unit SMG dan PDW ringkas untuk manuver cepat CQB',
    altEn: 'Compact SMG and PDW platform built for agile CQB play',
    headlineId: 'PERFORMA RINGKAS CQB',
    headlineEn: 'COMPACT CQB READY',
    ctaLabelId: 'Lihat SMG & PDW',
    ctaLabelEn: 'Explore SMG & PDW',
    ctaUrl: '/store?category=smg-pdw',
    sortOrder: 4,
  },
  {
    id: 'slide-5',
    imageUrl: HERO_KEYFRAME_PATHS[9],
    altId: 'Perlengkapan taktis lengkap Brakasa Tactical siap lapangan',
    altEn: 'Complete field-ready tactical gear loadout at Brakasa Tactical',
    headlineId: 'PERLENGKAPAN TAKTIS LENGKAP',
    headlineEn: 'COMPLETE TACTICAL GEAR',
    ctaLabelId: 'Buka Katalog',
    ctaLabelEn: 'Browse Catalog',
    ctaUrl: '/store',
    sortOrder: 5,
  },
];

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string[] | string>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, string[] | string>,
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: Record<string, string[] | string>,
): void {
  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  res.status(status).json(body);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function computeStockStatus(stockQty: number, lowStockThreshold: number): StockStatus {
  if (stockQty <= 0) {
    return 'OUT_OF_STOCK';
  }
  if (stockQty <= lowStockThreshold) {
    return 'LOW_STOCK';
  }
  return 'IN_STOCK';
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function buildSpecsSearchText(
  specs: ProductSpecs,
  compatibility: ProductCompatibility,
  missionTags: MissionTag[],
): string {
  const tokens: string[] = [
    specs.propulsion,
    specs.platform,
    specs.loadout_slot,
    specs.material,
    specs.gearbox_or_system ?? '',
    specs.hop_up ?? '',
    specs.inner_barrel ?? '',
    specs.connector ?? '',
    specs.battery_voltage_rec ?? '',
    specs.gas_type ?? '',
    specs.muzzle_thread ?? '',
    specs.cordura_denier ?? '',
    specs.optic_magnification ?? '',
    specs.bb_weight_rec ?? '',
    ...(specs.rail_type ?? []),
    ...(specs.fire_modes ?? []),
    ...(specs.color_options ?? []),
    ...(compatibility.provides_rails ?? []),
    ...missionTags,
  ];
  return tokens
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item !== 'NONE')
    .join(' ');
}

export function sanitizeFtsQuery(input: string): string | null {
  const chunks = input
    .trim()
    .split(/\s+/)
    .filter((chunk) => chunk.length > 0);
  if (chunks.length === 0) {
    return null;
  }

  const terms: string[] = [];
  for (const chunk of chunks) {
    const parts = chunk.match(/[a-zA-Z0-9]+/g);
    if (!parts || parts.length === 0) {
      continue;
    }
    if (parts.length > 1) {
      terms.push(`"${parts.join(' ')}"`);
    } else {
      terms.push(`"${parts[0]}"*`);
    }
  }

  return terms.length > 0 ? terms.join(' ') : null;
}

export interface ProductDbRow {
  id: number;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  category_id: number;
  category_slug: string;
  category_name: string;
  mission_tags_json: string;
  platform: string;
  propulsion: string;
  loadout_slot: string;
  price_idr: number;
  weight_grams: number;
  fps_min: number | null;
  fps_max: number | null;
  energy_joule: number | null;
  stock_qty: number;
  low_stock_threshold: number;
  is_featured: number;
  is_active: number;
  requires_age_18: number;
  shipping_class: string;
  short_description: string;
  description: string;
  specs_json: string;
  compatibility_tags_json: string;
  created_at: string;
  updated_at: string;
}

interface ProductMediaDbRow {
  id: number;
  product_id: number;
  media_type: string;
  url: string;
  poster_url: string | null;
  alt_text: string;
  duration_sec: number | null;
  is_primary: number;
  sort_order: number;
}

export function mapMediaRow(row: ProductMediaDbRow): ProductMediaItem {
  return {
    id: Number(row.id),
    productId: Number(row.product_id),
    mediaType: row.media_type as MediaType,
    url: row.url,
    posterUrl: row.poster_url,
    altText: row.alt_text,
    durationSec: row.duration_sec !== null ? Number(row.duration_sec) : null,
    isPrimary: Number(row.is_primary) === 1,
    sortOrder: Number(row.sort_order),
  };
}

export function getMediaByProductIds(productIds: number[]): Map<number, ProductMediaItem[]> {
  const result = new Map<number, ProductMediaItem[]>();
  if (productIds.length === 0) {
    return result;
  }
  const placeholders = productIds.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT id, product_id, media_type, url, poster_url, alt_text, duration_sec, is_primary, sort_order
       FROM product_media
       WHERE product_id IN (${placeholders})
       ORDER BY sort_order ASC, id ASC`,
    )
    .all(...productIds) as unknown as ProductMediaDbRow[];

  for (const row of rows) {
    const item = mapMediaRow(row);
    const list = result.get(item.productId) ?? [];
    list.push(item);
    result.set(item.productId, list);
  }
  return result;
}

export function mapProductSummary(row: ProductDbRow, media: ProductMediaItem[]): ProductSummary {
  const primaryImage =
    media.find((m) => m.mediaType === 'image' && m.isPrimary) ??
    media.find((m) => m.mediaType === 'image');
  const secondaryImage =
    media.find(
      (m) =>
        m.mediaType === 'image' &&
        m.id !== primaryImage?.id &&
        m.url !== primaryImage?.url,
    ) ?? null;
  const demoVideo = media.find((m) => m.mediaType === 'video') ?? null;

  const defaultSpecs: ProductSpecs = {
    propulsion: row.propulsion as PropulsionType,
    platform: row.platform as PlatformType,
    loadout_slot: row.loadout_slot as LoadoutSlotType,
    fps_min: row.fps_min,
    fps_max: row.fps_max,
    energy_joule: row.energy_joule,
    connector: null,
    has_mosfet: null,
    muzzle_thread: null,
    rail_type: [],
    material: '',
    cordura_denier: null,
  };
  const defaultCompatibility: ProductCompatibility = {
    loadout_slot: row.loadout_slot as LoadoutSlotType,
    platform_family: row.platform as PlatformType,
    propulsion: row.propulsion as PropulsionType,
  };

  return {
    id: Number(row.id),
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    categoryId: Number(row.category_id),
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    missionTags: safeJsonParse<MissionTag[]>(row.mission_tags_json, []),
    platform: row.platform as PlatformType,
    propulsion: row.propulsion as PropulsionType,
    loadoutSlot: row.loadout_slot as LoadoutSlotType,
    priceIdr: Number(row.price_idr),
    weightGrams: Number(row.weight_grams),
    fpsMin: row.fps_min !== null ? Number(row.fps_min) : null,
    fpsMax: row.fps_max !== null ? Number(row.fps_max) : null,
    energyJoule: row.energy_joule !== null ? Number(row.energy_joule) : null,
    stockQty: Number(row.stock_qty),
    lowStockThreshold: Number(row.low_stock_threshold),
    stockStatus: computeStockStatus(Number(row.stock_qty), Number(row.low_stock_threshold)),
    isFeatured: Number(row.is_featured) === 1,
    isActive: Number(row.is_active) === 1,
    requiresAge18: Number(row.requires_age_18) === 1,
    shippingClass: row.shipping_class as ShippingClass,
    shortDescription: row.short_description,
    primaryImageUrl: primaryImage?.url ?? '/media/images/products/brk-ar-001.jpg',
    primaryImageAlt: primaryImage?.altText ?? row.name,
    secondaryImageUrl: secondaryImage?.url ?? null,
    detailImageUrl: secondaryImage?.url ?? null,
    hasVideo: demoVideo !== null,
    demoVideoUrl: demoVideo?.url ?? null,
    demoVideoPosterUrl: demoVideo?.posterUrl ?? primaryImage?.url ?? null,
    demoVideoDurationSec: demoVideo?.durationSec ?? null,
    specs: safeJsonParse<ProductSpecs>(row.specs_json, defaultSpecs),
    compatibility: safeJsonParse<ProductCompatibility>(row.compatibility_tags_json, defaultCompatibility),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProductDetail(row: ProductDbRow, media: ProductMediaItem[]): ProductDetail {
  return {
    ...mapProductSummary(row, media),
    description: row.description,
    media,
  };
}

export function hydrateProductSummaries(rows: ProductDbRow[]): ProductSummary[] {
  const ids = rows.map((r) => Number(r.id));
  const mediaMap = getMediaByProductIds(ids);
  return rows.map((row) => mapProductSummary(row, mediaMap.get(Number(row.id)) ?? []));
}

export function hydrateProductDetails(rows: ProductDbRow[]): ProductDetail[] {
  const ids = rows.map((r) => Number(r.id));
  const mediaMap = getMediaByProductIds(ids);
  return rows.map((row) => mapProductDetail(row, mediaMap.get(Number(row.id)) ?? []));
}

export const PRODUCT_SELECT_BASE = `
  SELECT
    p.id, p.sku, p.slug, p.name, p.brand, p.category_id,
    c.slug AS category_slug, c.name AS category_name,
    p.mission_tags_json, p.platform, p.propulsion, p.loadout_slot,
    p.price_idr, p.weight_grams, p.fps_min, p.fps_max, p.energy_joule,
    p.stock_qty, p.low_stock_threshold, p.is_featured, p.is_active,
    p.requires_age_18, p.shipping_class, p.short_description, p.description,
    p.specs_json, p.compatibility_tags_json, p.created_at, p.updated_at
  FROM products p
  JOIN categories c ON c.id = p.category_id
`;

export interface VoucherDbRow {
  id: number;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  max_discount_idr: number | null;
  min_subtotal_idr: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_public: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export function mapVoucherRow(row: VoucherDbRow): Voucher {
  return {
    id: Number(row.id),
    code: row.code,
    description: row.description,
    discountType: row.discount_type as VoucherDiscountType,
    discountValue: Number(row.discount_value),
    maxDiscountIdr: row.max_discount_idr !== null ? Number(row.max_discount_idr) : null,
    minSubtotalIdr: Number(row.min_subtotal_idr),
    maxUses: row.max_uses !== null ? Number(row.max_uses) : null,
    usedCount: Number(row.used_count),
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    isPublic: Number(row.is_public) === 1,
    isActive: Number(row.is_active) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface OrderDbRow {
  id: number;
  invoice_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_zone: string;
  shipping_city: string;
  shipping_district: string;
  shipping_postal_code: string;
  shipping_address: string;
  shipping_notes: string | null;
  shipping_courier: string;
  shipping_class: string;
  wooden_packing: number;
  wooden_packing_cost_idr: number;
  shipping_cost_idr: number;
  tracking_number: string | null;
  payment_method: string;
  subtotal_idr: number;
  discount_idr: number;
  total_idr: number;
  voucher_code: string | null;
  requires_age_18: number;
  buyer_dob: string | null;
  buyer_age_years: number | null;
  age_18_confirmed: number;
  sport_use_declaration: number;
  club_kta_number: string | null;
  usage_purpose: string | null;
  stock_restored: number;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface OrderItemDbRow {
  id: number;
  order_id: number;
  product_id: number | null;
  sku_snapshot: string;
  name_snapshot: string;
  image_url_snapshot: string;
  unit_price_idr: number;
  weight_grams_snapshot: number;
  quantity: number;
  line_total_idr: number;
}

export interface OrderStatusLogDbRow {
  id: number;
  order_id: number;
  from_status: string | null;
  to_status: string;
  note: string | null;
  actor: string;
  created_at: string;
}

export function mapOrderSummary(row: OrderDbRow, itemCountFallback = 0): OrderSummary {
  return {
    id: Number(row.id),
    invoiceNumber: row.invoice_number,
    status: row.status as OrderStatus,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingZone: row.shipping_zone as ShippingZoneCode,
    shippingCity: row.shipping_city,
    shippingCourier: row.shipping_courier as ShippingCourierCode,
    shippingClass: row.shipping_class as ShippingClass,
    woodenPacking: Number(row.wooden_packing) === 1,
    trackingNumber: row.tracking_number,
    paymentMethod: row.payment_method as PaymentMethodCode,
    subtotalIdr: Number(row.subtotal_idr),
    discountIdr: Number(row.discount_idr),
    shippingCostIdr: Number(row.shipping_cost_idr),
    woodenPackingCostIdr: Number(row.wooden_packing_cost_idr),
    totalIdr: Number(row.total_idr),
    voucherCode: row.voucher_code,
    requiresAge18: Number(row.requires_age_18) === 1,
    buyerAgeYears: row.buyer_age_years !== null ? Number(row.buyer_age_years) : null,
    itemCount: row.item_count !== undefined ? Number(row.item_count) : itemCountFallback,
    stockRestored: Number(row.stock_restored) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapOrderItem(row: OrderItemDbRow): OrderItem {
  return {
    id: Number(row.id),
    orderId: Number(row.order_id),
    productId: row.product_id !== null ? Number(row.product_id) : null,
    skuSnapshot: row.sku_snapshot,
    nameSnapshot: row.name_snapshot,
    imageUrlSnapshot: row.image_url_snapshot,
    unitPriceIdr: Number(row.unit_price_idr),
    weightGramsSnapshot: Number(row.weight_grams_snapshot),
    quantity: Number(row.quantity),
    lineTotalIdr: Number(row.line_total_idr),
  };
}

export function mapOrderDetail(row: OrderDbRow, items: OrderItem[]): OrderDetail {
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const compliance: OrderComplianceData = {
    requiresAge18: Number(row.requires_age_18) === 1,
    buyerDob: row.buyer_dob,
    buyerAgeYears: row.buyer_age_years !== null ? Number(row.buyer_age_years) : null,
    age18Confirmed: Number(row.age_18_confirmed) === 1,
    sportUseDeclaration: Number(row.sport_use_declaration) === 1,
    clubKtaNumber: row.club_kta_number,
    usagePurpose: (row.usage_purpose as ReplicaUsagePurpose | null) ?? null,
  };
  return {
    ...mapOrderSummary(row, totalQty),
    shippingDistrict: row.shipping_district,
    shippingPostalCode: row.shipping_postal_code,
    shippingAddress: row.shipping_address,
    shippingNotes: row.shipping_notes,
    cancelReason: row.cancel_reason,
    compliance,
    items,
  };
}

export function mapOrderStatusLog(row: OrderStatusLogDbRow): OrderStatusLogItem {
  return {
    id: Number(row.id),
    orderId: Number(row.order_id),
    fromStatus: (row.from_status as OrderStatus | null) ?? null,
    toStatus: row.to_status as OrderStatus,
    note: row.note,
    actor: row.actor,
    createdAt: row.created_at,
  };
}

export interface InventoryMutationDbRow {
  id: number;
  product_id: number;
  product_sku: string;
  product_name: string;
  delta_qty: number;
  stock_before: number;
  stock_after: number;
  reason: string;
  reference_id: string | null;
  note: string;
  actor: string;
  created_at: string;
}

export function mapInventoryMutation(row: InventoryMutationDbRow): InventoryMutationItem {
  return {
    id: Number(row.id),
    productId: Number(row.product_id),
    productSku: row.product_sku,
    productName: row.product_name,
    deltaQty: Number(row.delta_qty),
    stockBefore: Number(row.stock_before),
    stockAfter: Number(row.stock_after),
    reason: row.reason as InventoryMutationReason,
    referenceId: row.reference_id,
    note: row.note,
    actor: row.actor,
    createdAt: row.created_at,
  };
}

export function getSettingValue<T>(key: string, fallback: T): T {
  const row = db
    .prepare('SELECT value_json FROM site_settings WHERE key = ?')
    .get(key) as { value_json: string } | undefined;
  return safeJsonParse<T>(row?.value_json, fallback);
}

export function getSiteSettingsBundle(): { settings: SiteSettingsBundle; updatedAt: string | null } {
  const rows = db
    .prepare('SELECT key, value_json, updated_at FROM site_settings')
    .all() as Array<{ key: string; value_json: string; updated_at: string }>;

  const map = new Map<string, string>();
  let latestUpdatedAt: string | null = null;
  for (const row of rows) {
    map.set(row.key, row.value_json);
    if (!latestUpdatedAt || row.updated_at > latestUpdatedAt) {
      latestUpdatedAt = row.updated_at;
    }
  }

  const rawProfile = safeJsonParse<Partial<ArmoryProfileSettings>>(
    map.get('armory_profile'),
    {},
  );
  const armoryProfile: ArmoryProfileSettings = {
    storeName: rawProfile.storeName || DEFAULT_ARMORY_PROFILE.storeName,
    tagline: rawProfile.tagline ?? DEFAULT_ARMORY_PROFILE.tagline,
    address: rawProfile.address || DEFAULT_ARMORY_PROFILE.address,
    city: rawProfile.city || DEFAULT_ARMORY_PROFILE.city,
    whatsappNumber: rawProfile.whatsappNumber || DEFAULT_ARMORY_PROFILE.whatsappNumber,
    supportEmail: rawProfile.supportEmail || DEFAULT_ARMORY_PROFILE.supportEmail,
    operatingHours: rawProfile.operatingHours || DEFAULT_ARMORY_PROFILE.operatingHours,
    operatingHoursEn: rawProfile.operatingHoursEn || DEFAULT_ARMORY_PROFILE.operatingHoursEn,
    mapsEmbedUrl: rawProfile.mapsEmbedUrl || DEFAULT_MAPS_EMBED_URL,
    mapsDirectionsUrl: rawProfile.mapsDirectionsUrl || DEFAULT_MAPS_DIRECTIONS_URL,
    announcementEnabled: Boolean(rawProfile.announcementEnabled ?? false),
    announcementText: rawProfile.announcementText ?? '',
    complianceNoticeShort: rawProfile.complianceNoticeShort ?? '',
  };

  const rawHeroSlides = safeJsonParse<HeroSlideConfig[]>(map.get('hero_slides'), []);
  const heroSlides: HeroSlideConfig[] =
    Array.isArray(rawHeroSlides) && rawHeroSlides.length > 0
      ? [...rawHeroSlides].sort((a, b) => a.sortOrder - b.sortOrder)
      : DEFAULT_HERO_SLIDES.map((slide) => ({ ...slide }));

  const settings: SiteSettingsBundle = {
    armoryProfile,
    heroSlides,
    heroConfig: safeJsonParse<HeroConfig>(
      map.get('hero_config'),
      {
        videoUrl: '/media/videos/hero-tactical-reel.mp4',
        posterUrl: HERO_KEYFRAME_PATHS[0],
        durationSec: 24.0,
        headline: 'Presisi Armory Lapangan',
        subheadline:
          'Replika airsoft AEG, GBBR, sniper, optik, dan sistem plate carrier dengan data teknis lengkap.',
        primaryCtaLabel: 'Belanja Sekarang',
        primaryCtaUrl: '/store',
        secondaryCtaLabel: 'Buka Katalog',
        secondaryCtaUrl: '/store',
        cacheVersion: '2',
      },
    ),
    heroScenes: safeJsonParse<HeroSceneTelemetry[]>(map.get('hero_scenes'), []),
    spotlightConfig: safeJsonParse<LoadoutSpotlightConfig>(
      map.get('spotlight_config'),
      {
        title: 'Inspeksi Konfigurasi Rig Lapangan',
        subtitle:
          'Pilih titik komponen pada rig untuk memeriksa spesifikasi material dan ketersediaan stok.',
        imageUrl: '/media/images/hero/hero-scene-10.jpg',
        imageAlt: 'Konfigurasi perlengkapan taktis Brakasa Tactical',
        presetKey: 'gbb-realism-kit',
        hotspots: [],
      },
    ),
    shippingSettings: safeJsonParse<ShippingSettings>(
      map.get('shipping_settings'),
      {
        woodenPackingFeeIdr: 75000,
        couriers: [],
        zoneRates: [],
      },
    ),
    inventoryDefaults: safeJsonParse<InventoryDefaultSettings>(
      map.get('inventory_defaults'),
      { defaultLowStockThreshold: 4 },
    ),
  };

  return { settings, updatedAt: latestUpdatedAt };
}
