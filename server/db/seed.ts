import { db, initializeSchema, withTransaction } from './connection.ts';
import {
  DEFAULT_ARMORY_PROFILE,
  DEFAULT_HERO_SLIDES,
  DEFAULT_MAPS_DIRECTIONS_URL,
  DEFAULT_MAPS_EMBED_URL,
  buildSpecsSearchText,
  safeJsonParse,
} from './helpers.ts';
import { hashPassword } from '../services/authService.ts';
import { DEFAULT_SHIPPING_SETTINGS } from '../services/shippingService.ts';
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
} from '../config.ts';
import {
  HERO_KEYFRAME_PATHS,
  HERO_POSTER_PATH,
  HERO_VIDEO_PATH,
  PRODUCT_MEDIA_CONVENTIONS,
  type ArmoryProfileSettings,
  type HeroConfig,
  type HeroSceneTelemetry,
  type HeroSlideConfig,
  type InventoryDefaultSettings,
  type LoadoutSlotType,
  type LoadoutSpotlightConfig,
  type MissionTag,
  type PlatformType,
  type ProductCompatibility,
  type ProductSpecs,
  type PropulsionType,
  type ShippingClass,
} from '../../shared/types.ts';

interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}

interface SeedProduct {
  sku: string;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  missionTags: MissionTag[];
  platform: PlatformType;
  propulsion: PropulsionType;
  loadoutSlot: LoadoutSlotType;
  priceIdr: number;
  weightGrams: number;
  stockQty: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  requiresAge18: boolean;
  shippingClass: ShippingClass;
  shortDescription: string;
  description: string;
  specs: ProductSpecs;
  compatibility: ProductCompatibility;
  primaryAlt: string;
  detailAlt?: string;
  videoAlt?: string;
  videoDurationSec?: number;
}

const SEED_CATEGORIES: SeedCategory[] = [
  {
    slug: 'assault-rifle',
    name: 'Assault Rifle',
    description: 'Unit replika laras panjang AEG dan GBBR untuk peran assault woodland dan milsim.',
    sortOrder: 1,
  },
  {
    slug: 'smg-pdw',
    name: 'SMG & PDW',
    description: 'Unit kompak bermanuver cepat untuk arena CQB indoor dan SpeedQB <= 350 FPS.',
    sortOrder: 2,
  },
  {
    slug: 'sniper-rifle',
    name: 'Sniper Rifle',
    description: 'Unit bolt-action spring presisi jarak jauh dengan hop-up TDC dan batas legal <= 2,0 J.',
    sortOrder: 3,
  },
  {
    slug: 'sidearm-pistol',
    name: 'Sidearm Pistol',
    description: 'Pistol gas blowback (GBB) untuk transisi cepat jarak dekat dan pelengkap MED.',
    sortOrder: 4,
  },
  {
    slug: 'optics-aiming',
    name: 'Optics & Aiming',
    description: 'Red dot, LPVO scope, dan modul laser/illuminator berstandar MIL-STD-1913 Picatinny.',
    sortOrder: 5,
  },
  {
    slug: 'plate-carrier-rig',
    name: 'Plate Carrier & Rig',
    description: 'Sistem pembawa magasin modular Cordura 500D, laser-cut MOLLE, dan placard SwiftClip.',
    sortOrder: 6,
  },
  {
    slug: 'helmet-comms',
    name: 'Helmet & Comms',
    description: 'Helm taktis high-cut ARC rail dan headset proteksi pendengaran aktif NRR 22 dB.',
    sortOrder: 7,
  },
  {
    slug: 'apparel-footwear',
    name: 'Apparel & Footwear',
    description: 'Seragam tempur 50/50 NyCo ripstop, sarung tangan proteksi benturan, dan sepatu GORE-TEX.',
    sortOrder: 8,
  },
  {
    slug: 'consumables-upgrades',
    name: 'Consumables & Upgrades',
    description: 'BB presisi 6mm, Green Gas 12kg, baterai LiPo 11.1V Deans, dan tracer unit 14mm CCW.',
    sortOrder: 9,
  },
];

const SEED_PRODUCTS: SeedProduct[] = [
  {
    sku: 'BRK-AR-001',
    slug: 'tokyo-marui-mk18-mod1-mws-gbbr',
    name: 'Tokyo Marui MK18 Mod.1 MWS GBBR',
    brand: 'Tokyo Marui',
    categorySlug: 'assault-rifle',
    missionTags: ['cqb', 'woodland-recce'],
    platform: 'M4_AR15',
    propulsion: 'GBBR',
    loadoutSlot: 'primary',
    priceIdr: 16500000,
    weightGrams: 2960,
    stockQty: 2,
    lowStockThreshold: 3,
    isFeatured: true,
    requiresAge18: false,
    shippingClass: 'CARGO_REPLICA',
    shortDescription:
      'GBBR flagship sistem ZET dengan handguard DD RIS II, Cerakote matte, dan akurasi stabil 300-325 FPS.',
    description:
      'Tokyo Marui MK18 Mod.1 MWS mengandalkan sistem internal ZET yang dirancang untuk ketahanan bolt-catch jangka panjang dan efisiensi konsumsi gas. Receiver berlapis Cerakote dipadu handguard RIS II Picatinny quad-rail kokoh dengan ulir laras 14mm CCW, ideal untuk simulasi milsim dan arena CQB 300-325 FPS (~0,90 Joule).',
    specs: {
      propulsion: 'GBBR',
      platform: 'M4_AR15',
      loadout_slot: 'primary',
      fps_min: 300,
      fps_max: 325,
      fps_test_bb_gram: 0.2,
      energy_joule: 0.9,
      field_role: 'CQB_STANDARD',
      gearbox_or_system: 'Tokyo Marui MWS ZET Gas Blowback System',
      fire_modes: ['Safe', 'Semi', 'Full-Auto'],
      hop_up: 'Adjustable Hop-Up Dial (GBB Bucking)',
      inner_barrel: '250 mm / 6.08 mm Brass Precision',
      magazine_capacity_rds: 35,
      connector: 'NONE',
      has_mosfet: false,
      battery_voltage_rec: 'Tidak memerlukan baterai (Propulsi Gas)',
      battery_form_factor: 'NONE',
      gas_type: 'GREEN_GAS',
      muzzle_thread: '14MM_CCW',
      rail_type: ['PICATINNY_1913'],
      material: 'Cerakote Die-Cast Aluminum Receiver & CNC RIS II Quad-Rail',
      cordura_denier: 'NONE',
      bb_weight_rec: '0.25g - 0.28g',
      orange_tip_compliant: true,
      safety_certification: 'Standar QC Chronograph (<= 2,0 Joule)',
      dimensions_mm: '715 - 790 mm',
      color_options: ['Black / Dark Earth Rail'],
      in_the_box: [
        'Unit Tokyo Marui MK18 Mod.1 MWS GBBR',
        '1x Magasin Gas MWS 35 rds',
        'Kunci Penyetel Front Sight & Manual Pabrikan',
        'Sertifikat Uji Chronograph Brakasa Armory',
      ],
      required_to_operate: [
        'Green Gas 12kg (BRK-CSM-002)',
        'BB Plastik 6mm 0.25g - 0.28g (BRK-CSM-001)',
        'Silicone Oil Perawatan Seal Magasin',
      ],
    },
    compatibility: {
      loadout_slot: 'primary',
      platform_family: 'M4_AR15',
      propulsion: 'GBBR',
      required_power_type: 'GREEN_GAS',
      battery_connector: 'NONE',
      supports_11v_lipo: false,
      provides_rails: ['PICATINNY_1913'],
      muzzle_thread: '14MM_CCW',
      mag_family: 'M4_556_MWS_GBBR',
      recommended_bb_min_gram: 0.25,
      recommended_bb_max_gram: 0.3,
      compatible_skus: ['BRK-CSM-002', 'BRK-CSM-001', 'BRK-OPT-001', 'BRK-OPT-003', 'BRK-UPG-001', 'BRK-RIG-002'],
    },
    primaryAlt: 'Tokyo Marui MK18 Mod.1 MWS GBBR dengan rail RIS II dark earth di latar studio gelap',
    detailAlt: 'Detail macro receiver Cerakote dan bolt carrier Tokyo Marui MK18 MWS GBBR',
    videoAlt: 'Video demo inspeksi mekanisme bolt dan rail Tokyo Marui MK18 Mod.1 MWS GBBR',
    videoDurationSec: 8.0,
  },
  {
    sku: 'BRK-AR-002',
    slug: 'vfc-avalon-saber-carbine-mlok-aeg',
    name: 'VFC Avalon Saber Carbine M-LOK AEG',
    brand: 'VFC',
    categorySlug: 'assault-rifle',
    missionTags: ['woodland-recce'],
    platform: 'M4_AR15',
    propulsion: 'AEG',
    loadoutSlot: 'primary',
    priceIdr: 7850000,
    weightGrams: 2850,
    stockQty: 9,
    lowStockThreshold: 4,
    isFeatured: true,
    requiresAge18: false,
    shippingClass: 'CARGO_REPLICA',
    shortDescription:
      'AEG full metal dengan Gearbox V2 ECS ber-MOSFET, konektor Deans, dan handguard CNC M-LOK 370-390 FPS.',
    description:
      'VFC Avalon Saber Carbine memadukan receiver full metal presisi tinggi dengan handguard CNC 6061-T6 M-LOK yang ramping. Gearbox V2 ECS sudah dilengkapi MOSFET internal, quick-change spring, konektor Deans T-Plug, dan laras dalam 6.03mm yang langsung siap menjalankan baterai LiPo 11.1V Stick di medan woodland.',
    specs: {
      propulsion: 'AEG',
      platform: 'M4_AR15',
      loadout_slot: 'primary',
      fps_min: 370,
      fps_max: 390,
      fps_test_bb_gram: 0.2,
      energy_joule: 1.35,
      field_role: 'WOODLAND_ASSAULT',
      gearbox_or_system: 'Gearbox V2 ECS (Quick-Spring + Integrated MOSFET)',
      fire_modes: ['Safe', 'Semi', 'Full-Auto'],
      hop_up: 'Adjustable Rotary Hop-Up',
      inner_barrel: '380 mm / 6.03 mm Tight-Bore',
      magazine_capacity_rds: 120,
      connector: 'DEANS_T_PLUG',
      has_mosfet: true,
      battery_voltage_rec: '11.1V 3S LiPo Stick (20C - 25C)',
      battery_form_factor: 'STICK_BUFFER_TUBE',
      gas_type: 'NONE',
      muzzle_thread: '14MM_CCW',
      rail_type: ['PICATINNY_1913', 'M_LOK'],
      material: 'Full Metal Receiver & CNC 6061-T6 M-LOK Handguard',
      cordura_denier: 'NONE',
      bb_weight_rec: '0.25g - 0.28g',
      orange_tip_compliant: true,
      safety_certification: 'Standar QC Chronograph (<= 2,0 Joule)',
      dimensions_mm: '805 - 885 mm',
      color_options: ['Matte Black'],
      in_the_box: [
        'Unit VFC Avalon Saber Carbine M-LOK AEG',
        '1x Magasin QRS Mid-Cap 120 rds',
        'Manual & Sertifikat Uji Chronograph',
      ],
      required_to_operate: [
        'Baterai LiPo 11.1V Stick Deans (BRK-CSM-003)',
        'Smart Balance Charger LiPo 2S/3S',
        'BB Plastik 6mm 0.28g (BRK-CSM-001)',
      ],
    },
    compatibility: {
      loadout_slot: 'primary',
      platform_family: 'M4_AR15',
      propulsion: 'AEG',
      required_power_type: 'LIPO_BATTERY',
      battery_connector: 'DEANS_T_PLUG',
      supports_11v_lipo: true,
      required_battery_form_factors: ['STICK_BUFFER_TUBE'],
      provides_rails: ['PICATINNY_1913', 'M_LOK'],
      muzzle_thread: '14MM_CCW',
      mag_family: 'M4_556_AEG',
      recommended_bb_min_gram: 0.25,
      recommended_bb_max_gram: 0.3,
      compatible_skus: ['BRK-CSM-003', 'BRK-CSM-001', 'BRK-OPT-001', 'BRK-OPT-002', 'BRK-UPG-001', 'BRK-RIG-002'],
    },
    primaryAlt: 'VFC Avalon Saber Carbine M-LOK AEG berwarna matte black tampak samping di studio',
    detailAlt: 'Detail macro handguard CNC M-LOK dan flat trigger VFC Avalon Saber Carbine',
    videoAlt: 'Video demo inspeksi VFC Avalon Saber Carbine M-LOK AEG',
    videoDurationSec: 7.8,
  },
  {
    sku: 'BRK-AR-003',
    slug: 'cyma-cm040c-ak74m-steel-aeg',
    name: 'CYMA CM.040C AK-74M Stamped Steel AEG',
    brand: 'CYMA',
    categorySlug: 'assault-rifle',
    missionTags: ['woodland-recce'],
    platform: 'AK_SERIES',
    propulsion: 'AEG',
    loadoutSlot: 'primary',
    priceIdr: 4950000,
    weightGrams: 3200,
    stockQty: 11,
    lowStockThreshold: 4,
    isFeatured: false,
    requiresAge18: false,
    shippingClass: 'CARGO_REPLICA',
    shortDescription:
      'AEG AK-74M ber-receiver baja cetak (stamped steel) dan Gearbox V3 kokoh pada kisaran 400-415 FPS.',
    description:
      'CYMA CM.040C memakai konstruksi VFC-spec dengan receiver baja cetak dan popor lipat samping polimer nilon. Ditenagai Gearbox V3 metal tangguh dengan laras dalam 6.03mm untuk performa outdoor solid. Catatan teknis: unit standar memakai konektor Mini Tamiya tanpa MOSFET (gunakan LiPo 7.4V) serta dudukan optik samping AK dovetail.',
    specs: {
      propulsion: 'AEG',
      platform: 'AK_SERIES',
      loadout_slot: 'primary',
      fps_min: 400,
      fps_max: 415,
      fps_test_bb_gram: 0.2,
      energy_joule: 1.55,
      field_role: 'WOODLAND_ASSAULT',
      gearbox_or_system: 'Gearbox V3 Full Metal (Non-MOSFET)',
      fire_modes: ['Safe', 'Full-Auto', 'Semi'],
      hop_up: 'Slider Metal Hop-Up AK-Style',
      inner_barrel: '455 mm / 6.03 mm Brass',
      magazine_capacity_rds: 500,
      connector: 'MINI_TAMIYA',
      has_mosfet: false,
      battery_voltage_rec: '7.4V 2S LiPo Stick (Mini Tamiya)',
      battery_form_factor: 'STICK_BUFFER_TUBE',
      gas_type: 'NONE',
      muzzle_thread: '14MM_CCW',
      rail_type: ['AK_SIDE_DOVETAIL'],
      material: 'Stamped Steel Receiver & Nylon Fiber Polymer Furniture',
      cordura_denier: 'NONE',
      bb_weight_rec: '0.28g',
      orange_tip_compliant: true,
      safety_certification: 'Standar QC Chronograph (<= 2,0 Joule)',
      dimensions_mm: '705 - 945 mm (Popor Lipat)',
      color_options: ['Matte Black'],
      in_the_box: [
        'Unit CYMA CM.040C AK-74M AEG',
        '1x Magasin Hi-Cap 500 rds',
        'Cleaning Rod & Sertifikat Uji Chronograph',
      ],
      required_to_operate: [
        'Baterai LiPo 7.4V Stick Mini Tamiya (disarankan tanpa MOSFET)',
        'Smart Balance Charger',
        'BB Plastik 6mm 0.28g (BRK-CSM-001)',
      ],
    },
    compatibility: {
      loadout_slot: 'primary',
      platform_family: 'AK_SERIES',
      propulsion: 'AEG',
      required_power_type: 'LIPO_BATTERY',
      battery_connector: 'MINI_TAMIYA',
      supports_11v_lipo: false,
      required_battery_form_factors: ['STICK_BUFFER_TUBE'],
      provides_rails: ['AK_SIDE_DOVETAIL'],
      muzzle_thread: '14MM_CCW',
      mag_family: 'AK_545_AEG',
      recommended_bb_min_gram: 0.25,
      recommended_bb_max_gram: 0.3,
      compatible_skus: ['BRK-CSM-001', 'BRK-UPG-001', 'BRK-PST-001', 'BRK-RIG-001'],
    },
    primaryAlt: 'CYMA CM.040C AK-74M Stamped Steel AEG berwarna matte black di latar studio',
  },
  {
    sku: 'BRK-SMG-001',
    slug: 'gg-arp9-2-cqb-pdw-aeg',
    name: 'G&G ARP9 2.0 CQB PDW AEG',
    brand: 'G&G Armament',
    categorySlug: 'smg-pdw',
    missionTags: ['cqb', 'speedqb'],
    platform: 'SMG_PDW',
    propulsion: 'AEG',
    loadoutSlot: 'primary',
    priceIdr: 7200000,
    weightGrams: 1960,
    stockQty: 8,
    lowStockThreshold: 4,
    isFeatured: true,
    requiresAge18: false,
    shippingClass: 'CARGO_REPLICA',
    shortDescription:
      'PDW CQB super ringkas 1,96 kg dengan ETU/MOSFET bawaan, Deans 11.1V ready, dan kisaran 330-350 FPS.',
    description:
      'G&G ARP9 2.0 membawa penyempurnaan kompartemen baterai lebih panjang untuk baterai stick LiPo 11.1V, handguard CNC aluminum M-LOK, serta Electronic Trigger Unit (ETU) dan MOSFET terintegrasi. Bobot 1.960 gram dengan kecepatan luncur 330-350 FPS (~1,10 J) menjadikannya andalan manuver cepat di ruang sempit CQB dan SpeedQB.',
    specs: {
      propulsion: 'AEG',
      platform: 'SMG_PDW',
      loadout_slot: 'primary',
      fps_min: 330,
      fps_max: 350,
      fps_test_bb_gram: 0.2,
      energy_joule: 1.1,
      field_role: 'CQB_STANDARD',
      gearbox_or_system: 'Gearbox V2 dengan G&G ETU & MOSFET Bawaan',
      fire_modes: ['Safe', 'Semi', 'Full-Auto / 3-Round Burst'],
      hop_up: 'Rotary Polymer Hop-Up',
      inner_barrel: '168 mm / 6.04 mm',
      magazine_capacity_rds: 68,
      connector: 'DEANS_T_PLUG',
      has_mosfet: true,
      battery_voltage_rec: '11.1V 3S LiPo Stick (Deans)',
      battery_form_factor: 'STICK_BUFFER_TUBE',
      gas_type: 'NONE',
      muzzle_thread: '14MM_CCW',
      rail_type: ['PICATINNY_1913', 'M_LOK'],
      material: 'Glass-Filled Nylon Fiber Polymer Receiver & CNC Aluminum M-LOK',
      cordura_denier: 'NONE',
      bb_weight_rec: '0.25g - 0.28g',
      orange_tip_compliant: true,
      safety_certification: 'Standar CQB (<= 350 FPS, <= 2,0 Joule)',
      dimensions_mm: '509 - 595 mm',
      color_options: ['Matte Black'],
      in_the_box: [
        'Unit G&G ARP9 2.0 CQB PDW AEG',
        '1x Magasin Mid-Cap 68 rds',
        'Manual ETU & Sertifikat Uji Chronograph',
      ],
      required_to_operate: [
        'Baterai LiPo 11.1V Stick Deans (BRK-CSM-003)',
        'Smart Balance Charger',
        'BB Plastik 6mm 0.25g - 0.28g (BRK-CSM-001)',
      ],
    },
    compatibility: {
      loadout_slot: 'primary',
      platform_family: 'SMG_PDW',
      propulsion: 'AEG',
      required_power_type: 'LIPO_BATTERY',
      battery_connector: 'DEANS_T_PLUG',
      supports_11v_lipo: true,
      required_battery_form_factors: ['STICK_BUFFER_TUBE'],
      provides_rails: ['PICATINNY_1913', 'M_LOK'],
      muzzle_thread: '14MM_CCW',
      mag_family: 'SMG_9MM_ARP9',
      recommended_bb_min_gram: 0.2,
      recommended_bb_max_gram: 0.28,
      compatible_skus: ['BRK-CSM-003', 'BRK-OPT-001', 'BRK-UPG-001', 'BRK-CSM-001', 'BRK-RIG-001'],
    },
    primaryAlt: 'G&G ARP9 2.0 CQB PDW AEG kompak dengan handguard M-LOK dan popor PDW',
    detailAlt: 'Setup CQB 3/4 G&G ARP9 2.0 dengan red dot dan tracer unit',
    videoAlt: 'Video demo G&G ARP9 2.0 CQB PDW AEG dengan detail M-LOK dan trigger',
    videoDurationSec: 7.5,
  },
  {
    sku: 'BRK-SNP-001',
    slug: 'silverback-tac-41-p-bolt-action-sniper',
    name: 'Silverback TAC-41 P Bolt-Action Sniper',
    brand: 'Silverback Airsoft',
    categorySlug: 'sniper-rifle',
    missionTags: ['woodland-recce'],
    platform: 'BOLT_ACTION',
    propulsion: 'SPRING',
    loadoutSlot: 'primary',
    priceIdr: 12400000,
    weightGrams: 2800,
    stockQty: 2,
    lowStockThreshold: 3,
    isFeatured: true,
    requiresAge18: false,
    shippingClass: 'CARGO_REPLICA',
    shortDescription:
      'Sniper spring presisi dengan hop-up CNC TDC 50 klik, silinder bervolume besar, dan ulir laras M24x1 CW.',
    description:
      'Silverback TAC-41 P dirancang siap tempur langsung dari kotak dengan receiver CNC 6000-series aluminum, sasis fiberglass reinforced nylon, dan hop-up TDC (Top Dead Center) 50 indeks klik 15 mikrometer. Menggunakan laras dalam 510mm AEG-spec dengan performa terukur 410-445 FPS (1,60-1,90 J). Disarankan membawa sidearm CQB untuk MED lapangan.',
    specs: {
      propulsion: 'SPRING',
      platform: 'BOLT_ACTION',
      loadout_slot: 'primary',
      fps_min: 410,
      fps_max: 445,
      fps_test_bb_gram: 0.2,
      energy_joule: 1.85,
      field_role: 'DMR_SNIPER',
      gearbox_or_system: 'Manual Spring Bolt-Action (41 cc Cylinder Volume)',
      fire_modes: ['Safe', 'Single Bolt-Action'],
      hop_up: 'CNC TDC Hop-Up 50-Click Indexed (AEG Bucking Spec)',
      inner_barrel: '510 mm / 6.05 mm AEG-Spec',
      magazine_capacity_rds: 48,
      connector: 'NONE',
      has_mosfet: false,
      battery_voltage_rec: 'Tidak memerlukan baterai atau gas',
      battery_form_factor: 'NONE',
      gas_type: 'NONE',
      muzzle_thread: 'M24X1_CW',
      rail_type: ['PICATINNY_1913', 'M_LOK'],
      material: 'Fiberglass-Reinforced Nylon Chassis & CNC 6000-Series Aluminum Receiver',
      cordura_denier: 'NONE',
      bb_weight_rec: '0.28g - 0.40g',
      orange_tip_compliant: true,
      safety_certification: 'Standar QC Chronograph (<= 2,0 Joule, MED 15-25 meter)',
      dimensions_mm: '1100 mm',
      color_options: ['Ranger Green / Matte Black'],
      in_the_box: [
        'Unit Silverback TAC-41 P Bolt-Action Sniper',
        '1x Magasin 48 rds',
        'Spacer Popor & Kunci Hex Penyetelan',
        'Sertifikat Uji Chronograph Brakasa Armory',
      ],
      required_to_operate: [
        'Optik Pembesaran LPVO / Scope (BRK-OPT-002)',
        'BB Presisi >= 0.28g (BRK-CSM-001)',
        'Sidearm CQB <= 350 FPS untuk jarak dekat (BRK-PST-001)',
      ],
    },
    compatibility: {
      loadout_slot: 'primary',
      platform_family: 'BOLT_ACTION',
      propulsion: 'SPRING',
      required_power_type: 'SPRING_MANUAL',
      battery_connector: 'NONE',
      supports_11v_lipo: false,
      provides_rails: ['PICATINNY_1913', 'M_LOK'],
      muzzle_thread: 'M24X1_CW',
      mag_family: 'TAC41_BOLT',
      recommended_bb_min_gram: 0.28,
      recommended_bb_max_gram: 0.4,
      compatible_skus: ['BRK-OPT-002', 'BRK-PST-001', 'BRK-CSM-001', 'BRK-APP-001', 'BRK-APP-003'],
    },
    primaryAlt: 'Silverback TAC-41 P Bolt-Action Sniper Rifle dengan sasis taktis ranger green dan laras fluted',
    detailAlt: 'Macro detail dial hop-up TDC dan bolt handle Silverback TAC-41 P',
    videoAlt: 'Video demo inspeksi Silverback TAC-41 P Bolt-Action Sniper',
    videoDurationSec: 8.5,
  },
  {
    sku: 'BRK-PST-001',
    slug: 'umarex-vfc-glock-17-gen5-gbb',
    name: 'Umarex / VFC Glock 17 Gen5 GBB',
    brand: 'Umarex / VFC',
    categorySlug: 'sidearm-pistol',
    missionTags: ['cqb', 'woodland-recce', 'speedqb'],
    platform: 'PISTOL_G_SERIES',
    propulsion: 'GBB_PISTOL',
    loadoutSlot: 'sidearm',
    priceIdr: 3650000,
    weightGrams: 655,
    stockQty: 14,
    lowStockThreshold: 5,
    isFeatured: true,
    requiresAge18: false,
    shippingClass: 'CARGO_REPLICA',
    shortDescription:
      'Pistol GBB berlisensi resmi dengan slide CNC aluminum, penyetel Guide-Hop cepat, dan performa CQB 300-330 FPS.',
    description:
      'Umarex / VFC Glock 17 Gen5 menghadirkan ergonomi ambidextrous Gen5, front slide serrations, serta sistem Guide-Hop yang memungkinkan penyetelan hop-up lewat recoil guide rod tanpa membongkar slide. Sangat andal sebagai sidearm backup untuk unit sniper/DMR maupun unit utama CQB ringan.',
    specs: {
      propulsion: 'GBB_PISTOL',
      platform: 'PISTOL_G_SERIES',
      loadout_slot: 'sidearm',
      fps_min: 300,
      fps_max: 330,
      fps_test_bb_gram: 0.2,
      energy_joule: 0.95,
      field_role: 'CQB_STRICT',
      gearbox_or_system: 'VFC GBB System dengan Guide-Hop Quick Adjust',
      fire_modes: ['Trigger Safety', 'Semi'],
      hop_up: 'Guide-Hop External Hex Adjust',
      inner_barrel: '97 mm / 6.03 mm',
      magazine_capacity_rds: 22,
      connector: 'NONE',
      has_mosfet: false,
      battery_voltage_rec: 'Tidak memerlukan baterai (Green Gas)',
      battery_form_factor: 'NONE',
      gas_type: 'GREEN_GAS',
      muzzle_thread: 'NONE',
      rail_type: ['PICATINNY_1913'],
      material: 'CNC Aluminum Slide & Reinforced Polymer Frame (Licensed)',
      cordura_denier: 'NONE',
      bb_weight_rec: '0.20g - 0.28g',
      orange_tip_compliant: true,
      safety_certification: 'Standar QC Chronograph (<= 2,0 Joule)',
      dimensions_mm: '202 mm',
      color_options: ['Matte Black'],
      in_the_box: [
        'Unit Umarex / VFC Glock 17 Gen5 GBB',
        '1x Magasin Green Gas 22 rds',
        'Manual & Sertifikat Uji Chronograph',
      ],
      required_to_operate: [
        'Green Gas 12kg (BRK-CSM-002)',
        'BB Plastik 6mm 0.25g - 0.28g (BRK-CSM-001)',
      ],
    },
    compatibility: {
      loadout_slot: 'sidearm',
      platform_family: 'PISTOL_G_SERIES',
      propulsion: 'GBB_PISTOL',
      required_power_type: 'GREEN_GAS',
      battery_connector: 'NONE',
      provides_rails: ['PICATINNY_1913'],
      muzzle_thread: 'NONE',
      mag_family: 'GLOCK_G17_GBB',
      recommended_bb_min_gram: 0.2,
      recommended_bb_max_gram: 0.28,
      compatible_skus: ['BRK-CSM-002', 'BRK-CSM-001', 'BRK-SNP-001', 'BRK-AR-003', 'BRK-AR-001'],
    },
    primaryAlt: 'Umarex VFC Glock 17 Gen5 GBB pistol dengan slide CNC matte black',
    detailAlt: 'Detail slide lockback dan frame polimer Umarex VFC Glock 17 Gen5 GBB',
    videoAlt: 'Video demo inspeksi slide dan aksi blowback Umarex VFC Glock 17 Gen5 GBB',
    videoDurationSec: 6.5,
  },
  {
    sku: 'BRK-OPT-001',
    slug: 'vector-optics-maverick-gen3-red-dot',
    name: 'Vector Optics Maverick Gen III 1x22 Red Dot',
    brand: 'Vector Optics',
    categorySlug: 'optics-aiming',
    missionTags: ['cqb', 'speedqb'],
    platform: 'UNIVERSAL_PICATINNY',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'optic',
    priceIdr: 1850000,
    weightGrams: 185,
    stockQty: 16,
    lowStockThreshold: 5,
    isFeatured: false,
    requiresAge18: false,
    shippingClass: 'REGULAR',
    shortDescription:
      'Red dot 3 MOA berbalut karet proteksi, bodi 6061-T6 aluminum IPX4, lengkap dengan QD Picatinny riser.',
    description:
      'Vector Optics Maverick Gen III 1x22 dibuat untuk akuisisi target seketika pada jarak dekat hingga menengah. Rumah 6061-T6 aluminum berpelindung karet tahan benturan ringan dengan 11 tingkat kecerahan titik merah 3 MOA, klik elevasi 1 MOA, serta dudukan QD cantilever riser dan low mount standar MIL-STD-1913.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'UNIVERSAL_PICATINNY',
      loadout_slot: 'optic',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: 'NONE',
      rail_type: ['PICATINNY_1913'],
      material: 'Rubber-Armored 6061-T6 Aluminum',
      cordura_denier: 'NONE',
      optic_magnification: '1x22 (3 MOA Red Dot, 11 Brightness)',
      optic_mount: 'PICATINNY_1913',
      safety_certification: 'IPX4 Water Resistant',
      dimensions_mm: '76 mm panjang',
      color_options: ['Matte Black'],
      in_the_box: [
        'Vector Optics Maverick Gen III 1x22',
        'QD Picatinny Riser Mount & Low Mount',
        'Tutup Lensa Karet & Kain Pembersih',
      ],
      required_to_operate: ['Baterai Koin CR2032 (tersedia umum)', 'Top Rail MIL-STD-1913 Picatinny'],
    },
    compatibility: {
      loadout_slot: 'optic',
      platform_family: 'UNIVERSAL_PICATINNY',
      propulsion: 'NON_REPLICA',
      requires_rail: 'PICATINNY_1913',
      optic_class: 'RED_DOT',
      compatible_skus: ['BRK-AR-001', 'BRK-AR-002', 'BRK-SMG-001', 'BRK-OPT-003'],
    },
    primaryAlt: 'Vector Optics Maverick Gen III 1x22 Red Dot di atas QD Picatinny riser',
  },
  {
    sku: 'BRK-OPT-002',
    slug: 'vector-optics-forester-1-5x24-lpvo',
    name: 'Vector Optics Forester 1-5x24 SFP LPVO Scope',
    brand: 'Vector Optics',
    categorySlug: 'optics-aiming',
    missionTags: ['woodland-recce'],
    platform: 'UNIVERSAL_PICATINNY',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'optic',
    priceIdr: 3150000,
    weightGrams: 425,
    stockQty: 3,
    lowStockThreshold: 4,
    isFeatured: true,
    requiresAge18: false,
    shippingClass: 'REGULAR',
    shortDescription:
      'LPVO 1-5x24 tabung tunggal 30mm dengan reticle etched iluminasi titik tengah dan ring Picatinny 30mm.',
    description:
      'Vector Optics Forester 1-5x24 SFP memadukan keleluasaan bidik 1x untuk observasi cepat dengan pembesaran 5x untuk identifikasi sasaran jarak jauh. Tabung monotube 30mm 6061-T6 aluminum diisi nitrogen anti-embun, dilengkapi turret 1/2 MOA dan ring mount Picatinny 30mm langsung dalam paket.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'UNIVERSAL_PICATINNY',
      loadout_slot: 'optic',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: 'NONE',
      rail_type: ['PICATINNY_1913'],
      material: '30mm Monotube 6061-T6 Aluminum (Nitrogen Purged)',
      cordura_denier: 'NONE',
      optic_magnification: '1-5x24 SFP (Etched Reticle + Illuminated Center Dot)',
      optic_mount: 'PICATINNY_1913',
      safety_certification: 'Shockproof & Fogproof Nitrogen Purged',
      dimensions_mm: '260 mm panjang',
      color_options: ['Matte Black'],
      in_the_box: [
        'Vector Optics Forester 1-5x24 SFP LPVO Scope',
        'Sepasang 30mm Picatinny Mount Rings',
        'Flip-Up Lens Caps & Kain Mikrofiber',
      ],
      required_to_operate: ['Baterai Koin CR2032 untuk iluminasi reticle', 'Top Rail MIL-STD-1913 Picatinny'],
    },
    compatibility: {
      loadout_slot: 'optic',
      platform_family: 'UNIVERSAL_PICATINNY',
      propulsion: 'NON_REPLICA',
      requires_rail: 'PICATINNY_1913',
      optic_class: 'LPVO_MAGNIFIED',
      compatible_skus: ['BRK-SNP-001', 'BRK-AR-002', 'BRK-AR-001'],
    },
    primaryAlt: 'Vector Optics Forester 1-5x24 SFP LPVO Scope dengan ring mount 30mm Picatinny',
    videoAlt: 'Video demo inspeksi turret dan lensa Vector Optics Forester 1-5x24 LPVO',
    videoDurationSec: 7.0,
  },
  {
    sku: 'BRK-OPT-003',
    slug: 'wadsn-an-peq15-laser-illuminator',
    name: 'WADSN AN/PEQ-15 Tactical Laser & Illuminator',
    brand: 'WADSN',
    categorySlug: 'optics-aiming',
    missionTags: ['cqb'],
    platform: 'UNIVERSAL_PICATINNY',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'optic',
    priceIdr: 1250000,
    weightGrams: 165,
    stockQty: 12,
    lowStockThreshold: 4,
    isFeatured: false,
    requiresAge18: false,
    shippingClass: 'REGULAR',
    shortDescription:
      'Modul laser visibel dan senter LED taktis Picatinny 1913 lengkap dengan remote pressure switch.',
    description:
      'WADSN AN/PEQ-15 menyediakan penunjuk laser terarah dan penerangan LED putih terpadu untuk skenario ruang redup dan simulasi milsim. Bodi nylon polymer ringan terpasang rapat di rail MIL-STD-1913 Picatinny lengkap dengan pad sakelar tekan jarak jauh.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'UNIVERSAL_PICATINNY',
      loadout_slot: 'optic',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: 'NONE',
      rail_type: ['PICATINNY_1913'],
      material: 'Reinforced Nylon Polymer Housing',
      cordura_denier: 'NONE',
      optic_magnification: 'Visible Laser + White LED Illuminator',
      optic_mount: 'PICATINNY_1913',
      dimensions_mm: '120 x 73 x 37 mm',
      color_options: ['Flat Dark Earth', 'Matte Black'],
      in_the_box: [
        'Modul WADSN AN/PEQ-15',
        'Remote Pressure Switch Pad',
        'Hard Case Penyimpanan & Stiker Marking',
      ],
      required_to_operate: ['2x Baterai CR123A', 'Rail MIL-STD-1913 Picatinny'],
    },
    compatibility: {
      loadout_slot: 'optic',
      platform_family: 'UNIVERSAL_PICATINNY',
      propulsion: 'NON_REPLICA',
      requires_rail: 'PICATINNY_1913',
      optic_class: 'LASER_ILLUMINATOR',
      compatible_skus: ['BRK-AR-001', 'BRK-AR-002', 'BRK-SMG-001', 'BRK-OPT-001'],
    },
    primaryAlt: 'WADSN AN/PEQ-15 Tactical Laser dan Illuminator warna flat dark earth dengan pressure switch',
  },
  {
    sku: 'BRK-RIG-001',
    slug: 'pew-tactical-fcpc-v5-plate-carrier',
    name: 'Pew Tactical FCPC V5 Plate Carrier (Cordura 500D)',
    brand: 'Pew Tactical',
    categorySlug: 'plate-carrier-rig',
    missionTags: ['cqb', 'woodland-recce', 'rig-protection'],
    platform: 'UNIVERSAL_MOLLE',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'rig_protection',
    priceIdr: 2450000,
    weightGrams: 1150,
    stockQty: 10,
    lowStockThreshold: 4,
    isFeatured: true,
    requiresAge18: false,
    shippingClass: 'REGULAR',
    shortDescription:
      'Plate carrier modular Cordura 500D laser-cut dengan cummerbund kaku, quick-release, dan antarmuka placard SwiftClip.',
    description:
      'Pew Tactical FCPC V5 dibangun dari kain asli Cordura 500D dengan panel laminasi laser-cut MOLLE yang tipis, kuat, dan tidak menyerap air. Dilengkapi cummerbund struktural kaku bergaya Tegris, quick-release buckle bahu, serta slot SwiftClip/G-Hook di dada untuk dipasangkan langsung dengan placard Micro Fight Mk4.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'UNIVERSAL_MOLLE',
      loadout_slot: 'rig_protection',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: 'NONE',
      rail_type: ['MOLLE_PALS_LASER_CUT', 'SWIFTCLIP_PLACARD'],
      material: 'Genuine Cordura 500D Nylon & Laser-Cut Laminate',
      cordura_denier: '500D_1000D_LAMINATE',
      dimensions_mm: 'Fit Dummy SAPI Medium (24 x 31 cm)',
      color_options: ['Ranger Green', 'Coyote Brown', 'Matte Black'],
      in_the_box: [
        'Base Carrier Depan & Belakang FCPC V5',
        'Rigid Cummerbund Set',
        'Quick-Release Cobra-Style Buckle Bahu',
      ],
      required_to_operate: [
        'Front Placard Magasin (direkomendasikan BRK-RIG-002)',
        'Dummy Foam SAPI Plate Medium (opsional penopang bentuk)',
      ],
    },
    compatibility: {
      loadout_slot: 'rig_protection',
      platform_family: 'UNIVERSAL_MOLLE',
      propulsion: 'NON_REPLICA',
      provides_rails: ['MOLLE_PALS_LASER_CUT', 'SWIFTCLIP_PLACARD'],
      placard_interface: true,
      compatible_skus: ['BRK-RIG-002', 'BRK-HLM-001', 'BRK-APP-001', 'BRK-APP-002'],
    },
    primaryAlt: 'Pew Tactical FCPC V5 Plate Carrier Cordura 500D warna Ranger Green',
    detailAlt: 'Close-up anyaman Cordura 500D laser-cut dan buckle quick-release FCPC V5',
    videoAlt: 'Video demo inspeksi material Cordura 500D dan buckle FCPC V5 Plate Carrier',
    videoDurationSec: 7.5,
  },
  {
    sku: 'BRK-RIG-002',
    slug: 'emersongear-micro-fight-mk4-chest-rig',
    name: 'EmersonGear Micro Fight Mk4 Modular Chest Rig',
    brand: 'EmersonGear',
    categorySlug: 'plate-carrier-rig',
    missionTags: ['woodland-recce', 'speedqb', 'rig-protection'],
    platform: 'UNIVERSAL_MOLLE',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'rig_protection',
    priceIdr: 1350000,
    weightGrams: 620,
    stockQty: 15,
    lowStockThreshold: 5,
    isFeatured: false,
    requiresAge18: false,
    shippingClass: 'REGULAR',
    shortDescription:
      'Chest rig modular Cordura 500D dengan triple 5.56 mag insert yang juga berfungsi sebagai front placard FCPC V5.',
    description:
      'EmersonGear Micro Fight Mk4 menawarkan sistem sasis modular ringan yang dapat dipakai mandiri menggunakan H-Harness untuk permainan SpeedQB/Recce cepat, atau dilepas harness-nya untuk dikunci sebagai front placard SwiftClip/Velcro pada FCPC V5 Plate Carrier. Dilengkapi triple 5.56 mag insert bawaan untuk magasin M4/MK18.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'UNIVERSAL_MOLLE',
      loadout_slot: 'rig_protection',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: 'NONE',
      rail_type: ['SWIFTCLIP_PLACARD', 'MOLLE_PALS_LASER_CUT'],
      material: 'Cordura 500D Nylon & High-Density Velcro Hook/Loop',
      cordura_denier: '500D',
      color_options: ['Coyote Brown', 'Ranger Green'],
      in_the_box: [
        'Micro Fight Mk4 Chassis',
        'Triple 5.56 Elastic Magazine Insert',
        'Half Flap & H-Harness + Waist Strap',
      ],
      required_to_operate: ['Siap pakai mandiri atau pasang langsung ke FCPC V5 (BRK-RIG-001)'],
    },
    compatibility: {
      loadout_slot: 'rig_protection',
      platform_family: 'UNIVERSAL_MOLLE',
      propulsion: 'NON_REPLICA',
      provides_rails: ['SWIFTCLIP_PLACARD'],
      supported_mag_families: ['M4_556_AEG', 'M4_556_MWS_GBBR'],
      placard_interface: true,
      compatible_skus: ['BRK-RIG-001', 'BRK-AR-001', 'BRK-AR-002'],
    },
    primaryAlt: 'EmersonGear Micro Fight Mk4 Modular Chest Rig Cordura 500D Coyote Brown',
  },
  {
    sku: 'BRK-HLM-001',
    slug: 'fma-fast-maritime-bump-helmet',
    name: 'FMA FAST Maritime High-Cut Bump Helmet',
    brand: 'FMA',
    categorySlug: 'helmet-comms',
    missionTags: ['cqb', 'rig-protection'],
    platform: 'UNIVERSAL_MOLLE',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'rig_protection',
    priceIdr: 1150000,
    weightGrams: 680,
    stockQty: 13,
    lowStockThreshold: 4,
    isFeatured: false,
    requiresAge18: false,
    shippingClass: 'REGULAR',
    shortDescription:
      'Helm olahraga airsoft high-cut ABS reinforced dengan side ARC rail, aluminum NVG shroud, dan sistem Occ-Dial.',
    description:
      'FMA FAST Maritime High-Cut Bump Helmet melindungi kepala dari benturan di arena CQB maupun woodland sekaligus menjadi platform pemasangan headset komunikasi dan lampu helm. Potongan high-cut memberi ruang lapang bagi Earmor M32 Plus dengan kompatibilitas side ARC rail. Catatan: khusus pelindung benturan olahraga, bukan helm balistik.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'UNIVERSAL_MOLLE',
      loadout_slot: 'rig_protection',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: 'NONE',
      rail_type: ['ARC_HELMET_RAIL', 'NVG_SHROUD'],
      material: 'Reinforced ABS Polymer Shell & CNC Aluminum NVG Shroud',
      cordura_denier: 'NONE',
      safety_certification: 'Non-Ballistic Sport Bump Protection Only',
      dimensions_mm: 'Ukuran M/L (Lingkar kepala 55 - 59 cm)',
      color_options: ['Ranger Green', 'Matte Black'],
      in_the_box: [
        'FMA FAST Maritime High-Cut Bump Helmet',
        'Set Busa Padding EPP & Occ-Dial Retention',
        'Velcro Loop Panel Set & Bungee NVG',
      ],
      required_to_operate: ['Pelindung mata full-seal ANSI Z87.1+ terpisah di arena skirmish'],
    },
    compatibility: {
      loadout_slot: 'rig_protection',
      platform_family: 'UNIVERSAL_MOLLE',
      propulsion: 'NON_REPLICA',
      provides_rails: ['ARC_HELMET_RAIL', 'NVG_SHROUD'],
      arc_rail_compatible: true,
      compatible_skus: ['BRK-HLM-002', 'BRK-RIG-001', 'BRK-APP-001'],
    },
    primaryAlt: 'FMA FAST Maritime High-Cut Bump Helmet dengan side ARC rail dan NVG shroud',
  },
  {
    sku: 'BRK-HLM-002',
    slug: 'earmor-m32-plus-tactical-headset',
    name: 'Earmor M32 Plus Active Tactical Headset',
    brand: 'Earmor',
    categorySlug: 'helmet-comms',
    missionTags: ['woodland-recce', 'rig-protection'],
    platform: 'UNIVERSAL_MOLLE',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'rig_protection',
    priceIdr: 1750000,
    weightGrams: 370,
    stockQty: 9,
    lowStockThreshold: 4,
    isFeatured: false,
    requiresAge18: false,
    shippingClass: 'REGULAR',
    shortDescription:
      'Headset komunikasi aktif NRR 22 dB peredam letusan > 82 dB dengan boom mic lepas-pasang dan plug NATO.',
    description:
      'Earmor M32 Plus memperkuat suara lingkungan rendah seperti langkah kaki atau instruksi rekan tim sambil menekan kebisingan impulsif di atas 82 dB secara seketika. Dilengkapi mikrofon boom yang bisa dipasang di sisi kiri atau kanan, konektor militer NATO untuk PTT radio, serta kompatibel dengan helm FAST Maritime.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'UNIVERSAL_MOLLE',
      loadout_slot: 'rig_protection',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: 'NONE',
      rail_type: ['ARC_HELMET_RAIL'],
      material: 'Impact-Resistant Polymer Earcups & Gel Cushion Ready',
      cordura_denier: 'NONE',
      safety_certification: 'NRR 22 dB Active Hearing Protection (Suppress > 82 dB)',
      color_options: ['Olive Drab / Foliage'],
      in_the_box: [
        'Earmor M32 Plus Active Tactical Headset',
        'Detachable Boom Microphone',
        'Kabel NATO Standard 7.0mm Plug',
      ],
      required_to_operate: ['2x Baterai AAA', 'Modul PTT Earmor M51/M52 jika terhubung ke HT'],
    },
    compatibility: {
      loadout_slot: 'rig_protection',
      platform_family: 'UNIVERSAL_MOLLE',
      propulsion: 'NON_REPLICA',
      arc_rail_compatible: true,
      compatible_skus: ['BRK-HLM-001', 'BRK-RIG-001', 'BRK-APP-001'],
    },
    primaryAlt: 'Earmor M32 Plus Active Tactical Headset warna olive dengan boom mic dan plug NATO',
  },
  {
    sku: 'BRK-APP-001',
    slug: 'emersongear-g3-combat-uniform-set',
    name: 'EmersonGear G3 Combat Shirt & Pants Set',
    brand: 'EmersonGear',
    categorySlug: 'apparel-footwear',
    missionTags: ['woodland-recce', 'rig-protection'],
    platform: 'APPAREL_FOOTWEAR',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'rig_protection',
    priceIdr: 2150000,
    weightGrams: 1350,
    stockQty: 14,
    lowStockThreshold: 5,
    isFeatured: false,
    requiresAge18: false,
    shippingClass: 'REGULAR',
    shortDescription:
      'Setelan kemeja dan celana tempur 50/50 NyCo ripstop dengan torso breathable, YKK zipper, dan knee pads terintegrasi.',
    description:
      'EmersonGear G3 Combat Set memakai kombinasi kain 50/50 NyCo ripstop tahan sobek di lengan dan celana serta rajutan torso penyerap keringat yang nyaman dipakai di bawah plate carrier pada iklim tropis Indonesia. Dilengkapi 10 saku fungsional, resleting YKK, serta pelindung lutut lepasan.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'APPAREL_FOOTWEAR',
      loadout_slot: 'rig_protection',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: 'NONE',
      rail_type: ['NONE'],
      material: '50/50 NyCo Ripstop, Breathable Torso Knit & YKK Zippers',
      cordura_denier: 'NYCO_50_50_RIPSTOP',
      color_options: ['Ranger Green', 'Multicam'],
      in_the_box: [
        '1x G3 Combat Shirt',
        '1x G3 Combat Pants',
        'Sepasang Removable Knee Pads & Elbow Pads',
      ],
      required_to_operate: ['Sabuk taktis 1.5 - 1.75 inci (opsional)'],
    },
    compatibility: {
      loadout_slot: 'rig_protection',
      platform_family: 'APPAREL_FOOTWEAR',
      propulsion: 'NON_REPLICA',
      compatible_skus: ['BRK-RIG-001', 'BRK-APP-002', 'BRK-APP-003'],
    },
    primaryAlt: 'EmersonGear G3 Combat Shirt dan Pants Set warna Ranger Green dengan knee pads',
  },
  {
    sku: 'BRK-APP-002',
    slug: 'mechanix-wear-mpact-tactical-gloves',
    name: 'Mechanix Wear M-Pact Tactical Gloves',
    brand: 'Mechanix Wear',
    categorySlug: 'apparel-footwear',
    missionTags: ['cqb', 'speedqb', 'rig-protection'],
    platform: 'APPAREL_FOOTWEAR',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'rig_protection',
    priceIdr: 680000,
    weightGrams: 140,
    stockQty: 26,
    lowStockThreshold: 8,
    isFeatured: false,
    requiresAge18: false,
    shippingClass: 'REGULAR',
    shortDescription:
      'Sarung tangan taktis dengan pelindung buku jari TPR, bantalan telapak D3O, dan ujung jari touchscreen.',
    description:
      'Mechanix Wear M-Pact melindungi punggung tangan dan buku jari dari hantaman BB jarak dekat maupun gesekan barikade berkat pelindung Thermoplastic Rubber (TPR) berstandar impak. Bantalan telapak D3O meredam getaran, sementara bahan TrekDry menjaga sirkulasi udara dan sensitivitas jari pelatuk.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'APPAREL_FOOTWEAR',
      loadout_slot: 'rig_protection',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: 'NONE',
      rail_type: ['NONE'],
      material: 'TPR Impact Guard, Armortex Palm, D3O Padding & TrekDry',
      cordura_denier: 'NONE',
      safety_certification: 'EN 13594 Impact Protection',
      color_options: ['Black / Coyote'],
      in_the_box: ['1 Pasang Mechanix Wear M-Pact Tactical Gloves'],
      required_to_operate: ['Siap pakai'],
    },
    compatibility: {
      loadout_slot: 'rig_protection',
      platform_family: 'APPAREL_FOOTWEAR',
      propulsion: 'NON_REPLICA',
      compatible_skus: ['BRK-SMG-001', 'BRK-RIG-001', 'BRK-APP-001'],
    },
    primaryAlt: 'Mechanix Wear M-Pact Tactical Gloves dengan pelindung buku jari TPR',
  },
  {
    sku: 'BRK-APP-003',
    slug: 'salomon-forces-xa-mid-gtx-boots',
    name: 'Salomon Forces XA Mid GTX Tactical Boots',
    brand: 'Salomon Forces',
    categorySlug: 'apparel-footwear',
    missionTags: ['woodland-recce', 'rig-protection'],
    platform: 'APPAREL_FOOTWEAR',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'rig_protection',
    priceIdr: 4950000,
    weightGrams: 1080,
    stockQty: 7,
    lowStockThreshold: 3,
    isFeatured: false,
    requiresAge18: false,
    shippingClass: 'REGULAR',
    shortDescription:
      'Sepatu bot taktis tahan air GORE-TEX non-reflektif dengan 3D Advanced Chassis dan outsole Contagrip.',
    description:
      'Salomon Forces XA Mid GTX dirancang untuk mobilitas cepat di medan licin, berbatu, dan berlumpur. Membran GORE-TEX menjaga kaki tetap kering, sementara 3D Advanced Chassis menstabilkan pergelangan kaki saat memikul bobot replika dan plate carrier penuh.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'APPAREL_FOOTWEAR',
      loadout_slot: 'rig_protection',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: 'NONE',
      rail_type: ['NONE'],
      material: 'GORE-TEX Membrane, Anti-Debris Mesh, Nubuck & Contagrip Outsole',
      cordura_denier: 'NONE',
      safety_certification: 'Non-Reflective Hardware & Protective Rubber Toe Cap',
      color_options: ['Ranger Earth / Black'],
      in_the_box: ['1 Pasang Salomon Forces XA Mid GTX Tactical Boots (540 g/sepatu)'],
      required_to_operate: ['Siap pakai'],
    },
    compatibility: {
      loadout_slot: 'rig_protection',
      platform_family: 'APPAREL_FOOTWEAR',
      propulsion: 'NON_REPLICA',
      compatible_skus: ['BRK-APP-001', 'BRK-SNP-001', 'BRK-RIG-001'],
    },
    primaryAlt: 'Salomon Forces XA Mid GTX Tactical Boots warna earth black dengan outsole Contagrip',
  },
  {
    sku: 'BRK-CSM-001',
    slug: 'bls-precision-6mm-bb-028g-1kg',
    name: 'BLS Precision 6mm BB 0.28g (1 kg / ~3.570 rds)',
    brand: 'BLS',
    categorySlug: 'consumables-upgrades',
    missionTags: ['cqb', 'woodland-recce', 'speedqb'],
    platform: 'CONSUMABLE',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'power_consumables',
    priceIdr: 185000,
    weightGrams: 1000,
    stockQty: 60,
    lowStockThreshold: 15,
    isFeatured: false,
    requiresAge18: false,
    shippingClass: 'REGULAR',
    shortDescription:
      'BB plastik presisi 6mm toleransi 5,95mm +/- 0,01mm berat 0.28g kemasan 1 kg resealable untuk AEG, GBBR, dan DMR.',
    description:
      'BLS Precision 0.28g diproses poles ganda tanpa garis sambungan untuk mencegah macet pada laras tight-bore 6.03mm. Berat 0.28g memberi lintasan lebih stabil terhadap angin pada AEG outdoor maupun GBBR, sekaligus layak sebagai baseline uji akurasi sniper.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'CONSUMABLE',
      loadout_slot: 'power_consumables',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: 'NONE',
      rail_type: ['NONE'],
      material: 'Polished Precision Plastic 6mm (5.95 mm +/- 0.01 mm)',
      cordura_denier: 'NONE',
      bb_weight_gram: 0.28,
      bb_weight_rec: '0.28g Universal Precision',
      in_the_box: ['1x Kantong Resealable 1 kg (~3.570 butir BB 6mm 0.28g)'],
      required_to_operate: ['Speedloader BB untuk magasin mid-cap/GBB'],
    },
    compatibility: {
      loadout_slot: 'power_consumables',
      platform_family: 'CONSUMABLE',
      propulsion: 'NON_REPLICA',
      bb_weight_gram: 0.28,
      compatible_skus: ['BRK-AR-001', 'BRK-AR-002', 'BRK-AR-003', 'BRK-SMG-001', 'BRK-SNP-001', 'BRK-PST-001'],
    },
    primaryAlt: 'Kemasan 1 kg BLS Precision 6mm BB 0.28g putih mengilap di baki logam gelap',
  },
  {
    sku: 'BRK-CSM-002',
    slug: 'puff-dino-12kg-green-gas-600ml',
    name: 'Puff Dino 12kg Green Gas (600ml)',
    brand: 'Puff Dino',
    categorySlug: 'consumables-upgrades',
    missionTags: ['cqb', 'woodland-recce', 'speedqb'],
    platform: 'CONSUMABLE',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'power_consumables',
    priceIdr: 165000,
    weightGrams: 420,
    stockQty: 42,
    lowStockThreshold: 10,
    isFeatured: false,
    requiresAge18: false,
    shippingClass: 'CARGO_GAS',
    shortDescription:
      'Tabung Green Gas bertekanan 12 kg/cm2 dengan formula silicone oil dan nozzle logam; wajib kargo darat/laut.',
    description:
      'Puff Dino 12kg Green Gas 600ml dirancang menjaga konsistensi tekanan siklus blowback pada unit GBBR dan pistol GBB. Formula pelumas silikon ringan membantu menjaga keawetan karet O-ring katup magasin. Karena berbentuk tabung bertekanan, produk ini wajib dikirim melalui kargo darat/laut khusus.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'CONSUMABLE',
      loadout_slot: 'power_consumables',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: 'NONE',
      rail_type: ['NONE'],
      material: 'Pressurized 12 kg/cm2 Gas Canister + Silicone Oil & Metal Nozzle',
      cordura_denier: 'NONE',
      gas_type: 'GREEN_GAS',
      safety_certification: 'Tabung Bertekanan: Wajib Pengiriman Kargo Darat/Laut',
      in_the_box: ['1x Tabung Puff Dino 12kg Green Gas 600ml'],
      required_to_operate: ['Unit GBBR atau Pistol GBB (BRK-AR-001 / BRK-PST-001)'],
    },
    compatibility: {
      loadout_slot: 'power_consumables',
      platform_family: 'CONSUMABLE',
      propulsion: 'NON_REPLICA',
      provides_power_type: 'GREEN_GAS',
      compatible_skus: ['BRK-AR-001', 'BRK-PST-001'],
    },
    primaryAlt: 'Tabung Puff Dino 12kg Green Gas 600ml dengan nozzle pengisian logam',
  },
  {
    sku: 'BRK-CSM-003',
    slug: 'lipo-11v-1200mah-25c-stick-deans',
    name: 'LiPo 11.1V 1200mAh 25C 3S Stick Battery (Deans)',
    brand: 'Brakasa Power',
    categorySlug: 'consumables-upgrades',
    missionTags: ['cqb', 'woodland-recce', 'speedqb'],
    platform: 'CONSUMABLE',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'power_consumables',
    priceIdr: 245000,
    weightGrams: 95,
    stockQty: 28,
    lowStockThreshold: 8,
    isFeatured: false,
    requiresAge18: false,
    shippingClass: 'CARGO_BATTERY',
    shortDescription:
      'Baterai LiPo 3S 11.1V 25C profil stick berkonektor Deans T-Plug untuk AEG ber-MOSFET/ETU; wajib kargo darat.',
    description:
      'Baterai LiPo 11.1V 1200mAh 25C berprofil stick ramping ini muat rapi di dalam buffer tube VFC Avalon Saber dan kompartemen popor G&G ARP9 2.0. Menggunakan konektor Deans T-Plug resistansi rendah serta kabel balance JST-XH. Tidak disarankan untuk AEG tanpa MOSFET berkonektor Mini Tamiya.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'CONSUMABLE',
      loadout_slot: 'power_consumables',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'DEANS_T_PLUG',
      has_mosfet: null,
      battery_voltage_rec: '11.1V 3S 1200mAh 25C Continuous',
      battery_form_factor: 'STICK_BUFFER_TUBE',
      gas_type: 'NONE',
      muzzle_thread: 'NONE',
      rail_type: ['NONE'],
      material: '3S Lithium Polymer Pack dengan Deans T-Plug & JST-XH Balance Lead',
      cordura_denier: 'NONE',
      safety_certification: 'Baterai Lithium: Wajib Pengiriman Kargo Darat/Laut',
      dimensions_mm: '125 x 20 x 16 mm',
      in_the_box: ['1x Baterai LiPo 11.1V 1200mAh 25C Stick (Deans)'],
      required_to_operate: [
        'AEG dengan MOSFET/ETU dan konektor Deans (BRK-AR-002 / BRK-SMG-001)',
        'Smart Balance Charger LiPo 3S + LiPo Safe Bag',
      ],
    },
    compatibility: {
      loadout_slot: 'power_consumables',
      platform_family: 'CONSUMABLE',
      propulsion: 'NON_REPLICA',
      provides_power_type: 'LIPO_BATTERY',
      battery_connector: 'DEANS_T_PLUG',
      battery_voltage_v: 11.1,
      battery_form_factor: 'STICK_BUFFER_TUBE',
      compatible_skus: ['BRK-AR-002', 'BRK-SMG-001'],
    },
    primaryAlt: 'Baterai LiPo 11.1V 3S Stick dengan konektor Deans merah dan kabel balance putih',
  },
  {
    sku: 'BRK-UPG-001',
    slug: 'acetech-brighter-c-tracer-unit',
    name: 'Acetech Brighter C Compact Tracer Unit',
    brand: 'Acetech',
    categorySlug: 'consumables-upgrades',
    missionTags: ['cqb', 'speedqb'],
    platform: 'UNIVERSAL_PICATINNY',
    propulsion: 'NON_REPLICA',
    loadoutSlot: 'power_consumables',
    priceIdr: 1050000,
    weightGrams: 32,
    stockQty: 12,
    lowStockThreshold: 4,
    isFeatured: true,
    requiresAge18: false,
    shippingClass: 'REGULAR',
    shortDescription:
      'Tracer unit CNC aluminum bobot 32 g berulir 14mm CCW dengan fitur shake-to-wake hingga 35 RPS.',
    description:
      'Acetech Brighter C memancarkan kilatan UV ultra-cepat untuk menerangi Green Tracer BB hingga kecepatan tembak 35 RPS di ruangan CQB remang. Bodi silinder CNC aluminum berbobot hanya 32 gram berulir 14mm CCW (sudah menyertakan adapter 11mm CW untuk barrel pistol berulir), pengisian USB-C, dan sensor bangun otomatis saat digerakkan.',
    specs: {
      propulsion: 'NON_REPLICA',
      platform: 'UNIVERSAL_PICATINNY',
      loadout_slot: 'power_consumables',
      fps_min: null,
      fps_max: null,
      energy_joule: null,
      connector: 'NONE',
      has_mosfet: null,
      muzzle_thread: '14MM_CCW',
      rail_type: ['NONE'],
      material: 'CNC Anodized Aluminum Body (32 g)',
      cordura_denier: 'NONE',
      safety_certification: 'IP64 Dust & Splash Resistant, USB-C Rechargeable',
      dimensions_mm: '57 mm panjang x 28 mm diameter',
      color_options: ['Matte Black'],
      in_the_box: [
        'Acetech Brighter C Tracer Unit (14mm CCW)',
        'Adapter Ulir 14mm CCW ke 11mm CW Pistol',
        'Kabel Pengisian USB-C & Kunci Hex',
      ],
      required_to_operate: [
        'Unit berulir 14mm CCW (tidak langsung cocok dengan M24x1 CW TAC-41)',
        'Green Tracer BB 6mm untuk efek pijar',
      ],
    },
    compatibility: {
      loadout_slot: 'power_consumables',
      platform_family: 'UNIVERSAL_PICATINNY',
      propulsion: 'NON_REPLICA',
      muzzle_thread: '14MM_CCW',
      supported_muzzle_threads: ['14MM_CCW', '11MM_CW_PISTOL'],
      compatible_skus: ['BRK-SMG-001', 'BRK-AR-001', 'BRK-AR-002', 'BRK-AR-003'],
    },
    primaryAlt: 'Acetech Brighter C Compact Tracer Unit CNC hitam dengan ulir 14mm CCW',
  },
];

const SEED_HERO_SCENES: HeroSceneTelemetry[] = [
  {
    index: 1,
    code: 'SCN-01',
    title: 'Armory Bench Prep',
    startSec: 0.0,
    endSec: 2.4,
    keyframeUrl: HERO_KEYFRAME_PATHS[0],
    telemetryMeta: 'GBBR ZET | 325 FPS | 0.90 J',
    platformTag: 'M4 / MK18',
    targetUrl: '/store/tokyo-marui-mk18-mod1-mws-gbbr',
    targetLabel: 'Inspeksi MK18 MWS',
  },
  {
    index: 2,
    code: 'SCN-02',
    title: 'Cordura & Buckle Lock',
    startSec: 2.4,
    endSec: 4.6,
    keyframeUrl: HERO_KEYFRAME_PATHS[1],
    telemetryMeta: '500D CORDURA | LASER-CUT MOLLE',
    platformTag: 'PLATE CARRIER',
    targetUrl: '/store?mission=rig-protection',
    targetLabel: 'Lihat Rig & Proteksi',
  },
  {
    index: 3,
    code: 'SCN-03',
    title: 'Mag Seating & Bolt Rack',
    startSec: 4.6,
    endSec: 7.2,
    keyframeUrl: HERO_KEYFRAME_PATHS[2],
    telemetryMeta: 'CNC 6061-T6 | M4 / MK18',
    platformTag: 'M4_AR15',
    targetUrl: '/store?platform=M4_AR15',
    targetLabel: 'Filter Platform M4',
  },
  {
    index: 4,
    code: 'SCN-04',
    title: 'Helmet & Comms Check',
    startSec: 7.2,
    endSec: 9.4,
    keyframeUrl: HERO_KEYFRAME_PATHS[3],
    telemetryMeta: 'ARC RAIL | NRR 22 dB ACTIVE',
    platformTag: 'HELMET & COMMS',
    targetUrl: '/store?category=helmet-comms',
    targetLabel: 'Lihat Helm & Comms',
  },
  {
    index: 5,
    code: 'SCN-05',
    title: 'Optic & Illuminator Zero',
    startSec: 9.4,
    endSec: 11.8,
    keyframeUrl: HERO_KEYFRAME_PATHS[4],
    telemetryMeta: '3 MOA RED DOT | PICATINNY 1913',
    platformTag: 'OPTICS',
    targetUrl: '/store?category=optics-aiming',
    targetLabel: 'Lihat Optik & Laser',
  },
  {
    index: 6,
    code: 'SCN-06',
    title: 'Killhouse Entry Stack',
    startSec: 11.8,
    endSec: 14.4,
    keyframeUrl: HERO_KEYFRAME_PATHS[5],
    telemetryMeta: 'CQB <= 350 FPS | 50/50 NYCO',
    platformTag: 'CQB MISSION',
    targetUrl: '/store?mission=cqb',
    targetLabel: 'Buka Filter CQB',
  },
  {
    index: 7,
    code: 'SCN-07',
    title: 'CQB Pivot & Tracer Pulse',
    startSec: 14.4,
    endSec: 16.6,
    keyframeUrl: HERO_KEYFRAME_PATHS[6],
    telemetryMeta: 'AEG ETU | 345 FPS | 14MM CCW',
    platformTag: 'ARP9 2.0 PDW',
    targetUrl: '/store/gg-arp9-2-cqb-pdw-aeg',
    targetLabel: 'Inspeksi ARP9 2.0',
  },
  {
    index: 8,
    code: 'SCN-08',
    title: 'Secondary Transition',
    startSec: 16.6,
    endSec: 19.4,
    keyframeUrl: HERO_KEYFRAME_PATHS[7],
    telemetryMeta: 'GBB PISTOL | 320 FPS | 0.95 J',
    platformTag: 'GLOCK 17 GEN5',
    targetUrl: '/store/umarex-vfc-glock-17-gen5-gbb',
    targetLabel: 'Inspeksi Glock 17',
  },
  {
    index: 9,
    code: 'SCN-09',
    title: 'Overwatch Bolt Cycle',
    startSec: 19.4,
    endSec: 21.6,
    keyframeUrl: HERO_KEYFRAME_PATHS[8],
    telemetryMeta: 'SPRING TDC | 440 FPS | 1.85 J',
    platformTag: 'TAC-41 SNIPER',
    targetUrl: '/store/silverback-tac-41-p-bolt-action-sniper',
    targetLabel: 'Inspeksi TAC-41 P',
  },
  {
    index: 10,
    code: 'SCN-10',
    title: 'Brakasa Full Kit',
    startSec: 21.6,
    endSec: 24.0,
    keyframeUrl: HERO_KEYFRAME_PATHS[9],
    telemetryMeta: 'FULL TACTICAL GEAR | <= 2.0 J',
    platformTag: 'FULL KIT',
    targetUrl: '/store',
    targetLabel: 'Buka Katalog',
  },
];

const SEED_HERO_SLIDES: HeroSlideConfig[] = DEFAULT_HERO_SLIDES.map((slide) => ({ ...slide }));

const SEED_ARMORY_PROFILE: ArmoryProfileSettings = {
  ...DEFAULT_ARMORY_PROFILE,
};

const SEED_HERO_CONFIG: HeroConfig = {
  videoUrl: HERO_VIDEO_PATH,
  posterUrl: HERO_KEYFRAME_PATHS[0] ?? HERO_POSTER_PATH,
  durationSec: 24.0,
  headline: 'Presisi Armory Lapangan',
  subheadline:
    'Replika AEG, GBBR, sniper, optik, dan sistem plate carrier dengan spesifikasi teknis lengkap.',
  primaryCtaLabel: 'Belanja Sekarang',
  primaryCtaUrl: '/store',
  secondaryCtaLabel: 'Buka Katalog',
  secondaryCtaUrl: '/store',
  cacheVersion: '2',
};

const SEED_SPOTLIGHT_CONFIG: LoadoutSpotlightConfig = {
  title: 'Inspeksi Konfigurasi Rig Lapangan',
  subtitle:
    'Pilih titik komponen pada rig untuk memeriksa spesifikasi material, ketersediaan stok langsung, dan kecocokan platform.',
  imageUrl: HERO_KEYFRAME_PATHS[9],
  imageAlt: 'Operator full loadout Brakasa Tactical mengenakan FCPC V5, helm FAST, dan MK18 MWS',
  presetKey: 'gbb-realism-kit',
  hotspots: [
    {
      id: 'hs-helmet',
      code: 'PT-01',
      label: 'FAST Maritime Helmet',
      xPercent: 68,
      yPercent: 18,
      productSku: 'BRK-HLM-001',
    },
    {
      id: 'hs-comms',
      code: 'PT-02',
      label: 'Earmor M32 Plus Headset',
      xPercent: 73,
      yPercent: 25,
      productSku: 'BRK-HLM-002',
    },
    {
      id: 'hs-carrier',
      code: 'PT-03',
      label: 'FCPC V5 Plate Carrier',
      xPercent: 66,
      yPercent: 45,
      productSku: 'BRK-RIG-001',
    },
    {
      id: 'hs-optic',
      code: 'PT-04',
      label: 'Maverick Gen III Red Dot',
      xPercent: 57,
      yPercent: 51,
      productSku: 'BRK-OPT-001',
    },
    {
      id: 'hs-primary',
      code: 'PT-05',
      label: 'Tokyo Marui MK18 MWS GBBR',
      xPercent: 62,
      yPercent: 60,
      productSku: 'BRK-AR-001',
    },
  ],
};

const SEED_INVENTORY_DEFAULTS: InventoryDefaultSettings = {
  defaultLowStockThreshold: 4,
};

const SEED_VOUCHERS = [
  {
    code: 'BRAKASA10',
    description: 'Diskon 10% hingga Rp500.000 untuk minimum belanja Rp2.000.000.',
    discountType: 'PERCENT',
    discountValue: 10,
    maxDiscountIdr: 500000,
    minSubtotalIdr: 2000000,
    maxUses: 100,
    isPublic: 1,
    isActive: 1,
  },
  {
    code: 'CQBREADY',
    description: 'Potongan langsung Rp250.000 untuk perakitan kit CQB minimum Rp3.500.000.',
    discountType: 'FIXED',
    discountValue: 250000,
    maxDiscountIdr: 250000,
    minSubtotalIdr: 3500000,
    maxUses: 50,
    isPublic: 1,
    isActive: 1,
  },
  {
    code: 'KARGOFREE',
    description: 'Subsidi ongkos kirim kargo darat/laut hingga Rp150.000 untuk transaksi minimal Rp5.000.000.',
    discountType: 'FIXED',
    discountValue: 150000,
    maxDiscountIdr: 150000,
    minSubtotalIdr: 5000000,
    maxUses: 75,
    isPublic: 1,
    isActive: 1,
  },
];

export function seedDatabase(): void {
  initializeSchema();

  const mediaConventionBySku = new Map(
    PRODUCT_MEDIA_CONVENTIONS.map((item) => [item.sku, item]),
  );

  let createdAdmin = false;

  withTransaction(() => {
    const insertCategory = db.prepare(
      `INSERT OR IGNORE INTO categories (slug, name, description, sort_order)
       VALUES (?, ?, ?, ?)`,
    );
    for (const cat of SEED_CATEGORIES) {
      insertCategory.run(cat.slug, cat.name, cat.description, cat.sortOrder);
    }

    const categoryRows = db
      .prepare('SELECT id, slug FROM categories')
      .all() as Array<{ id: number; slug: string }>;
    const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, Number(c.id)]));

    const findProductBySku = db.prepare('SELECT id FROM products WHERE sku = ?');
    const insertProduct = db.prepare(
      `INSERT INTO products (
        sku, slug, name, brand, category_id, mission_tags_json,
        platform, propulsion, loadout_slot, price_idr, weight_grams,
        fps_min, fps_max, energy_joule, stock_qty, low_stock_threshold,
        is_featured, is_active, requires_age_18, shipping_class,
        short_description, description, specs_json, compatibility_tags_json,
        specs_search_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertMedia = db.prepare(
      `INSERT INTO product_media (
        product_id, media_type, url, poster_url, alt_text, duration_sec, is_primary, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertMutation = db.prepare(
      `INSERT INTO inventory_mutations (
        product_id, delta_qty, stock_before, stock_after, reason, reference_id, note, actor
      ) VALUES (?, ?, 0, ?, 'INITIAL_SEED', 'SEED-INIT', ?, 'system:seed')`,
    );

    for (const product of SEED_PRODUCTS) {
      const existing = findProductBySku.get(product.sku) as { id: number } | undefined;
      if (existing) {
        continue;
      }

      const categoryId = categoryIdBySlug.get(product.categorySlug);
      if (!categoryId) {
        throw new Error(`Kategori seed tidak ditemukan untuk slug: ${product.categorySlug}`);
      }

      const specsSearchText = buildSpecsSearchText(
        product.specs,
        product.compatibility,
        product.missionTags,
      );

      const inserted = insertProduct.run(
        product.sku,
        product.slug,
        product.name,
        product.brand,
        categoryId,
        JSON.stringify(product.missionTags),
        product.platform,
        product.propulsion,
        product.loadoutSlot,
        product.priceIdr,
        product.weightGrams,
        product.specs.fps_min,
        product.specs.fps_max,
        product.specs.energy_joule,
        product.stockQty,
        product.lowStockThreshold,
        product.isFeatured ? 1 : 0,
        product.requiresAge18 ? 1 : 0,
        product.shippingClass,
        product.shortDescription,
        product.description,
        JSON.stringify(product.specs),
        JSON.stringify(product.compatibility),
        specsSearchText,
      );

      const productId = Number(inserted.lastInsertRowid);

      const convention = mediaConventionBySku.get(product.sku);
      if (convention) {
        let sortOrder = 0;
        insertMedia.run(
          productId,
          'image',
          convention.primaryImage,
          null,
          product.primaryAlt,
          null,
          1,
          sortOrder++,
        );

        if (convention.detailImage) {
          insertMedia.run(
            productId,
            'image',
            convention.detailImage,
            null,
            product.detailAlt ?? `Detail ${product.name}`,
            null,
            0,
            sortOrder++,
          );
        }

        if (convention.demoVideo) {
          insertMedia.run(
            productId,
            'video',
            convention.demoVideo,
            convention.demoVideoPoster ?? convention.primaryImage,
            product.videoAlt ?? `Video demo ${product.name}`,
            product.videoDurationSec ?? 7.5,
            0,
            sortOrder++,
          );
        }
      }

      if (product.stockQty > 0) {
        insertMutation.run(
          productId,
          product.stockQty,
          product.stockQty,
          `Stok awal katalog Brakasa Tactical (${product.sku})`,
        );
      }
    }

    const insertVoucher = db.prepare(
      `INSERT OR IGNORE INTO vouchers (
        code, description, discount_type, discount_value, max_discount_idr,
        min_subtotal_idr, max_uses, used_count, starts_at, expires_at,
        is_public, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?)`,
    );
    for (const v of SEED_VOUCHERS) {
      insertVoucher.run(
        v.code,
        v.description,
        v.discountType,
        v.discountValue,
        v.maxDiscountIdr,
        v.minSubtotalIdr,
        v.maxUses,
        v.isPublic,
        v.isActive,
      );
    }

    const insertSetting = db.prepare(
      `INSERT OR IGNORE INTO site_settings (key, value_json) VALUES (?, ?)`,
    );
    insertSetting.run('armory_profile', JSON.stringify(SEED_ARMORY_PROFILE));
    insertSetting.run('hero_slides', JSON.stringify(SEED_HERO_SLIDES));
    insertSetting.run('hero_config', JSON.stringify(SEED_HERO_CONFIG));
    insertSetting.run('hero_scenes', JSON.stringify(SEED_HERO_SCENES));
    insertSetting.run('spotlight_config', JSON.stringify(SEED_SPOTLIGHT_CONFIG));
    insertSetting.run('shipping_settings', JSON.stringify(DEFAULT_SHIPPING_SETTINGS));
    insertSetting.run('inventory_defaults', JSON.stringify(SEED_INVENTORY_DEFAULTS));

    const v2Migrated = db
      .prepare("SELECT key FROM site_settings WHERE key = 'v2_swarna_migrated' LIMIT 1")
      .get() as { key: string } | undefined;

    if (!v2Migrated) {
      const upsertSetting = db.prepare(
        `INSERT INTO site_settings (key, value_json, updated_at)
         VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
         ON CONFLICT(key) DO UPDATE SET
           value_json = excluded.value_json,
           updated_at = excluded.updated_at`,
      );

      const existingProfileRow = db
        .prepare("SELECT value_json FROM site_settings WHERE key = 'armory_profile' LIMIT 1")
        .get() as { value_json: string } | undefined;

      const parsedProfile = existingProfileRow
        ? safeJsonParse<Partial<ArmoryProfileSettings>>(existingProfileRow.value_json, {})
        : {};

      const migratedProfile: ArmoryProfileSettings = {
        storeName: parsedProfile.storeName || SEED_ARMORY_PROFILE.storeName,
        tagline: parsedProfile.tagline || SEED_ARMORY_PROFILE.tagline,
        address: parsedProfile.address || SEED_ARMORY_PROFILE.address,
        city: parsedProfile.city || SEED_ARMORY_PROFILE.city,
        whatsappNumber: parsedProfile.whatsappNumber || SEED_ARMORY_PROFILE.whatsappNumber,
        supportEmail: parsedProfile.supportEmail || SEED_ARMORY_PROFILE.supportEmail,
        operatingHours: parsedProfile.operatingHours || SEED_ARMORY_PROFILE.operatingHours,
        operatingHoursEn: parsedProfile.operatingHoursEn || SEED_ARMORY_PROFILE.operatingHoursEn,
        mapsEmbedUrl: parsedProfile.mapsEmbedUrl || DEFAULT_MAPS_EMBED_URL,
        mapsDirectionsUrl: parsedProfile.mapsDirectionsUrl || DEFAULT_MAPS_DIRECTIONS_URL,
        announcementEnabled: false,
        announcementText: '',
        complianceNoticeShort: '',
      };

      upsertSetting.run('armory_profile', JSON.stringify(migratedProfile));
      upsertSetting.run('hero_slides', JSON.stringify(SEED_HERO_SLIDES));

      const legacyProducts = db
        .prepare(
          'SELECT id, specs_json FROM products WHERE requires_age_18 = 1 OR specs_json LIKE ?',
        )
        .all('%Perpol%') as Array<{ id: number; specs_json: string }>;

      const updateProductClean = db.prepare(
        `UPDATE products
         SET requires_age_18 = 0,
             specs_json = ?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`,
      );

      for (const pRow of legacyProducts) {
        const parsedSpecs = safeJsonParse<Record<string, unknown>>(pRow.specs_json, {});
        if (
          typeof parsedSpecs.safety_certification === 'string' &&
          /perpol/i.test(parsedSpecs.safety_certification)
        ) {
          parsedSpecs.safety_certification = 'Standar QC Chronograph (<= 2,0 Joule)';
        }
        updateProductClean.run(JSON.stringify(parsedSpecs), Number(pRow.id));
      }

      upsertSetting.run('v2_swarna_migrated', JSON.stringify({ version: 2 }));
    }

    const existingAdmin = db
      .prepare('SELECT id FROM admin_users WHERE username = ? COLLATE NOCASE')
      .get(DEFAULT_ADMIN_USERNAME) as { id: number } | undefined;

    if (!existingAdmin) {
      const passwordHash = hashPassword(DEFAULT_ADMIN_PASSWORD);
      db.prepare(
        `INSERT INTO admin_users (username, email, display_name, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, 'SUPER_ADMIN', 1)`,
      ).run(
        DEFAULT_ADMIN_USERNAME,
        DEFAULT_ADMIN_EMAIL,
        'Armory Operations Lead',
        passwordHash,
      );
      createdAdmin = true;
    }
  });

  if (createdAdmin) {
    console.log(
      `[brakasa-seed] Akun admin awal dibuat: username="${DEFAULT_ADMIN_USERNAME}", email="${DEFAULT_ADMIN_EMAIL}"`,
    );
  }
}
