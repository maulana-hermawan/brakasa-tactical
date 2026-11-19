# Brakasa Tactical: Spesifikasi Arsitektur Sistem, Skema SQLite 3.53, Kontrak API & Pembagian Modul

Dokumen ini merupakan spesifikasi teknis tunggal (*Single Source of Truth*) bagi seluruh tim implementasi **Brakasa Tactical** pada workspace `d:\brakasa-tac`. Seluruh tipe data TypeScript pada dokumen ini dikunci di [shared/types.ts](file:///d:/brakasa-tac/shared/types.ts) tanpa import library eksternal agar dapat dipakai langsung oleh `server/` maupun `src/` tanpa *circular dependency*.

---

## 1. Arsitektur Full-Stack & Alur Runtime

Berdasarkan audit empiris host Windows target (`Node v24.16.0`, `npm 11.13.0`, tanpa `cl.exe`/`gcc`/`cmake`), stack produksi dikunci pada **Single Unified Repository**:

- **Backend Runtime:** Node.js `v24.16.0` + Express `5.3.x` + `node:sqlite` (`DatabaseSync`, SQLite `3.53.0` built-in) + `node:crypto` (`scryptSync`, `timingSafeEqual`, `randomBytes`, `createHash`) + `multer` + `zod`.
- **Frontend Runtime:** React `19.3.x` + React Router `8.x` + Vite `8.3.x` + Tailwind CSS `v4` (`@tailwindcss/vite`) + TypeScript ketat.
- **Database:** File lokal persisten `storage/brakasa.db` (mode `WAL`, `foreign_keys = ON`, `JSON1`, `FTS5`, transaksi atomik `BEGIN IMMEDIATE`).
- **Media Streaming:** Layanan statis native Express 5 dengan `acceptRanges: true` (`HTTP 206 Partial Content`) untuk aset generatif di `public/media/` (`/media/*`) dan upload runtime Admin di `storage/uploads/` (`/uploads/*`).

```text
                       Browser (Desktop / Tablet / Mobile)
                                        |
         +------------------------------+------------------------------+
         | HTML Initial Request         | REST API / JSON              | Video / Image Range
         v                              v                              v
+---------------------------------------------------------------------------------+
| Express 5 Server (Port 3000 Prod / Port 3001 Dev behind Vite Proxy)             |
|                                                                                 |
|  1. /media/*    -> express.static('public/media', { acceptRanges: true })       |
|  2. /uploads/*  -> express.static('storage/uploads', { acceptRanges: true })    |
|  3. /api/*      -> Public Routes + Rate Limiter                                 |
|  4. /api/admin/*-> requireAdminSession (HttpOnly Cookie) + Admin Routes         |
|  5. GET /*      -> htmlShell Middleware (R-39 & R-40: lang="id", unique <title>,|
|                    inline Hero LCP <img> on "/" before JS bundle executes)      |
+------------------------------------+--------------------------------------------+
                                     |
                    +----------------+----------------+
                    |                                 |
                    v                                 v
      +---------------------------+     +---------------------------+
      | node:sqlite DatabaseSync  |     | Local Filesystem Storage  |
      | storage/brakasa.db (WAL)  |     | public/media/ (seeded)    |
      | SQLite 3.53 + FTS5 + JSON1|     | storage/uploads/ (admin)  |
      +---------------------------+     +---------------------------+
```

### Mode Eksekusi Tunggal (`package.json`)
- **Pengembangan (`npm run dev`):** Menjalankan API Express (`tsx watch server/index.ts` di port `3001`) dan Vite dev server (port `5173` dengan proxy `/api`, `/media`, `/uploads` ke `http://127.0.0.1:3001`) secara bersamaan via `concurrently`.
- **Build Produksi (`npm run build`):**
  1. `vite build` menghasilkan bundle client ke `dist/client/`.
  2. `esbuild server/index.ts --bundle --platform=node --format=esm --packages=external --outfile=dist/server/index.mjs` menghasilkan bundle server tunggal.
- **Start Produksi (`npm start`):** Menjalankan `node dist/server/index.mjs` di port `process.env.PORT || 3000`. Saat startup, server otomatis menjalankan migrasi DDL idempoten (`schema.sql`) dan seeding idempoten (`seed.ts`) sebelum membuka port HTTP.

---

## 2. Kunci Konvensi Path Media Generatif & Manifest Katalog 20 SKU

Seluruh jalur URL berikut **DIKUNCI** dan wajib sinkron 100% antara tim Media Generatif, Backend Seeder, Frontend Storefront, dan Admin Media Library.

### 2.1 Daftar Path Media Terkunci

| Kategori Media | Pola Path URL Publik | Lokasi Fisik di Disk | Jumlah File |
| :--- | :--- | :--- | :---: |
| **Hero Keyframes** | `/media/images/hero/hero-scene-01.jpg` s/d `hero-scene-10.jpg` | `public/media/images/hero/` | 10 |
| **Hero Video** | `/media/videos/hero-tactical-reel.mp4` | `public/media/videos/` | 1 |
| **Hero Poster (LCP)** | `/media/videos/hero-tactical-poster.jpg` | `public/media/videos/` | 1 |
| **Product Primary Images** | `/media/images/products/<sku-lowercase>.jpg` | `public/media/images/products/` | 20 |
| **Product Detail Images** | `/media/images/products/<sku-lowercase>-detail.jpg` | `public/media/images/products/` | 6 |
| **Product Demo Videos** | `/media/videos/product-<sku-lowercase>.mp4` | `public/media/videos/` | 7 |
| **Product Video Posters** | `/media/videos/product-<sku-lowercase>-poster.jpg` | `public/media/videos/` | 7 |
| **Admin Runtime Uploads** | `/uploads/<uuid>.<ext>` | `storage/uploads/` | Dinamis |

#### Rincian 6 Foto Detail Sekunder (Galeri PDP & Multi-Keyframe Video)
1. `/media/images/products/brk-ar-001-detail.jpg`
2. `/media/images/products/brk-ar-002-detail.jpg`
3. `/media/images/products/brk-smg-001-detail.jpg`
4. `/media/images/products/brk-snp-001-detail.jpg`
5. `/media/images/products/brk-pst-001-detail.jpg`
6. `/media/images/products/brk-rig-001-detail.jpg`

#### Rincian 7 Video Demo Produk + 7 Poster Frame
1. `/media/videos/product-brk-ar-001.mp4` + `/media/videos/product-brk-ar-001-poster.jpg`
2. `/media/videos/product-brk-ar-002.mp4` + `/media/videos/product-brk-ar-002-poster.jpg`
3. `/media/videos/product-brk-smg-001.mp4` + `/media/videos/product-brk-smg-001-poster.jpg`
4. `/media/videos/product-brk-snp-001.mp4` + `/media/videos/product-brk-snp-001-poster.jpg`
5. `/media/videos/product-brk-pst-001.mp4` + `/media/videos/product-brk-pst-001-poster.jpg`
6. `/media/videos/product-brk-rig-001.mp4` + `/media/videos/product-brk-rig-001-poster.jpg`
7. `/media/videos/product-brk-opt-002.mp4` + `/media/videos/product-brk-opt-002-poster.jpg`

### 2.2 Sinkronisasi 10 Scene Telemetry Hero Video (`24.0 detik`, 720 Frame @ 30fps)

Data default ini disimpan pada `site_settings` dengan key `hero_scenes` dan dapat diedit melalui `/admin/settings`:

| Index | Code | Rentang Detik | Keyframe Path | Judul Scene | Telemetry Meta | Target URL |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- |
| 1 | `SCN-01` | `0.0 - 2.4` | `/media/images/hero/hero-scene-01.jpg` | Armory Bench Prep | `GBBR ZET | 325 FPS | 0.90 J` | `/store/tokyo-marui-mk18-mod1-mws-gbbr` |
| 2 | `SCN-02` | `2.4 - 4.6` | `/media/images/hero/hero-scene-02.jpg` | Cordura & Buckle Lock | `500D CORDURA | LASER-CUT MOLLE` | `/store?mission=rig-protection` |
| 3 | `SCN-03` | `4.6 - 7.2` | `/media/images/hero/hero-scene-03.jpg` | Mag Seating & Bolt Rack | `CNC 6061-T6 | M4 / MK18` | `/store?platform=M4_AR15` |
| 4 | `SCN-04` | `7.2 - 9.4` | `/media/images/hero/hero-scene-04.jpg` | Helmet & Comms Check | `ARC RAIL | NRR 22 dB ACTIVE` | `/store?category=helmet-comms` |
| 5 | `SCN-05` | `9.4 - 11.8` | `/media/images/hero/hero-scene-05.jpg` | Optic & Illuminator Zero | `3 MOA RED DOT | PICATINNY 1913` | `/store?category=optics-aiming` |
| 6 | `SCN-06` | `11.8 - 14.4` | `/media/images/hero/hero-scene-06.jpg` | Killhouse Entry Stack | `CQB <= 350 FPS | 50/50 NYCO` | `/store?mission=cqb` |
| 7 | `SCN-07` | `14.4 - 16.6` | `/media/images/hero/hero-scene-07.jpg` | CQB Pivot & Tracer Pulse | `AEG ETU | 345 FPS | 14MM CCW` | `/store/gg-arp9-2-cqb-pdw-aeg` |
| 8 | `SCN-08` | `16.6 - 19.4` | `/media/images/hero/hero-scene-08.jpg` | Secondary Transition | `GBB PISTOL | 320 FPS | 0.95 J` | `/store/umarex-vfc-glock-17-gen5-gbb` |
| 9 | `SCN-09` | `19.4 - 21.6` | `/media/images/hero/hero-scene-09.jpg` | Overwatch Bolt Cycle | `SPRING TDC | 440 FPS | 1.85 J` | `/store/silverback-tac-41-p-bolt-action-sniper` |
| 10 | `SCN-10` | `21.6 - 24.0` | `/media/images/hero/hero-scene-10.jpg` | Brakasa Full Loadout | `5-SLOT BUILDER | <= 2.0 J LEGAL` | `/loadout-builder` |

### 2.3 Manifest Kanonik 20 SKU Seed Database (`server/db/seed.ts`)

| SKU | Slug Kanonik | Category Slug | Nama Produk | Harga (IDR) | Berat (g) | Propulsi | Platform | FPS / J | 18+ | Shipping Class | Loadout Slot | Media |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `BRK-AR-001` | `tokyo-marui-mk18-mod1-mws-gbbr` | `assault-rifle` | Tokyo Marui MK18 Mod.1 MWS GBBR | 16.500.000 | 2960 | `GBBR` | `M4_AR15` | `300-325 / 0.90` | Ya | `CARGO_REPLICA` | `primary` | Img + Detail + Video |
| `BRK-AR-002` | `vfc-avalon-saber-carbine-mlok-aeg` | `assault-rifle` | VFC Avalon Saber Carbine M-LOK AEG | 7.850.000 | 2850 | `AEG` | `M4_AR15` | `370-390 / 1.35` | Ya | `CARGO_REPLICA` | `primary` | Img + Detail + Video |
| `BRK-AR-003` | `cyma-cm040c-ak74m-steel-aeg` | `assault-rifle` | CYMA CM.040C AK-74M Stamped Steel AEG | 4.950.000 | 3200 | `AEG` | `AK_SERIES` | `400-415 / 1.55` | Ya | `CARGO_REPLICA` | `primary` | Img |
| `BRK-SMG-001` | `gg-arp9-2-cqb-pdw-aeg` | `smg-pdw` | G&G ARP9 2.0 CQB PDW AEG | 7.200.000 | 1960 | `AEG` | `SMG_PDW` | `330-350 / 1.10` | Ya | `CARGO_REPLICA` | `primary` | Img + Detail + Video |
| `BRK-SNP-001` | `silverback-tac-41-p-bolt-action-sniper` | `sniper-rifle` | Silverback TAC-41 P Bolt-Action Sniper | 12.400.000 | 2800 | `SPRING` | `BOLT_ACTION` | `410-445 / 1.85` | Ya | `CARGO_REPLICA` | `primary` | Img + Detail + Video |
| `BRK-PST-001` | `umarex-vfc-glock-17-gen5-gbb` | `sidearm-pistol` | Umarex / VFC Glock 17 Gen5 GBB | 3.650.000 | 655 | `GBB_PISTOL` | `PISTOL_G_SERIES` | `300-330 / 0.95` | Ya | `CARGO_REPLICA` | `sidearm` | Img + Detail + Video |
| `BRK-OPT-001` | `vector-optics-maverick-gen3-red-dot` | `optics-aiming` | Vector Optics Maverick Gen III 1x22 Red Dot | 1.850.000 | 185 | `NON_REPLICA` | `UNIVERSAL_PICATINNY` | `-` | Tidak | `REGULAR` | `optic` | Img |
| `BRK-OPT-002` | `vector-optics-forester-1-5x24-lpvo` | `optics-aiming` | Vector Optics Forester 1-5x24 SFP LPVO Scope | 3.150.000 | 425 | `NON_REPLICA` | `UNIVERSAL_PICATINNY` | `-` | Tidak | `REGULAR` | `optic` | Img + Video |
| `BRK-OPT-003` | `wadsn-an-peq15-laser-illuminator` | `optics-aiming` | WADSN AN/PEQ-15 Tactical Laser & Illuminator | 1.250.000 | 165 | `NON_REPLICA` | `UNIVERSAL_PICATINNY` | `-` | Tidak | `REGULAR` | `optic` | Img |
| `BRK-RIG-001` | `pew-tactical-fcpc-v5-plate-carrier` | `plate-carrier-rig` | Pew Tactical FCPC V5 Plate Carrier (Cordura 500D) | 2.450.000 | 1150 | `NON_REPLICA` | `UNIVERSAL_MOLLE` | `-` | Tidak | `REGULAR` | `rig_protection` | Img + Detail + Video |
| `BRK-RIG-002` | `emersongear-micro-fight-mk4-chest-rig` | `plate-carrier-rig` | EmersonGear Micro Fight Mk4 Modular Chest Rig | 1.350.000 | 620 | `NON_REPLICA` | `UNIVERSAL_MOLLE` | `-` | Tidak | `REGULAR` | `rig_protection` | Img |
| `BRK-HLM-001` | `fma-fast-maritime-bump-helmet` | `helmet-comms` | FMA FAST Maritime High-Cut Bump Helmet | 1.150.000 | 680 | `NON_REPLICA` | `UNIVERSAL_MOLLE` | `-` | Tidak | `REGULAR` | `rig_protection` | Img |
| `BRK-HLM-002` | `earmor-m32-plus-tactical-headset` | `helmet-comms` | Earmor M32 Plus Active Tactical Headset | 1.750.000 | 370 | `NON_REPLICA` | `UNIVERSAL_MOLLE` | `-` | Tidak | `REGULAR` | `rig_protection` | Img |
| `BRK-APP-001` | `emersongear-g3-combat-uniform-set` | `apparel-footwear` | EmersonGear G3 Combat Shirt & Pants Set | 2.150.000 | 1350 | `NON_REPLICA` | `APPAREL_FOOTWEAR` | `-` | Tidak | `REGULAR` | `rig_protection` | Img |
| `BRK-APP-002` | `mechanix-wear-mpact-tactical-gloves` | `apparel-footwear` | Mechanix Wear M-Pact Tactical Gloves | 680.000 | 140 | `NON_REPLICA` | `APPAREL_FOOTWEAR` | `-` | Tidak | `REGULAR` | `rig_protection` | Img |
| `BRK-APP-003` | `salomon-forces-xa-mid-gtx-boots` | `apparel-footwear` | Salomon Forces XA Mid GTX Tactical Boots | 4.950.000 | 1080 | `NON_REPLICA` | `APPAREL_FOOTWEAR` | `-` | Tidak | `REGULAR` | `rig_protection` | Img |
| `BRK-CSM-001` | `bls-precision-6mm-bb-028g-1kg` | `consumables-upgrades` | BLS Precision 6mm BB 0.28g (1 kg / ~3.570 rds) | 185.000 | 1000 | `NON_REPLICA` | `CONSUMABLE` | `-` | Tidak | `REGULAR` | `power_consumables` | Img |
| `BRK-CSM-002` | `puff-dino-12kg-green-gas-600ml` | `consumables-upgrades` | Puff Dino 12kg Green Gas (600ml) | 165.000 | 420 | `NON_REPLICA` | `CONSUMABLE` | `-` | Tidak | `CARGO_GAS` | `power_consumables` | Img |
| `BRK-CSM-003` | `lipo-11v-1200mah-25c-stick-deans` | `consumables-upgrades` | LiPo 11.1V 1200mAh 25C 3S Stick Battery (Deans) | 245.000 | 95 | `NON_REPLICA` | `CONSUMABLE` | `-` | Tidak | `CARGO_BATTERY` | `power_consumables` | Img |
| `BRK-UPG-001` | `acetech-brighter-c-tracer-unit` | `consumables-upgrades` | Acetech Brighter C Compact Tracer Unit | 1.050.000 | 32 | `NON_REPLICA` | `UNIVERSAL_PICATINNY` | `-` | Tidak | `REGULAR` | `power_consumables` | Img |

*(Catatan: Seluruh 20 SKU dipetakan ke 5 slot Loadout Builder, selaras dengan `docs/specs/02-FLOW-AND-FEATURES.md`. Seed voucher awal mencakup 3 kode aktif siap uji: `BRAKASA10`, `CQBREADY`, dan `KARGOFREE`.)*

---

## 3. Skema Database SQLite 3.53 (`node:sqlite` `DatabaseSync`)

### 3.1 Konfigurasi Koneksi & Helper Transaksi (`server/db/connection.ts`)

```ts
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = process.env.BRAKASA_DB_PATH || path.resolve(process.cwd(), 'storage', 'brakasa.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA temp_store = MEMORY;
`);

export function withTransaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
```

### 3.2 DDL SQL Lengkap (`server/db/schema.sql`)

Skema berikut telah diverifikasi langsung pada runtime `Node v24.16.0` / `SQLite 3.53.0` (`WAL`, `JSON1`, `FTS5`, dan trigger sinkronisasi otomatis):

```sql
-- ============================================================================
-- 1. CATEGORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================================================
-- 2. PRODUCTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  sku                     TEXT    NOT NULL UNIQUE,
  slug                    TEXT    NOT NULL UNIQUE,
  name                    TEXT    NOT NULL,
  brand                   TEXT    NOT NULL,
  category_id             INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  mission_tags_json       TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(mission_tags_json)),
  platform                TEXT    NOT NULL,
  propulsion              TEXT    NOT NULL,
  loadout_slot            TEXT    NOT NULL,
  price_idr               INTEGER NOT NULL CHECK (price_idr >= 0),
  weight_grams            INTEGER NOT NULL CHECK (weight_grams >= 0),
  fps_min                 INTEGER CHECK (fps_min IS NULL OR fps_min >= 0),
  fps_max                 INTEGER CHECK (fps_max IS NULL OR fps_max >= 0),
  energy_joule            REAL    CHECK (energy_joule IS NULL OR (energy_joule >= 0 AND energy_joule <= 2.0)),
  stock_qty               INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  low_stock_threshold     INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  is_featured             INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
  is_active               INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  requires_age_18         INTEGER NOT NULL DEFAULT 0 CHECK (requires_age_18 IN (0, 1)),
  shipping_class          TEXT    NOT NULL DEFAULT 'REGULAR'
                                  CHECK (shipping_class IN ('REGULAR', 'CARGO_BATTERY', 'CARGO_REPLICA', 'CARGO_GAS')),
  short_description       TEXT    NOT NULL DEFAULT '',
  description             TEXT    NOT NULL DEFAULT '',
  specs_json              TEXT    NOT NULL DEFAULT '{}' CHECK (json_valid(specs_json)),
  compatibility_tags_json TEXT    NOT NULL DEFAULT '{}' CHECK (json_valid(compatibility_tags_json)),
  specs_search_text       TEXT    NOT NULL DEFAULT '',
  deleted_at              TEXT,
  created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(is_active, is_featured, deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_platform_propulsion ON products(platform, propulsion);
CREATE INDEX IF NOT EXISTS idx_products_loadout_slot ON products(loadout_slot);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_idr);
CREATE INDEX IF NOT EXISTS idx_products_fps ON products(fps_min, fps_max);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(is_active, stock_qty, low_stock_threshold);

-- ============================================================================
-- 3. PRODUCTS FTS5 + SYNCHRONIZATION TRIGGERS
-- ============================================================================
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
  sku,
  name,
  brand,
  platform,
  propulsion,
  short_description,
  description,
  specs_search_text,
  content='products',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(
    rowid, sku, name, brand, platform, propulsion,
    short_description, description, specs_search_text
  ) VALUES (
    new.id, new.sku, new.name, new.brand, new.platform, new.propulsion,
    new.short_description, new.description, new.specs_search_text
  );
END;

CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
  INSERT INTO products_fts(
    products_fts, rowid, sku, name, brand, platform, propulsion,
    short_description, description, specs_search_text
  ) VALUES (
    'delete', old.id, old.sku, old.name, old.brand, old.platform, old.propulsion,
    old.short_description, old.description, old.specs_search_text
  );
END;

CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
  INSERT INTO products_fts(
    products_fts, rowid, sku, name, brand, platform, propulsion,
    short_description, description, specs_search_text
  ) VALUES (
    'delete', old.id, old.sku, old.name, old.brand, old.platform, old.propulsion,
    old.short_description, old.description, old.specs_search_text
  );
  INSERT INTO products_fts(
    rowid, sku, name, brand, platform, propulsion,
    short_description, description, specs_search_text
  ) VALUES (
    new.id, new.sku, new.name, new.brand, new.platform, new.propulsion,
    new.short_description, new.description, new.specs_search_text
  );
END;

-- ============================================================================
-- 4. PRODUCT MEDIA (IMAGES & DEMO VIDEOS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_media (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_type   TEXT    NOT NULL CHECK (media_type IN ('image', 'video')),
  url          TEXT    NOT NULL,
  poster_url   TEXT,
  alt_text     TEXT    NOT NULL DEFAULT '',
  duration_sec REAL    CHECK (duration_sec IS NULL OR duration_sec > 0),
  is_primary   INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_product_media_product ON product_media(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_media_type ON product_media(media_type, product_id);

-- ============================================================================
-- 5. VOUCHERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  code             TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  description      TEXT    NOT NULL DEFAULT '',
  discount_type    TEXT    NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
  discount_value   INTEGER NOT NULL CHECK (discount_value > 0),
  max_discount_idr INTEGER CHECK (max_discount_idr IS NULL OR max_discount_idr > 0),
  min_subtotal_idr INTEGER NOT NULL DEFAULT 0 CHECK (min_subtotal_idr >= 0),
  max_uses         INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count       INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at        TEXT,
  expires_at       TEXT,
  is_public        INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
  is_active        INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================================================
-- 6. ORDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number          TEXT    NOT NULL UNIQUE,
  status                  TEXT    NOT NULL DEFAULT 'PENDING_PAYMENT'
                                  CHECK (status IN ('PENDING_PAYMENT', 'PAID_VERIFIED', 'PACKED', 'SHIPPED', 'COMPLETED', 'CANCELLED')),
  customer_name           TEXT    NOT NULL,
  customer_email          TEXT    NOT NULL,
  customer_phone          TEXT    NOT NULL,
  shipping_zone           TEXT    NOT NULL,
  shipping_city           TEXT    NOT NULL,
  shipping_district       TEXT    NOT NULL DEFAULT '',
  shipping_postal_code    TEXT    NOT NULL DEFAULT '',
  shipping_address        TEXT    NOT NULL,
  shipping_notes          TEXT,
  shipping_courier        TEXT    NOT NULL,
  shipping_class          TEXT    NOT NULL
                                  CHECK (shipping_class IN ('REGULAR', 'CARGO_BATTERY', 'CARGO_REPLICA', 'CARGO_GAS')),
  wooden_packing          INTEGER NOT NULL DEFAULT 0 CHECK (wooden_packing IN (0, 1)),
  wooden_packing_cost_idr INTEGER NOT NULL DEFAULT 0 CHECK (wooden_packing_cost_idr >= 0),
  shipping_cost_idr       INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cost_idr >= 0),
  tracking_number         TEXT,
  payment_method          TEXT    NOT NULL,
  subtotal_idr            INTEGER NOT NULL CHECK (subtotal_idr >= 0),
  discount_idr            INTEGER NOT NULL DEFAULT 0 CHECK (discount_idr >= 0),
  total_idr               INTEGER NOT NULL CHECK (total_idr >= 0),
  voucher_code            TEXT,
  requires_age_18         INTEGER NOT NULL DEFAULT 0 CHECK (requires_age_18 IN (0, 1)),
  buyer_dob               TEXT,
  buyer_age_years         INTEGER,
  age_18_confirmed        INTEGER NOT NULL DEFAULT 0 CHECK (age_18_confirmed IN (0, 1)),
  sport_use_declaration   INTEGER NOT NULL DEFAULT 0 CHECK (sport_use_declaration IN (0, 1)),
  club_kta_number         TEXT,
  usage_purpose           TEXT,
  stock_restored          INTEGER NOT NULL DEFAULT 0 CHECK (stock_restored IN (0, 1)),
  cancel_reason           TEXT,
  created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);

-- ============================================================================
-- 7. ORDER ITEMS (IMMUTABLE SNAPSHOT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id              INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id            INTEGER REFERENCES products(id) ON DELETE SET NULL,
  sku_snapshot          TEXT    NOT NULL,
  name_snapshot         TEXT    NOT NULL,
  image_url_snapshot    TEXT    NOT NULL DEFAULT '',
  unit_price_idr        INTEGER NOT NULL CHECK (unit_price_idr >= 0),
  weight_grams_snapshot INTEGER NOT NULL DEFAULT 0 CHECK (weight_grams_snapshot >= 0),
  quantity              INTEGER NOT NULL CHECK (quantity > 0),
  line_total_idr        INTEGER NOT NULL CHECK (line_total_idr >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ============================================================================
-- 8. ORDER STATUS LOGS (TIMELINE FOR ORDER LOOKUP & ADMIN AUDIT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_status_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT    NOT NULL,
  note        TEXT,
  actor       TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_order_status_logs_order ON order_status_logs(order_id, created_at ASC);

-- ============================================================================
-- 9. INVENTORY MUTATIONS (APPEND-ONLY STOCK LEDGER)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_mutations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  delta_qty    INTEGER NOT NULL CHECK (delta_qty != 0),
  stock_before INTEGER NOT NULL CHECK (stock_before >= 0),
  stock_after  INTEGER NOT NULL CHECK (stock_after >= 0),
  reason       TEXT    NOT NULL
                       CHECK (reason IN ('INITIAL_SEED', 'CHECKOUT_DEDUCT', 'ORDER_CANCEL_RESTOCK', 'MANUAL_RESTOCK', 'AUDIT_ADJUSTMENT')),
  reference_id TEXT,
  note         TEXT    NOT NULL DEFAULT '',
  actor        TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_inventory_mutations_product ON inventory_mutations(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_mutations_created ON inventory_mutations(created_at DESC);

-- ============================================================================
-- 10. SITE SETTINGS (JSON KEY-VALUE STORE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value_json TEXT NOT NULL CHECK (json_valid(value_json)),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================================================
-- 11. ADMIN USERS & SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  display_name  TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'OPERATIONS_ADMIN'
                        CHECK (role IN ('SUPER_ADMIN', 'OPERATIONS_ADMIN')),
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT    PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TEXT    NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
```

### 3.3 Aturan Integritas Ledger & Soft-Delete Produk
- **Mutasi Stok Mutlak:** `PUT /api/admin/products/:id` **tidak** mengubah `stock_qty` secara diam-diam. Semua perubahan stok pasca-pembuatan wajib melalui `POST /api/admin/inventory/adjust` (atau atomik checkout/cancel) agar setiap perubahan tercatat pada `inventory_mutations`.
- **Hapus Produk Aman:** Pada `DELETE /api/admin/products/:id`, server memeriksa apakah produk direferensikan di `order_items` atau `inventory_mutations`. Jika ya, jalankan soft-archive (`UPDATE products SET is_active = 0, deleted_at = ? WHERE id = ?`) dan kembalikan `mode: 'soft_archived'`. Hanya produk yang belum memiliki riwayat transaksi dan ledger yang dihapus permanen (`mode: 'hard_deleted'`).

---

## 4. Kontrak JSON Terstandar & Mesin Kompatibilitas Loadout Builder

Definisi penuh ada di [shared/types.ts](file:///d:/brakasa-tac/shared/types.ts) pada interface `ProductSpecs` dan `ProductCompatibility`.

### 4.1 Contoh Payload `specs_json` & `compatibility_tags_json`

Contoh 1 (`BRK-AR-002` VFC Avalon Saber Carbine M-LOK AEG):
```json
{
  "specs": {
    "propulsion": "AEG",
    "platform": "M4_AR15",
    "loadout_slot": "primary",
    "fps_min": 370,
    "fps_max": 390,
    "fps_test_bb_gram": 0.20,
    "energy_joule": 1.35,
    "field_role": "WOODLAND_ASSAULT",
    "gearbox_or_system": "Gearbox V2 ECS (Quick-Spring)",
    "fire_modes": ["Safe", "Semi", "Full-Auto"],
    "hop_up": "Adjustable Rotary Hop-Up",
    "inner_barrel": "380 mm / 6.03 mm Tight-Bore",
    "magazine_capacity_rds": 120,
    "connector": "DEANS_T_PLUG",
    "has_mosfet": true,
    "battery_voltage_rec": "11.1V 3S LiPo Stick",
    "battery_form_factor": "STICK_BUFFER_TUBE",
    "gas_type": "NONE",
    "muzzle_thread": "14MM_CCW",
    "rail_type": ["PICATINNY_1913", "M_LOK"],
    "material": "Full Metal Receiver & CNC 6061-T6 M-LOK Handguard",
    "cordura_denier": "NONE",
    "bb_weight_rec": "0.25g - 0.28g",
    "orange_tip_compliant": true,
    "in_the_box": ["Unit VFC Avalon Saber", "1x QRS Mid-Cap 120 rds", "Manual & Sertifikat Uji Chrono"],
    "required_to_operate": ["Baterai LiPo 11.1V Stick (Deans)", "Smart Balance Charger", "BB 6mm 0.25g-0.28g"]
  },
  "compatibility": {
    "loadout_slot": "primary",
    "platform_family": "M4_AR15",
    "propulsion": "AEG",
    "required_power_type": "LIPO_BATTERY",
    "battery_connector": "DEANS_T_PLUG",
    "supports_11v_lipo": true,
    "required_battery_form_factors": ["STICK_BUFFER_TUBE"],
    "provides_rails": ["PICATINNY_1913", "M_LOK"],
    "muzzle_thread": "14MM_CCW",
    "mag_family": "M4_556_AEG",
    "recommended_bb_min_gram": 0.25,
    "recommended_bb_max_gram": 0.30,
    "compatible_skus": ["BRK-CSM-003", "BRK-OPT-001", "BRK-OPT-002", "BRK-UPG-001", "BRK-CSM-001"]
  }
}
```

### 4.2 Aturan Deterministik Loadout Compatibility Engine (`POST /api/loadout/evaluate`)

Engine membaca 5 slot (`primaryId`, `sidearmId`, `opticIds[]`, `rigProtectionIds[]`, `powerConsumableIds[]`) dari database, lalu menjalankan 6 kelompok aturan deterministik yang selaras 100% dengan `docs/specs/02-FLOW-AND-FEATURES.md` (kode aturan terkunci di `LoadoutRuleCode` pada [shared/types.ts](file:///d:/brakasa-tac/shared/types.ts)):

1. **Power & Propulsion (`GBBR_GREEN_GAS_OK`, `MISSING_GREEN_GAS`, `AEG_DEANS_LIPO_OK`, `MISSING_LIPO_DEANS`, `AK74M_CONNECTOR_VOLTAGE_CONFLICT`, `AK74M_NEEDS_74V_TAMIYA`, `REDUNDANT_LIPO`, `REDUNDANT_GREEN_GAS`):**
   - Primary `AEG` dengan Deans + MOSFET (`BRK-AR-002`, `BRK-SMG-001`) tanpa `BRK-CSM-003` -> `WARNING`; bersama `BRK-CSM-003` -> `COMPATIBLE`.
   - Primary `BRK-AR-003` (Mini Tamiya, Non-MOSFET) bersama `BRK-CSM-003` (11.1V Deans) -> `CONFLICT` (`AK74M_CONNECTOR_VOLTAGE_CONFLICT`).
   - Primary `GBBR` (`BRK-AR-001`) atau Sidearm `GBB_PISTOL` (`BRK-PST-001`) tanpa `BRK-CSM-002` -> `WARNING`.
   - Baterai LiPo tanpa AEG atau Green Gas tanpa GBBR/GBB -> `WARNING` (redundant).
2. **Muzzle Thread (`MUZZLE_14CCW_OK`, `MUZZLE_M24_CONFLICT`, `MUZZLE_PISTOL_NON_THREADED`):**
   - `BRK-UPG-001` (`14MM_CCW`) bersama `BRK-SNP-001` (`M24X1_CW`) -> `CONFLICT` (`MUZZLE_M24_CONFLICT`).
   - `BRK-UPG-001` bersama unit berulir `14MM_CCW` -> `COMPATIBLE`.
3. **Optic & Rail (`OPTIC_PICATINNY_OK`, `AK74M_NEEDS_RAIL_ADAPTER`, `LPVO_ON_CQB_PDW`, `REDDOT_ONLY_ON_SNIPER`, `DUPLICATE_OPTIC`):**
   - Optik/PEQ Picatinny pada `BRK-AR-003` (`AK_SIDE_DOVETAIL`) -> `WARNING` (`AK74M_NEEDS_RAIL_ADAPTER`).
   - `BRK-OPT-002` LPVO pada `BRK-SMG-001` -> `WARNING`; `BRK-OPT-001` Red Dot saja pada `BRK-SNP-001` -> `WARNING`; kedua optik bidik utama dipilih bersamaan -> `WARNING`.
4. **BB & Consumables (`MISSING_BB`, `BB_028_OPTIMAL_OUTDOOR`, `BB_028_SNIPER_BASELINE`, `BB_028_CQB_NOTE`, `TRACER_GLOW_BB_REMINDER`):**
   - Ada unit replika tanpa `BRK-CSM-001` -> `WARNING`; catatan informasi berat BB dan Tracer BB sesuai peran medan.
5. **FPS, MED & Kepatuhan Legal (`MED_OVER_400_NO_SIDEARM`, `MED_OVER_400_COVERED`, `PERPOL_JOULE_COMPLIANT`):**
   - Primary `fpsMax > 400` tanpa Sidearm `<= 350 FPS` -> `WARNING` (sarankan `BRK-PST-001`).
   - Semua replika `<= 2.0 Joule` -> `INFO` (`PERPOL_JOULE_COMPLIANT`).
6. **Rig Modularity (`FCPC_PLACARD_MATCH`, `HELMET_COMMS_MATCH`, `PLACARD_556_INSERT_NOTE`):**
   - `BRK-RIG-001` + `BRK-RIG-002` -> `COMPATIBLE` (SwiftClip placard); `BRK-HLM-001` + `BRK-HLM-002` -> `COMPATIBLE` (ARC rail comms); `BRK-RIG-002` (5.56 insert) bersama `BRK-SMG-001`/`BRK-AR-003`/`BRK-SNP-001` -> `WARNING`.

**Klasifikasi Total Berat Loadout:**
- `< 4000 g` -> `ULTRALIGHT`
- `4000 g - 6500 g` -> `BALANCED_TACTICAL`
- `> 6500 g` -> `HEAVY_DIRECT_ACTION`

**3 Preset Misi Default Zero-Conflict (dihidrasi dari SKU aktif di SQLite, selaras `02-FLOW-AND-FEATURES.md`):**
1. `cqb-speed-breacher` (CQB Speed Breacher, Rp13.660.000, 4.562 g): `BRK-SMG-001` + `BRK-OPT-001` + [`BRK-RIG-001`, `BRK-APP-002`] + [`BRK-CSM-003`, `BRK-UPG-001`, `BRK-CSM-001`]
2. `woodland-recce-marksman` (Woodland Recce Marksman, Rp28.400.000, 8.100 g): `BRK-SNP-001` + `BRK-PST-001` + `BRK-OPT-002` + [`BRK-APP-001`, `BRK-APP-003`, `BRK-HLM-002`] + [`BRK-CSM-001`, `BRK-CSM-002`]
3. `gbb-realism-kit` (Gas Blowback Realism Kit, Rp30.300.000, 8.205 g): `BRK-AR-001` + `BRK-PST-001` + [`BRK-OPT-001`, `BRK-OPT-003`] + [`BRK-RIG-001`, `BRK-RIG-002`, `BRK-HLM-001`, `BRK-HLM-002`] + [`BRK-CSM-002`, `BRK-CSM-001`]

---

## 5. Kontrak REST API Lengkap

Semua error endpoint mengembalikan format seragam `ApiErrorResponse`:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Pesan ramah bahasa Indonesia", "details": {} } }
```

### 5.1 Public Endpoints (`/api/*`)

| Method & Path | Kontrak Tipe (`shared/types.ts`) | Perilaku & Aturan Bisnis |
| :--- | :--- | :--- |
| `GET /api/bootstrap` | Res: `BootstrapResponse` | Mengembalikan `categories` (dengan count SKU aktif live), `settings` publik (`armoryProfile`, `heroConfig`, 10 `heroScenes`, `spotlight` terhidrasi stok/harga live, `shippingSettings`), `activePromos` (voucher aktif & `is_public = 1`), `missionSummaries` (4 misi dengan count & min/max harga SQL live), `fieldVideoProducts` (semua produk aktif yang memiliki video demo), dan `loadoutPresets`. |
| `GET /api/products` | Query: `ProductListQuery`<br>Res: `ProductListResponse` | Mendukung `q` (FTS5 `MATCH` dengan fallback sanitasi prefix `term*`), `category`, `mission` (`json_each(mission_tags_json)`), `platform`, `propulsion`, `loadoutSlot`, `minPrice`, `maxPrice`, `minFps`, `maxFps`, `inStock`, `lowStock`, `hasVideo` (`EXISTS product_media WHERE media_type='video'`), `featured`, `ids` (CSV untuk validasi live Cart), `sort`, `page`, `limit`. Hanya mengembalikan `is_active = 1 AND deleted_at IS NULL`. Mengembalikan `facets` dihitung langsung dari SQL. |
| `GET /api/products/:slug` | Res: `ProductDetailResponse` | Mengembalikan `product` lengkap (`specs`, `compatibility`, seluruh `media` foto + video) dan maksimal 4 `compatibleProducts` aktif berstok `> 0` berdasarkan `compatible_skus` serta kecocokan rail/power/platform. Mengembalikan `404` bila slug tidak ditemukan atau nonaktif. |
| `POST /api/loadout/evaluate` | Req: `LoadoutEvaluateRequest`<br>Res: `LoadoutEvaluateResponse` | Menjalankan 6 aturan Loadout Compatibility Engine, menghitung `totalWeightGrams`, `weightClass`, `totalPriceIdr`, `combinedShippingClass` (prioritas tertinggi: `CARGO_GAS > CARGO_REPLICA > CARGO_BATTERY > REGULAR`), `requiresAge18`, dan mengembalikan daftar `checks` + `presets`. |
| `POST /api/vouchers/validate` | Req: `VoucherValidateRequest`<br>Res: `VoucherValidateResponse` | Memeriksa kode (case-insensitive), `is_active = 1`, rentang `starts_at`/`expires_at`, kuota `used_count < max_uses`, dan `subtotalIdr >= min_subtotal_idr`. Menghitung `discountIdr` (mematuhi plafon `max_discount_idr` untuk `PERCENT`). |
| `POST /api/orders` | Req: `CreateOrderRequest`<br>Res (`201`): `CreateOrderResponse` | **Checkout Atomik (`BEGIN IMMEDIATE`):**<br>1. Baca ulang produk dari DB (harga, berat, stok, `requires_age_18`, `shipping_class`). Tolak `409 OUT_OF_STOCK` bila stok kurang.<br>2. Jika ada item `requires_age_18 = 1`, wajibkan `compliance.buyerDob` dengan umur terhitung server `>= 18` tahun, `age18Confirmed === true`, `legalDeclarationAccepted === true`. Tolak `422 AGE_VERIFICATION_FAILED` jika gagal.<br>3. Evaluasi `combinedShippingClass` dan pastikan `shippingCourier` diizinkan untuk kelas pengiriman tersebut (blokir kurir reguler/udara untuk `CARGO_BATTERY`/`CARGO_REPLICA`/`CARGO_GAS`).<br>4. Hitung ongkir deterministik dari `site_settings.shipping_settings` + `woodenPackingCostIdr`.<br>5. Validasi ulang voucher dan lakukan atomic increment `UPDATE vouchers SET used_count = used_count + 1 WHERE id = ? AND (max_uses IS NULL OR used_count < max_uses)`.<br>6. Potong stok tiap SKU (`UPDATE products SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty >= ?`), tulis `inventory_mutations` (`reason = 'CHECKOUT_DEDUCT'`).<br>7. Generate `invoice_number` format `BRK-YYYYMMDD-XXXX`, simpan `orders`, `order_items`, dan log awal `order_status_logs` (`PENDING_PAYMENT`). |
| `POST /api/orders/lookup` | Req: `OrderLookupRequest`<br>Res: `OrderLookupResponse` | Dilindungi rate limiter (`15 req / 15 menit / IP`). Normalisasi `invoiceNumber` (trim + uppercase) dan verifikasi `contact` cocok dengan `customer_email` (case-insensitive) atau `customer_phone` (normalisasi digit `08`/`62`). Mengembalikan `order`, `timeline` kronologis dari `order_status_logs`, dan 5 `steps` progres linear. Pesan error generik `404` untuk mencegah enumerasi pesanan. |

### 5.2 Admin Endpoints (`/api/admin/*`)

**Aturan Wajib:** Seluruh endpoint di bawah ini (kecuali `POST /api/admin/auth/login`) wajib melewati middleware `requireAdminSession`. Permintaan tanpa cookie `brakasa_admin_session` yang valid dan belum kadaluwarsa langsung mengembalikan `401 UNAUTHORIZED`.

| Method & Path | Kontrak Tipe (`shared/types.ts`) | Perilaku & Aturan Bisnis |
| :--- | :--- | :--- |
| `POST /api/admin/auth/login` | Req: `AdminLoginRequest`<br>Res: `AdminAuthMeResponse` | Rate-limited (`10 percobaan / 15 menit / IP`). Verifikasi username/email + password `scryptSync` + `timingSafeEqual`. Buat token random 32-byte, simpan `SHA-256(token)` di `admin_sessions` (TTL 24 jam), set cookie `brakasa_admin_session` (`HttpOnly; SameSite=Lax; Path=/`, plus `Secure` di production HTTPS). |
| `POST /api/admin/auth/logout` | Res: `AdminLogoutResponse` | Hapus sesi dari `admin_sessions` dan kosongkan cookie (`Max-Age=0`). |
| `GET /api/admin/auth/me` | Res: `AdminAuthMeResponse` | Mengembalikan profil admin aktif dari sesi terverifikasi. |
| `GET /api/admin/dashboard` | Res: `AdminDashboardResponse` | **100% Agregasi SQL Real-Time (NOL angka fiktif):**<br>- `confirmedRevenueIdr`: `SUM(total_idr)` status `PAID_VERIFIED/PACKED/SHIPPED/COMPLETED`.<br>- `pendingPaymentRevenueIdr`: `SUM(total_idr)` status `PENDING_PAYMENT`.<br>- `actionRequiredOrdersCount`: `COUNT(*)` status `PENDING_PAYMENT/PAID_VERIFIED/PACKED`.<br>- `lowStockSkuCount` & `outOfStockSkuCount`: dari `products` aktif (`stock_qty <= low_stock_threshold`).<br>- `totalInventoryValueIdr`: `SUM(stock_qty * price_idr)` produk aktif.<br>- `orderStatusBreakdown`, `priorityOrders` (maks 10), `lowStockProducts`, dan 10 `recentMutations` terbaru. |
| `GET /api/admin/products` | Query: `AdminProductListQuery`<br>Res: `AdminProductListResponse` | Menampilkan seluruh produk (aktif maupun nonaktif yang belum hard-delete) beserta seluruh media. |
| `GET /api/admin/products/:id` | Res: `AdminProductDetailResponse` | Detail lengkap satu produk untuk form editor. |
| `POST /api/admin/products` | Req: `AdminProductUpsertRequest`<br>Res (`201`): `AdminProductDetailResponse` | Transaksi `BEGIN IMMEDIATE`: insert `products` (otomatis sinkronisasi `fps_min`, `fps_max`, `energy_joule`, `specs_search_text`), insert `product_media`, dan bila `initialStockQty > 0` catat baris `inventory_mutations` (`MANUAL_RESTOCK`). |
| `PUT /api/admin/products/:id` | Req: `AdminProductUpsertRequest`<br>Res: `AdminProductDetailResponse` | Transaksi `BEGIN IMMEDIATE`: update metadata, `specs_json`, `compatibility_tags_json`, `specs_search_text`, dan replace daftar `product_media` sesuai `sortOrder`. Tidak mengubah `stock_qty`. |
| `PUT /api/admin/products/:id/media` | Req: `AdminProductMediaUpdateRequest`<br>Res: `AdminProductDetailResponse` | Pembaruan khusus daftar media (foto/video/urutan/primary) sebuah produk secara atomik. |
| `DELETE /api/admin/products/:id` | Res: `AdminDeleteProductResponse` | Soft-archive bila pernah masuk `order_items`/`inventory_mutations`; hard-delete bila bersih. |
| `GET /api/admin/media` | Res: `AdminMediaListResponse` | Memindai disk nyata pada `public/media/images/hero`, `public/media/images/products`, `public/media/videos`, dan `storage/uploads` untuk pustaka media Admin. |
| `POST /api/admin/media/upload` | Multipart field `file`<br>Res (`201`): `AdminMediaUploadResponse` | Upload gambar (maks `8 MB`) atau video (maks `40 MB`) ke `storage/uploads/<uuid>.<ext>` dengan validasi ekstensi allowlist + pengecekan magic bytes biner. |
| `GET /api/admin/inventory` | Query: `productId`, `reason`, `q`<br>Res: `AdminInventoryListResponse` | Daftar stok semua SKU aktif + nilai inventori riil + tabel riwayat `inventory_mutations` terfilter. |
| `POST /api/admin/inventory/adjust` | Req: `AdminInventoryAdjustRequest`<br>Res: `AdminInventoryAdjustResponse` | Transaksi `BEGIN IMMEDIATE`: wajib `note` non-kosong, cek `stock_qty + deltaQty >= 0`, update `products.stock_qty`, catat `inventory_mutations` dengan `actor = admin.username`. |
| `GET /api/admin/orders` | Query: `AdminOrderListQuery`<br>Res: `AdminOrderListResponse` | Daftar pesanan + `countsByStatus` live dari `GROUP BY status`. |
| `GET /api/admin/orders/:id` | Res: `AdminOrderDetailResponse` | Detail pesanan lengkap, data kepatuhan 18+, `timeline`, dan `allowedNextStatuses`. |
| `PATCH /api/admin/orders/:id/status` | Req: `AdminOrderStatusUpdateRequest`<br>Res: `AdminOrderStatusUpdateResponse` | Validasi transisi terhadap `ALLOWED_ORDER_TRANSITIONS`.<br>- Menuju `SHIPPED`: wajib `trackingNumber` tidak kosong (minimal 5 karakter).<br>- Menuju `CANCELLED`: wajib `cancelReason` tidak kosong; dalam `BEGIN IMMEDIATE`, jalankan guard idempotensi `orders.stock_restored = 0 -> 1`, kembalikan stok seluruh `order_items` ke `products.stock_qty`, dan catat `inventory_mutations` (`ORDER_CANCEL_RESTOCK`).<br>- Selalu menulis baris baru di `order_status_logs`. |
| `GET /api/admin/vouchers` | Res: `AdminVoucherListResponse` | Daftar seluruh voucher beserta `usedCount` aktual. |
| `POST /api/admin/vouchers` | Req: `AdminVoucherCreateRequest`<br>Res (`201`): `Voucher` | Buat voucher baru (kode otomatis uppercase trim, unik). |
| `PATCH /api/admin/vouchers/:id` | Req: `AdminVoucherUpdateRequest`<br>Res: `Voucher` | Ubah properti atau toggle `isActive` / `isPublic`. |
| `DELETE /api/admin/vouchers/:id` | Res: `AdminDeleteVoucherResponse` | Tolak `409 VOUCHER_IN_USE` bila `used_count > 0` (arahkan untuk menonaktifkan); hard-delete bila `used_count === 0`. |
| `GET /api/admin/settings` | Res: `AdminSettingsResponse` | Baca seluruh konfigurasi `site_settings` (`armoryProfile`, `heroConfig`, 10 `heroScenes`, `spotlightConfig`, `shippingSettings`, `inventoryDefaults`). |
| `PUT /api/admin/settings` | Req: `AdminSettingsUpdateRequest`<br>Res: `AdminSettingsResponse` | Update parsial/penuh `site_settings` dalam 1 transaksi. Bila `heroConfig.videoUrl` atau `posterUrl` berubah, otomatis perbarui `heroConfig.cacheVersion = String(Date.now())`. |

---

## 6. Arsitektur Keamanan, Autentikasi & Upload Media

1. **Password Hashing (`server/services/authService.ts`):**
   - Format tersimpan: `scrypt$<saltHex16Bytes>$<derivedKeyHex64Bytes>` memakai `crypto.scryptSync(password, salt, 64)`.
   - Verifikasi wajib menggunakan `crypto.timingSafeEqual` untuk mencegah timing attack.
   - Kredensial admin seed awal dibaca dari environment variable (`BRAKASA_ADMIN_USER`, `BRAKASA_ADMIN_PASS`) dengan fallback development terdokumentasi (`admin` / `BrakasaArmory#2026`, hanya dicetak pada log seeder saat pertama kali dibuat, tidak pernah muncul di UI atau error login).
2. **Session Cookie & CSRF Defense:**
   - Nama cookie: `brakasa_admin_session`.
   - Flag: `HttpOnly; SameSite=Lax; Path=/` (+ `Secure` bila `NODE_ENV === 'production'` dan request HTTPS).
   - Hanya `SHA-256(rawToken)` yang disimpan di tabel `admin_sessions`. Token tidak pernah disimpan di `localStorage`.
   - Middleware `requireAdminSession` juga memverifikasi header `Origin` / `Referer` (bila ada) cocok dengan host sendiri untuk metode mutasi (`POST`, `PUT`, `PATCH`, `DELETE`).
3. **Upload File Aman (`server/middleware/upload.ts`):**
   - Ekstensi allowlist ketat: `.jpg`, `.jpeg`, `.png`, `.webp` (maks `8 MB`) dan `.mp4`, `.webm` (maks `40 MB`).
   - Penamaan ulang file otomatis menjadi `<crypto.randomUUID()><ext>` untuk mencegah *path traversal* dan bentrokan nama.
   - **Validasi Magic Bytes:** Setelah Multer menyimpan berkas sementara di `storage/uploads/`, baca 16 byte pertama:
     - JPEG: `FF D8 FF`
     - PNG: `89 50 4E 47 0D 0A 1A 0A`
     - WebP: `RIFF` (offset 0..3) dan `WEBP` (offset 8..11)
     - MP4: `ftyp` pada offset `4..7`
     - WebM: `1A 45 DF A3`
   - Jika magic bytes gagal, hapus berkas segera via `fs.unlinkSync` dan kembalikan `400 INVALID_MEDIA_SIGNATURE`.
4. **Rate Limiting (`server/middleware/rateLimit.ts`):**
   - In-memory sliding window map:
     - `POST /api/admin/auth/login`: maks `10` request / `15 menit` per IP.
     - `POST /api/orders/lookup`: maks `15` request / `15 menit` per IP.

---

## 7. Strategi Kepatuhan Teknis `antislop` R-39 & R-40 di Express + Vite

Agar aplikasi SPA React + Vite lulus penuh terhadap audit statis maupun dinamis **`R-39` (Aksesibilitas, Semantik Dokumen & Motion)** serta **`R-40` (LCP Poster Hero Awal & Nol CLS)** tanpa kompleksitas SSR penuh, arsitektur menggunakan mekanisme **Server-Enhanced HTML Shell**.

### 7.1 Template `index.html`

```html
<!doctype html>
<html lang="id" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--BRAKASA_HEAD_META-->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
    />
    <script>
      (function () {
        try {
          var saved = localStorage.getItem('brakasa-theme');
          if (saved === 'light' || saved === 'dark') {
            document.documentElement.setAttribute('data-theme', saved);
          }
        } catch (_) {}
      })();
    </script>
  </head>
  <body>
    <div id="root"><!--BRAKASA_LCP_PRELOAD_SHELL--></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 7.2 Injeksi Per-Route di Express (`server/middleware/htmlShell.ts`) & Vite Dev Parity

Saat Express melayani request HTML SPA (`GET *` selain `/api/*`, `/media/*`, `/uploads/*`, `/assets/*`), middleware `renderHtmlShell(req, templateHtml)` melakukan dua substitusi sinkron super cepat:

1. **`<!--BRAKASA_HEAD_META-->` (Judul Unik per Rute, R-39):**
   - `/`: `<title>Brakasa Tactical | Unit Airsoft & Perlengkapan Taktis Presisi 18+</title>` + `<link rel="preload" as="image" href="/media/videos/hero-tactical-poster.jpg" fetchpriority="high" />`
   - `/store`: `<title>Katalog Unit & Gear | Brakasa Tactical</title>`
   - `/store/:slug`: Query sinkron SQLite `SELECT name, short_description FROM products WHERE slug = ? AND is_active = 1` (< 0.2ms) -> `<title>{name} | Brakasa Tactical</title>` (fallback ke judul katalog bila tidak ditemukan)
   - `/loadout-builder`: `<title>Interactive Tactical Loadout Builder | Brakasa Tactical</title>`
   - `/checkout`: `<title>Checkout & Verifikasi Kepatuhan 18+ | Brakasa Tactical</title>`
   - `/order-lookup`: `<title>Cek Status Pesanan & Resi Kargo | Brakasa Tactical</title>`
   - `/compliance`: `<title>Panduan Regulasi Perpol No. 5/2018 & Klasifikasi FPS | Brakasa Tactical</title>`
   - `/admin/login`: `<title>Login Admin Operations | Brakasa Tactical</title>`
   - `/admin*`: `<title>Admin Operations Center | Brakasa Tactical</title>`
   - Seluruh `<title>` dan `<meta name="description">` wajib melewati helper `escapeHtml()` untuk mencegah XSS.

2. **`<!--BRAKASA_LCP_PRELOAD_SHELL-->` (Poster Hero LCP Awal di HTML, R-40):**
   - **Khusus rute `/`:** Menginjeksi elemen gambar poster LCP nyata tepat di dalam `<div id="root">` **sebelum** berkas JS apa pun diunduh atau dieksekusi:
     ```html
     <div id="hero-lcp-shell" style="position:relative;width:100%;min-height:clamp(540px,82svh,860px);background:#0F1110;overflow:hidden;">
       <img
         id="hero-lcp-poster"
         src="/media/videos/hero-tactical-poster.jpg"
         width="1920"
         height="1080"
         fetchpriority="high"
         decoding="sync"
         alt="Operator airsoft Brakasa Tactical dengan unit AEG dan plate carrier Cordura 500D"
         style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;"
       />
     </div>
     ```
   - **Rute selain `/`:** Diganti string kosong `""` agar halaman `/store` atau `/admin` tidak mengunduh poster hero yang tidak dipakai.
   - **Transisi Zero-CLS saat React Mount:** Ketika React melakukan `createRoot(rootEl).render(<App />)`, komponen `HeroVideoSection` merender kontainer berdimensi identik (`min-height: clamp(540px, 82svh, 860px)`) dan elemen `<img id="hero-lcp-poster" src={posterUrl} width={1920} height={1080} fetchPriority="high">` yang langsung memakai berkas gambar yang sudah ada di memory cache browser, sehingga LCP tercapai instan dan CLS bernilai `0`.
   - **Paritas Dev Mode (`vite.config.ts`):** Plugin inline kecil pada `vite.config.ts` (`transformIndexHtml`) juga menyuntikkan placeholder default `/` agar pengujian di port dev `5173` maupun build produksi `3000` sama-sama patuh R-39 & R-40.
   - **Navigasi SPA Client-Side:** Hook `useDocumentTitle(title)` pada setiap halaman React memperbarui `document.title` setiap kali pengguna berpindah rute di sisi klien.

### 7.3 Kepatuhan R-39 pada Hero Video & Seluruh Kontrol UI
- Elemen `<video>` Hero selalu memakai `muted loop playsInline preload="metadata" aria-hidden="true"` dan ditumpuk di atas `#hero-lcp-poster` (baru naik ke `opacity: 1` setelah event `playing` atau `canplay`).
- Wajib membaca `window.matchMedia('(prefers-reduced-motion: reduce)')` saat mount: jika aktif, `video.pause()` otomatis dan hanya poster statis tajam yang tampil sampai pengguna menekan tombol Putar secara manual.
- Tombol permanen `Play / Pause` (`aria-pressed`) dan `Audio On / Off` (`aria-pressed`, default muted) minimal `44x44px`, terletak di atas scrim `#0F1110` >= 82% opasitas.
- `src/styles/global.css` wajib menetapkan `cursor: pointer` pada `button, a[href], select, summary, input[type="checkbox"], input[type="radio"]`, `cursor: not-allowed` pada `:disabled`, skip link `<a href="#main-content">`, dan `:focus-visible` dengan outline `2px solid var(--focus-ring)`.

---

## 8. Matriks Pembagian File Tim Implementasi Gelombang 3 (Zero Collision)

Empat engineer pada Gelombang 3 bekerja **100% paralel** tanpa satu pun file yang diedit oleh dua engineer berbeda.

### 8.1 File Terkunci (Read-Only untuk Gelombang 3)
- `shared/types.ts` (kontrak tipe utama)
- `docs/specs/01-UX-DESIGN.md`, `DESIGN.md`, `docs/specs/03-ARCHITECTURE.md`
- `public/media/images/**`, `public/media/videos/**`

### 8.2 Tabel Kepemilikan Eksklusif 4 Engineer Gelombang 3

| Engineer | Ruang Lingkup Tanggung Jawab | Daftar File Eksklusif (Tidak Boleh Disentuh Engineer Lain) |
| :--- | :--- | :--- |
| **`backend-engineer`** | Konfigurasi root build, seluruh Express 5 API, SQLite 3.53 DDL + Seeder 20 SKU, Auth Cookie, Upload Media, Loadout Engine, Checkout Atomik, HTML Shell R-39/R-40 | `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `storage/.gitkeep`, `storage/uploads/.gitkeep`, seluruh direktori `server/**` (`server/index.ts`, `server/config.ts`, `server/db/connection.ts`, `server/db/schema.sql`, `server/db/seed.ts`, `server/db/helpers.ts`, `server/services/authService.ts`, `server/services/loadoutService.ts`, `server/services/shippingService.ts`, `server/services/orderService.ts`, `server/middleware/auth.ts`, `server/middleware/rateLimit.ts`, `server/middleware/upload.ts`, `server/middleware/htmlShell.ts`, `server/routes/public.ts`, `server/routes/orders.ts`, `server/routes/adminAuth.ts`, `server/routes/adminDashboard.ts`, `server/routes/adminProducts.ts`, `server/routes/adminMedia.ts`, `server/routes/adminInventory.ts`, `server/routes/adminOrders.ts`, `server/routes/adminVouchers.ts`, `server/routes/adminSettings.ts`) |
| **`frontend-shell-lp`** | Entry React, Router, Token CSS Dual-Mode, Shared API Client & Formatters, Context Global (Theme, Bootstrap, Cart), Layout Shell (Navbar, Footer, CartDrawer), Shared UI States, Landing Page (5 seksi + Hero Video + Telemetry Switcher), Compliance Page | `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/styles/global.css`, `src/lib/api.ts`, `src/lib/format.ts`, `src/lib/useDocumentTitle.ts`, `src/context/ThemeContext.tsx`, `src/context/BootstrapContext.tsx`, `src/context/CartContext.tsx`, `src/components/layout/SiteLayout.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/CartDrawer.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/StateViews.tsx`, `src/components/landing/HeroVideoSection.tsx`, `src/components/landing/ShopByMissionSection.tsx`, `src/components/landing/LoadoutSpotlightSection.tsx`, `src/components/landing/FieldVideoShowcaseSection.tsx`, `src/components/landing/CompliancePreviewSection.tsx`, `src/pages/LandingPage.tsx`, `src/pages/CompliancePage.tsx` |
| **`frontend-store`** | Storefront Catalog + Multi-Filter, PDP (Galeri Foto + Video Demo + Spec Sheet + Compatible Pairings), Interactive 5-Slot Loadout Builder, Checkout 18+ & Kargo Darat, Guest Order Lookup | `src/components/store/ProductCard.tsx`, `src/components/store/CatalogFilterPanel.tsx`, `src/components/store/ProductGallery.tsx`, `src/components/store/SpecSheetTable.tsx`, `src/components/store/CompatibilityCallout.tsx`, `src/components/loadout/LoadoutSlotCard.tsx`, `src/components/loadout/LoadoutManifestPanel.tsx`, `src/components/loadout/ProductPickerModal.tsx`, `src/components/checkout/ComplianceAgeSection.tsx`, `src/components/checkout/ShippingCargoSection.tsx`, `src/components/checkout/OrderSummaryPanel.tsx`, `src/pages/StoreCatalogPage.tsx`, `src/pages/ProductDetailPage.tsx`, `src/pages/LoadoutBuilderPage.tsx`, `src/pages/CheckoutPage.tsx`, `src/pages/OrderLookupPage.tsx` |
| **`admin-engineer`** | Admin Auth Context & Route Guard, Admin Layout Shell, 7 Halaman Admin Operations Center & Modal/Drawer Pendukung | `src/context/AdminAuthContext.tsx`, `src/components/admin/AdminLayout.tsx`, `src/components/admin/AdminGuard.tsx`, `src/components/admin/ProductEditorModal.tsx`, `src/components/admin/MediaPickerModal.tsx`, `src/components/admin/StockAdjustModal.tsx`, `src/components/admin/OrderDetailDrawer.tsx`, `src/components/admin/VoucherEditorModal.tsx`, `src/pages/admin/AdminLoginPage.tsx`, `src/pages/admin/AdminDashboardPage.tsx`, `src/pages/admin/AdminProductsPage.tsx`, `src/pages/admin/AdminInventoryPage.tsx`, `src/pages/admin/AdminOrdersPage.tsx`, `src/pages/admin/AdminVouchersPage.tsx`, `src/pages/admin/AdminSettingsPage.tsx` |

### 8.3 Kontrak Export Lintas-Modul (Wajib Dipatuhi agar Kompilasi Langsung Hijau)

Karena `src/App.tsx` (milik `frontend-shell-lp`) mengimpor halaman dari `frontend-store` dan `admin-engineer`, dan sebaliknya kedua engineer tersebut mengimpor utilitas/context dari `frontend-shell-lp`, seluruh simbol export berikut **DIKUNCI**:

1. **Named Export Halaman yang Diimpor oleh `src/App.tsx`:**
   - Dari `frontend-store`:
     - `src/pages/StoreCatalogPage.tsx` -> `export function StoreCatalogPage(): React.JSX.Element`
     - `src/pages/ProductDetailPage.tsx` -> `export function ProductDetailPage(): React.JSX.Element`
     - `src/pages/LoadoutBuilderPage.tsx` -> `export function LoadoutBuilderPage(): React.JSX.Element`
     - `src/pages/CheckoutPage.tsx` -> `export function CheckoutPage(): React.JSX.Element`
     - `src/pages/OrderLookupPage.tsx` -> `export function OrderLookupPage(): React.JSX.Element`
   - Dari `admin-engineer`:
     - `src/context/AdminAuthContext.tsx` -> `export function AdminAuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element`, `export function useAdminAuth(): { admin: AdminUserProfile | null; loading: boolean; login: (username: string, password: string) => Promise<void>; logout: () => Promise<void>; refresh: () => Promise<void>; }`
     - `src/components/admin/AdminGuard.tsx` -> `export function AdminGuard(): React.JSX.Element` (merender `<Outlet />` di dalam `<AdminLayout />` bila terautentikasi, atau `<Navigate to="/admin/login" replace />` bila tidak)
     - `src/pages/admin/AdminLoginPage.tsx` -> `export function AdminLoginPage(): React.JSX.Element`
     - `src/pages/admin/AdminDashboardPage.tsx` -> `export function AdminDashboardPage(): React.JSX.Element`
     - `src/pages/admin/AdminProductsPage.tsx` -> `export function AdminProductsPage(): React.JSX.Element`
     - `src/pages/admin/AdminInventoryPage.tsx` -> `export function AdminInventoryPage(): React.JSX.Element`
     - `src/pages/admin/AdminOrdersPage.tsx` -> `export function AdminOrdersPage(): React.JSX.Element`
     - `src/pages/admin/AdminVouchersPage.tsx` -> `export function AdminVouchersPage(): React.JSX.Element`
     - `src/pages/admin/AdminSettingsPage.tsx` -> `export function AdminSettingsPage(): React.JSX.Element`

2. **Named Export Utilitas & Context yang Disediakan `frontend-shell-lp` untuk `frontend-store` & `admin-engineer`:**
   - `src/lib/api.ts`:
     - `export class ApiRequestError extends Error { status: number; code: string; details?: Record<string, string[] | string>; }`
     - `export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T>` (otomatis `credentials: 'include'`, parse JSON, throw `ApiRequestError` pada status `>= 400`)
     - `export async function apiUpload<T>(path: string, formData: FormData): Promise<T>` (tanpa set `Content-Type` manual agar boundary multipart otomatis)
   - `src/lib/format.ts`:
     - `export function formatIdr(amount: number): string` (contoh: `Rp 7.850.000`)
     - `export function formatWeight(grams: number): string` (contoh: `2.850 g (2,85 kg)`)
     - `export function formatDateTimeId(isoString: string): string`
     - `export function calculateJoule(fps: number, bbWeightGram: number): number`
     - `export function getShippingClassLabel(cls: ShippingClass): string`
     - `export function getOrderStatusLabel(status: OrderStatus): string`
   - `src/lib/useDocumentTitle.ts`:
     - `export function useDocumentTitle(title: string): void`
   - `src/context/ThemeContext.tsx`:
     - `export function useTheme(): { theme: 'dark' | 'light'; toggleTheme: () => void; setTheme: (t: 'dark' | 'light') => void }`
   - `src/context/BootstrapContext.tsx`:
     - `export function useBootstrap(): { data: BootstrapResponse | null; loading: boolean; error: string | null; reload: () => Promise<void> }`
   - `src/context/CartContext.tsx`:
     - `export function useCart(): { items: CartStoredItem[]; resolvedItems: CartResolvedItem[]; loading: boolean; drawerOpen: boolean; setDrawerOpen: (open: boolean) => void; totalCount: number; subtotalIdr: number; totalWeightGrams: number; requiresAge18: boolean; combinedShippingClass: ShippingClass; addItem: (productId: number, qty?: number) => void; addManyItems: (entries: CartStoredItem[]) => void; updateQuantity: (productId: number, qty: number) => void; removeItem: (productId: number) => void; clearCart: () => void; refreshCart: () => Promise<void>; }`
   - `src/components/ui/StateViews.tsx`:
     - `export function LoadingState({ label }: { label?: string }): React.JSX.Element`
     - `export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }): React.JSX.Element`
     - `export function ErrorState({ title, message, onRetry }: { title?: string; message: string; onRetry?: () => void }): React.JSX.Element`

### 8.4 Peta Rute Frontend Kanonik (`src/App.tsx`)
- Publik (dibungkus `<SiteLayout />`):
  - `/` -> `LandingPage`
  - `/store` -> `StoreCatalogPage`
  - `/store/:slug` -> `ProductDetailPage`
  - `/loadout-builder` -> `LoadoutBuilderPage`
  - `/checkout` -> `CheckoutPage`
  - `/order-lookup` -> `OrderLookupPage` (serta `<Route path="/orders/lookup" element={<Navigate to="/order-lookup" replace />} />`)
  - `/compliance` -> `CompliancePage`
- Admin (dibungkus `<AdminAuthProvider />`):
  - `/admin/login` -> `AdminLoginPage`
  - `/admin` (dibungkus `<AdminGuard />`) -> `AdminDashboardPage`
  - `/admin/products` -> `AdminProductsPage`
  - `/admin/inventory` -> `AdminInventoryPage`
  - `/admin/orders` -> `AdminOrdersPage`
  - `/admin/vouchers` -> `AdminVouchersPage`
  - `/admin/settings` -> `AdminSettingsPage`
- Fallback 404: Halaman not-found bersih berbahasa Indonesia dengan tautan kembali ke `/` dan `/store`.

---

## 9. Daftar Periksa Verifikasi Integrasi (Gate Gelombang 4)

Sebelum dinyatakan siap rilis, seluruh poin teknis berikut wajib diverifikasi langsung pada server produksi `npm run build && npm start`:

1. **Database & Seeder:** `storage/brakasa.db` terbuat otomatis, menjalankan 20 SKU aktif + 9 kategori + 10 hero scenes + voucher promo + 1 admin default secara idempoten (restart server ke-2 tidak menduplikasi baris).
2. **HTML Shell R-39 & R-40:** `curl -s http://localhost:3000/` wajib memuat `<html lang="id">`, `<title>` unik, dan `<img id="hero-lcp-poster" src="/media/videos/hero-tactical-poster.jpg" width="1920" height="1080" fetchpriority="high"` sebelum eksekusi JS. Permintaan ke `/store` dan `/admin/login` wajib menghasilkan `<title>` berbeda tanpa menyertakan `#hero-lcp-poster`.
3. **HTTP 206 Video Streaming:** `curl -I -H "Range: bytes=0-1023" http://localhost:3000/media/videos/hero-tactical-reel.mp4` dan ketujuh `product-*.mp4` mengembalikan `206 Partial Content` dengan `Content-Type: video/mp4`.
4. **Proteksi Admin & Transaksi Atomik:** `GET /api/admin/dashboard` tanpa cookie wajib `401`. Checkout replika dengan usia `< 18` wajib `422`. Transisi order ke `SHIPPED` tanpa resi wajib `400`. Transisi order ke `CANCELLED` wajib mengembalikan stok 1x secara idempoten dan mencatat baris `ORDER_CANCEL_RESTOCK` di `inventory_mutations`.
5. **Kepatuhan TypeScript & Zero Slop:** `npx tsc --noEmit` dan `npm run build` lulus dengan exit code `0`, tanpa peringatan error tipe lintas `shared/types.ts`, `server/`, dan `src/`.
