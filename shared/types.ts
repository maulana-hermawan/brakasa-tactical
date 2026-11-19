/**
 * Brakasa Tactical - Shared Pure TypeScript Contracts
 *
 * ZERO external imports allowed in this file so it can be imported safely
 * by both `server/` (Node.js v24 + Express 5 + node:sqlite) and `src/`
 * (React 19 + Vite 8) without circular dependencies or bundler conflicts.
 */

// Locked generative media path conventions (synchronized with media pipeline)

export const HERO_KEYFRAME_PATHS = [
  '/media/images/hero/hero-scene-01.jpg',
  '/media/images/hero/hero-scene-02.jpg',
  '/media/images/hero/hero-scene-03.jpg',
  '/media/images/hero/hero-scene-04.jpg',
  '/media/images/hero/hero-scene-05.jpg',
  '/media/images/hero/hero-scene-06.jpg',
  '/media/images/hero/hero-scene-07.jpg',
  '/media/images/hero/hero-scene-08.jpg',
  '/media/images/hero/hero-scene-09.jpg',
  '/media/images/hero/hero-scene-10.jpg',
] as const;

export const HERO_VIDEO_PATH = '/media/videos/hero-tactical-reel.mp4' as const;
export const HERO_POSTER_PATH = '/media/videos/hero-tactical-poster.jpg' as const;

export interface ProductMediaAssetConvention {
  readonly sku: string;
  readonly primaryImage: string;
  readonly detailImage?: string;
  readonly demoVideo?: string;
  readonly demoVideoPoster?: string;
}

export const PRODUCT_MEDIA_CONVENTIONS: readonly ProductMediaAssetConvention[] = [
  {
    sku: 'BRK-AR-001',
    primaryImage: '/media/images/products/brk-ar-001.jpg',
    detailImage: '/media/images/products/brk-ar-001-detail.jpg',
    demoVideo: '/media/videos/product-brk-ar-001.mp4',
    demoVideoPoster: '/media/videos/product-brk-ar-001-poster.jpg',
  },
  {
    sku: 'BRK-AR-002',
    primaryImage: '/media/images/products/brk-ar-002.jpg',
    detailImage: '/media/images/products/brk-ar-002-detail.jpg',
    demoVideo: '/media/videos/product-brk-ar-002.mp4',
    demoVideoPoster: '/media/videos/product-brk-ar-002-poster.jpg',
  },
  {
    sku: 'BRK-AR-003',
    primaryImage: '/media/images/products/brk-ar-003.jpg',
  },
  {
    sku: 'BRK-SMG-001',
    primaryImage: '/media/images/products/brk-smg-001.jpg',
    detailImage: '/media/images/products/brk-smg-001-detail.jpg',
    demoVideo: '/media/videos/product-brk-smg-001.mp4',
    demoVideoPoster: '/media/videos/product-brk-smg-001-poster.jpg',
  },
  {
    sku: 'BRK-SNP-001',
    primaryImage: '/media/images/products/brk-snp-001.jpg',
    detailImage: '/media/images/products/brk-snp-001-detail.jpg',
    demoVideo: '/media/videos/product-brk-snp-001.mp4',
    demoVideoPoster: '/media/videos/product-brk-snp-001-poster.jpg',
  },
  {
    sku: 'BRK-PST-001',
    primaryImage: '/media/images/products/brk-pst-001.jpg',
    detailImage: '/media/images/products/brk-pst-001-detail.jpg',
    demoVideo: '/media/videos/product-brk-pst-001.mp4',
    demoVideoPoster: '/media/videos/product-brk-pst-001-poster.jpg',
  },
  {
    sku: 'BRK-OPT-001',
    primaryImage: '/media/images/products/brk-opt-001.jpg',
  },
  {
    sku: 'BRK-OPT-002',
    primaryImage: '/media/images/products/brk-opt-002.jpg',
    demoVideo: '/media/videos/product-brk-opt-002.mp4',
    demoVideoPoster: '/media/videos/product-brk-opt-002-poster.jpg',
  },
  {
    sku: 'BRK-OPT-003',
    primaryImage: '/media/images/products/brk-opt-003.jpg',
  },
  {
    sku: 'BRK-RIG-001',
    primaryImage: '/media/images/products/brk-rig-001.jpg',
    detailImage: '/media/images/products/brk-rig-001-detail.jpg',
    demoVideo: '/media/videos/product-brk-rig-001.mp4',
    demoVideoPoster: '/media/videos/product-brk-rig-001-poster.jpg',
  },
  {
    sku: 'BRK-RIG-002',
    primaryImage: '/media/images/products/brk-rig-002.jpg',
  },
  {
    sku: 'BRK-HLM-001',
    primaryImage: '/media/images/products/brk-hlm-001.jpg',
  },
  {
    sku: 'BRK-HLM-002',
    primaryImage: '/media/images/products/brk-hlm-002.jpg',
  },
  {
    sku: 'BRK-APP-001',
    primaryImage: '/media/images/products/brk-app-001.jpg',
  },
  {
    sku: 'BRK-APP-002',
    primaryImage: '/media/images/products/brk-app-002.jpg',
  },
  {
    sku: 'BRK-APP-003',
    primaryImage: '/media/images/products/brk-app-003.jpg',
  },
  {
    sku: 'BRK-CSM-001',
    primaryImage: '/media/images/products/brk-csm-001.jpg',
  },
  {
    sku: 'BRK-CSM-002',
    primaryImage: '/media/images/products/brk-csm-002.jpg',
  },
  {
    sku: 'BRK-CSM-003',
    primaryImage: '/media/images/products/brk-csm-003.jpg',
  },
  {
    sku: 'BRK-UPG-001',
    primaryImage: '/media/images/products/brk-upg-001.jpg',
  },
] as const;

// Domain unions and constants (Node 24 native type-stripping safe)

export const CATEGORY_SLUGS = [
  'assault-rifle',
  'smg-pdw',
  'sniper-rifle',
  'sidearm-pistol',
  'optics-aiming',
  'plate-carrier-rig',
  'helmet-comms',
  'apparel-footwear',
  'consumables-upgrades',
] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const MISSION_TAGS = [
  'cqb',
  'woodland-recce',
  'speedqb',
  'rig-protection',
] as const;
export type MissionTag = (typeof MISSION_TAGS)[number];

export const PLATFORM_TYPES = [
  'M4_AR15',
  'AK_SERIES',
  'SMG_PDW',
  'BOLT_ACTION',
  'PISTOL_G_SERIES',
  'UNIVERSAL_MOLLE',
  'UNIVERSAL_PICATINNY',
  'APPAREL_FOOTWEAR',
  'CONSUMABLE',
] as const;
export type PlatformType = (typeof PLATFORM_TYPES)[number];

export const PROPULSION_TYPES = [
  'AEG',
  'GBBR',
  'GBB_PISTOL',
  'CO2',
  'SPRING',
  'NON_REPLICA',
] as const;
export type PropulsionType = (typeof PROPULSION_TYPES)[number];

export const LOADOUT_SLOT_TYPES = [
  'primary',
  'sidearm',
  'optic',
  'rig_protection',
  'power_consumables',
] as const;
export type LoadoutSlotType = (typeof LOADOUT_SLOT_TYPES)[number];

export type FieldFpsClass =
  | 'CQB_STRICT'
  | 'CQB_STANDARD'
  | 'WOODLAND_ASSAULT'
  | 'DMR_SNIPER';

export type BatteryConnectorType = 'DEANS_T_PLUG' | 'MINI_TAMIYA' | 'NONE';

export type BatteryFormFactor =
  | 'STICK_BUFFER_TUBE'
  | 'NUNCHUCK'
  | 'PEQ_BOX'
  | 'NONE';

export type GasType = 'GREEN_GAS' | 'CO2_12G' | 'NONE';

export type PowerSourceType =
  | 'LIPO_BATTERY'
  | 'GREEN_GAS'
  | 'CO2_12G'
  | 'SPRING_MANUAL'
  | 'NONE';

export type MuzzleThreadType =
  | '14MM_CCW'
  | 'M24X1_CW'
  | '11MM_CW_PISTOL'
  | 'NONE';

export type RailMountType =
  | 'PICATINNY_1913'
  | 'M_LOK'
  | 'AK_SIDE_DOVETAIL'
  | 'MOLLE_PALS_LASER_CUT'
  | 'SWIFTCLIP_PLACARD'
  | 'ARC_HELMET_RAIL'
  | 'NVG_SHROUD'
  | 'NONE';

export type CorduraDenierType =
  | '500D'
  | '1000D'
  | '500D_1000D_LAMINATE'
  | 'NYCO_50_50_RIPSTOP'
  | 'NONE';

export type MagFamilyType =
  | 'M4_556_AEG'
  | 'M4_556_MWS_GBBR'
  | 'AK_545_AEG'
  | 'SMG_9MM_ARP9'
  | 'TAC41_BOLT'
  | 'GLOCK_G17_GBB'
  | 'UNIVERSAL';

export type OpticClassType =
  | 'RED_DOT'
  | 'LPVO_MAGNIFIED'
  | 'LASER_ILLUMINATOR'
  | 'SNIPER_SCOPE';

export const SHIPPING_CLASSES = [
  'REGULAR',
  'CARGO_BATTERY',
  'CARGO_REPLICA',
  'CARGO_GAS',
] as const;
export type ShippingClass = (typeof SHIPPING_CLASSES)[number];

export const SHIPPING_CLASS_PRIORITY: Record<ShippingClass, number> = {
  REGULAR: 0,
  CARGO_BATTERY: 1,
  CARGO_REPLICA: 2,
  CARGO_GAS: 3,
};

export const SHIPPING_ZONES = [
  'JABODETABEK',
  'JAWA',
  'SUMATERA_BALI',
  'KALIMANTAN_SULAWESI',
  'INDONESIA_TIMUR',
] as const;
export type ShippingZoneCode = (typeof SHIPPING_ZONES)[number];

export const SHIPPING_COURIERS = [
  'JNE_REG',
  'SICEPAT_REG',
  'JNE_TRUCKING',
  'INDAH_CARGO',
  'DAKOTA_CARGO',
  'HAZMAT_LAND_CARGO',
  'ARMORY_PICKUP',
] as const;
export type ShippingCourierCode = (typeof SHIPPING_COURIERS)[number];

export const PAYMENT_METHODS = [
  'VA_BCA',
  'VA_MANDIRI',
  'QRIS',
  'BANK_TRANSFER_ARMORY',
] as const;
export type PaymentMethodCode = (typeof PAYMENT_METHODS)[number];

export const REPLICA_USAGE_PURPOSES = [
  'SKIRMISH_CLUB',
  'TARGET_SPORT_RANGE',
  'PRIVATE_COLLECTION',
] as const;
export type ReplicaUsagePurpose = (typeof REPLICA_USAGE_PURPOSES)[number];

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type MediaType = 'image' | 'video';

export type VoucherDiscountType = 'PERCENT' | 'FIXED';

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID_VERIFIED',
  'PACKED',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ALLOWED_ORDER_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  PENDING_PAYMENT: ['PAID_VERIFIED', 'CANCELLED'],
  PAID_VERIFIED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const INVENTORY_MUTATION_REASONS = [
  'INITIAL_SEED',
  'CHECKOUT_DEDUCT',
  'ORDER_CANCEL_RESTOCK',
  'MANUAL_RESTOCK',
  'AUDIT_ADJUSTMENT',
] as const;
export type InventoryMutationReason =
  (typeof INVENTORY_MUTATION_REASONS)[number];

export type AdminRole = 'SUPER_ADMIN' | 'OPERATIONS_ADMIN';

export type ProductSortOption =
  | 'featured'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'fps_asc'
  | 'fps_desc';

export type CompatibilitySeverity =
  | 'COMPATIBLE'
  | 'INFO'
  | 'WARNING'
  | 'CONFLICT';

export type LoadoutWeightClass =
  | 'ULTRALIGHT'
  | 'BALANCED_TACTICAL'
  | 'HEAVY_DIRECT_ACTION';

export type LoadoutRuleCode =
  | 'GBBR_GREEN_GAS_OK'
  | 'MISSING_GREEN_GAS'
  | 'AEG_DEANS_LIPO_OK'
  | 'MISSING_LIPO_DEANS'
  | 'AK74M_CONNECTOR_VOLTAGE_CONFLICT'
  | 'AK74M_NEEDS_74V_TAMIYA'
  | 'REDUNDANT_LIPO'
  | 'REDUNDANT_GREEN_GAS'
  | 'MUZZLE_14CCW_OK'
  | 'MUZZLE_M24_CONFLICT'
  | 'MUZZLE_PISTOL_NON_THREADED'
  | 'OPTIC_PICATINNY_OK'
  | 'AK74M_NEEDS_RAIL_ADAPTER'
  | 'LPVO_ON_CQB_PDW'
  | 'REDDOT_ONLY_ON_SNIPER'
  | 'DUPLICATE_OPTIC'
  | 'MISSING_BB'
  | 'BB_028_OPTIMAL_OUTDOOR'
  | 'BB_028_SNIPER_BASELINE'
  | 'BB_028_CQB_NOTE'
  | 'TRACER_GLOW_BB_REMINDER'
  | 'MED_OVER_400_NO_SIDEARM'
  | 'MED_OVER_400_COVERED'
  | 'PERPOL_JOULE_COMPLIANT'
  | 'FCPC_PLACARD_MATCH'
  | 'HELMET_COMMS_MATCH'
  | 'PLACARD_556_INSERT_NOTE';

// Structured JSON contracts for specs_json and compatibility_tags_json

export interface ProductSpecs {
  propulsion: PropulsionType;
  platform: PlatformType;
  loadout_slot: LoadoutSlotType;
  fps_min: number | null;
  fps_max: number | null;
  fps_test_bb_gram?: number | null;
  energy_joule: number | null;
  field_role?: FieldFpsClass | null;
  gearbox_or_system?: string | null;
  fire_modes?: string[];
  hop_up?: string | null;
  inner_barrel?: string | null;
  magazine_capacity_rds?: number | null;
  connector: BatteryConnectorType | null;
  has_mosfet: boolean | null;
  battery_voltage_rec?: string | null;
  battery_form_factor?: BatteryFormFactor | null;
  gas_type?: GasType | null;
  muzzle_thread: MuzzleThreadType | null;
  rail_type: RailMountType[];
  material: string;
  cordura_denier: CorduraDenierType | null;
  optic_magnification?: string | null;
  optic_mount?: RailMountType | null;
  bb_weight_gram?: number | null;
  bb_weight_rec?: string | null;
  orange_tip_compliant?: boolean;
  safety_certification?: string | null;
  dimensions_mm?: string | null;
  color_options?: string[];
  in_the_box?: string[];
  required_to_operate?: string[];
  extra?: Record<string, string | number | boolean>;
}

export interface ProductCompatibility {
  loadout_slot: LoadoutSlotType;
  platform_family: PlatformType;
  propulsion: PropulsionType;
  required_power_type?: PowerSourceType | null;
  provides_power_type?: PowerSourceType | null;
  battery_connector?: BatteryConnectorType | null;
  supports_11v_lipo?: boolean | null;
  battery_voltage_v?: number | null;
  battery_form_factor?: BatteryFormFactor | null;
  required_battery_form_factors?: BatteryFormFactor[];
  provides_rails?: RailMountType[];
  requires_rail?: RailMountType | null;
  muzzle_thread?: MuzzleThreadType | null;
  supported_muzzle_threads?: MuzzleThreadType[];
  mag_family?: MagFamilyType | null;
  supported_mag_families?: MagFamilyType[];
  placard_interface?: boolean;
  arc_rail_compatible?: boolean;
  bb_weight_gram?: number | null;
  recommended_bb_min_gram?: number | null;
  recommended_bb_max_gram?: number | null;
  optic_class?: OpticClassType | null;
  compatible_skus?: string[];
}

// Core entity DTOs

export interface Category {
  id: number;
  slug: CategorySlug | string;
  name: string;
  description: string;
  sortOrder: number;
}

export interface CategoryWithCount extends Category {
  activeProductCount: number;
  imageUrl: string;
}

export interface ProductMediaItem {
  id: number;
  productId: number;
  mediaType: MediaType;
  url: string;
  posterUrl: string | null;
  altText: string;
  durationSec: number | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductMediaInput {
  mediaType: MediaType;
  url: string;
  posterUrl?: string | null;
  altText: string;
  durationSec?: number | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductSummary {
  id: number;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  missionTags: MissionTag[];
  platform: PlatformType;
  propulsion: PropulsionType;
  loadoutSlot: LoadoutSlotType;
  priceIdr: number;
  weightGrams: number;
  fpsMin: number | null;
  fpsMax: number | null;
  energyJoule: number | null;
  stockQty: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  isFeatured: boolean;
  isActive: boolean;
  requiresAge18: boolean;
  shippingClass: ShippingClass;
  shortDescription: string;
  primaryImageUrl: string;
  primaryImageAlt: string;
  secondaryImageUrl?: string | null;
  detailImageUrl?: string | null;
  hasVideo: boolean;
  demoVideoUrl: string | null;
  demoVideoPosterUrl: string | null;
  demoVideoDurationSec: number | null;
  specs: ProductSpecs;
  compatibility: ProductCompatibility;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  media: ProductMediaItem[];
}

export interface MissionSummary {
  mission: MissionTag;
  title: string;
  subtitle: string;
  fpsProfile: string;
  medGuideline: string;
  activeProductCount: number;
  minPriceIdr: number | null;
  maxPriceIdr: number | null;
  targetUrl: string;
}

export interface HeroSceneTelemetry {
  index: number;
  code: string;
  title: string;
  startSec: number;
  endSec: number;
  keyframeUrl: string;
  telemetryMeta: string;
  platformTag: string;
  targetUrl: string;
  targetLabel: string;
}

export interface HeroConfig {
  videoUrl: string;
  posterUrl: string;
  durationSec: number;
  headline: string;
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  cacheVersion: string;
}

export interface HeroSlideConfig {
  id: string;
  imageUrl: string;
  altId: string;
  altEn: string;
  headlineId: string;
  headlineEn: string;
  ctaLabelId: string;
  ctaLabelEn: string;
  ctaUrl: string;
  sortOrder: number;
}

export interface ArmoryProfileSettings {
  storeName: string;
  tagline: string;
  address: string;
  city: string;
  whatsappNumber: string;
  supportEmail: string;
  operatingHours: string;
  operatingHoursEn?: string;
  mapsEmbedUrl?: string;
  mapsDirectionsUrl?: string;
  announcementEnabled: boolean;
  announcementText: string;
  complianceNoticeShort: string;
}

export interface LoadoutSpotlightHotspot {
  id: string;
  code: string;
  label: string;
  xPercent: number;
  yPercent: number;
  productSku: string;
}

export interface LoadoutSpotlightHotspotResolved extends LoadoutSpotlightHotspot {
  product: ProductSummary | null;
}

export interface LoadoutSpotlightConfig {
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  presetKey: string;
  hotspots: LoadoutSpotlightHotspot[];
}

export interface LoadoutSpotlightResolved {
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  presetKey: string;
  hotspots: LoadoutSpotlightHotspotResolved[];
  totalPriceIdr: number;
  totalWeightGrams: number;
}

export interface ShippingCourierConfig {
  code: ShippingCourierCode;
  name: string;
  description: string;
  etaDays: string;
  allowedClasses: ShippingClass[];
  baseMultiplier: number;
  minChargeableKg: number;
  isPickup: boolean;
}

export interface ShippingZoneRate {
  zone: ShippingZoneCode;
  label: string;
  regularPerKgIdr: number;
  cargoPerKgIdr: number;
  hazmatSurchargeIdr: number;
}

export interface ShippingSettings {
  woodenPackingFeeIdr: number;
  couriers: ShippingCourierConfig[];
  zoneRates: ShippingZoneRate[];
}

export interface InventoryDefaultSettings {
  defaultLowStockThreshold: number;
}

export interface SiteSettingsBundle {
  armoryProfile: ArmoryProfileSettings;
  heroSlides: HeroSlideConfig[];
  heroConfig?: HeroConfig;
  heroScenes?: HeroSceneTelemetry[];
  spotlightConfig?: LoadoutSpotlightConfig;
  shippingSettings: ShippingSettings;
  inventoryDefaults: InventoryDefaultSettings;
}

export interface PublicSiteSettings {
  armoryProfile: ArmoryProfileSettings;
  heroSlides: HeroSlideConfig[];
  heroConfig?: HeroConfig;
  heroScenes?: HeroSceneTelemetry[];
  spotlight?: LoadoutSpotlightResolved;
  shippingSettings: ShippingSettings;
}

export interface Voucher {
  id: number;
  code: string;
  description: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountIdr: number | null;
  minSubtotalIdr: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicVoucherPromo {
  code: string;
  description: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountIdr: number | null;
  minSubtotalIdr: number;
  expiresAt: string | null;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  skuSnapshot: string;
  nameSnapshot: string;
  imageUrlSnapshot: string;
  unitPriceIdr: number;
  weightGramsSnapshot: number;
  quantity: number;
  lineTotalIdr: number;
}

export interface OrderComplianceData {
  requiresAge18: boolean;
  buyerDob: string | null;
  buyerAgeYears: number | null;
  age18Confirmed: boolean;
  sportUseDeclaration: boolean;
  clubKtaNumber: string | null;
  usagePurpose: ReplicaUsagePurpose | null;
}

export interface OrderSummary {
  id: number;
  invoiceNumber: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingZone: ShippingZoneCode;
  shippingCity: string;
  shippingCourier: ShippingCourierCode;
  shippingClass: ShippingClass;
  woodenPacking: boolean;
  trackingNumber: string | null;
  paymentMethod: PaymentMethodCode;
  subtotalIdr: number;
  discountIdr: number;
  shippingCostIdr: number;
  woodenPackingCostIdr: number;
  totalIdr: number;
  voucherCode: string | null;
  requiresAge18: boolean;
  buyerAgeYears: number | null;
  itemCount: number;
  stockRestored: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetail extends OrderSummary {
  shippingDistrict: string;
  shippingPostalCode: string;
  shippingAddress: string;
  shippingNotes: string | null;
  cancelReason: string | null;
  compliance: OrderComplianceData;
  items: OrderItem[];
}

export interface OrderStatusLogItem {
  id: number;
  orderId: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  actor: string;
  createdAt: string;
}

export interface OrderProgressStep {
  status: OrderStatus;
  label: string;
  description: string;
  state: 'completed' | 'current' | 'upcoming' | 'cancelled';
  completedAt: string | null;
}

export interface InventoryMutationItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  deltaQty: number;
  stockBefore: number;
  stockAfter: number;
  reason: InventoryMutationReason;
  referenceId: string | null;
  note: string;
  actor: string;
  createdAt: string;
}

export interface AdminUserProfile {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: AdminRole;
}

export interface MediaLibraryAsset {
  url: string;
  filename: string;
  folder: 'hero' | 'products' | 'videos' | 'uploads';
  mediaType: MediaType;
  sizeBytes: number;
  updatedAt: string;
}

// Common API envelope and public REST API contracts

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[] | string>;
  };
}

/** GET /api/bootstrap */
export interface BootstrapResponse {
  categories: CategoryWithCount[];
  featuredProducts: ProductSummary[];
  settings: PublicSiteSettings;
  activePromos: PublicVoucherPromo[];
  missionSummaries?: MissionSummary[];
  fieldVideoProducts?: ProductSummary[];
  loadoutPresets?: LoadoutPreset[];
}

/** GET /api/products */
export interface ProductListQuery {
  q?: string;
  category?: string;
  mission?: MissionTag;
  platform?: PlatformType;
  propulsion?: PropulsionType;
  loadoutSlot?: LoadoutSlotType;
  minPrice?: number;
  maxPrice?: number;
  minFps?: number;
  maxFps?: number;
  inStock?: boolean;
  lowStock?: boolean;
  hasVideo?: boolean;
  featured?: boolean;
  ids?: string;
  sort?: ProductSortOption;
  page?: number;
  limit?: number;
}

export interface ProductFilterFacets {
  categories: Array<{ slug: string; name: string; count: number }>;
  platforms: Array<{ value: PlatformType; count: number }>;
  propulsions: Array<{ value: PropulsionType; count: number }>;
  priceRange: { minIdr: number; maxIdr: number };
  fpsRange: { minFps: number; maxFps: number };
  withVideoCount: number;
  inStockCount: number;
}

export interface ProductListResponse {
  items: ProductSummary[];
  total: number;
  page: number;
  limit: number;
  facets: ProductFilterFacets;
}

/** GET /api/products/:slug */
export interface ProductDetailResponse {
  product: ProductDetail;
  compatibleProducts: ProductSummary[];
}

/** POST /api/loadout/evaluate */
export interface LoadoutSelectionSlots {
  primaryId: number | null;
  sidearmId: number | null;
  opticIds: number[];
  rigProtectionIds: number[];
  powerConsumableIds: number[];
}

export interface LoadoutPreset {
  key: string;
  name: string;
  mission: MissionTag;
  description: string;
  fpsProfile: string;
  slots: LoadoutSelectionSlots;
}

export interface LoadoutCompatibilityCheck {
  ruleCode: LoadoutRuleCode;
  severity: CompatibilitySeverity;
  title: string;
  message: string;
  affectedSlot: LoadoutSlotType | 'overall';
  suggestedSkus?: string[];
  suggestedProductId?: number;
  suggestedProductName?: string;
}

export interface LoadoutEvaluateRequest {
  slots: LoadoutSelectionSlots;
}

export interface LoadoutEvaluateResponse {
  resolvedSlots: {
    primary: ProductSummary | null;
    sidearm: ProductSummary | null;
    optics: ProductSummary[];
    rigProtection: ProductSummary[];
    powerConsumables: ProductSummary[];
  };
  allSelectedProducts: ProductSummary[];
  totalWeightGrams: number;
  weightClass: LoadoutWeightClass;
  totalPriceIdr: number;
  combinedShippingClass: ShippingClass;
  requiresAge18: boolean;
  estimatedMaxJoule: number | null;
  overallStatus: 'COMPATIBLE' | 'WARNING' | 'CONFLICT';
  conflictCount: number;
  warningCount: number;
  checks: LoadoutCompatibilityCheck[];
  presets: LoadoutPreset[];
}

/** POST /api/vouchers/validate */
export interface VoucherValidateRequest {
  code: string;
  subtotalIdr: number;
}

export interface VoucherValidateResponse {
  valid: boolean;
  code: string;
  discountIdr: number;
  finalSubtotalIdr: number;
  voucher?: PublicVoucherPromo;
  reason?: string;
}

/** POST /api/orders */
export interface CreateOrderItemInput {
  productId: number;
  quantity: number;
}

export interface CreateOrderComplianceInput {
  buyerDob: string;
  clubKtaNumber?: string;
  usagePurpose: ReplicaUsagePurpose;
  age18Confirmed: boolean;
  legalDeclarationAccepted: boolean;
}

export interface CreateOrderRequest {
  items: CreateOrderItemInput[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingZone: ShippingZoneCode;
  shippingCity: string;
  shippingDistrict: string;
  shippingPostalCode: string;
  shippingAddress: string;
  shippingNotes?: string;
  shippingCourier: ShippingCourierCode;
  woodenPacking: boolean;
  paymentMethod: PaymentMethodCode;
  voucherCode?: string | null;
  compliance?: CreateOrderComplianceInput;
}

export interface PaymentInstruction {
  method: PaymentMethodCode;
  methodLabel: string;
  accountLabel: string;
  accountNumber: string;
  amountIdr: number;
  expiresAt: string;
  note: string;
}

export interface CreateOrderResponse {
  order: OrderDetail;
  paymentInstruction: PaymentInstruction;
}

/** POST /api/orders/lookup */
export interface OrderLookupRequest {
  invoiceNumber: string;
  contact: string;
}

export interface OrderLookupResponse {
  order: OrderDetail;
  timeline: OrderStatusLogItem[];
  steps: OrderProgressStep[];
}

// Admin REST API contracts (/api/admin/*)

/** POST /api/admin/auth/login */
export interface AdminLoginRequest {
  username: string;
  password: string;
}

/** GET /api/admin/auth/me & POST /api/admin/auth/login response */
export interface AdminAuthMeResponse {
  authenticated: boolean;
  admin: AdminUserProfile;
}

/** POST /api/admin/auth/logout response */
export interface AdminLogoutResponse {
  ok: true;
}

/** GET /api/admin/dashboard */
export interface AdminDashboardKpis {
  confirmedRevenueIdr: number;
  pendingPaymentRevenueIdr: number;
  actionRequiredOrdersCount: number;
  lowStockSkuCount: number;
  outOfStockSkuCount: number;
  activeSkuCount: number;
  productsWithVideoCount: number;
  totalInventoryValueIdr: number;
  totalOrdersCount: number;
}

export interface AdminLowStockItem {
  id: number;
  sku: string;
  slug: string;
  name: string;
  categoryName: string;
  stockQty: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  priceIdr: number;
}

export interface AdminDashboardResponse {
  generatedAt: string;
  kpis: AdminDashboardKpis;
  orderStatusBreakdown: Record<OrderStatus, number>;
  priorityOrders: OrderSummary[];
  lowStockProducts: AdminLowStockItem[];
  recentMutations: InventoryMutationItem[];
}

/** GET /api/admin/products */
export interface AdminProductListQuery {
  q?: string;
  category?: string;
  status?: 'all' | 'active' | 'inactive';
  stockFilter?: 'all' | 'low' | 'out' | 'in';
  hasVideo?: boolean;
}

export interface AdminProductListResponse {
  items: ProductDetail[];
  total: number;
}

/** GET /api/admin/products/:id */
export interface AdminProductDetailResponse {
  product: ProductDetail;
}

/** POST /api/admin/products & PUT /api/admin/products/:id */
export interface AdminProductUpsertRequest {
  sku: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: number;
  missionTags: MissionTag[];
  platform: PlatformType;
  propulsion: PropulsionType;
  loadoutSlot: LoadoutSlotType;
  priceIdr: number;
  weightGrams: number;
  initialStockQty?: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isActive: boolean;
  requiresAge18: boolean;
  shippingClass: ShippingClass;
  shortDescription: string;
  description: string;
  specs: ProductSpecs;
  compatibility: ProductCompatibility;
  media: ProductMediaInput[];
}

/** PUT /api/admin/products/:id/media */
export interface AdminProductMediaUpdateRequest {
  media: ProductMediaInput[];
}

/** DELETE /api/admin/products/:id */
export interface AdminDeleteProductResponse {
  ok: true;
  id: number;
  mode: 'soft_archived' | 'hard_deleted';
  message: string;
}

/** GET /api/admin/media */
export interface AdminMediaListResponse {
  assets: MediaLibraryAsset[];
  total: number;
}

/** POST /api/admin/media/upload */
export interface AdminMediaUploadResponse {
  asset: MediaLibraryAsset;
}

/** GET /api/admin/inventory */
export interface AdminInventoryProductRow {
  id: number;
  sku: string;
  name: string;
  categoryName: string;
  priceIdr: number;
  stockQty: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  inventoryValueIdr: number;
  isActive: boolean;
  lastMutationAt: string | null;
}

export interface AdminInventoryListResponse {
  products: AdminInventoryProductRow[];
  mutations: InventoryMutationItem[];
  totalInventoryValueIdr: number;
}

/** POST /api/admin/inventory/adjust */
export interface AdminInventoryAdjustRequest {
  productId: number;
  deltaQty: number;
  reason: 'MANUAL_RESTOCK' | 'AUDIT_ADJUSTMENT';
  referenceId?: string;
  note: string;
}

export interface AdminInventoryAdjustResponse {
  product: AdminInventoryProductRow;
  mutation: InventoryMutationItem;
}

/** GET /api/admin/orders */
export interface AdminOrderListQuery {
  status?: OrderStatus | 'ALL';
  q?: string;
}

export interface AdminOrderListResponse {
  orders: OrderSummary[];
  countsByStatus: Record<OrderStatus, number>;
  total: number;
}

/** GET /api/admin/orders/:id */
export interface AdminOrderDetailResponse {
  order: OrderDetail;
  timeline: OrderStatusLogItem[];
  allowedNextStatuses: OrderStatus[];
}

/** PATCH /api/admin/orders/:id/status */
export interface AdminOrderStatusUpdateRequest {
  nextStatus: OrderStatus;
  trackingNumber?: string;
  shippingCourier?: ShippingCourierCode;
  note?: string;
  cancelReason?: string;
}

export interface AdminOrderStatusUpdateResponse {
  order: OrderDetail;
  timeline: OrderStatusLogItem[];
  restockedItemsCount: number;
}

/** GET /api/admin/vouchers */
export interface AdminVoucherListResponse {
  vouchers: Voucher[];
}

/** POST /api/admin/vouchers */
export interface AdminVoucherCreateRequest {
  code: string;
  description: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountIdr?: number | null;
  minSubtotalIdr: number;
  maxUses?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isPublic: boolean;
  isActive: boolean;
}

/** PATCH /api/admin/vouchers/:id */
export type AdminVoucherUpdateRequest = Partial<AdminVoucherCreateRequest>;

/** DELETE /api/admin/vouchers/:id */
export interface AdminDeleteVoucherResponse {
  ok: true;
  id: number;
}

/** GET /api/admin/settings */
export interface AdminSettingsResponse {
  settings: SiteSettingsBundle;
  updatedAt: string | null;
}

/** PUT /api/admin/settings */
export interface AdminSettingsUpdateRequest {
  armoryProfile?: ArmoryProfileSettings;
  heroSlides?: HeroSlideConfig[];
  heroConfig?: HeroConfig;
  heroScenes?: HeroSceneTelemetry[];
  spotlightConfig?: LoadoutSpotlightConfig;
  shippingSettings?: ShippingSettings;
  inventoryDefaults?: InventoryDefaultSettings;
}

// Frontend cart persistence contracts

export interface CartStoredItem {
  productId: number;
  quantity: number;
}

export interface CartStoredState {
  version: 1;
  items: CartStoredItem[];
  updatedAt: string;
}

export interface CartResolvedItem {
  product: ProductSummary;
  quantity: number;
  lineTotalIdr: number;
  lineWeightGrams: number;
  exceedsStock: boolean;
  outOfStock: boolean;
}
