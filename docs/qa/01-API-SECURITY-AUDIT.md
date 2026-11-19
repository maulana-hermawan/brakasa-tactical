# 01 - Audit Keamanan, API, Media HTTP 206, Konkurensi & Code Hygiene (Brakasa Tactical)

**Auditor:** `qa-api-security` (Principal Adversarial Security, API & Code-Hygiene Verifier)
**Tanggal Audit:** 2026-11-19
**Target Pengujian:** Bundle produksi `dist/server/index.mjs` + `dist/client` pada `PORT=3088` dengan database SQLite terisolasi `storage/qa-api.db`
**Skrip Otomatis:** `tests/verify_api_security.mjs`
**Verdict Akhir:** **LULUS 100% (`58/58 PASS`, `0 FAIL`, `0 Broken Media`, `0 Open Findings`)**

---

## 1. Ringkasan Eksekutif

Audit menyeluruh dilakukan dalam dua tahap (Pass 1 menemukan 4 akar masalah backend/code-hygiene dengan skor `51/58`; setelah perbaikan oleh `@backend-engineer`, Pass 2 terverifikasi **58/58 PASS, 0 FAIL, 0 stderr error**):

1. **Static Security & Anti-Slop Scan (`12/12 PASS`)**: Seluruh 82 berkas kode sumber (`shared/`, `server/`, `src/`, `index.html`, `vite.config.ts`) bebas dari em dash (`U+2014`), en dash (`U+2013`), komentar dekoratif AI (`// ====`, `// ----`, emoji, narasi `Step N`), pola pill `rounded-full` / `rounded-2xl` (patuh `DESIGN.md` R-11), font default AI, sink DOM/eval berbahaya, dan interpolasi SQL tak aman.
2. **HTML Shell R-39 & R-40 (`7/7 PASS`)**: Seluruh rute uji (`/`, `/store`, `/store/tokyo-marui-mk18-mod1-mws-gbbr`, `/loadout-builder`, `/admin/login`) mengirim `<html lang="id">`, `<title>` unik per rute, header keamanan (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, tanpa `X-Powered-By`), serta `<img id="hero-lcp-poster" ... fetchpriority="high">` dan `<link rel="preload" as="image" ... fetchpriority="high">` secara eksklusif hanya pada `/`.
3. **Integritas Media & HTTP 206 Streaming (`3/3 PASS`)**: Semua **44 URL gambar & poster unik** dari `/api/bootstrap`, `/api/products`, dan ke-20 `/api/products/:slug` mengembalikan `200 OK` dengan ukuran > 0 byte. Seluruh **8 video MP4** (`hero-tactical-reel.mp4` + 7 video produk `product-*.mp4`) mengembalikan `206 Partial Content`, `Content-Type: video/mp4`, `Accept-Ranges: bytes`, dan payload tepat 1024 byte untuk header `Range: bytes=0-1023`.
4. **Loadout Compatibility Engine (`7/7 PASS`)**: Ketiga preset misi lulus dengan `0` konflik, `0` peringatan, serta kalkulasi harga IDR dan bobot gram eksak. Ketiga skenario konflik/MED (`BRK-AR-003` Mini Tamiya vs `BRK-CSM-003` Deans 11.1V; `BRK-SNP-001` M24x1 CW vs `BRK-UPG-001` 14mm CCW; Primary > 400 FPS tanpa Sidearm) terpicu sesuai spesifikasi.
5. **Atomic Checkout, 18+, Kargo, Voucher, Order Lookup & Race Condition (`10/10 PASS`)**: Pembeli usia < 18 tahun (termasuk batas tepat 1 hari sebelum ulang tahun ke-18) ditolak `422 AGE_VERIFICATION_FAILED`; kurir reguler ditolak `400` untuk `CARGO_REPLICA`, `CARGO_GAS`, dan `CARGO_BATTERY`; kupon `BRAKASA10`, `CQBREADY`, dan `KARGOFREE` tervalidasi akurat; uji **5 checkout paralel** pada `BRK-AR-001` (stok awal `2`) meloloskan tepat **2** pesanan (`201`) dan menolak **3** sisanya (`409 OUT_OF_STOCK`) dengan stok akhir `0` (tidak pernah negatif).
6. **Admin Auth, CSRF, CRUD, Upload Magic-Bytes, State Machine & Idempotent Cancel (`19/19 PASS`)**: Seluruh 8 endpoint `/api/admin/*` menolak akses tanpa sesi (`401`), cookie sesi menggunakan `HttpOnly` + `SameSite=Lax`, serangan CSRF cross-origin (`Origin` & `Referer`) ditolak `403`, unggahan `.jpg` palsu berisi `"not-an-image"` ditolak `400 INVALID_MEDIA_SIGNATURE` tanpa kebocoran file sementara, KPI `/api/admin/dashboard` cocok 100% dengan transaksi di DB uji, transisi `PAID_VERIFIED -> PACKED -> SHIPPED` wajib nomor resi (`JTR-88990011`), dan pembatalan ganda (`CANCELLED` 2x) bersifat idempoten dengan restock tepat 1x tercatat di `inventory_mutations`.

---

## 2. Log Temuan & Verifikasi Perbaikan (Pass 1 -> Pass 2)

Keempat temuan keamanan & code-hygiene berikut ditemukan pada Pass 1 (dilaporkan pada board `#36`), diperbaiki oleh `@backend-engineer` (`#37`), dan diverifikasi tuntas pada Pass 2:

| ID | Keparahan | Berkas Terdampak | Temuan Pass 1 (Bukti Empiris) | Perbaikan & Hasil Verifikasi Pass 2 |
| :--- | :---: | :--- | :--- | :--- |
| **AUD-01** | MEDIUM | `shared/types.ts` | Terdapat 7 blok banner komentar dekoratif `// ============` + label ALL CAPS (14 baris) yang melanggar `antislop-code` R-31. | Diganti komentar plain 1 baris sentence-case tanpa mengubah kontrak tipe. Static scan: **0 hit (PASS)**. |
| **AUD-02** | MEDIUM | `server/middleware/auth.ts:29`, `server/middleware/htmlShell.ts:50` | `decodeURIComponent()` tidak dibungkus `try/catch`; request `GET /store/%E0%A4%A` dan header `Cookie: brakasa_admin_session=%E0%A4%A` memicu uncaught `URIError` dan respons `HTTP 500`. | Keduanya dibungkus `try/catch`. Runtime Pass 2: `/store/%E0%A4%A` -> `HTTP 200` fallback, cookie malformed -> `HTTP 401`, 0 stderr error (**PASS**). |
| **AUD-03** | MEDIUM | `server/middleware/rateLimit.ts`, `server/index.ts` | `createRateLimiter` memparsing leftmost `req.headers['x-forwarded-for']` secara langsung dan `trust proxy` selalu aktif; 16 request ke `POST /api/orders/lookup` dengan `X-Forwarded-For` berputar lolos seluruhnya tanpa `429`. | Parsing manual `x-forwarded-for` dihapus (pakai `req.ip \|\| req.socket.remoteAddress`) dan `trust proxy` hanya aktif bila `TRUST_PROXY=1`. Runtime Pass 2: request ke-16 diblokir `429 RATE_LIMITED` (**PASS**). |
| **AUD-04** | MEDIUM | `server/routes/adminSettings.ts`, `server/routes/adminProducts.ts` | `PUT /api/admin/settings` mengizinkan `heroConfig.primaryCtaUrl: "javascript:alert(1)"` dengan status `200`. | Validasi `isSafeNavigationOrAssetUrl` diterapkan (hanya `/` non-`//` atau `http(s)://` tanpa control chars) pada seluruh field URL settings & media produk. Runtime Pass 2: `javascript:alert(1)` ditolak `400` (**PASS**). |

---

## 3. Matriks Hasil Static Code, Security & Anti-Slop Scan (`12/12 PASS`)

| # | Pemeriksaan Statis | Status | Bukti Hasil |
| :---: | :--- | :---: | :--- |
| 1 | Nol em dash (`U+2014`) & en dash (`U+2013`) di kode/UI copy | **PASS** | 82 file dipindai (`shared/`, `server/`, `src/`, `index.html`, `vite.config.ts`): 0 hit |
| 2 | Nol komentar dekoratif AI (`// ====`, `// ----`, emoji, `Step N`) | **PASS** | 0 hit setelah pembersihan `shared/types.ts` |
| 3 | Nol pelanggaran pill `rounded-full` / `rounded-2xl` / `9999px` (`DESIGN.md` R-11) | **PASS** | 0 hit; radius terkunci pada `0px`, `2px`, `4px`, `6px` |
| 4 | Tidak ada `outline: none` tanpa proteksi `:focus-visible` | **PASS** | `src/styles/global.css:97` menerapkan `:focus-visible` `2px solid var(--focus-ring)`; `main:focus` hanya untuk target programmatic skip-link (`tabIndex={-1}`) |
| 5 | Nol sink berbahaya (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`) | **PASS** | 0 hit di seluruh kode sumber |
| 6 | Nol font default AI (`Inter`, `Geist`, `Space Grotesk`, `JetBrains Mono`, `Fira Code`) | **PASS** | Memakai `Barlow Condensed`, `IBM Plex Sans`, `IBM Plex Mono` |
| 7 | Nol animasi dekoratif slop (`animate-pulse`, `animate-bounce`, `animate-ping`) | **PASS** | 0 hit |
| 8 | Keamanan SQL: seluruh query memakai parameterized `?` | **PASS** | Semua `db.prepare` / `db.exec` terverifikasi aman; interpolasi template terbatas pada konstanta statis, placeholder `?`, dan `ORDER BY` hasil `switch` allowlist |
| 9 | Kriptografi autentikasi admin (`scryptSync` + `timingSafeEqual` + token 256-bit) | **PASS** | Terverifikasi di `server/services/authService.ts` (salt 16 byte, key 64 byte, SHA-256 session token hash di SQLite) |
| 10 | Pengamanan cookie & CSRF (`HttpOnly`, `SameSite=Lax`, validasi `Origin`/`Referer`) | **PASS** | Terverifikasi di `server/middleware/auth.ts` (`Secure` otomatis aktif saat produksi HTTPS) |
| 11 | Perlindungan `decodeURIComponent()` terhadap URI malformed | **PASS** | Seluruh pemanggilan di `server/` dibungkus `try/catch` |
| 12 | Rate limiter memakai `req.ip` terpercaya (tanpa header `X-Forwarded-For` raw) | **PASS** | Terverifikasi di `server/middleware/rateLimit.ts` & `server/index.ts` |

---

## 4. Matriks Hasil Pengujian Runtime End-to-End (`46/46 PASS`)

### 4.1 HTML Shell (R-39 & R-40) & Header Keamanan

| Rute | HTTP | `lang="id"` | `<title>` Terverifikasi | `hero-lcp-poster` + `preload` | Security Headers | Status |
| :--- | :---: | :---: | :--- | :---: | :---: | :---: |
| `/` | 200 | Ya | `Brakasa Tactical \| Unit Airsoft & Perlengkapan Taktis Presisi 18+` | **Ada (eksklusif)** | `nosniff`, `SAMEORIGIN`, no `X-Powered-By` | **PASS** |
| `/store` | 200 | Ya | `Katalog Unit & Gear \| Brakasa Tactical` | Tidak ada | `nosniff`, `SAMEORIGIN`, no `X-Powered-By` | **PASS** |
| `/store/tokyo-marui-mk18-mod1-mws-gbbr` | 200 | Ya | `Tokyo Marui MK18 Mod.1 MWS GBBR \| Brakasa Tactical` | Tidak ada | `nosniff`, `SAMEORIGIN`, no `X-Powered-By` | **PASS** |
| `/loadout-builder` | 200 | Ya | `Interactive Tactical Loadout Builder \| Brakasa Tactical` | Tidak ada | `nosniff`, `SAMEORIGIN`, no `X-Powered-By` | **PASS** |
| `/admin/login` | 200 | Ya | `Login Admin Operations \| Brakasa Tactical` | Tidak ada | `nosniff`, `SAMEORIGIN`, no `X-Powered-By` | **PASS** |
| `/store/%E0%A4%A` (adversarial) | 200 | Ya | Fallback aman tanpa crash `URIError` | Tidak ada | Aman | **PASS** |

### 4.2 Integritas Aset Media & HTTP 206 Streaming

| Kategori Aset | Jumlah Diuji | Kriteria Verifikasi | Hasil | Status |
| :--- | :---: | :--- | :--- | :---: |
| Gambar produk, detail, poster video, spotlight, & 10 keyframe hero | **44 URL unik** | `GET` -> `200 OK`, `Content-Type: image/*`, ukuran > 0 byte | 44/44 sukses, 0 broken URL | **PASS** |
| Hero reel (`/media/videos/hero-tactical-reel.mp4`) + 7 video produk (`product-*.mp4`) | **8 video MP4** | `GET` + `Range: bytes=0-1023` -> `206 Partial Content`, `Content-Type: video/mp4`, `Accept-Ranges: bytes`, `Content-Range: bytes 0-1023/*`, panjang tepat 1024 byte | 8/8 sukses, 0 broken video | **PASS** |

### 4.3 Interactive 5-Slot Loadout Compatibility Engine (`POST /api/loadout/evaluate`)

| Skenario Uji | Status Evaluasi | Konflik / Peringatan | Harga Total (IDR) | Berat Total (g) | Hasil |
| :--- | :---: | :---: | ---: | ---: | :---: |
| Preset `cqb-speed-breacher` | `COMPATIBLE` | 0 / 0 | 13.660.000 | 4.562 | **PASS** |
| Preset `woodland-recce-marksman` | `COMPATIBLE` | 0 / 0 | 28.400.000 | 8.100 | **PASS** |
| Preset `gbb-realism-kit` | `COMPATIBLE` | 0 / 0 | 30.300.000 | 8.205 | **PASS** |
| `BRK-AR-003` (Mini Tamiya) + `BRK-CSM-003` (Deans 11.1V) | `CONFLICT` | `AK74M_CONNECTOR_VOLTAGE_CONFLICT` | Terhitung eksak | Terhitung eksak | **PASS** |
| `BRK-SNP-001` (M24x1 CW) + `BRK-UPG-001` (14mm CCW) | `CONFLICT` | `MUZZLE_M24_CONFLICT` | Terhitung eksak | Terhitung eksak | **PASS** |
| `BRK-SNP-001` (> 400 FPS) tanpa Sidearm | `WARNING` / `CONFLICT` | `MED_OVER_400_NO_SIDEARM` (`WARNING`) | Terhitung eksak | Terhitung eksak | **PASS** |

### 4.4 Checkout Atomik, Verifikasi 18+, Kargo, Voucher, Lookup & Konkurensi

| Skenario Uji | Bukti Respons Runtime | Status |
| :--- | :--- | :---: |
| Pembeli usia 17 tahun (`2009-11-19`) & 1 hari menjelang 18 tahun (`2008-11-20`) pada replika | Keduanya ditolak `422 AGE_VERIFICATION_FAILED` | **PASS** |
| Tolak ekspedisi reguler/tidak sesuai: `CARGO_REPLICA` (`JNE_REG`, `SICEPAT_REG`), `CARGO_GAS` (`JNE_REG`, `JNE_TRUCKING`), `CARGO_BATTERY` (`SICEPAT_REG`) | Seluruh 5 kombinasi ditolak `400 COURIER_RESTRICTED_FOR_SHIPPING_CLASS` | **PASS** |
| Validasi kupon `BRAKASA10`, `CQBREADY`, `KARGOFREE` | `BRAKASA10` tolak < 2 jt & cap `500.000`; `CQBREADY` potong `250.000`; `KARGOFREE` cap ke ongkir (`80.000`) / maks `150.000` & tolak pickup (`0`) | **PASS** |
| Checkout valid `BRK-AR-002` + `JNE_TRUCKING` (`JAWA`) + `woodenPacking` + `BRAKASA10` | `201 Created`, `totalIdr = 7.490.000` (`7.850.000 - 500.000 + 65.000 + 75.000`), stok `9 -> 8` | **PASS** |
| Guest Order Lookup (`POST /api/orders/lookup`) | Email case-insensitive `200`, HP ternormalisasi (`+62` vs `08`) `200`, kontak salah `404 ORDER_NOT_FOUND` | **PASS** |
| **Race Condition 5 checkout paralel** pada `BRK-AR-001` (stok awal `2`) | Tepat **2** sukses (`201`), **3** gagal (`409 OUT_OF_STOCK`), stok akhir tepat **`0`** (tidak pernah negatif) | **PASS** |

### 4.5 Admin Auth, Keamanan Lanjutan, Dashboard, Upload Magic-Bytes, CRUD & Order State Machine

| Skenario Uji | Bukti Respons Runtime | Status |
| :--- | :--- | :---: |
| Akses tanpa cookie pada 8 endpoint `/api/admin/*` | Seluruh 8 endpoint mengembalikan `401 UNAUTHORIZED` | **PASS** |
| Malformed `Cookie: brakasa_admin_session=%E0%A4%A` | Ditolak aman `401 UNAUTHORIZED` (0 error `500`) | **PASS** |
| Login kredensial salah vs valid (`admin` / `BrakasaArmory#2026`) | Salah -> `401 INVALID_CREDENTIALS`; Valid -> `200 OK` + `Set-Cookie: brakasa_admin_session=...; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400` | **PASS** |
| Proteksi CSRF lintas origin (`Origin` & `Referer` asing pada `POST /api/admin/*`) | Keduanya ditolak `403 CSRF_ORIGIN_MISMATCH` | **PASS** |
| Uji injeksi SQL & FTS5 pada `/api/products?q=...&sort=...` | Semua aman `200 OK`, tabel `products` utuh (20 SKU aktif) | **PASS** |
| Rekonsiliasi KPI `/api/admin/dashboard` terhadap transaksi DB uji | `totalOrdersCount=3/3`, `pendingPaymentRevenueIdr=40.620.000`, `confirmedRevenueIdr=0`, `outOfStockSkuCount=1` (100% akurat) | **PASS** |
| Upload Magic-Bytes (`POST /api/admin/media/upload`) | `.jpg` palsu (`"not-an-image"`) ditolak `400 INVALID_MEDIA_SIGNATURE`; `.svg` ditolak `400 INVALID_FILE_TYPE`; 0 temp file tersisa; JPEG valid sukses `201` dan dapat diunduh via `/uploads/<uuid>.jpg` | **PASS** |
| Admin CRUD Products, Vouchers, Inventory Adjust, Media Library & Settings | Products `POST 201 -> GET 200 -> PUT 200 -> DELETE hard_deleted -> GET 404`; Vouchers `POST 201 -> PATCH 200 -> DELETE 200`; Inventory tolak stok negatif `409` & catat mutasi; Media `53` aset; Settings `10` hero scenes & tolak `javascript:alert(1)` (`400`) | **PASS** |
| State Machine Order (`PAID_VERIFIED -> PACKED -> SHIPPED`) | Skip langsung `PENDING_PAYMENT -> SHIPPED` ditolak `409`; `PACKED -> SHIPPED` tanpa resi ditolak `400 TRACKING_NUMBER_REQUIRED`; dengan resi `JTR-88990011` sukses `200` & `confirmedRevenueIdr` dashboard bertambah tepat `7.490.000` | **PASS** |
| **Idempotent Cancel Restock** (`CANCELLED` 2x + ledger `inventory_mutations`) | Order `BRK-RIG-001` qty `2` (`stock: 10 -> 8`); `CANCELLED` tanpa alasan ditolak `400`; `CANCELLED` ke-1 sukses `200` (`restockedItemsCount=2`, stok `-> 10`); `CANCELLED` ke-2 ditolak `409 ORDER_ALREADY_CANCELLED` (stok tetap `10`); tercatat tepat `1` mutasi `ORDER_CANCEL_RESTOCK` di ledger | **PASS** |
| Ketahanan rate limiter terhadap spoofing header `X-Forwarded-For` | 16 request berturut-turut dengan `X-Forwarded-For` berbeda diblokir `429 RATE_LIMITED` pada request ke-16 | **PASS** |
| Admin Logout (`POST /api/admin/auth/logout`) | Sesi dicabut di SQLite; pemakaian ulang cookie lama pada `/api/admin/auth/me` mengembalikan `401` | **PASS** |

---

## 5. Analisis Pre-Mortem Adversarial (Ketahanan Produksi)

Sesuai kerangka `adversarial-reviewer`, berikut 3 skenario kegagalan produksi paling realistis dan status mitigasinya pada kode saat ini:

1. **Flash-Sale Overselling & Stok Negatif Saat Lonjakan Trafik Bersamaan**:
   - *Akar Risiko*: Beberapa permintaan checkout membaca `stock_qty` secara bersamaan lalu mengurangi stok tanpa penguncian atomik.
   - *Status Mitigasi*: **TERMITIGASI PENUH**. `createAtomicOrder` berjalan di dalam transaksi `BEGIN IMMEDIATE`, memakai `UPDATE products SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty >= ?`, dan dilindungi constraint SQLite `CHECK (stock_qty >= 0)`. Terbukti pada uji 5 checkout paralel di atas.
2. **Brute-Force Login Admin atau Enumerasi Invoice via Spoofing `X-Forwarded-For`**:
   - *Akar Risiko*: Rate limiter memori yang mempercayai header `X-Forwarded-For` mentah mudah ditembus skrip rotasi header.
   - *Status Mitigasi*: **TERMITIGASI PENUH** setelah perbaikan `AUD-03`. Rate limiter kini menggunakan `req.ip` terpercaya dan `trust proxy` nonaktif secara default (hanya diaktifkan melalui `TRUST_PROXY=1` saat di belakang reverse proxy yang sah). Catatan operasional: bila aplikasi dideploy multi-instance di masa depan, pindahkan store rate limiter dari `Map` memori ke store bersama (Redis/SQLite).
3. **Penyisipan Payload Berbahaya via Upload Media atau Pengaturan CTA Admin**:
   - *Akar Risiko*: Penyerang mengunggah skrip HTML/SVG berekstensi `.jpg` atau menyisipkan URL `javascript:` pada tautan CTA Hero.
   - *Status Mitigasi*: **TERMITIGASI PENUH**. Uploader memverifikasi allowlist ekstensi + signature magic-bytes biner (dan otomatis menghapus berkas sementara bila gagal), serta `adminSettings` dan `adminProducts` kini membatasi skema URL hanya pada path relatif `/` (bukan `//`) atau `http(s)://` (`AUD-04`).

---

## 6. Pembersihan Lingkungan Uji

Setelah verifikasi akhir selesai:
- Proses server sementara pada `PORT=3088` telah dimatikan bersih (`PORT 3088` bebas).
- Berkas database uji `storage/qa-api.db`, `storage/qa-api.db-wal`, dan `storage/qa-api.db-shm` telah dihapus.
- Berkas unggahan JPEG uji di `storage/uploads/` telah dihapus sehingga direktori kembali bersih tanpa residu.
