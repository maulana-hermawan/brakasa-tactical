import type {
  BatteryConnectorType,
  BatteryFormFactor,
  CorduraDenierType,
  FieldFpsClass,
  GasType,
  MissionTag,
  MuzzleThreadType,
  OrderDetail,
  PaymentInstruction,
  PaymentMethodCode,
  PlatformType,
  ProductDetail,
  ProductSortOption,
  PropulsionType,
  RailMountType,
  ShippingClass,
  ShippingCourierCode,
  ShippingCourierConfig,
  ShippingZoneCode,
} from '../../shared/types';
import type { Language } from './common';

export interface ProductLocaleOverride {
  description: string;
  inTheBox: string[];
}

export const PRODUCT_EN_LOCALE: Record<string, ProductLocaleOverride> = {
  'BRK-AR-001': {
    description:
      'The Tokyo Marui MK18 Mod.1 MWS runs on the proven ZET internal gas blowback system engineered for long-term bolt-catch durability and consistent gas efficiency. Its Cerakote-coated receiver pairs with a rigid CNC RIS II Picatinny quad-rail and 14mm CCW muzzle threads, making it an ideal primary for milsim and 300-325 FPS (~0.90 Joule) CQB arenas.',
    inTheBox: [
      'Tokyo Marui MK18 Mod.1 MWS GBBR unit',
      '1x MWS 35-round gas magazine',
      'Front sight adjustment tool and factory manual',
      'Brakasa Armory chronograph QC test sheet',
    ],
  },
  'BRK-AR-002': {
    description:
      'The VFC Avalon Saber Carbine pairs a precision full-metal receiver with a slim CNC 6061-T6 M-LOK handguard. Its Gearbox V2 ECS includes an integrated MOSFET, quick-change spring system, Deans T-Plug wiring, and a 6.03mm tight-bore inner barrel ready for 11.1V Stick LiPo batteries in woodland play.',
    inTheBox: [
      'VFC Avalon Saber Carbine M-LOK AEG unit',
      '1x QRS 120-round mid-cap magazine',
      'Factory manual and chronograph QC test sheet',
    ],
  },
  'BRK-AR-003': {
    description:
      'The CYMA CM.040C uses VFC-spec construction with a stamped steel receiver and side-folding nylon-polymer stock. Driven by a rugged full-metal V3 gearbox and 6.03mm inner barrel for dependable outdoor performance. Technical note: ships with a Mini Tamiya connector without MOSFET (use a 7.4V LiPo) and an AK side dovetail optic mount.',
    inTheBox: [
      'CYMA CM.040C AK-74M AEG unit',
      '1x 500-round hi-cap magazine',
      'Cleaning rod and chronograph QC test sheet',
    ],
  },
  'BRK-SMG-001': {
    description:
      'The G&G ARP9 2.0 features an extended battery compartment for 11.1V stick LiPo packs, a CNC aluminum M-LOK handguard, and an integrated Electronic Trigger Unit (ETU) with MOSFET. Weighing 1,960 grams at 330-350 FPS (~1.10 J), it is built for fast transitions in tight CQB and SpeedQB arenas.',
    inTheBox: [
      'G&G ARP9 2.0 CQB PDW AEG unit',
      '1x 68-round mid-cap magazine',
      'ETU manual and chronograph QC test sheet',
    ],
  },
  'BRK-SNP-001': {
    description:
      'The Silverback TAC-41 P is field-ready out of the box with a CNC 6000-series aluminum receiver, fiberglass-reinforced nylon chassis, and a 50-click indexed CNC TDC hop-up (15-micron steps). Equipped with a 510mm AEG-spec inner barrel delivering 410-445 FPS (1.60-1.90 J). Carrying a CQB sidearm is recommended for minimum engagement distances.',
    inTheBox: [
      'Silverback TAC-41 P Bolt-Action Sniper unit',
      '1x 48-round magazine',
      'Stock spacers and hex adjustment keys',
      'Brakasa Armory chronograph QC test sheet',
    ],
  },
  'BRK-PST-001': {
    description:
      'The Umarex / VFC Glock 17 Gen5 delivers ambidextrous Gen5 ergonomics, front slide serrations, and the Guide-Hop system for quick hop-up adjustment via the recoil guide rod without removing the slide. Reliable as a sniper/DMR secondary or lightweight CQB primary.',
    inTheBox: [
      'Umarex / VFC Glock 17 Gen5 GBB unit',
      '1x 22-round Green Gas magazine',
      'Factory manual and chronograph QC test sheet',
    ],
  },
  'BRK-OPT-001': {
    description:
      'The Vector Optics Maverick Gen III 1x22 is built for rapid target acquisition from close to medium range. Its rubber-armored 6061-T6 aluminum body resists field knocks and features 11 red-dot brightness levels (3 MOA), 1 MOA elevation clicks, plus both a QD cantilever Picatinny riser and low mount.',
    inTheBox: [
      'Vector Optics Maverick Gen III 1x22 red dot',
      'QD Picatinny riser mount and low mount',
      'Rubber lens covers and cleaning cloth',
    ],
  },
  'BRK-OPT-002': {
    description:
      'The Vector Optics Forester 1-5x24 SFP combines fast 1x situational awareness with 5x magnification for distant target identification. Its nitrogen-purged 30mm 6061-T6 aluminum monotube resists fogging and includes 1/2 MOA turrets plus a pair of 30mm Picatinny mount rings in the box.',
    inTheBox: [
      'Vector Optics Forester 1-5x24 SFP LPVO scope',
      'Pair of 30mm Picatinny mount rings',
      'Flip-up lens caps and microfiber cloth',
    ],
  },
  'BRK-OPT-003': {
    description:
      'The WADSN AN/PEQ-15 combines a visible aiming laser and white LED illuminator for low-light CQB scenarios and milsim configurations. Its lightweight nylon polymer housing clamps securely onto MIL-STD-1913 Picatinny rails and includes a remote pressure switch pad.',
    inTheBox: [
      'WADSN AN/PEQ-15 laser and illuminator module',
      'Remote pressure switch pad',
      'Storage hard case and marking stickers',
    ],
  },
  'BRK-RIG-001': {
    description:
      'The Pew Tactical FCPC V5 is crafted from genuine 500D Cordura with low-profile laser-cut MOLLE laminate panels that shed water and resist abrasion. Includes a rigid Tegris-style structural cummerbund, quick-release shoulder hardware, and SwiftClip/G-Hook front interface compatible with Micro Fight Mk4 placards.',
    inTheBox: [
      'FCPC V5 front and rear plate bags',
      'Rigid structural cummerbund set',
      'Quick-release Cobra-style shoulder buckle',
    ],
  },
  'BRK-RIG-002': {
    description:
      'The EmersonGear Micro Fight Mk4 offers a lightweight modular chassis that runs standalone with an H-Harness for fast SpeedQB or recce setups, or attaches directly as a SwiftClip/Velcro front placard on the FCPC V5 Plate Carrier. Includes a triple 5.56 elastic magazine insert for M4/MK18 magazines.',
    inTheBox: [
      'Micro Fight Mk4 modular chassis',
      'Triple 5.56 elastic magazine insert',
      'Half flap, H-Harness, and waist strap',
    ],
  },
  'BRK-HLM-001': {
    description:
      'The FMA FAST Maritime High-Cut Bump Helmet protects your head from arena impacts while providing mounting rails for tactical comms headsets and helmet lights. Its high-cut shell leaves clear room for Earmor M32 Plus earcups via side ARC rails. Note: sport bump protection only, non-ballistic.',
    inTheBox: [
      'FMA FAST Maritime High-Cut Bump Helmet',
      'EPP comfort padding set and Occ-Dial retention',
      'Loop Velcro panel kit and NVG bungee cords',
    ],
  },
  'BRK-HLM-002': {
    description:
      'The Earmor M32 Plus amplifies ambient low-level audio such as footsteps and teammate callouts while actively suppressing harmful impulse noise above 82 dB. Features an ambidextrous detachable boom microphone, NATO 7.0mm PTT plug, and direct compatibility with FAST Maritime helmets.',
    inTheBox: [
      'Earmor M32 Plus active tactical headset',
      'Detachable boom microphone',
      'Standard NATO 7.0mm downlead plug',
    ],
  },
  'BRK-APP-001': {
    description:
      'The EmersonGear G3 Combat Set combines abrasion-resistant 50/50 NyCo ripstop sleeves and pants with a breathable moisture-wicking knit torso comfortable under plate carriers in tropical climates. Built with 10 utility pockets, YKK zippers, and removable knee and elbow pads.',
    inTheBox: [
      '1x G3 Combat Shirt',
      '1x G3 Combat Pants',
      'Pair of removable knee pads and elbow pads',
    ],
  },
  'BRK-APP-002': {
    description:
      'Mechanix Wear M-Pact gloves shield knuckles and fingers from close-range BB hits and barricade scrapes with impact-rated Thermoplastic Rubber (TPR) guards. D3O palm padding dampens vibration while breathable TrekDry fabric keeps trigger finger dexterity sharp.',
    inTheBox: ['1 pair of Mechanix Wear M-Pact Tactical Gloves'],
  },
  'BRK-APP-003': {
    description:
      'Salomon Forces XA Mid GTX boots are engineered for fast traction across wet, rocky, and muddy terrain. A waterproof GORE-TEX membrane keeps feet dry while the 3D Advanced Chassis stabilizes your ankles under full replica and plate carrier weight.',
    inTheBox: ['1 pair of Salomon Forces XA Mid GTX Tactical Boots (540 g per boot)'],
  },
  'BRK-CSM-001': {
    description:
      'BLS Precision 0.28g 6mm BBs undergo double polishing with zero seams to prevent jams in 6.03mm tight-bore barrels. The 0.28g weight stabilizes trajectory in outdoor wind for AEGs and GBBRs while serving as a reliable accuracy baseline for sniper platforms.',
    inTheBox: ['1x Resealable 1 kg bag (~3,570 rounds of 6mm 0.28g BBs)'],
  },
  'BRK-CSM-002': {
    description:
      'Puff Dino 12kg Green Gas (600ml) delivers consistent blowback pressure for GBBRs and GBB pistols. Its light silicone lubricant blend helps preserve magazine valve O-rings. Pressurized canisters require specialized land or sea cargo shipping.',
    inTheBox: ['1x Puff Dino 12kg Green Gas canister (600ml)'],
  },
  'BRK-CSM-003': {
    description:
      'This slim 11.1V 1200mAh 25C 3S stick LiPo pack fits cleanly inside the VFC Avalon Saber buffer tube and G&G ARP9 2.0 stock compartment. Terminated with a low-resistance Deans T-Plug and JST-XH balance lead. Not recommended for non-MOSFET Mini Tamiya AEGs.',
    inTheBox: ['1x LiPo 11.1V 1200mAh 25C 3S Stick Battery (Deans)'],
  },
  'BRK-UPG-001': {
    description:
      'The Acetech Brighter C fires ultra-fast UV pulses to illuminate green tracer BBs up to 35 RPS in dim CQB arenas. Its CNC anodized aluminum body weighs just 32 grams with 14mm CCW threads (includes an 11mm CW pistol adapter), USB-C charging, and shake-to-wake power management.',
    inTheBox: [
      'Acetech Brighter C Tracer Unit (14mm CCW)',
      '14mm CCW to 11mm CW pistol thread adapter',
      'USB-C charging cable and hex key',
    ],
  },
};

export function getLocalizedProductDescription(
  product: Pick<ProductDetail, 'sku' | 'description'>,
  lang: Language,
): string {
  if (lang === 'en') {
    const override = PRODUCT_EN_LOCALE[product.sku.toUpperCase()];
    if (override?.description) {
      return override.description;
    }
  }
  return product.description;
}

export function getLocalizedInTheBox(
  product: Pick<ProductDetail, 'sku' | 'specs'>,
  lang: Language,
): string[] {
  const raw = product.specs?.in_the_box ?? [];
  if (raw.length === 0) return [];
  if (lang === 'en') {
    const override = PRODUCT_EN_LOCALE[product.sku.toUpperCase()];
    if (override?.inTheBox && override.inTheBox.length > 0) {
      return override.inTheBox;
    }
  }
  return raw;
}

const SPEC_VALUE_EN_MAP: Record<string, string> = {
  'Tidak memerlukan baterai (Propulsi Gas)': 'No battery required (Gas Propulsion)',
  'Tidak memerlukan baterai atau gas': 'No battery or gas required',
  'Tidak memerlukan baterai (Green Gas)': 'No battery required (Green Gas)',
  'Standar QC Chronograph (<= 2,0 Joule)': 'Chronograph QC Tested (<= 2.0 Joule)',
  'Standar CQB (<= 350 FPS, <= 2,0 Joule)': 'CQB Standard (<= 350 FPS, <= 2.0 Joule)',
  'Standar QC Chronograph (<= 2,0 Joule, MED 15-25 meter)':
    'Chronograph QC Tested (<= 2.0 Joule, MED 15-25 m)',
  'Tabung Bertekanan: Wajib Pengiriman Kargo Darat/Laut':
    'Pressurized Canister: Land/Sea Cargo Required',
  'Baterai Lithium: Wajib Pengiriman Kargo Darat/Laut':
    'Lithium Battery: Land/Sea Cargo Required',
  'Gearbox V2 dengan G&G ETU & MOSFET Bawaan': 'Gearbox V2 with Integrated G&G ETU & MOSFET',
  'VFC GBB System dengan Guide-Hop Quick Adjust': 'VFC GBB System with Guide-Hop Quick Adjust',
  '3S Lithium Polymer Pack dengan Deans T-Plug & JST-XH Balance Lead':
    '3S Lithium Polymer Pack with Deans T-Plug & JST-XH Balance Lead',
  '705 - 945 mm (Popor Lipat)': '705 - 945 mm (Folding Stock)',
  '76 mm panjang': '76 mm length',
  '260 mm panjang': '260 mm length',
  '57 mm panjang x 28 mm diameter': '57 mm length x 28 mm diameter',
  'Ukuran M/L (Lingkar kepala 55 - 59 cm)': 'Size M/L (Head circumference 55 - 59 cm)',
};

export function localizeSpecValue(raw: string, lang: Language): string {
  if (lang !== 'en') return raw;
  return SPEC_VALUE_EN_MAP[raw] ?? raw;
}

export interface StoreDictionary {
  card: {
    soldOut: string;
    viewProductAria: (name: string) => string;
  };
  filters: {
    heading: string;
    reset: (count: number) => string;
    sortLabel: string;
    categoryLabel: string;
    allCategories: string;
    missionLabel: string;
    allMissions: string;
    platformLabel: string;
    allPlatforms: string;
    propulsionLabel: string;
    allPropulsions: string;
    fpsLegend: string;
    fpsMinLabel: string;
    fpsMaxLabel: string;
    fpsMinPlaceholder: string;
    fpsMaxPlaceholder: string;
    fpsPresetCqb: string;
    fpsPresetOutdoor: string;
    fpsPresetSniper: string;
    priceLegend: string;
    priceMinLabel: string;
    priceMaxLabel: string;
    availabilityLegend: string;
    inStockOnly: string;
    hasVideoOnly: string;
    missionLabels: Record<MissionTag, string>;
    platformLabels: Record<PlatformType, string>;
    propulsionLabels: Record<PropulsionType, string>;
    sortOptions: ReadonlyArray<{ value: ProductSortOption; label: string }>;
  };
  catalog: {
    docTitle: string;
    docTitleCategory: (categoryName: string) => string;
    defaultTitle: string;
    loadingCount: string;
    productCount: (count: number) => string;
    desktopFilterAria: string;
    searchLabel: string;
    searchPlaceholder: string;
    filterButton: string;
    sortLabel: string;
    activeFiltersAria: string;
    chipSearch: (query: string) => string;
    chipCategory: (name: string) => string;
    chipMission: (label: string) => string;
    chipPlatform: (label: string) => string;
    chipPropulsion: (label: string) => string;
    chipFps: (min: string, max: string) => string;
    chipPrice: (min: string, max: string) => string;
    chipPriceMaxFallback: string;
    chipInStock: string;
    chipHasVideo: string;
    resetAll: string;
    productListSrHeading: string;
    errorTitle: string;
    errorFallback: string;
    loadingLabel: string;
    emptyTitle: string;
    emptyDesc: string;
    paginationAria: string;
    prevPage: string;
    nextPage: string;
    pageInfo: (page: number, totalPages: number, total: number) => string;
    sheetTitle: string;
    sheetCloseAria: string;
    sheetCloseLabel: string;
    sheetReset: string;
    sheetApply: (total: number) => string;
  };
  gallery: {
    photoTab: string;
    videoTab: string;
    zoomLabel: string;
    zoomAria: (name: string) => string;
    playDemoBtn: string;
    playDemoAria: (name: string) => string;
    pauseLabel: string;
    playLabel: string;
    pauseVideoAria: string;
    playVideoAria: string;
    unmuteAria: string;
    muteAria: string;
    soundOff: string;
    soundOn: string;
    seekLabel: string;
    prevMediaAria: string;
    nextMediaAria: string;
    thumbsGroupAria: string;
    showVideoThumbAria: (index: number) => string;
    showPhotoThumbAria: (index: number) => string;
    videoBadge: string;
    lightboxAria: (name: string) => string;
    lightboxCloseLabel: string;
    lightboxCloseAria: string;
    lightboxPrevAria: string;
    lightboxNextAria: string;
  };
  specs: {
    caption: (name: string) => string;
    paramHeader: string;
    valueHeader: string;
    yes: string;
    no: string;
    mosfetYes: string;
    mosfetNo: string;
    roundsUnit: (qty: number) => string;
    labels: {
      sku: string;
      brand: string;
      category: string;
      platform: string;
      propulsion: string;
      chronographVelocity: string;
      kineticEnergy: string;
      fieldClass: string;
      gearboxOrSystem: string;
      fireModes: string;
      hopUp: string;
      innerBarrel: string;
      magazineCapacity: string;
      batteryConnector: string;
      mosfetEtu: string;
      batteryRecommendation: string;
      batteryFormFactor: string;
      gasType: string;
      muzzleThread: string;
      railMounting: string;
      opticMagnification: string;
      opticMount: string;
      material: string;
      textileSpec: string;
      bbWeight: string;
      recommendedBbWeight: string;
      dimensions: string;
      certification: string;
      colorOptions: string;
      netWeight: string;
      shippingClass: string;
    };
    connectors: Record<Exclude<BatteryConnectorType, 'NONE'>, string>;
    formFactors: Record<Exclude<BatteryFormFactor, 'NONE'>, string>;
    gasTypes: Record<Exclude<GasType, 'NONE'>, string>;
    muzzleThreads: Record<Exclude<MuzzleThreadType, 'NONE'>, string>;
    rails: Record<Exclude<RailMountType, 'NONE'>, string>;
    cordura: Record<Exclude<CorduraDenierType, 'NONE'>, string>;
    fieldRoles: Record<FieldFpsClass, string>;
  };
  pdp: {
    docTitleDefault: string;
    backButton: string;
    backAria: string;
    breadcrumbAria: string;
    breadcrumbHome: string;
    breadcrumbShop: string;
    loadingLabel: string;
    notFoundPageHeading: string;
    notFoundSectionSr: string;
    notFoundTitle: string;
    notFoundDesc: string;
    backToShop: string;
    errorPageHeading: string;
    errorSectionSr: string;
    errorTitle: string;
    errorFallback: string;
    stockInStock: (qty: number) => string;
    stockLowStock: (qty: number) => string;
    stockOutOfStock: string;
    quantityLabel: string;
    decreaseQtyAria: string;
    increaseQtyAria: string;
    addToCart: string;
    outOfStockBtn: string;
    addedFeedback: (qty: number, name: string) => string;
    viewCart: string;
    descriptionHeading: string;
    inTheBoxHeading: string;
    specsHeading: string;
    similarHeading: string;
  };
  checkout: {
    docTitle: string;
    pageTitle: string;
    loadingLabel: string;
    emptySectionSr: string;
    emptyTitle: string;
    emptyDesc: string;
    browseShop: string;
    cartErrorTitle: string;
    cartErrorSrHeading: string;
    addressHeading: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    cityLabel: string;
    cityPlaceholder: string;
    districtLabel: string;
    districtPlaceholder: string;
    postalCodeLabel: string;
    postalCodePlaceholder: string;
    streetAddressLabel: string;
    streetAddressPlaceholder: string;
    notesLabel: string;
    notesPlaceholder: string;
    shippingHeading: string;
    zoneLabel: string;
    totalWeightLabel: (formatted: string) => string;
    courierLegend: string;
    availableBadge: string;
    unavailableBadge: string;
    freeBadge: string;
    courierLockedReason: (shippingClassLabel: string) => string;
    etaPrefix: string;
    chargeableWeightMeta: (chargeableKg: number, minKg: number) => string;
    woodenPackingTitle: string;
    woodenPackingRecommended: string;
    woodenPackingPickupNote: string;
    woodenPackingDesc: string;
    voucherPaymentHeading: string;
    voucherLabel: string;
    voucherPlaceholder: string;
    voucherChecking: string;
    voucherApplyBtn: string;
    activePromosLabel: string;
    voucherAppliedTitle: (code: string) => string;
    voucherKargoFreeConflict: string;
    voucherDiscountApplied: (amount: string) => string;
    voucherRemoveBtn: string;
    paymentMethodLegend: string;
    paymentOptions: ReadonlyArray<{
      code: PaymentMethodCode;
      label: string;
      description: string;
    }>;
    submitLoading: string;
    submitLabel: (totalFormatted: string) => string;
    summaryAria: string;
    summaryHeading: string;
    summaryMobileToggle: (count: number) => string;
    summaryMeta: (skuCount: number, unitCount: number, weightFormatted: string) => string;
    summarySubtotal: string;
    summaryVoucher: (code: string) => string;
    summaryShipping: (courierName: string) => string;
    summaryWoodenPacking: string;
    summaryTotal: string;
    itemOutOfStock: string;
    itemRemainingStock: (qty: number) => string;
    validation: {
      stockBlocker: string;
      formBanner: string;
      networkError: string;
      voucherEmpty: string;
      voucherInvalid: string;
      voucherKargoFreePickup: string;
      voucherNetworkError: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      shippingCity: string;
      shippingDistrict: string;
      shippingPostalCode: string;
      shippingAddress: string;
      shippingCourier: string;
    };
    invoice: {
      heading: (invoiceNumber: string) => string;
      subtitle: string;
      copyInvoice: string;
      copiedInvoice: string;
      printInvoice: string;
      backToShop: string;
      paymentDestination: string;
      accountNumberLabel: string;
      copyShort: string;
      copiedShort: string;
      exactAmountLabel: string;
      deadlineLabel: string;
      orderItemsHeading: (count: number) => string;
      summaryHeading: string;
      recipientLabel: string;
      subtotalLabel: string;
      discountLabel: (code: string | null) => string;
      shippingLabel: (courierName: string) => string;
      woodenPackingLabel: string;
      totalLabel: string;
    };
  };
}

const COURIER_EN_MAP: Record<
  ShippingCourierCode,
  { name: string; description: string; etaDays: string }
> = {
  JNE_REG: {
    name: 'JNE Regular',
    description: 'Standard courier for accessories, optics, apparel, rigs, and BBs.',
    etaDays: '1-5 business days',
  },
  SICEPAT_REG: {
    name: 'SiCepat Regular',
    description: 'Nationwide standard delivery for non-replica tactical gear and accessories.',
    etaDays: '1-5 business days',
  },
  JNE_TRUCKING: {
    name: 'JNE Trucking (Land/Sea Cargo)',
    description: 'Land and sea freight for airsoft units, LiPo batteries, and heavy parcels.',
    etaDays: '2-10 business days',
  },
  INDAH_CARGO: {
    name: 'Indah Cargo Land Freight',
    description: 'Dedicated land and sea cargo for AEG/GBBR units and LiPo batteries.',
    etaDays: '3-12 business days',
  },
  DAKOTA_CARGO: {
    name: 'Dakota Cargo Land Freight',
    description: 'Scheduled inter-island land freight for long rifles and hard cases.',
    etaDays: '3-12 business days',
  },
  HAZMAT_LAND_CARGO: {
    name: 'Specialized Land/Sea Cargo (Gas & Units)',
    description: 'Licensed land and sea cargo for pressurized Green Gas canisters, units, and LiPo packs.',
    etaDays: '2-16 business days',
  },
  ARMORY_PICKUP: {
    name: 'Armory Pickup (South Jakarta)',
    description: 'Collect directly at the Kemang showroom once packed and QC checked.',
    etaDays: 'Ready after packed',
  },
};

const ZONE_EN_MAP: Record<ShippingZoneCode, string> = {
  JABODETABEK: 'Greater Jakarta (Jabodetabek)',
  JAWA: 'Java Island',
  SUMATERA_BALI: 'Sumatra & Bali',
  KALIMANTAN_SULAWESI: 'Kalimantan & Sulawesi',
  INDONESIA_TIMUR: 'Eastern Indonesia (NTB/NTT/Maluku/Papua)',
};

export function getLocalizedCourierCopy(
  courier: ShippingCourierConfig,
  lang: Language,
): { name: string; description: string; etaDays: string } {
  if (lang === 'en') {
    const mapped = COURIER_EN_MAP[courier.code];
    if (mapped) return mapped;
  }
  return {
    name: courier.name,
    description: courier.description,
    etaDays: courier.etaDays,
  };
}

export function getLocalizedCourierNameByCode(
  code: ShippingCourierCode,
  couriers: ShippingCourierConfig[],
  lang: Language,
): string {
  const found = couriers.find((c) => c.code === code);
  if (found) {
    return getLocalizedCourierCopy(found, lang).name;
  }
  if (lang === 'en' && COURIER_EN_MAP[code]) {
    return COURIER_EN_MAP[code].name;
  }
  return code.replace(/_/g, ' ');
}

export function getLocalizedZoneLabel(
  zone: ShippingZoneCode,
  fallbackLabel: string,
  lang: Language,
): string {
  if (lang === 'en') {
    return ZONE_EN_MAP[zone] ?? fallbackLabel;
  }
  return fallbackLabel;
}

export function getLocalizedPaymentInstruction(
  instruction: PaymentInstruction,
  order: OrderDetail,
  whatsappNumber: string,
  lang: Language,
): { methodLabel: string; note: string } {
  if (lang !== 'en') {
    return {
      methodLabel: instruction.methodLabel,
      note: instruction.note,
    };
  }
  switch (instruction.method) {
    case 'VA_BCA':
      return {
        methodLabel: 'BCA Virtual Account',
        note: `Transfer the exact amount for invoice ${order.invoiceNumber}. Payment is verified once funds are received.`,
      };
    case 'VA_MANDIRI':
      return {
        methodLabel: 'Bank Mandiri Virtual Account',
        note: 'Complete payment via Livin or Mandiri ATM before the deadline to keep your reserved stock.',
      };
    case 'QRIS':
      return {
        methodLabel: 'National QRIS',
        note: `Scan QRIS through your banking app or e-wallet, or send payment proof via WhatsApp (${whatsappNumber}).`,
      };
    case 'BANK_TRANSFER_ARMORY':
      return {
        methodLabel: 'Armory Bank Transfer',
        note: `Include invoice number ${order.invoiceNumber} in the transfer note and send proof of transfer to ${whatsappNumber}.`,
      };
    default:
      return {
        methodLabel: instruction.methodLabel,
        note: instruction.note,
      };
  }
}

export function getShippingClassShortLabel(cls: ShippingClass, lang: Language): string {
  if (lang === 'en') {
    switch (cls) {
      case 'REGULAR':
        return 'Regular';
      case 'CARGO_BATTERY':
        return 'LiPo Cargo';
      case 'CARGO_REPLICA':
        return 'Unit Cargo';
      case 'CARGO_GAS':
        return 'Gas Cargo';
    }
  }
  switch (cls) {
    case 'REGULAR':
      return 'Reguler';
    case 'CARGO_BATTERY':
      return 'Kargo Baterai';
    case 'CARGO_REPLICA':
      return 'Kargo Unit';
    case 'CARGO_GAS':
      return 'Kargo Gas';
  }
}

export const STORE_DICTIONARIES: Record<Language, StoreDictionary> = {
  id: {
    card: {
      soldOut: 'Habis',
      viewProductAria: (name: string) => `Lihat ${name}`,
    },
    filters: {
      heading: 'Filter',
      reset: (count: number) => `Reset (${count})`,
      sortLabel: 'Urutkan',
      categoryLabel: 'Kategori',
      allCategories: 'Semua Kategori',
      missionLabel: 'Profil Misi',
      allMissions: 'Semua Misi',
      platformLabel: 'Platform',
      allPlatforms: 'Semua Platform',
      propulsionLabel: 'Propulsi',
      allPropulsions: 'Semua Propulsi',
      fpsLegend: 'Rentang FPS (@0.20g)',
      fpsMinLabel: 'FPS Min',
      fpsMaxLabel: 'FPS Maks',
      fpsMinPlaceholder: '300',
      fpsMaxPlaceholder: '450',
      fpsPresetCqb: '<= 350 CQB',
      fpsPresetOutdoor: '351-420 Outdoor',
      fpsPresetSniper: '> 400 Sniper',
      priceLegend: 'Rentang Harga (IDR)',
      priceMinLabel: 'Min (Rp)',
      priceMaxLabel: 'Maks (Rp)',
      availabilityLegend: 'Ketersediaan & Media',
      inStockOnly: 'Hanya Stok Tersedia',
      hasVideoOnly: 'Ada Video Demo',
      missionLabels: {
        cqb: 'CQB Indoor (<= 350 FPS)',
        'woodland-recce': 'Woodland & Recce',
        speedqb: 'SpeedQB / Kompetisi',
        'rig-protection': 'Rig, Helm & Proteksi',
      },
      platformLabels: {
        M4_AR15: 'M4 / AR-15 / MK18',
        AK_SERIES: 'AK Series',
        SMG_PDW: 'SMG / CQB PDW',
        BOLT_ACTION: 'Bolt-Action Sniper',
        PISTOL_G_SERIES: 'Pistol G-Series',
        UNIVERSAL_MOLLE: 'MOLLE / Plate Carrier / Helm',
        UNIVERSAL_PICATINNY: 'Optik & Picatinny 1913',
        APPAREL_FOOTWEAR: 'Pakaian, Sarung Tangan & Sepatu',
        CONSUMABLE: 'BB, Green Gas & LiPo',
      },
      propulsionLabels: {
        AEG: 'AEG (Electric)',
        GBBR: 'GBBR (Gas Blowback Rifle)',
        GBB_PISTOL: 'GBB Pistol',
        CO2: 'Sistem CO2',
        SPRING: 'Spring Bolt-Action',
        NON_REPLICA: 'Perlengkapan Non-Unit',
      },
      sortOptions: [
        { value: 'featured', label: 'Unggulan' },
        { value: 'newest', label: 'Terbaru' },
        { value: 'price_asc', label: 'Harga: Terendah ke Tertinggi' },
        { value: 'price_desc', label: 'Harga: Tertinggi ke Terendah' },
        { value: 'fps_asc', label: 'FPS: Terendah ke Tertinggi' },
        { value: 'fps_desc', label: 'FPS: Tertinggi ke Terendah' },
      ],
    },
    catalog: {
      docTitle: 'Katalog | Brakasa Tactical',
      docTitleCategory: (categoryName: string) => `${categoryName} | Brakasa Tactical`,
      defaultTitle: 'Katalog',
      loadingCount: 'Memuat...',
      productCount: (count: number) => `${count} produk`,
      desktopFilterAria: 'Panel filter katalog',
      searchLabel: 'Cari produk, merek, atau SKU',
      searchPlaceholder: 'Cari produk, merek, SKU...',
      filterButton: 'Filter',
      sortLabel: 'Urutkan',
      activeFiltersAria: 'Filter aktif',
      chipSearch: (query: string) => `Cari: "${query}"`,
      chipCategory: (name: string) => `Kategori: ${name}`,
      chipMission: (label: string) => `Misi: ${label}`,
      chipPlatform: (label: string) => `Platform: ${label}`,
      chipPropulsion: (label: string) => `Propulsi: ${label}`,
      chipFps: (min: string, max: string) => `FPS: ${min} - ${max}`,
      chipPrice: (min: string, max: string) => `Harga: ${min} - ${max}`,
      chipPriceMaxFallback: 'Maks',
      chipInStock: 'Stok Tersedia',
      chipHasVideo: 'Ada Video Demo',
      resetAll: 'Reset Semua',
      productListSrHeading: 'Daftar Produk',
      errorTitle: 'Gagal memuat katalog produk',
      errorFallback: 'Server katalog tidak merespons saat ini. Periksa koneksi Anda lalu coba lagi.',
      loadingLabel: 'Memuat katalog produk...',
      emptyTitle: 'Produk tidak ditemukan',
      emptyDesc: 'Ubah kata kunci atau reset filter untuk melihat produk yang tersedia.',
      paginationAria: 'Navigasi halaman katalog',
      prevPage: 'Sebelumnya',
      nextPage: 'Berikutnya',
      pageInfo: (page: number, totalPages: number, total: number) =>
        `Halaman ${page} dari ${totalPages} (${total} produk)`,
      sheetTitle: 'Filter & Urutkan',
      sheetCloseAria: 'Tutup panel filter',
      sheetCloseLabel: 'Tutup',
      sheetReset: 'Reset',
      sheetApply: (total: number) => `Terapkan (${total})`,
    },
    gallery: {
      photoTab: 'Foto',
      videoTab: 'Video Demo',
      zoomLabel: 'Perbesar',
      zoomAria: (name: string) => `Perbesar foto ${name}`,
      playDemoBtn: 'Putar Video',
      playDemoAria: (name: string) => `Putar video demo ${name}`,
      pauseLabel: 'Jeda',
      playLabel: 'Putar',
      pauseVideoAria: 'Jeda video demo',
      playVideoAria: 'Putar video demo',
      unmuteAria: 'Aktifkan suara video',
      muteAria: 'Senyapkan suara video',
      soundOff: 'Senyap',
      soundOn: 'Suara',
      seekLabel: 'Posisi waktu video demo',
      prevMediaAria: 'Media sebelumnya',
      nextMediaAria: 'Media berikutnya',
      thumbsGroupAria: 'Pilih media produk',
      showVideoThumbAria: (index: number) => `Tampilkan video demo ${index}`,
      showPhotoThumbAria: (index: number) => `Tampilkan foto produk ${index}`,
      videoBadge: 'VIDEO',
      lightboxAria: (name: string) => `Pratinjau diperbesar ${name}`,
      lightboxCloseLabel: 'Tutup',
      lightboxCloseAria: 'Tutup pratinjau gambar',
      lightboxPrevAria: 'Foto sebelumnya',
      lightboxNextAria: 'Foto berikutnya',
    },
    specs: {
      caption: (name: string) => `Spesifikasi teknis ${name}`,
      paramHeader: 'Parameter',
      valueHeader: 'Spesifikasi',
      yes: 'Ya',
      no: 'Tidak',
      mosfetYes: 'Ya (Terpasang dari pabrikan)',
      mosfetNo: 'Tidak (Kontak mekanis)',
      roundsUnit: (qty: number) => `${qty} butir BB 6mm`,
      labels: {
        sku: 'Kode SKU',
        brand: 'Merek',
        category: 'Kategori',
        platform: 'Platform',
        propulsion: 'Sistem Propulsi',
        chronographVelocity: 'Kecepatan Chronograph',
        kineticEnergy: 'Estimasi Energi Kinetik',
        fieldClass: 'Klasifikasi Arena',
        gearboxOrSystem: 'Gearbox / Sistem Mekanis',
        fireModes: 'Mode Tembak',
        hopUp: 'Sistem Hop-Up',
        innerBarrel: 'Inner Barrel',
        magazineCapacity: 'Kapasitas Magasin',
        batteryConnector: 'Konektor Baterai',
        mosfetEtu: 'MOSFET / ETU',
        batteryRecommendation: 'Rekomendasi Baterai',
        batteryFormFactor: 'Form Factor Baterai',
        gasType: 'Tipe Gas',
        muzzleThread: 'Ulir Muzzle',
        railMounting: 'Sistem Rail / Mounting',
        opticMagnification: 'Pembesaran Optik',
        opticMount: 'Dudukan Optik',
        material: 'Material Konstruksi',
        textileSpec: 'Spesifikasi Tekstil',
        bbWeight: 'Berat BB',
        recommendedBbWeight: 'Rekomendasi Berat BB',
        dimensions: 'Dimensi',
        certification: 'Standar / Sertifikasi',
        colorOptions: 'Varian Warna',
        netWeight: 'Berat Bersih',
        shippingClass: 'Kelas Pengiriman',
      },
      connectors: {
        DEANS_T_PLUG: 'Deans T-Plug',
        MINI_TAMIYA: 'Mini Tamiya',
      },
      formFactors: {
        STICK_BUFFER_TUBE: 'Stick (Buffer Tube)',
        NUNCHUCK: 'Nunchuck / Butterfly',
        PEQ_BOX: 'PEQ Box Eksternal',
      },
      gasTypes: {
        GREEN_GAS: 'Green Gas (Propane + Silicone)',
        CO2_12G: 'CO2 Cartridge 12g',
      },
      muzzleThreads: {
        '14MM_CCW': '14mm CCW (Counter-Clockwise)',
        M24X1_CW: 'M24x1 CW (Clockwise)',
        '11MM_CW_PISTOL': '11mm CW (Pistol Barrel)',
      },
      rails: {
        PICATINNY_1913: 'MIL-STD-1913 Picatinny',
        M_LOK: 'M-LOK Handguard',
        AK_SIDE_DOVETAIL: 'AK Side Dovetail Mount',
        MOLLE_PALS_LASER_CUT: 'MOLLE/PALS Laser-Cut',
        SWIFTCLIP_PLACARD: 'SwiftClip / G-Hook Placard',
        ARC_HELMET_RAIL: 'FAST ARC Helmet Side Rail',
        NVG_SHROUD: 'Aluminum NVG Shroud',
      },
      cordura: {
        '500D': '500D Cordura Nylon',
        '1000D': '1000D Cordura Nylon',
        '500D_1000D_LAMINATE': '500D Cordura + Laser-Cut Laminate',
        NYCO_50_50_RIPSTOP: '50/50 NyCo Ripstop',
      },
      fieldRoles: {
        CQB_STRICT: 'CQB Ketat (<= 330 FPS)',
        CQB_STANDARD: 'CQB Standar (<= 350 FPS)',
        WOODLAND_ASSAULT: 'Woodland / Outdoor Assault (<= 420 FPS)',
        DMR_SNIPER: 'DMR / Bolt-Action Sniper (> 400 FPS, MED 15-25 m)',
      },
    },
    pdp: {
      docTitleDefault: 'Detail Produk | Brakasa Tactical',
      backButton: 'Kembali',
      backAria: 'Kembali ke halaman sebelumnya',
      breadcrumbAria: 'Breadcrumb',
      breadcrumbHome: 'Beranda',
      breadcrumbShop: 'Katalog',
      loadingLabel: 'Memuat detail produk...',
      notFoundPageHeading: 'Produk Tidak Ditemukan',
      notFoundSectionSr: 'Status ketersediaan produk',
      notFoundTitle: 'Produk tidak ditemukan',
      notFoundDesc: 'Produk mungkin sudah tidak aktif atau tautan yang dibuka tidak valid.',
      backToShop: 'Kembali ke Katalog',
      errorPageHeading: 'Detail Produk',
      errorSectionSr: 'Status kesalahan produk',
      errorTitle: 'Gagal memuat detail produk',
      errorFallback: 'Terjadi gangguan saat memuat data produk dari server.',
      stockInStock: (qty: number) => `Tersedia (${qty})`,
      stockLowStock: (qty: number) => `Stok Terbatas (${qty})`,
      stockOutOfStock: 'Habis',
      quantityLabel: 'Jumlah',
      decreaseQtyAria: 'Kurangi jumlah pembelian',
      increaseQtyAria: 'Tambah jumlah pembelian',
      addToCart: 'Tambah ke Keranjang',
      outOfStockBtn: 'Habis',
      addedFeedback: (qty: number, name: string) => `${qty}x ${name} ditambahkan ke keranjang.`,
      viewCart: 'Buka Keranjang',
      descriptionHeading: 'Deskripsi',
      inTheBoxHeading: 'Isi Paket',
      specsHeading: 'Spesifikasi',
      similarHeading: 'Produk Terkait',
    },
    checkout: {
      docTitle: 'Checkout | Brakasa Tactical',
      pageTitle: 'Checkout',
      loadingLabel: 'Menyinkronkan keranjang belanja...',
      emptySectionSr: 'Status keranjang belanja',
      emptyTitle: 'Keranjang belanja masih kosong',
      emptyDesc: 'Tambahkan produk dari katalog terlebih dahulu sebelum melanjutkan ke checkout.',
      browseShop: 'Lihat Katalog',
      cartErrorTitle: 'Gagal memverifikasi stok keranjang',
      cartErrorSrHeading: 'Status keranjang',
      addressHeading: 'Alamat Pengiriman',
      fullNameLabel: 'Nama Lengkap',
      fullNamePlaceholder: 'Nama penerima paket',
      emailLabel: 'Alamat Email',
      emailPlaceholder: 'nama@domain.id',
      phoneLabel: 'Nomor WhatsApp / Telepon',
      phonePlaceholder: '08xx-xxxx-xxxx',
      cityLabel: 'Kota / Kabupaten',
      cityPlaceholder: 'Jakarta Selatan',
      districtLabel: 'Kecamatan',
      districtPlaceholder: 'Mampang Prapatan',
      postalCodeLabel: 'Kode Pos (5 Digit)',
      postalCodePlaceholder: '12730',
      streetAddressLabel: 'Alamat Lengkap',
      streetAddressPlaceholder: 'Nama jalan, nomor rumah, RT/RW, dan patokan',
      notesLabel: 'Catatan (Opsional)',
      notesPlaceholder: 'Catatan tambahan untuk pengiriman atau QC',
      shippingHeading: 'Pengiriman',
      zoneLabel: 'Zona Wilayah',
      totalWeightLabel: (formatted: string) => `Total berat: ${formatted}`,
      courierLegend: 'Pilih Ekspedisi',
      availableBadge: 'Tersedia',
      unavailableBadge: 'Tidak Tersedia',
      freeBadge: 'Gratis',
      courierLockedReason: (shippingClassLabel: string) =>
        `Tidak tersedia untuk kelas ${shippingClassLabel}.`,
      etaPrefix: 'Estimasi:',
      chargeableWeightMeta: (chargeableKg: number, minKg: number) =>
        `Berat terhitung: ${chargeableKg} kg (min. ${minKg} kg)`,
      woodenPackingTitle: 'Packing Kayu',
      woodenPackingRecommended: 'Disarankan',
      woodenPackingPickupNote: 'Tidak diperlukan untuk Ambil di Armory.',
      woodenPackingDesc: 'Pelindung rangka kayu tambahan untuk pengiriman ekspedisi.',
      voucherPaymentHeading: 'Voucher & Pembayaran',
      voucherLabel: 'Kode Voucher (Opsional)',
      voucherPlaceholder: 'Masukkan kode promo',
      voucherChecking: 'Memeriksa...',
      voucherApplyBtn: 'Terapkan',
      activePromosLabel: 'Promo aktif:',
      voucherAppliedTitle: (code: string) => `Voucher ${code} diterapkan`,
      voucherKargoFreeConflict:
        'KARGOFREE hanya berlaku untuk pengiriman ekspedisi berbayar.',
      voucherDiscountApplied: (amount: string) => `Potongan: ${amount}`,
      voucherRemoveBtn: 'Hapus',
      paymentMethodLegend: 'Metode Pembayaran',
      paymentOptions: [
        {
          code: 'VA_BCA',
          label: 'Virtual Account BCA',
          description: 'Nomor VA BCA otomatis per invoice, batas bayar 24 jam.',
        },
        {
          code: 'VA_MANDIRI',
          label: 'Virtual Account Bank Mandiri',
          description: 'Pembayaran melalui Livin atau ATM Mandiri.',
        },
        {
          code: 'QRIS',
          label: 'QRIS Nasional',
          description: 'Bayar instan melalui aplikasi bank atau e-wallet.',
        },
        {
          code: 'BANK_TRANSFER_ARMORY',
          label: 'Transfer Bank',
          description: 'Transfer manual ke rekening resmi PT Brakasa Tactical Indonesia.',
        },
      ],
      submitLoading: 'Memproses Pesanan...',
      submitLabel: (totalFormatted: string) => `Buat Pesanan (${totalFormatted})`,
      summaryAria: 'Ringkasan pesanan',
      summaryHeading: 'Ringkasan Pesanan',
      summaryMobileToggle: (count: number) => `Ringkasan Pesanan (${count})`,
      summaryMeta: (skuCount: number, unitCount: number, weightFormatted: string) =>
        `${skuCount} SKU (${unitCount} unit) - ${weightFormatted}`,
      summarySubtotal: 'Subtotal',
      summaryVoucher: (code: string) => `Voucher (${code})`,
      summaryShipping: (courierName: string) => `Ongkir (${courierName})`,
      summaryWoodenPacking: 'Packing Kayu',
      summaryTotal: 'Total',
      itemOutOfStock: 'Stok habis. Hapus dari keranjang.',
      itemRemainingStock: (qty: number) => `Stok tersisa ${qty} unit.`,
      validation: {
        stockBlocker: 'Beberapa item di keranjang melebihi stok tersedia. Perbarui keranjang Anda.',
        formBanner: 'Periksa kembali kolom yang ditandai sebelum membuat pesanan.',
        networkError: 'Koneksi ke server terputus saat membuat pesanan. Silakan coba lagi.',
        voucherEmpty: 'Masukkan kode voucher terlebih dahulu.',
        voucherInvalid: 'Kode voucher tidak berlaku untuk transaksi ini.',
        voucherKargoFreePickup:
          'Voucher KARGOFREE hanya berlaku untuk ekspedisi berbayar, bukan Ambil di Armory.',
        voucherNetworkError: 'Gagal memvalidasi voucher. Periksa koneksi Anda lalu coba lagi.',
        customerName: 'Masukkan nama lengkap penerima.',
        customerEmail: 'Masukkan alamat email yang valid.',
        customerPhone: 'Masukkan nomor WhatsApp atau telepon yang valid (10-15 digit).',
        shippingCity: 'Masukkan kota atau kabupaten tujuan.',
        shippingDistrict: 'Masukkan kecamatan tujuan.',
        shippingPostalCode: 'Kode pos harus terdiri dari 5 digit angka.',
        shippingAddress: 'Masukkan alamat lengkap pengiriman (minimal 10 karakter).',
        shippingCourier: 'Pilih ekspedisi yang tersedia untuk isi keranjang Anda.',
      },
      invoice: {
        heading: (invoiceNumber: string) => `Invoice ${invoiceNumber}`,
        subtitle:
          'Pesanan Anda telah dicatat dan stok telah diamankan. Selesaikan pembayaran sebelum batas waktu berakhir.',
        copyInvoice: 'Salin Nomor Invoice',
        copiedInvoice: 'Nomor Invoice Disalin',
        printInvoice: 'Cetak Invoice',
        backToShop: 'Kembali ke Katalog',
        paymentDestination: 'Tujuan Pembayaran',
        accountNumberLabel: 'Nomor VA / Rekening',
        copyShort: 'Salin',
        copiedShort: 'Disalin',
        exactAmountLabel: 'Nominal Pembayaran',
        deadlineLabel: 'Batas Waktu',
        orderItemsHeading: (count: number) => `Item Pesanan (${count})`,
        summaryHeading: 'Pengiriman & Ringkasan Biaya',
        recipientLabel: 'Penerima',
        subtotalLabel: 'Subtotal',
        discountLabel: (code: string | null) => (code ? `Diskon (${code})` : 'Diskon'),
        shippingLabel: (courierName: string) => `Ongkir (${courierName})`,
        woodenPackingLabel: 'Packing Kayu',
        totalLabel: 'Total Pembayaran',
      },
    },
  },
  en: {
    card: {
      soldOut: 'Sold Out',
      viewProductAria: (name: string) => `View ${name}`,
    },
    filters: {
      heading: 'Filter',
      reset: (count: number) => `Reset (${count})`,
      sortLabel: 'Sort By',
      categoryLabel: 'Category',
      allCategories: 'All Categories',
      missionLabel: 'Mission Profile',
      allMissions: 'All Missions',
      platformLabel: 'Platform',
      allPlatforms: 'All Platforms',
      propulsionLabel: 'Propulsion',
      allPropulsions: 'All Propulsion',
      fpsLegend: 'FPS Range (@0.20g)',
      fpsMinLabel: 'Min FPS',
      fpsMaxLabel: 'Max FPS',
      fpsMinPlaceholder: '300',
      fpsMaxPlaceholder: '450',
      fpsPresetCqb: '<= 350 CQB',
      fpsPresetOutdoor: '351-420 Outdoor',
      fpsPresetSniper: '> 400 Sniper',
      priceLegend: 'Price Range (IDR)',
      priceMinLabel: 'Min (Rp)',
      priceMaxLabel: 'Max (Rp)',
      availabilityLegend: 'Availability & Media',
      inStockOnly: 'In Stock Only',
      hasVideoOnly: 'Has Demo Video',
      missionLabels: {
        cqb: 'Indoor CQB (<= 350 FPS)',
        'woodland-recce': 'Woodland & Recce',
        speedqb: 'SpeedQB / Competition',
        'rig-protection': 'Rig, Helmet & Protection',
      },
      platformLabels: {
        M4_AR15: 'M4 / AR-15 / MK18',
        AK_SERIES: 'AK Series',
        SMG_PDW: 'SMG / CQB PDW',
        BOLT_ACTION: 'Bolt-Action Sniper',
        PISTOL_G_SERIES: 'G-Series Pistol',
        UNIVERSAL_MOLLE: 'MOLLE / Plate Carrier / Helmet',
        UNIVERSAL_PICATINNY: 'Optics & Picatinny 1913',
        APPAREL_FOOTWEAR: 'Apparel, Gloves & Boots',
        CONSUMABLE: 'BBs, Green Gas & LiPo',
      },
      propulsionLabels: {
        AEG: 'AEG (Electric)',
        GBBR: 'GBBR (Gas Blowback Rifle)',
        GBB_PISTOL: 'GBB Pistol',
        CO2: 'CO2 System',
        SPRING: 'Spring Bolt-Action',
        NON_REPLICA: 'Non-Unit Gear',
      },
      sortOptions: [
        { value: 'featured', label: 'Featured' },
        { value: 'newest', label: 'Newest' },
        { value: 'price_asc', label: 'Price: Low to High' },
        { value: 'price_desc', label: 'Price: High to Low' },
        { value: 'fps_asc', label: 'FPS: Low to High' },
        { value: 'fps_desc', label: 'FPS: High to Low' },
      ],
    },
    catalog: {
      docTitle: 'Shop | Brakasa Tactical',
      docTitleCategory: (categoryName: string) => `${categoryName} | Brakasa Tactical`,
      defaultTitle: 'Shop',
      loadingCount: 'Loading...',
      productCount: (count: number) => `${count} ${count === 1 ? 'product' : 'products'}`,
      desktopFilterAria: 'Catalog filter panel',
      searchLabel: 'Search products, brands, or SKU',
      searchPlaceholder: 'Search products, brands, SKU...',
      filterButton: 'Filter',
      sortLabel: 'Sort By',
      activeFiltersAria: 'Active filters',
      chipSearch: (query: string) => `Search: "${query}"`,
      chipCategory: (name: string) => `Category: ${name}`,
      chipMission: (label: string) => `Mission: ${label}`,
      chipPlatform: (label: string) => `Platform: ${label}`,
      chipPropulsion: (label: string) => `Propulsion: ${label}`,
      chipFps: (min: string, max: string) => `FPS: ${min} - ${max}`,
      chipPrice: (min: string, max: string) => `Price: ${min} - ${max}`,
      chipPriceMaxFallback: 'Max',
      chipInStock: 'In Stock Only',
      chipHasVideo: 'Has Demo Video',
      resetAll: 'Reset All',
      productListSrHeading: 'Product Listing',
      errorTitle: 'Failed to load catalog',
      errorFallback: 'The catalog server did not respond. Please check your connection and try again.',
      loadingLabel: 'Loading products...',
      emptyTitle: 'No products found',
      emptyDesc: 'Try adjusting your search query or clearing active filters.',
      paginationAria: 'Catalog pagination',
      prevPage: 'Previous',
      nextPage: 'Next',
      pageInfo: (page: number, totalPages: number, total: number) =>
        `Page ${page} of ${totalPages} (${total} products)`,
      sheetTitle: 'Filter & Sort',
      sheetCloseAria: 'Close filter panel',
      sheetCloseLabel: 'Close',
      sheetReset: 'Reset',
      sheetApply: (total: number) => `Apply (${total})`,
    },
    gallery: {
      photoTab: 'Photos',
      videoTab: 'Demo Video',
      zoomLabel: 'Zoom',
      zoomAria: (name: string) => `Zoom image of ${name}`,
      playDemoBtn: 'Play Video',
      playDemoAria: (name: string) => `Play demo video of ${name}`,
      pauseLabel: 'Pause',
      playLabel: 'Play',
      pauseVideoAria: 'Pause demo video',
      playVideoAria: 'Play demo video',
      unmuteAria: 'Unmute video audio',
      muteAria: 'Mute video audio',
      soundOff: 'Muted',
      soundOn: 'Sound',
      seekLabel: 'Demo video seek position',
      prevMediaAria: 'Previous media',
      nextMediaAria: 'Next media',
      thumbsGroupAria: 'Select product media',
      showVideoThumbAria: (index: number) => `Show demo video ${index}`,
      showPhotoThumbAria: (index: number) => `Show product photo ${index}`,
      videoBadge: 'VIDEO',
      lightboxAria: (name: string) => `Enlarged preview of ${name}`,
      lightboxCloseLabel: 'Close',
      lightboxCloseAria: 'Close image preview',
      lightboxPrevAria: 'Previous photo',
      lightboxNextAria: 'Next photo',
    },
    specs: {
      caption: (name: string) => `Technical specifications for ${name}`,
      paramHeader: 'Parameter',
      valueHeader: 'Specification',
      yes: 'Yes',
      no: 'No',
      mosfetYes: 'Yes (Factory Installed)',
      mosfetNo: 'No (Mechanical Trigger Contacts)',
      roundsUnit: (qty: number) => `${qty} rds (6mm BB)`,
      labels: {
        sku: 'SKU',
        brand: 'Brand',
        category: 'Category',
        platform: 'Platform',
        propulsion: 'Propulsion',
        chronographVelocity: 'Chronograph Velocity',
        kineticEnergy: 'Kinetic Energy',
        fieldClass: 'Field Class',
        gearboxOrSystem: 'Gearbox / System',
        fireModes: 'Fire Modes',
        hopUp: 'Hop-Up System',
        innerBarrel: 'Inner Barrel',
        magazineCapacity: 'Magazine Capacity',
        batteryConnector: 'Battery Connector',
        mosfetEtu: 'MOSFET / ETU',
        batteryRecommendation: 'Recommended Battery',
        batteryFormFactor: 'Battery Form Factor',
        gasType: 'Gas Type',
        muzzleThread: 'Muzzle Thread',
        railMounting: 'Rail / Mounting',
        opticMagnification: 'Optic Magnification',
        opticMount: 'Optic Mount',
        material: 'Material',
        textileSpec: 'Textile Specification',
        bbWeight: 'BB Weight',
        recommendedBbWeight: 'Recommended BB Weight',
        dimensions: 'Dimensions',
        certification: 'Standard / Rating',
        colorOptions: 'Color Options',
        netWeight: 'Net Weight',
        shippingClass: 'Shipping Class',
      },
      connectors: {
        DEANS_T_PLUG: 'Deans T-Plug',
        MINI_TAMIYA: 'Mini Tamiya',
      },
      formFactors: {
        STICK_BUFFER_TUBE: 'Stick (Buffer Tube)',
        NUNCHUCK: 'Nunchuck / Butterfly',
        PEQ_BOX: 'External PEQ Box',
      },
      gasTypes: {
        GREEN_GAS: 'Green Gas (Propane + Silicone)',
        CO2_12G: '12g CO2 Cartridge',
      },
      muzzleThreads: {
        '14MM_CCW': '14mm CCW (Counter-Clockwise)',
        M24X1_CW: 'M24x1 CW (Clockwise)',
        '11MM_CW_PISTOL': '11mm CW (Pistol Barrel)',
      },
      rails: {
        PICATINNY_1913: 'MIL-STD-1913 Picatinny',
        M_LOK: 'M-LOK Handguard',
        AK_SIDE_DOVETAIL: 'AK Side Dovetail Mount',
        MOLLE_PALS_LASER_CUT: 'MOLLE/PALS Laser-Cut',
        SWIFTCLIP_PLACARD: 'SwiftClip / G-Hook Placard',
        ARC_HELMET_RAIL: 'FAST ARC Helmet Side Rail',
        NVG_SHROUD: 'Aluminum NVG Shroud',
      },
      cordura: {
        '500D': '500D Cordura Nylon',
        '1000D': '1000D Cordura Nylon',
        '500D_1000D_LAMINATE': '500D Cordura + Laser-Cut Laminate',
        NYCO_50_50_RIPSTOP: '50/50 NyCo Ripstop',
      },
      fieldRoles: {
        CQB_STRICT: 'Strict CQB (<= 330 FPS)',
        CQB_STANDARD: 'Standard CQB (<= 350 FPS)',
        WOODLAND_ASSAULT: 'Woodland / Outdoor Assault (<= 420 FPS)',
        DMR_SNIPER: 'DMR / Bolt-Action Sniper (> 400 FPS, MED 15-25 m)',
      },
    },
    pdp: {
      docTitleDefault: 'Product Detail | Brakasa Tactical',
      backButton: 'Back',
      backAria: 'Go back to previous page',
      breadcrumbAria: 'Breadcrumb',
      breadcrumbHome: 'Home',
      breadcrumbShop: 'Shop',
      loadingLabel: 'Loading product details...',
      notFoundPageHeading: 'Product Not Found',
      notFoundSectionSr: 'Product availability status',
      notFoundTitle: 'Product not found',
      notFoundDesc: 'This SKU may no longer be active or the link is incomplete.',
      backToShop: 'Back to Shop',
      errorPageHeading: 'Product Detail',
      errorSectionSr: 'Product error status',
      errorTitle: 'Failed to load product details',
      errorFallback: 'Could not retrieve this product from the server.',
      stockInStock: (qty: number) => `In Stock (${qty})`,
      stockLowStock: (qty: number) => `Low Stock (${qty})`,
      stockOutOfStock: 'Out of Stock',
      quantityLabel: 'Quantity',
      decreaseQtyAria: 'Decrease quantity',
      increaseQtyAria: 'Increase quantity',
      addToCart: 'Add to Cart',
      outOfStockBtn: 'Out of Stock',
      addedFeedback: (qty: number, name: string) => `${qty}x ${name} added to cart.`,
      viewCart: 'View Cart',
      descriptionHeading: 'Description',
      inTheBoxHeading: 'In the Box',
      specsHeading: 'Specifications',
      similarHeading: 'Similar Products',
    },
    checkout: {
      docTitle: 'Checkout | Brakasa Tactical',
      pageTitle: 'Checkout',
      loadingLabel: 'Syncing shopping cart...',
      emptySectionSr: 'Shopping cart status',
      emptyTitle: 'Your cart is empty',
      emptyDesc: 'Add items from the shop before proceeding to checkout.',
      browseShop: 'Browse Shop',
      cartErrorTitle: 'Failed to verify cart stock',
      cartErrorSrHeading: 'Cart status',
      addressHeading: 'Shipping Address',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'Recipient full name',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@domain.com',
      phoneLabel: 'WhatsApp / Phone Number',
      phonePlaceholder: '+62 8xx-xxxx-xxxx',
      cityLabel: 'City / Regency',
      cityPlaceholder: 'South Jakarta',
      districtLabel: 'District',
      districtPlaceholder: 'Mampang Prapatan',
      postalCodeLabel: 'Postal Code (5 Digits)',
      postalCodePlaceholder: '12730',
      streetAddressLabel: 'Street Address',
      streetAddressPlaceholder: 'Street name, building number, neighborhood, and landmark',
      notesLabel: 'Order Notes (Optional)',
      notesPlaceholder: 'Optional delivery or QC request',
      shippingHeading: 'Shipping',
      zoneLabel: 'Shipping Zone',
      totalWeightLabel: (formatted: string) => `Total weight: ${formatted}`,
      courierLegend: 'Shipping Method',
      availableBadge: 'Available',
      unavailableBadge: 'Unavailable',
      freeBadge: 'Free',
      courierLockedReason: (shippingClassLabel: string) =>
        `Not available for ${shippingClassLabel}.`,
      etaPrefix: 'ETA:',
      chargeableWeightMeta: (chargeableKg: number, minKg: number) =>
        `Chargeable weight: ${chargeableKg} kg (min. ${minKg} kg)`,
      woodenPackingTitle: 'Wooden Crating',
      woodenPackingRecommended: 'Recommended',
      woodenPackingPickupNote: 'Not required for Armory Pickup.',
      woodenPackingDesc: 'Protective outer wood framing for cargo shipments.',
      voucherPaymentHeading: 'Voucher & Payment',
      voucherLabel: 'Voucher Code (Optional)',
      voucherPlaceholder: 'Enter promo code',
      voucherChecking: 'Checking...',
      voucherApplyBtn: 'Apply',
      activePromosLabel: 'Active promos:',
      voucherAppliedTitle: (code: string) => `Voucher ${code} applied`,
      voucherKargoFreeConflict: 'KARGOFREE only applies to paid courier shipments.',
      voucherDiscountApplied: (amount: string) => `Discount: ${amount}`,
      voucherRemoveBtn: 'Remove',
      paymentMethodLegend: 'Payment Method',
      paymentOptions: [
        {
          code: 'VA_BCA',
          label: 'BCA Virtual Account',
          description: 'Dedicated BCA Virtual Account number per invoice, valid 24 hours.',
        },
        {
          code: 'VA_MANDIRI',
          label: 'Bank Mandiri Virtual Account',
          description: 'Pay via Livin or Bank Mandiri ATM.',
        },
        {
          code: 'QRIS',
          label: 'National QRIS',
          description: 'Instant payment via Indonesian banking apps or e-wallets.',
        },
        {
          code: 'BANK_TRANSFER_ARMORY',
          label: 'Bank Transfer',
          description: 'Manual transfer to the official PT Brakasa Tactical Indonesia account.',
        },
      ],
      submitLoading: 'Placing Order...',
      submitLabel: (totalFormatted: string) => `Place Order (${totalFormatted})`,
      summaryAria: 'Order summary',
      summaryHeading: 'Order Summary',
      summaryMobileToggle: (count: number) => `Order Summary (${count})`,
      summaryMeta: (skuCount: number, unitCount: number, weightFormatted: string) =>
        `${skuCount} SKU (${unitCount} units) - ${weightFormatted}`,
      summarySubtotal: 'Subtotal',
      summaryVoucher: (code: string) => `Voucher (${code})`,
      summaryShipping: (courierName: string) => `Shipping (${courierName})`,
      summaryWoodenPacking: 'Wooden Crating',
      summaryTotal: 'Total',
      itemOutOfStock: 'Out of stock. Remove from cart.',
      itemRemainingStock: (qty: number) => `Only ${qty} unit(s) remaining.`,
      validation: {
        stockBlocker: 'Some items in your cart exceed available stock. Please update your cart.',
        formBanner: 'Please review the highlighted fields before placing your order.',
        networkError: 'Connection lost while placing your order. Please try again.',
        voucherEmpty: 'Please enter a voucher code first.',
        voucherInvalid: 'This voucher code is not valid for your order.',
        voucherKargoFreePickup:
          'KARGOFREE only applies to paid courier shipping, not Armory Pickup.',
        voucherNetworkError: 'Could not validate voucher. Check your connection and try again.',
        customerName: 'Please enter the recipient full name.',
        customerEmail: 'Please enter a valid email address.',
        customerPhone: 'Please enter a valid WhatsApp or phone number (10-15 digits).',
        shippingCity: 'Please enter the destination city or regency.',
        shippingDistrict: 'Please enter the destination district.',
        shippingPostalCode: 'Postal code must be exactly 5 digits.',
        shippingAddress: 'Please enter the complete delivery address (at least 10 characters).',
        shippingCourier: 'Please select an available shipping method for your cart.',
      },
      invoice: {
        heading: (invoiceNumber: string) => `Invoice ${invoiceNumber}`,
        subtitle:
          'Your order is confirmed and stock has been reserved. Complete payment before the deadline.',
        copyInvoice: 'Copy Invoice Number',
        copiedInvoice: 'Invoice Number Copied',
        printInvoice: 'Print Invoice',
        backToShop: 'Back to Shop',
        paymentDestination: 'Payee',
        accountNumberLabel: 'VA / Account Number',
        copyShort: 'Copy',
        copiedShort: 'Copied',
        exactAmountLabel: 'Amount Due',
        deadlineLabel: 'Payment Deadline',
        orderItemsHeading: (count: number) => `Order Items (${count})`,
        summaryHeading: 'Shipping & Cost Summary',
        recipientLabel: 'Recipient',
        subtotalLabel: 'Subtotal',
        discountLabel: (code: string | null) => (code ? `Discount (${code})` : 'Discount'),
        shippingLabel: (courierName: string) => `Shipping (${courierName})`,
        woodenPackingLabel: 'Wooden Crating',
        totalLabel: 'Total Paid',
      },
    },
  },
};

export function getStoreCopy(lang: Language): StoreDictionary {
  return STORE_DICTIONARIES[lang];
}
