# Brakasa Tactical: Audit Lingkungan Teknis, Arsitektur Full-Stack, dan Desain Pipeline Video Sinematik

Dokumen ini merangkum hasil audit empiris terhadap mesin Windows target (`d:\brakasa-tac`), keputusan arsitektur Full-Stack produksi yang paling tahan banting di Node v24 Windows, serta cetak biru teknis **Cinematic Tactical Video Renderer** berbasis Python untuk menghasilkan video `.mp4` nyata (Hero Tactical Reel + Video Demo Produk Store) dari keyframe gambar resolusi tinggi.

---

## 1. Hasil Audit Empiris Lingkungan Windows

Semua pengujian di bawah dijalankan langsung secara read-only pada host target tanpa menyentuh berkas konfigurasi sensitif atau environment variable rahasia.

### 1.1 Spesifikasi Perangkat Keras & Toolchain Sistem

| Komponen | Hasil Audit Empiris | Implikasi Arsitektur |
| :--- | :--- | :--- |
| Sistem Operasi & Arsitektur | Windows (`AMD64`) | Wajib menghindari toolchain yang rawan error path/symlink Windows atau lock cache native. |
| CPU | 12 logical cores | Ideal untuk paralelisasi render frame Python (`ThreadPoolExecutor` / `ProcessPoolExecutor`) dan encoding multi-thread `libx264`. |
| RAM | 15.89 GiB (`17,066,131,456` bytes) | Sangat memadai untuk buffer frame 1080p `float32` (~24 MB/frame) via streaming pipe ke `ffmpeg` tanpa file temp masif. |
| GPU | NVIDIA GeForce GTX 1660 SUPER | Encoding software `libx264` tetap dipilih sebagai default demi determinisme bitrate, kompatibilitas browser universal, dan portabilitas antar mesin. |
| Node.js & npm | `Node v24.16.0`, `npm 11.13.0` | `pnpm`, `yarn`, dan `bun` tidak terpasang (`NOT_FOUND`). Proyek wajib distandardisasi menggunakan `npm`. |
| Git | `C:\Program Files\Git\cmd\git.exe` | Tersedia untuk manajemen versi. |
| Compiler Native C/C++ | `cl.exe`, `gcc`, `cmake`: `NOT_FOUND` | **Temuan kritis:** paket Node yang mengandalkan kompilasi `node-gyp` saat fallback (mis. `better-sqlite3`, `sqlite3`, `bcrypt`) berisiko gagal total di host ini. |

### 1.2 Audit Modul Bawaan `node:sqlite` (`DatabaseSync`)

Pengujian langsung pada Node `v24.16.0` membuktikan bahwa `node:sqlite` berfungsi penuh tanpa kompilasi C++, tanpa dependensi eksternal, dan tanpa peringatan error:

1. **Uji Standar (`DatabaseSync` in-memory):**
   ```powershell
   node -e "const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync(':memory:'); db.exec('CREATE TABLE t(id INT)'); console.log('SQLITE_OK');"
   ```
   Output aktual: `SQLITE_OK` (exit code `0`, bersih tanpa warning).

2. **Uji Kemampuan Produksi SQLite (File-backed WAL + JSON1 + FTS5 + Transaksi):**
   Output aktual dari probe:
   ```json
   {
     "node": "v24.16.0",
     "sqlite_version": "3.53.0",
     "journal_mode": "wal",
     "json1_fps": 410,
     "fts5_hits": 1
   }
   ```
   Fitur yang terverifikasi aktif 100%:
   - **SQLite Engine `3.53.0`** tertanam langsung di binary Node v24.16.0.
   - **Mode CJS (`require('node:sqlite')`) dan ESM (`import { DatabaseSync } from 'node:sqlite'`)** keduanya lolos.
   - **`PRAGMA journal_mode = WAL`** aktif penuh (memungkinkan concurrent reads saat checkout/admin write berlangsung).
   - **`PRAGMA foreign_keys = ON`** & **`PRAGMA busy_timeout = 5000`** berjalan normal.
   - **Ekstensi JSON1 (`json_extract`)** aktif untuk query spesifikasi teknis taktis di kolom JSON (`fps`, `gearbox`, `propulsion`, `denier`).
   - **Ekstensi FTS5 (`USING fts5`)** aktif untuk pencarian katalog instan (SKU, nama model, rail, material, kaliber BB).
   - **Transaksi eksplisit (`BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK`)** berjalan sinkron untuk menjamin konsistensi stok atomik saat checkout dan pembatalan pesanan.
   - **Native TypeScript Type Stripping** pada Node v24 juga lolos (`TS_OK:node24`), sementara `tsx` (`4.23.15`) dan `esbuild` (`0.28.2`) tersedia di npm untuk build produksi penuh.

### 1.3 Audit Lingkungan Python & Pipeline Video `.mp4`

| Komponen / Paket | Status Aktual di Host | Detail & Keterangan |
| :--- | :--- | :--- |
| Python & pip | `Python 3.14.5`, `pip 26.1.1` | Lokasi `C:\Python314\python.exe`. |
| System `ffmpeg` di PATH | `NOT_FOUND` | Tidak ada binary `ffmpeg` global. Wajib gunakan binary statis dari `imageio-ffmpeg`. |
| `Pillow` (`PIL`) | **Sudah Terpasang (`12.2.0`)** | Siap pakai (`Image`, `ImageFilter`, `ImageEnhance`, `ImageDraw`, `ImageChops`). |
| `NumPy` | **Sudah Terpasang (`2.5.3`)** | Siap pakai untuk transformasi array, LUT warna, vignette, motion blur, dan sintesis audio WAV. |
| Stdlib Audio/Proses | **Siap Pakai** | `wave`, `struct`, `subprocess`, `concurrent.futures` terverifikasi aktif. |
| `imageio-ffmpeg` | Belum terpasang; **Dry-run LOLOS** | `pip install --dry-run imageio-ffmpeg` memverifikasi wheel prebuilt **`imageio_ffmpeg-0.8.1-py3-none-win_amd64.whl`** (berisi binary statis `ffmpeg` Windows, tanpa dependensi tambahan). |
| `opencv-python-headless` | Belum terpasang; **Dry-run LOLOS** | `pip install --dry-run opencv-python-headless` memverifikasi wheel **`opencv_python_headless-5.1.0.95-cp37-abi3-win_amd64.whl`** (kompatibel Python 3.14 + NumPy 2.5.3). Opsional sebagai akselerator kecepatan. |
| `scipy` | Belum terpasang; **Dry-run LOLOS** | `scipy-1.18.1-cp314-cp314-win_amd64.whl` tersedia, namun **tidak diperlukan** agar pipeline tetap ringan (sintesis DSP cukup dengan NumPy). |

**Catatan Penting Izin Instalasi Windows:**
Hasil dry-run menunjukkan `Defaulting to user installation because normal site-packages is not writeable` pada `C:\Python314\Lib\site-packages`. Oleh karena itu, perintah instalasi pada tahap implementasi wajib memakai flag `--user` (atau `.venv` lokal):
```powershell
python -m pip install --user imageio-ffmpeg
# Opsional (akselerasi 5-8x untuk warp subpixel & directional blur):
python -m pip install --user opencv-python-headless
```

---

## 2. Rekomendasi Arsitektur Full-Stack Produksi

### 2.1 Perbandingan Stack: Express 5 + Vite React TS vs Fastify 5 + Vite React TS vs Next.js 16 App Router

Semua versi paket di bawah diverifikasi langsung dari npm registry pada hari audit.

| Kriteria Evaluasi | **Opsi A (Direkomendasikan): Express 5 (`5.3.0`) + Vite 8 (`8.3.8`) + React 19 (`19.3.1`) TS + `node:sqlite`** | **Opsi B (Alternatif Kuat): Fastify 5 (`5.12.8`) + Vite 8 + React 19 TS + `node:sqlite`** | **Opsi C (Tidak Direkomendasikan): Next.js 16 (`16.4.6`) App Router TS + `node:sqlite`** |
| :--- | :--- | :--- | :--- |
| Kompatibilitas `node:sqlite` di Node v24 Windows | **100% Native, 0 friksi.** Backend berjalan langsung di runtime Node.js murni tanpa bundler yang mengutak-atik core module. | **100% Native, 0 friksi.** Sama seperti Express, berjalan murni di runtime Node.js. | **Rawan friksi bundler.** Turbopack/Webpack sering gagal me-resolve specifier `node:sqlite` kecuali dikonfigurasi manual (`serverExternalPackages`, `server-only`) atau fallback ke `--webpack`. |
| Stabilitas Build di Windows | **Sangat tinggi.** Vite/Rollup stabil di Windows; build penuh frontend + backend selesai dalam ~2-5 detik. | **Sangat tinggi.** Build frontend + backend sangat cepat dan deterministik. | **Risiko menengah-tinggi.** Turbopack di Windows masih rentan cache lock `.next`, path quirk, dan prerender route yang menabrak DB lokal saat `next build`. |
| Streaming Video `.mp4` (`206 Partial Content`) & Upload Media Admin Runtime | **Built-in sempurna.** `express.static` secara native mendukung `Accept-Ranges: bytes` (HTTP 206) baik untuk aset build (`public/media/`) maupun file upload baru di `storage/uploads/` saat runtime tanpa restart. | **Built-in sempurna** via `@fastify/static` (perlu registrasi plugin per root folder). | **Problem klasik produksi:** file yang diunggah Admin ke `public/` setelah `next build` tidak otomatis dilayani Next.js production server, memaksa penulisan manual Route Handler streaming `fs.createReadStream` dengan header `Range`. |
| Kompleksitas & Kecepatan Implementasi | **Paling rendah & intuitif.** Express 5 sudah mendukung async error handling native; middleware standar (`express.json`, `multer`, cookie auth) tanpa jebakan enkapsulasi plugin. | **Rendah-menengah.** Performa RPS sintetis lebih tinggi, namun enkapsulasi plugin (`fastify-plugin`) dan strict JSON serializer bisa memperlambat iterasi fitur CRUD. | **Menengah-tinggi.** Boundary Server/Client Component, caching App Router, dan konfigurasi upload menambah permukaan bug. |
| Single-Command Run | **Ya.** `npm run dev` (Vite HMR + API proxy) dan `npm run build && npm start` (satu proses Express melayani SPA + API + Video di 1 port `3000`). | **Ya.** Pola yang sama dengan Express. | **Ya**, tetapi waktu cold-build dan footprint memori jauh lebih besar. |
| Dependensi Native C++ | **Nol (0).** SQLite via `node:sqlite`, hashing password via `node:crypto` (`scryptSync`), upload via `multer` pure JS. | **Nol (0).** Sama. | **Nol** jika tidak pakai native addon, tetapi beban binary SWC/Turbopack besar. |

### 2.2 Keputusan Final Stack Produksi Brakasa Tactical

**Stack terpilih: Express 5 + Vite 8 + React 19 + TypeScript + Tailwind CSS v4 + `node:sqlite` (Single Unified Repository).**

Alasan rekayasa utama:
1. **Bebas friksi 100% di Node v24.16.0 Windows:** Nol compiler C++ dibutuhkan (`cl.exe` tidak ada di mesin), nol konflik Turbopack terhadap `node:sqlite`, dan nol dependensi database eksternal (Docker/Postgres tidak diperlukan).
2. **Video-First & Runtime Media Ready:** Hero video 1080p, 6 video demo produk, serta gambar/video yang diunggah Admin dari dashboard langsung dilayani dengan HTTP `206 Partial Content` (`Accept-Ranges: bytes`) untuk scrubbing, looping, dan preload yang mulus di semua browser.
3. **Satu Perintah Produksi & Pengembangan:**
   - Pengembangan: `npm run dev` menjalankan server API (`tsx watch server/index.ts` di port `3001`) dan Vite dev server (`port 5173` dengan reverse proxy `/api`, `/media`, `/uploads` ke `:3001`) secara bersamaan via `concurrently`.
   - Produksi: `npm run build` mengompilasi client Vite ke `dist/client` dan bundle server via `esbuild` ke `dist/server/index.mjs`; lalu `npm start` menjalankan satu proses Node (`http://localhost:3000`) yang otomatis memastikan migrasi + seed idempoten lalu melayani frontend SPA, REST API, dan static/uploaded media.

### 2.3 Matriks Paket Terverifikasi (Zero Peer-Dep Conflict)

| Layer | Paket & Versi Target | Peran |
| :--- | :--- | :--- |
| Frontend Core | `react@^19.3.1`, `react-dom@^19.3.1`, `react-router@^8.5.2` | SPA Storefront, Loadout Builder, Checkout, Order Lookup, Admin Operations Center |
| Build & Styling | `vite@^8.3.8`, `@vitejs/plugin-react`, `tailwindcss@^4.3.5`, `@tailwindcss/vite@^4.3.5` | Peer dep `@tailwindcss/vite` terverifikasi mendukung `vite ^8` secara resmi |
| UI Icons | `lucide-react@^1.75.0` | Ikonografi teknis tajam dan konsisten |
| Backend Server | `express@^5.3.0`, `multer@^2.5.0`, `zod@^4.6.7` | REST API async-safe, multipart upload gambar/video, validasi skema ketat |
| Database & Auth | `node:sqlite` (built-in), `node:crypto` (`scryptSync`, `randomBytes`, `timingSafeEqual`) | Zero-dependency SQLite 3.53.0 + password KDF tahan brute-force + opaque session token |
| Dev & Build Tooling | `typescript@^5.8` atau `^7.0`, `@types/node@^24`, `@types/express@^5.0.6`, `@types/multer@^2.3.0`, `tsx@^4.23.15`, `esbuild@^0.28.2`, `concurrently@^10.0.7` | Type-checking ketat, dev reload instan, build server tunggal super cepat |

*(Catatan: kunci `@types/node` ke major `^24` agar definisi tipe `node:sqlite` selaras penuh dengan runtime Node `v24.16.0`.)*

### 2.4 Struktur Direktori Proyek yang Direkomendasikan

```text
d:\brakasa-tac\
|-- package.json                 # Satu entry point: dev, build, start, db:seed, media:render
|-- tsconfig.json                # Konfigurasi TypeScript ketat
|-- vite.config.ts               # Vite + React + @tailwindcss/vite + proxy /api, /media, /uploads
|-- index.html                   # Entry HTML + metadata + font preload
|-- public/
|   `-- media/
|       |-- images/              # Keyframe & foto produk hasil image-generator (.webp / .jpg)
|       `-- videos/              # Video hasil render pipeline (hero-tactical-reel.mp4, product-*.mp4, *-poster.jpg)
|-- storage/                     # Di-gitignore kecuali .gitkeep (dibuat otomatis saat startup)
|   |-- brakasa.db               # File SQLite utama (+ -wal, -shm)
|   `-- uploads/                 # Media gambar/video yang diunggah Admin saat runtime
|-- shared/
|   `-- schemas.ts               # Skema Zod & tipe TypeScript bersama (Product, Order, Loadout, Specs)
|-- server/
|   |-- index.ts                 # Bootstrap Express 5, static/Range serving, SPA fallback, graceful shutdown
|   |-- db/
|   |   |-- connection.ts        # Singleton DatabaseSync + WAL + helper withTransaction()
|   |   |-- schema.sql           # DDL tabel relasional + FTS5 + trigger sinkronisasi
|   |   `-- seed.ts              # Seeder idempoten (katalog 16-20 produk, admin default, voucher, settings)
|   |-- middleware/
|   |   |-- auth.ts              # Validasi cookie HttpOnly admin_session + proteksi CSRF origin/SameSite
|   |   |-- upload.ts            # Konfigurasi Multer + validasi ekstensi & magic-bytes
|   |   `-- rateLimit.ts         # In-memory sliding window limiter untuk login & order lookup
|   `-- routes/
|       |-- products.ts          # Katalog publik, filter spek JSON, search FTS5, detail + media
|       |-- loadout.ts           # Validasi kompatibilitas Loadout Builder & kalkulasi berat/harga
|       |-- orders.ts            # Checkout atomik (18+ declaration, kupon, ongkir darat/kargo), Order Lookup
|       |-- settings.ts          # Pengaturan toko publik (hero video URL, versi cache-busting, notice)
|       `-- admin/               # Auth, Dashboard KPI real-time, CRUD Produk/Media, Stok, Pesanan, Voucher
|-- src/                         # Frontend React 19 + Tailwind v4
|   |-- main.tsx
|   |-- App.tsx
|   |-- lib/                     # API client, format IDR, cart store persisten
|   |-- components/              # HeroVideoPlayer, ProductCard (hover video preview), SpecSheet, dsb.
|   `-- pages/                   # Landing, Storefront, ProductDetail, LoadoutBuilder, Checkout, OrderLookup, Admin/*
`-- scripts/
    `-- media/
        |-- video_manifest.json  # Konfigurasi deklaratif 10 scene Hero + 6 Video Produk (kamera, FX, timing)
        |-- render_videos.py     # Pipeline Python Cinematic Tactical Video Renderer
        `-- verify_videos.py     # Verifikasi durasi, codec, yuv420p, faststart, dan ukuran file
```

### 2.5 Cetak Biru Lapisan Database `node:sqlite` & Keamanan Produksi

1. **Inisialisasi Koneksi (`server/db/connection.ts`):**
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
   Pola `BEGIN IMMEDIATE` sangat penting: saat checkout memverifikasi stok, mengurangi kuantitas, mencatat baris `inventory_mutations`, dan menyimpan `orders` + `order_items`, seluruh blok berjalan atomik tanpa kondisi *race condition* overselling. Hal yang sama berlaku saat Admin membatalkan pesanan dan mengembalikan stok otomatis.

2. **Tabel Inti yang Disarankan:**
   - `categories` (`id`, `slug`, `name`, `sort_order`)
   - `products` (`id`, `sku`, `slug`, `name`, `category_id`, `price_idr`, `weight_grams`, `stock_qty`, `low_stock_threshold`, `is_featured`, `is_active`, `requires_age_18`, `shipping_class` ['ground_cargo' | 'standard'], `specs_json`, `description`, `created_at`, `updated_at`)
   - `products_fts` (`VIRTUAL TABLE USING fts5(name, sku, description, specs_text, content='products', content_rowid='id')` dengan trigger `AFTER INSERT/UPDATE/DELETE`)
   - `product_media` (`id`, `product_id`, `media_type` ['image' | 'video'], `url`, `poster_url`, `alt_text`, `duration_sec`, `is_primary`, `sort_order`)
   - `vouchers` (`id`, `code`, `discount_type` ['percent' | 'fixed'], `discount_value`, `min_subtotal_idr`, `max_uses`, `used_count`, `expires_at`, `is_active`)
   - `orders` (`id`, `invoice_number`, `customer_name`, `customer_phone`, `customer_email`, `shipping_address`, `shipping_city`, `shipping_method`, `shipping_cost_idr`, `subtotal_idr`, `discount_idr`, `total_idr`, `voucher_code`, `age_18_confirmed`, `sport_use_declaration`, `status`, `tracking_number`, `notes`, `created_at`, `updated_at`)
   - `order_items` (`id`, `order_id`, `product_id`, `sku_snapshot`, `name_snapshot`, `unit_price_idr`, `quantity`, `line_total_idr`)
   - `inventory_mutations` (`id`, `product_id`, `delta_qty`, `stock_after`, `reason` ['checkout' | 'cancel_restock' | 'manual_restock' | 'audit_adjust'], `reference_id`, `actor`, `created_at`)
   - `site_settings` (`key PRIMARY KEY`, `value_json`, `updated_at`) -> menyimpan URL hero video aktif, status mute/loop default, dan token versi `?v=<ts>` untuk cache-busting.
   - `admin_users` (`id`, `username`, `password_hash`, `role`, `created_at`) & `admin_sessions` (`token_hash PRIMARY KEY`, `admin_id`, `expires_at`, `created_at`).

3. **Keamanan & Layanan Streaming Media:**
   - Password admin disimpan dengan format `scrypt$<saltHex>$<derivedKeyHex>` memakai `crypto.scryptSync(password, salt, 64)` dan dicek dengan `crypto.timingSafeEqual`.
   - Cookie sesi menggunakan `HttpOnly; SameSite=Lax; Path=/` (plus `Secure` saat `NODE_ENV=production` di balik HTTPS), dengan token mentah 32-byte yang hanya disimpan versi SHA-256 hash-nya di tabel `admin_sessions`.
   - Upload Admin via `multer.diskStorage` ke `storage/uploads/` memakai nama file UUID + ekstensi allowlist (`.jpg`, `.jpeg`, `.png`, `.webp`, `.mp4`, `.webm`), batas ukuran (gambar maks 8 MB, video maks 40 MB), dan pengecekan *magic bytes* header berkas (`ftyp` untuk MP4, `RIFF..WEBP` untuk WebP, `\x89PNG`, `\xFF\xD8\xFF`).
   - Static serving di Express 5:
     ```ts
     app.use('/media', express.static(path.resolve('public/media'), {
       acceptRanges: true,
       maxAge: '1h',
       setHeaders(res, filePath) {
         if (filePath.endsWith('.mp4')) res.setHeader('Content-Type', 'video/mp4');
       }
     }));
     app.use('/uploads', express.static(path.resolve('storage/uploads'), {
       acceptRanges: true,
       maxAge: '1h'
     }));
     ```

---

## 3. Desain Pipeline Cinematic Tactical Video Renderer (Python)

Pipeline ini bertugas mengubah keyframe gambar taktis beresolusi tinggi hasil subagent `image-generator` menjadi video `.mp4` (H.264 `yuv420p`) yang benar-benar terasa disutradarai oleh sinematografer, bukan slideshow gambar statis yang kaku.

### 3.1 Prinsip Arsitektur Pipeline (Zero Disk Bloat & Deterministik)

```text
[9-10 High-Res Keyframes >= 2560x1440] + [video_manifest.json]
                     |
                     v
   +----------------------------------------------------+
   |  Python Renderer (PIL 12.2 + NumPy 2.5 + stdlib)   |
   |  [Opsional: cv2 fast-path jika opencv terpasang]   |
   |  1. Overscan Loader & Pre-Normalizer               |
   |  2. Per-Frame Subpixel Camera Rig (Affine Bicubic) |
   |  3. Handheld Shake + Recoil + Muzzle/Tracer Flash  |
   |  4. Transition Engine (Whip-Pan / Rack-Focus)      |
   |  5. Tactical 3-Way LUT + Vignette + 35mm Grain     |
   +-------------------------+--------------------------+
                             |
              Raw RGB24 byte stream via stdin pipe
              (0 temp PNG di disk, paralel 8 worker)
                             |
                             v
   +----------------------------------------------------+
   |  Static ffmpeg binary (imageio_ffmpeg.get_ffmpeg_exe)
   |  + Optional Procedural Audio WAV (48kHz Stereo)    |
   |  -> libx264 High@L4.1 yuv420p +faststart + AAC     |
   +-------------------------+--------------------------+
                             |
                             v
    public/media/videos/hero-tactical-reel.mp4 (~8-11 MB)
    public/media/videos/hero-tactical-poster.jpg (<120 KB)
    public/media/videos/product-*.mp4 (6 file, @ 1.2-2.2 MB)
    public/media/videos/product-*-poster.jpg (6 file)
```

**Syarat Overscan Resolusi Keyframe (Wajib Disepakati dengan `image-generator`):**
- Keyframe untuk Hero 1080p (`1920x1080`) idealnya beresolusi minimal **`2048x1152`** atau **`2560x1440`** (16:9). Jika generator mengeluarkan 16:9 di sekitar `1344x768` atau `1408x768`, pipeline melakukan pre-upscale halus sekali di awal menggunakan `Image.Resampling.LANCZOS` + *unsharp mask* ringan (`radius=1.2, percent=85, threshold=3`) ke kanvas overscan `2400x1350` sebelum transformasi kamera agar gerak dolly/pan hingga `1.22x` tetap tajam tanpa batas tepi hitam.
- Semua koordinat fokus (`roi_center`) dan titik flash (`muzzle_xy`) ditulis dalam **koordinat ternormalisasi `[0.0 .. 1.0]`** di `video_manifest.json`, sehingga independen terhadap resolusi input aktual gambar.

---

### 3.2 Cetak Biru (a): Hero Tactical Video (`hero-tactical-reel.mp4`)

- **Durasi Total:** **24.0 detik** (720 frame @ **30 fps**, patuh ketat `<= 30 detik`).
- **Jumlah Scene:** **10 scene taktis** dengan durasi tiap scene **2.2 - 2.8 detik** (tepat di rentang target `2.0 - 2.8 detik`), bervariasi ritmenya (cepat-lambat-cepat) agar terasa seperti *commercial tactical action reel*.
- **Output Video Spec:** `1920x1080`, `30 fps`, H.264 (`libx264 -profile:v high -level 4.1 -pix_fmt yuv420p -preset medium -crf 20 -maxrate 4500k -bufsize 9000k -movflags +faststart`), audio AAC `128 kbps / 48 kHz / stereo`, estimasi ukuran file **8 - 11 MB**.

#### Shot List & Koreografi Kamera 10 Scene (Total Tepat 24.0 Detik = 720 Frame)

| Scene | Timecode | Durasi (Frame) | Subjek Keyframe (dari `image-generator`) | Gerakan Kamera Utama | Efek Sinematik Khusus | Transisi Keluar (Durasi) |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- |
| **01** | `00:00.0 - 00:02.4` | **2.4s** (72f) | Pendekatan tim CQB di koridor gudang berkabut senja | **Dynamic Push-In Dolly** (`scale 1.04 -> 1.18`, cubic-out) + micro-breath | Fade-in `0.35s` dari `#090B0E`, cool steel haze | **Whip-Pan Right Cut** (6f / 0.20s) |
| **02** | `00:02.4 - 00:04.6` | **2.2s** (66f) | Operator membidik dengan MK18/M4 AEG CNC + LPVO + PEQ-15 | **Handheld Tactical Shake + Micro Push-In** (`1.08 -> 1.16`, jitter `+/- 5px`, roll `+/- 0.4 deg`) | Glint tipis di lensa optik | **Rack-Focus Blur Cut** (8f / 0.27s) |
| **03** | `00:04.6 - 00:07.2` | **2.6s** (78f) | Makro CNC 6061-T6 receiver, handguard M-LOK, dan bolt detail | **Horizontal Tracking Pan** (kiri ke kanan, drift halus `scale 1.16` konstan) | Specular highlight sweep melintasi tekstur anodize logam | **Impact Amber Cut** (3f / 0.10s) |
| **04** | `00:07.2 - 00:09.4` | **2.2s** (66f) | Aksi dinamis CQB corner-pie dalam ruang sempit berdebu | **Aggressive Handheld Action Shake** + **Recoil Kick** | **2x Muzzle/Tracer Flash Pulse** pada `t+0.65s` & `t+1.35s` (amber radial bloom + recoil `dy +10px`, decay `80ms`) | **Whip-Pan Left Cut** (6f / 0.20s) |
| **05** | `00:09.4 - 00:11.8` | **2.4s** (72f) | Tactical Plate Carrier Cordura 500D MOLLE laser-cut & pouch | **Slow Tilt-Up Reveal + Dolly Pull-Back** (`scale 1.20 -> 1.06`, pan bawah ke atas) | Ritme napas (*breather shot*), edge rim-light kontras tinggi | **Rack-Focus Dissolve** (8f / 0.27s) |
| **06** | `00:11.8 - 00:14.4` | **2.6s** (78f) | Pergerakan squad malam dengan helm NVG & pencahayaan low-light | **Diagonal Tracking Pan + Breathing Handheld Drift** | Split-tone shadow slate-teal lembut + shimmer lensa NVG | **Whip-Pan Down Cut** (6f / 0.20s) |
| **07** | `00:14.4 - 00:16.6` | **2.2s** (66f) | Sidearm GBB Pistol quick-draw / detail slide dengan tactical gloves | **Punch-In Snap Zoom** (`scale 1.04 -> 1.22` cepat di `0.45s` pertama via `ease_out_expo`, lalu micro-drift) | Chromatic aberration `2px` sesaat pada puncak snap-zoom | **Hard Impact Cut** (4f / 0.13s) |
| **08** | `00:16.6 - 00:19.4` | **2.8s** (84f) | Sniper / DMR overwatch berperedam & bipod di elevasi terbuka | **Slow Telephoto Pan + Rack-Focus Pull** (mulai blur `sigma=3.2`, mengunci tajam pada `0.55s`) | Atmosfer depth-of-field telefoto 85mm | **Whip-Pan Right Cut** (6f / 0.20s) |
| **09** | `00:19.4 - 00:21.6` | **2.2s** (66f) | Meja armory / gear flatlay (unit utama, optik, helm, comms, mag) | **Overhead Drift Zoom-In + Subtle Roll** (`rot -1.2 deg -> +0.8 deg`, `scale 1.06 -> 1.17`) | Sapuan cahaya tungsten hangat halus | **Rack-Focus Dissolve** (8f / 0.27s) |
| **10** | `00:21.6 - 00:24.0` | **2.4s** (72f) | Siluet heroik unit & operator Brakasa di kabut lampu sorot amber | **Epic Pull-Back Dolly + Stabilized Horizon Lock** (`scale 1.22 -> 1.04`) | Bridge loop halus (fade gelap tipis `0.35s` di ujung agar loop kembali ke Scene 01 mulus) | **Seamless Loop to Scene 01** |

*Verifikasi durasi total: `2.4 + 2.2 + 2.6 + 2.2 + 2.4 + 2.6 + 2.2 + 2.8 + 2.2 + 2.4 = 24.0 detik` (720 frame @ 30 fps).*

---

### 3.3 Algoritma Efek Sinematik & Implementasi Matematis (PIL + NumPy)

Agar tidak ada artefak patah-patah (*integer crop jitter*) atau tampilan slideshow murahan, setiap modul efek dirancang secara deterministik:

#### 1. Subpixel Camera Rig (Anti-Jitter Affine Transform)
Jangan gunakan `img.crop((int(x0), int(y0), int(x1), int(y1)))` karena pergeseran piksel bulat menimbulkan efek *micro-stutter* pada pan lambat. Gunakan transformasi matriks affine balik (*inverse affine mapping*) subpixel:
- Untuk kanvas output `(W_out, H_out)` dan gambar sumber `(W_src, H_src)`, hitung matriks pemetaan piksel tujuan `(x_d, y_d)` ke koordinat sumber `(x_s, y_s)` berdasarkan `scale(t)`, `rot_rad(t)`, dan pan pusat `(cx(t), cy(t))`:
  ```python
  # Inverse affine coefficients (a, b, c, d, e, f) untuk PIL Image.transform
  inv_s = 1.0 / (scale * base_fit_scale)
  cos_r, sin_r = math.cos(-rot_rad), math.sin(-rot_rad)
  a = inv_s * cos_r
  b = -inv_s * sin_r
  d = inv_s * sin_r
  e = inv_s * cos_r
  cx_d, cy_d = W_out * 0.5, H_out * 0.5
  cx_s, cy_s = src_focus_x + pan_dx, src_focus_y + pan_dy
  c = cx_s - a * cx_d - b * cy_d
  f = cy_s - d * cx_d - e * cy_d
  frame = src_img.transform(
      (W_out, H_out),
      Image.Transform.AFFINE,
      (a, b, c, d, e, f),
      resample=Image.Resampling.BICUBIC,
  )
  ```
- Jika `opencv-python-headless` terpasang, jalur cepat `cv2.warpAffine(..., flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT_101)` menghasilkan output identik 5-8x lebih cepat.

#### 2. Handheld Tactical Camera Shake & Recoil Impulse
Gerakan bahu operator disimulasikan lewat penjumlahan 3 harmonik frekuensi non-kelipatan agar tidak terasa berulang:
```python
def handheld_shake(t: float, seed: float, amp_px: float = 5.0, amp_deg: float = 0.35):
    dx = amp_px * (
        0.55 * math.sin(2 * math.pi * 0.73 * t + seed)
        + 0.30 * math.sin(2 * math.pi * 2.17 * t + seed * 1.9)
        + 0.15 * math.sin(2 * math.pi * 5.41 * t + seed * 3.1)
    )
    dy = amp_px * (
        0.55 * math.cos(2 * math.pi * 0.61 * t + seed * 0.7)
        + 0.30 * math.sin(2 * math.pi * 1.89 * t + seed * 2.3)
        + 0.15 * math.cos(2 * math.pi * 4.93 * t + seed * 3.7)
    )
    rot = amp_deg * math.sin(2 * math.pi * 0.85 * t + seed * 1.3)
    return dx, dy, rot
```
Pada momen tembakan/muzzle flash (`t >= t_flash`), tambahkan impuls recoil teredam eksponensial:
`recoil = math.exp(-(t - t_flash) / 0.08)` -> `dy += 11.0 * recoil`, `scale += 0.016 * recoil`, `rot += 0.55 * recoil`.

#### 3. Engine Transisi Cepat (Whip-Pan & Rack-Focus)
- **Whip-Pan Cut (6 frame: 3 frame akhir Scene A + 3 frame awal Scene B):**
  - 3 frame keluar Scene A: geser arah pan secara kuadratik (`offset = sign * W * 0.28 * u^2`) dan terapkan *1D Directional Motion Blur* sepanjang sumbu gerak (`kernel_len = 25 -> 61 px`). Di pure NumPy, directional box blur 1D dihitung dalam waktu `O(N)` memakai `np.cumsum` pada sumbu X (horizontal) atau sumbu Y (vertikal), sehingga super cepat tanpa SciPy.
  - 3 frame masuk Scene B: masuk dari sisi berlawanan dengan deselerasi (`(1 - u)^2`) dan blur meluruh kembali ke `0`.
- **Rack-Focus Blur Transition (8 frame overlap/edge):**
  - Kurva lonceng Gaussian blur `sigma(u) = 14.0 * sin(pi * u)` menggunakan `PIL.ImageFilter.GaussianBlur(radius=sigma)` yang dikombinasikan dengan cross-dissolve `smoothstep(u)` dari Scene A ke Scene B, meniru fokus lensa telefoto yang berpindah bidang.

#### 4. Muzzle / Tracer Flash Pulse & Specular Light Sweep
- **Muzzle Flash Pulse (durasi 3 frame = 100ms, puncak di frame ke-1):**
  - Koordinat sumber `(mx, my)` dari manifest.
  - Buat mask radial Gaussian dua lapis:
    - Inti putih-hangat: `core = exp(-r^2 / (2 * (0.04 * W)^2))` warna `[1.0, 0.96, 0.88]`
    - Halo amber taktis: `halo = exp(-r^2 / (2 * (0.18 * W)^2))` warna `[1.0, 0.66, 0.24]`
  - Komposit secara **Screen / Additive clamped** (`frame + intensity * (0.95 * core + 0.55 * halo) + 0.07 * intensity`) agar cahaya juga memantul realistis ke baju/dinding di sekitar unit.
- **Specular Sweep (untuk Scene 03 makro CNC & Video Produk):**
  - Pita diagonal lembut `exp(-((x*cos(theta) + y*sin(theta) - pos(t))^2) / (2 * width^2))` dikalikan dengan *luminance mask* gambar sumber (`luma^1.8`) sehingga kilau hanya menyala di tepian logam/anodize dan tidak memutihkan area bayangan gelap.

#### 5. Finishing Sinematik Terpadu (Tactical Color Grade LUT, Vignette, Film Grain)
Diterapkan seragam pada seluruh 720 frame Hero agar 10 gambar generatif yang berbeda menyatu layaknya direkam dengan 1 kamera & 1 lensa yang sama:
- **3-Way Tactical Color Grade (NumPy vectorized `float32` `[0..1]`):**
  - S-Curve micro-contrast: `x = x + 0.07 * sin(2 * pi * x) * (-1)` (memperdalam bayangan obsidian & mengangkat mid-highlight tanpa clipping).
  - Desaturasi terkontrol (`sat = 0.86`) agar warna tidak berlebihan/neon.
  - Split-toning: Shadow (`(1 - luma)^2`) diberi tint cool gunmetal slate `[-0.015, +0.004, +0.022]`; Highlight (`luma^2`) diberi tint warm tactical amber `[+0.028, +0.012, -0.018]`.
- **Anamorphic Vignette + Edge Legibility Gradient:**
  - Mask elips precomputed sekali di awal: `vig = 1.0 - 0.36 * (r_elliptical ** 2.2)`.
  - Tambahan gradasi lembut 18% di sisi kiri-bawah agar teks Hero landing page selalu memiliki rasio kontras WCAG AA tanpa perlu blok kotak gelap murahan di CSS.
- **Subtle 35mm Film Grain (Anti-Banding H.264):**
  - Pre-generate pool 16 frame noise Gaussian (`sigma = 3.2 / 255.0`), diputar siklikal tiap frame. Efek ganda: memberi tekstur kamera film nyata sekaligus mencegah *color banding* kompresi H.264 pada kabut dan bayangan gelap.

---

### 3.4 Sintesis Audio Taktis Prosedural (Pure NumPy + `wave`) & Kebijakan Autoplay Web

Agar video Hero memiliki kedalaman sinematik saat pengunjung mengaktifkan suara (namun **100% bebas hak cipta** dan **nol ketergantungan aset audio eksternal**), renderer menyintesis berkas WAV `48000 Hz`, 16-bit, stereo (`hero-audio-tmp.wav`) yang tersinkronisasi persis hingga milidetik ke daftar timestamp 10 scene:

1. **Sub-Bass Tactical Drone (`0.0s - 24.0s`):**
   - Dua osilator sinus/segitiga ter-detune (`42 Hz` + `63.2 Hz`) dengan modulasi amplitudo lambat (`0.21 Hz`) di level `-18 dBFS`.
2. **Dark Room / Wind Ambience (`0.0s - 24.0s`):**
   - Noise acak yang dibentuk spektrumnya via FFT (`np.fft.rfft`) dengan kurva bandpass `240 Hz - 1650 Hz` (`1/f` slope) di level `-28 dBFS`, memberikan tekstur ruang udara taktis.
3. **Scene-Cut Percussive Sub-Impacts & Whip-Pan Whooshes:**
   - Pada setiap titik potong scene (`2.4s, 4.6s, 7.2s, 9.4s, 11.8s, 14.4s, 16.6s, 19.4s, 21.6s`):
     - Untuk **Whip-Pan Cut**: sintesis *whoosh* bandpass noise menyapu frekuensi `350 Hz -> 1800 Hz -> 300 Hz` selama `220ms` dengan stereo panning kiri-kanan mengikuti arah whip-pan.
     - Untuk **Impact / Rack-Focus Cut**: *sub-drop thump* (`105 Hz -> 34 Hz` pitch envelope, decay `190ms`) pada `-10 dBFS`.
4. **Muzzle / Mechanical Bolt Transient (tersinkron ke Scene 04: `7.85s` & `8.55s`):**
   - Impuls noise tajam `12ms` (high-pass `> 1200 Hz`) + nada mekanik bolt logam (`1420 Hz + 2860 Hz`, decay `40ms`) + punch rendah (`68 Hz`), di-mix halus di `-11 dBFS`.
5. **Mastering & Loop Safety:**
   - Soft limiter `np.tanh(mix * 1.15) * 0.88` (nol digital clipping), fade-in `0.30s` dan fade-out `0.40s` untuk loop mulus.

**Integrasi & Kontrol Pemutar Hero di Frontend:**
- Atribut wajib: `<video autoPlay muted loop playsInline preload="metadata" poster="/media/videos/hero-tactical-poster.jpg">` -> **selalu mulai dalam keadaan muted** agar 100% patuh terhadap kebijakan autoplay semua browser modern.
- Kontrol HUD taktis minimalis di sudut kanan bawah viewport Hero:
  - Tombol **Unmute / Mute** (toggle `videoRef.current.muted`) dengan label status jelas (`AUDIO OFF` / `AUDIO ON`).
  - Tombol **Pause / Play** eksplisit.
  - Indikator progres tipis (`2px`, warna aksen Signal Amber) yang menampilkan posisi putar dalam reel 24 detik.
- **Aksesibilitas `prefers-reduced-motion: reduce`:** Jika preferensi OS pengguna mengaktifkan *reduce motion*, komponen Hero secara otomatis tidak menjalankan autoplay dan menampilkan `hero-tactical-poster.jpg` beresolusi penuh dengan tombol Play manual.

---

### 3.5 Cetak Biru (b): 6 Video Demo Produk Store (`product-*.mp4`)

Untuk mengisi katalog store dan halaman Product Detail Page (PDP) dengan video produk nyata, pipeline yang sama merender **6 video produk unggulan** dari katalog utama Brakasa Tactical.

- **Spesifikasi Output Video Produk:**
  - Resolusi: **`1280x720`** (16:9), **`30 fps`**
  - Durasi: **6.5 - 8.5 detik** per produk (masuk tepat di rentang `6 - 9 detik`)
  - Codec: `libx264 -profile:v high -level 4.0 -pix_fmt yuv420p -preset medium -crf 21 -maxrate 2200k -bufsize 4400k -movflags +faststart`
  - Audio: **Hening (`-an`)** agar bobot tiap video tetap ringan (**1.2 - 2.2 MB**) dan siap untuk *hover-to-play preview* di kartu katalog.
  - Poster: setiap video otomatis menghasilkan `product-*-poster.jpg` (< 80 KB).

#### Daftar 6 Video Demo Produk & Koreografi 3-Beat Inspection

| File Output | Durasi | Produk / Kategori Target | Koreografi Kamera 3-Beat (Multi-Angle / Virtual Studio Jib) |
| :--- | :---: | :--- | :--- |
| `product-mk18-aeg.mp4` | **8.0s** | Primary Assault Rifle (MK18 / M4 CNC AEG) | Beat 1 (`0.0-2.6s`): Wide slow push-in profil penuh -> Beat 2 (`2.6-5.4s`): Rack-focus punch ke makro CNC receiver & magwell -> Beat 3 (`5.4-8.0s`): Horizontal tracking pan sepanjang M-LOK handguard & muzzle dengan specular sweep. |
| `product-mp7-gbb.mp4` | **7.5s** | Compact SMG / PDW (GBB CQB) | Beat 1 (`0.0-2.5s`): Establishing 3/4 dolly-in -> Beat 2 (`2.5-5.0s`): Tilt-down makro rail atas & bolt port -> Beat 3 (`5.0-7.5s`): Snap pan lipatan popor & grip depan. |
| `product-m24-sniper.mp4` | **8.5s** | Precision Bolt-Action Sniper / DMR | Beat 1 (`0.0-3.0s`): Pan horizontal lambat ujung suppressor ke popor -> Beat 2 (`3.0-5.8s`): Rack-focus pull makro turret optik & bolt handle -> Beat 3 (`5.8-8.5s`): Pull-back stabil menampilkan keseluruhan siluet chassis & bipod. |
| `product-hi-capa-gbb.mp4` | **6.5s** | Sidearm Tactical Pistol (GBB) | Beat 1 (`0.0-2.2s`): Hero tilt-up sudut 3/4 -> Beat 2 (`2.2-4.4s`): Makro serration CNC slide & fiber optic sight -> Beat 3 (`4.4-6.5s`): Pull-back ringan ke magwell & stippled grip. |
| `product-plate-carrier.mp4` | **7.5s** | Plate Carrier Cordura 500D MOLLE | Beat 1 (`0.0-2.5s`): Tilt-up lembut dari panel bawah ke bahu -> Beat 2 (`2.5-5.0s`): Zoom makro jahitan laser-cut MOLLE & buckle quick-release -> Beat 3 (`5.0-7.5s`): Horizontal drift cummerbund dengan rim-light studio. |
| `product-lpvo-optic.mp4` | **7.0s** | Optics & Aiming (1-6x LPVO Tactical Scope) | Beat 1 (`0.0-2.4s`): Wide dolly-in tabung optik & cantilever mount -> Beat 2 (`2.4-4.7s`): Makro knurling turret elevasi/windage -> Beat 3 (`4.7-7.0s`): Sapuan glint anti-reflektif pada lensa objektif. |

#### Dua Mode Input Fleksibel di `video_manifest.json`
1. **Multi-Keyframe Mode (2-3 gambar sudut berbeda per produk):** Setiap beat menggunakan gambar sudut berbeda (mis. wide shot, close-up receiver, angle 3/4) yang dihubungkan lewat rack-focus dissolve `0.25s`.
2. **Single High-Res Master Mode (1 gambar studio master >= 2048px per produk):** Jika hanya 1 gambar resolusi tinggi yang tersedia untuk produk tersebut, renderer otomatis memetakan Beat 1 (full framing), Beat 2 (macro ROI zoom `1.55x` ke area mekanisme utama), dan Beat 3 (macro horizontal pan melintasi ROI sekunder) secara subpixel dengan transisi rack-focus `0.25s`. Dengan cara ini, seluruh 6 video produk dijamin selalu tampil dinamis dan informatif.

#### Integrasi UX Video Produk di Storefront & PDP
- **Kartu Katalog (Storefront Grid):** Render `<img>` thumbnail/poster secara default (hemat bandwidth 100%). Saat kursor desktop *hover* (dengan debounce `180ms`) atau fokus keyboard pada produk yang memiliki video, `<video muted loop playsInline>` melakukan lazy-mount dan memutar preview mulus di dalam frame kartu (dengan badge teknis kecil `VIDEO`).
- **Halaman Detail Produk (PDP):** Galeri media menampilkan thumbnail video bersama foto-foto produk; pengguna dapat memilih tab/slide video lengkap dengan kontrol Play/Pause dan loop mulus.

---

### 3.6 Perintah Encoding `ffmpeg`, Estimasi Waktu Render, & Skrip Verifikasi QA

#### Perintah Pipe `ffmpeg` di dalam `render_videos.py`
```python
import imageio_ffmpeg
import subprocess

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

cmd = [
    ffmpeg_exe, "-y",
    "-f", "rawvideo",
    "-vcodec", "rawvideo",
    "-pix_fmt", "rgb24",
    "-s", f"{width}x{height}",
    "-r", str(fps),
    "-i", "-",                        # stdin raw RGB24 frames
]
if audio_wav_path:
    cmd += ["-i", str(audio_wav_path)]

cmd += [
    "-c:v", "libx264",
    "-profile:v", "high",
    "-level", "4.1",
    "-pix_fmt", "yuv420p",
    "-preset", "medium",
    "-crf", str(crf),                 # 20 untuk Hero, 21 untuk Product
    "-maxrate", maxrate,              # "4500k" Hero, "2200k" Product
    "-bufsize", bufsize,              # "9000k" Hero, "4400k" Product
    "-movflags", "+faststart",
]
if audio_wav_path:
    cmd += ["-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2", "-shortest"]
else:
    cmd += ["-an"]

cmd += [str(output_mp4_path)]
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
```

#### Estimasi Kinerja Render pada Host Target (12 Core CPU, 16 GB RAM)
- **Hero Video (`hero-tactical-reel.mp4`, 720 frame @ 1920x1080):**
  - Mode `PIL + NumPy` paralel (8 thread): ~20 - 35 detik.
  - Mode akselerasi `opencv-python-headless`: ~8 - 14 detik.
- **6 Video Produk (`product-*.mp4`, total ~1,350 frame @ 1280x720):**
  - Mode `PIL + NumPy` paralel: ~18 - 30 detik total.
  - Mode akselerasi `opencv-python-headless`: ~8 - 15 detik total.
- **Total waktu produksi penuh semua 7 video nyata + 7 poster:** **< 65 detik** (1 perintah `python scripts/media/render_videos.py --all`).

#### Checklist Verifikasi Otomatis (`scripts/media/verify_videos.py`)
Setelah rendering selesai, skrip QA wajib memeriksa setiap file `.mp4` memakai `imageio_ffmpeg.count_frames_and_secs()` dan parsing metadata `ffmpeg -i`:
1. **Hero Video:** codec `h264`, pixel format `yuv420p`, resolusi `1920x1080`, durasi tepat `23.5 - 24.5s` (`<= 30s`), terdapat stream audio `aac 48000 Hz`, atom `moov` di awal file (`+faststart`), ukuran file `<= 12 MB`.
2. **6 Video Produk:** codec `h264`, pixel format `yuv420p`, resolusi `1280x720`, durasi tiap file `6.0 - 9.0s`, tanpa audio (`-an`), ukuran file `<= 2.5 MB` per video.
3. **Poster Frames:** 7 berkas `*-poster.jpg` valid, non-zero, masing-masing `< 150 KB`.
4. **Uji HTTP Range Streaming di Server Express:**
   ```powershell
   curl.exe -s -D - -o NUL -H "Range: bytes=0-1023" http://localhost:3000/media/videos/hero-tactical-reel.mp4
   ```
   Wajib mengembalikan status **`HTTP/1.1 206 Partial Content`**, header `Accept-Ranges: bytes`, dan `Content-Type: video/mp4`.

---

## 4. Ringkasan Keputusan Teknis untuk Tim Implementasi

1. **Runtime & Database:** Gunakan **Node v24.16.0** + **`node:sqlite` (`DatabaseSync`, SQLite 3.53.0)** dengan mode `WAL`, `JSON1`, `FTS5`, dan transaksi `BEGIN IMMEDIATE`. Jangan memasang `better-sqlite3` atau `bcrypt` karena mesin target tidak memiliki compiler C++ (`cl.exe`/`gcc`).
2. **Full-Stack Web:** Gunakan **Express 5 + Vite 8 + React 19 + TypeScript + Tailwind CSS v4** (satu repositori, satu perintah `npm run build && npm start` di port `3000`) untuk stabilitas maksimal di Windows, build instan, dan dukungan native HTTP `206 Partial Content` bagi video hero, video produk, dan upload runtime Admin.
3. **Video Pipeline:** Pasang **`python -m pip install --user imageio-ffmpeg`** (dan opsional `opencv-python-headless`), lalu jalankan `scripts/media/render_videos.py` berbasis `PIL` + `NumPy` + raw RGB24 pipe ke `ffmpeg` statis untuk menghasilkan `hero-tactical-reel.mp4` (24.0s, 10 scene @ 2.2-2.8s, kamera & FX sinematik + audio prosedural) dan 6 video `product-*.mp4` (6.5-8.5s) yang siap dipakai langsung oleh storefront.
