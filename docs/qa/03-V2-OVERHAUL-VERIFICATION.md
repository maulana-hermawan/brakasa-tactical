# 03-V2-OVERHAUL-VERIFICATION.md: Laporan Verifikasi Menyeluruh Brakasa Tactical V2 (Swarna Layout + ID/EN i18n + Anti-Slop Delivery Gate)

Laporan ini mencatat bukti empiris verifikasi penuh untuk perombakan **Brakasa Tactical V2** yang mencakup: Typecheck & Production Build, Audit Statis Keamanan & Anti-Slop, Uji Runtime API/Media/Konkurensi/Keamanan/Migrasi DB (`tests/verify_api_security.mjs`, `PORT=3088`), Uji Click-Through Browser Nyata Google Chrome via CDP (`tests/browser_clickthrough.mjs`, `PORT=3089`) lintas 3 breakpoint x 2 tema x 2 bahasa (`ID` / `EN`), serta **Anti-Slop Delivery Gate (Blocks 1, 2, 3, 4)**.

---

## 1. Ringkasan Eksekutif & Status Akhir

| Gerbang Verifikasi | Perintah / Skrip | Total Uji | Lulus | Gagal | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **TypeScript Typecheck** | `npm run typecheck` (`tsc --noEmit`) | 1 | 1 | 0 | **PASS** |
| **Production Build** | `npm run build` (Vite 6.4.6 + esbuild server bundle) | 1 | 1 | 0 | **PASS** |
| **Static Audit + V2 API + Security + Migration** | `node tests/verify_api_security.mjs` (`PORT=3088`, DB terisolasi `storage/qa-v2-api.db` & `storage/qa-v2-mig.db`) | 52 | 52 | 0 | **PASS** |
| **Real Chrome CDP Browser Click-Through V2** | `node tests/browser_clickthrough.mjs` (`PORT=3089`, DB terisolasi `storage/qa-v2-browser.db`) | 134 | 134 | 0 | **PASS** |
| **Anti-Slop Delivery Gate (Blocks 1-4)** | Audit gabungan R-01 s.d. R-40 + C-1 s.d. C-5 + Liveliness Dials | 4 Blok | 4 Blok | 0 | **PASS** |

- **Total Verifikasi Otomatis Lulus:** **186 / 186 (100% PASS)** (52 Static/API/Security/Migration + 134 Real Chrome CDP Browser Checks).
- **Kesehatan Runtime Browser:** `0 console.error`, `0 pageerror`, `0` respon HTTP `>= 400` pada seluruh endpoint first-party (`127.0.0.1:3089`).
- **Kebersihan Workspace:** Seluruh proses server QA (`3088`, `3089`, `3098`) dimatikan bersih dan seluruh berkas basis data uji sementara (`storage/qa-v2-api.db*`, `storage/qa-v2-mig.db*`, `storage/qa-v2-browser.db*`) serta unggahan uji sementara telah dihapus.

---

## 2. Siklus Temuan Cacat Pass 1 & Verifikasi Perbaikan Pass 2

Pada putaran verifikasi browser pertama, verifier menemukan 3 cacat nyata dan melaporkannya langsung ke author pemilik berkas (Swarm Board `#60`). Seluruhnya diperbaiki oleh pemilik track (`#61`, `#62`, `#63`), dibangun ulang, dan diverifikasi ulang lulus 100%:

| No | Pemilik Track | Cacat Ditemukan pada Pass 1 | Perbaikan Diterapkan | Bukti Verifikasi Pass 2 |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `v2-i18n-shell-lp` | Heading skip `h1 -> h3` di `/loadout-builder`, `/order-lookup`, `/compliance` (`NotFoundPage` hanya punya `<h1>`, diikuti `<h3>` kolom `Footer.tsx`); plus offset `heroRect.top = 1px` akibat `border-b` 1px pada `<header>`. | `Footer.tsx` mengubah 3 heading kolom ke `<h2>` dengan styling identik; `Navbar.tsx` menerapkan `box-border h-[56px] lg:h-[68px]` di `<header>` dan `h-full` di kontainer dalam (`#62`). | `skipped: null` di seluruh 3 rute 404; `heroRect.top === 0` di Desktop (`900/900`), Tablet (`1024/1024`), dan Mobile (`812/812`). |
| 2 | `v2-store-checkout` | Pada `375x812` mobile di PDP (`/store/tokyo-marui-mk18-mod1-mws-gbbr`), tautan breadcrumb `Katalog` terukur `41x44px` (`< 44px` lebar, melanggar R-03). | Menambahkan `min-w-[44px]` pada seluruh 3 `<Link>` breadcrumb di `ProductDetailPage.tsx` serta tombol singkat di `CheckoutPage.tsx` dan `ProductGallery.tsx` (`#61`). | `TapTarget` lulus 100% (`All interactive targets >= 44x44px`) di seluruh 10 rute publik & admin pada `375x812`. |
| 3 | `v2-admin` | Menyimpan judul slide Hero di `/admin/settings` lalu klik link SPA `Lihat Toko` (`<Link to="/">`) menampilkan judul Hero lama ter-cache di `BootstrapContext` sampai hard reload. | `AdminSettingsPage.tsx` memanggil `await reloadBootstrap()` dari `useBootstrap()` tepat setelah `PUT /api/admin/settings` sukses (`#63`). | Navigasi SPA ke `/` langsung menampilkan `BRAKASA LIVE HERO VERIFIED` (`spaNav === reload === "BRAKASA LIVE HERO VERIFIED"`). |

---

## 3. Hasil Audit Statis, API V2, Keamanan & Migrasi DB (`52/52 PASS`)

### 3.1 Build & Static Code Audit (`16/16 PASS`)
- `npm run typecheck`: exit code `0`, 0 error TypeScript di `shared/`, `server/`, `src/`.
- `npm run build`: exit code `0`, menghasilkan `dist/client/index.html` (`1.30 kB`), `dist/client/assets/index-*.css` (`67.64 kB`), `dist/client/assets/index-*.js` (`776.54 kB`), dan `dist/server/index.mjs` (`201.9 kb`).
- **Em dash (`\u2014`) & En dash (`\u2013`):** `0` temuan dari 77 berkas (`shared/`, `server/`, `src/`, `index.html`, `vite.config.ts`, `DESIGN.md`).
- **Anti-Pill Radius (`R-11`):** `0` kemunculan `rounded-full`, `rounded-2xl`, `rounded-3xl`, `9999px`, atau `border-radius: 50%` di 76 berkas kode.
- **Zero Micro-Prefix & Over-Description:** `0` kemunculan `SEC-01`, `SEC-06`, `OPS-01`, `CAT-01`, `INV-01`, `ORD-01`, `CFG-01`, `CFG-02`, `QUEUE-01`, `STOCK-02`, `METRIK-03`, `BLOK 01..04`, `[BRK //`, `[SCN-`, `spec-index-row`, `AUTH //`, `STATUS //`, `MANIFEST //`, `PARAM //`, `OVERVIEW //`, `SUMMARY //`, `PAYMENT //`, `LOGISTICS //`, `ORDER //`, `PROMO //`, `MEDIA //`, `KONFIRMASI //`.
- **Penghapusan Total 18+ / Perpol / 3 Fitur Usang:** `0` kemunculan teks UI `18+`, `Perpol`, `Loadout Builder`, `Cek Pesanan`, `/loadout-builder`, `/order-lookup`, `/compliance` di seluruh `src/`, `index.html`, `server/middleware/htmlShell.ts`, `server/routes/*`, `server/services/*`; seluruh 11 berkas V1 usang (termasuk `server/services/loadoutService.ts`, `LoadoutBuilderPage.tsx`, `OrderLookupPage.tsx`, `CompliancePage.tsx`, `ComplianceAgeSection.tsx`, `HeroVideoSection.tsx`) telah terhapus.
- **Dimensi Media Eksplisit (`R-40`):** `0` tag `<img>`, `<video>`, atau `<iframe>` tanpa atribut `width` dan `height` eksplisit.
- **Keamanan Kode Statis:** 0 komentar dekoratif AI, 0 `dangerouslySetInnerHTML`/`eval`/`new Function`, 0 font default AI, 0 animasi utilitas `animate-pulse`/`bounce`/`ping`, seluruh query SQL terparameterisasi (`?`), password admin `scryptSync` + `timingSafeEqual` + token 256-bit `randomBytes(32)`, cookie `HttpOnly` + `SameSite=Lax` + CSRF `Origin`/`Referer`, `decodeURIComponent` aman, dan rate limiter menggunakan `req.ip` terpercaya.

### 3.2 Runtime API V2, Media, Konkurensi, Keamanan & Migrasi (`36/36 PASS`)
- **HTML Shell V2 (5 rute diuji):** `/`, `/store`, `/store/tokyo-marui-mk18-mod1-mws-gbbr`, `/checkout`, `/admin/login` seluruhnya menghasilkan `200 OK`, `<html lang="id">` + inline sync `brakasa-lang`, 5/5 `<title>` unik bersih dari kata `18+`/`Perpol`/`Loadout Builder`, header keamanan (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, tanpa `X-Powered-By`), serta `#hero-lcp-poster` `fetchpriority="high"` + `<link rel="preload" as="image">` tepat di `/` saja. Malformed percent-encoding `/store/%E0%A4%A` ditangani tanpa 500.
- **`GET /api/bootstrap` V2:** Mengembalikan `5` `heroSlides` bilingual, `8` `featuredProducts`, `9` `categories` lengkap dengan `imageUrl`, serta `armoryProfile` dengan `announcementEnabled: false`, `mapsEmbedUrl` & `mapsDirectionsUrl` berprotokol `https://`.
- **Integritas Media & HTTP 206:** `38/38` aset gambar Hero/Kategori/Produk mengembalikan `200 OK` (`image/*`, > 0 byte); `7/7` video demo produk `.mp4` mengembalikan `206 Partial Content` (`Accept-Ranges: bytes`, `Content-Range: bytes 0-1023/...`).
- **Endpoint Dihapus (`404`):** `POST /api/loadout/evaluate` dan `POST /api/orders/lookup` keduanya mengembalikan `404 API_NOT_FOUND`.
- **Checkout V2 Tanpa 18+/Compliance + Aturan Kargo + Konkurensi:**
  - `POST /api/orders` untuk replika `BRK-AR-002` **tanpa field `compliance`/`buyerDob`** berhasil `201 Created` (`total=7490000` dengan `BRAKASA10` + `JNE_TRUCKING` + `woodenPacking`), menyetel `requiresAge18=false` & `buyerDob=null`, dan memotong stok secara atomik (`9 -> 8`).
  - Penolakan kurir udara/non-hazmat tetap ditegakkan (`400 COURIER_RESTRICTED_FOR_SHIPPING_CLASS`) untuk 5 kombinasi uji `CARGO_REPLICA`, `CARGO_GAS`, dan `CARGO_BATTERY`.
  - Voucher `BRAKASA10`, `CQBREADY`, dan `KARGOFREE` lulus seluruh aturan batas minimum, cap diskon, dan penolakan pickup.
  - Uji balapan paralel: `5` checkout serentak (tanpa `compliance`) pada `BRK-AR-001` (stok awal `2`) menghasilkan tepat `2` sukses (`201`) dan `3` ditolak (`409 OUT_OF_STOCK`), stok akhir `0`.
- **Keamanan Admin, Upload Magic-Bytes, Settings V2 & Rate Limit:**
  - `8/8` endpoint `/api/admin/*` mengembalikan `401` tanpa sesi; cookie cacat mengembalikan `401`; CSRF cross-origin `Origin` & `Referer` ditolak `403 CSRF_ORIGIN_MISMATCH`; payload SQLi/FTS5 aman (`20` produk utuh); KPI dashboard cocok 100% (`3` order, `Rp 40.620.000`).
  - Upload magic-bytes menolak `.jpg` palsu (`400 INVALID_MEDIA_SIGNATURE`) & `.svg` XSS (`400 INVALID_FILE_TYPE`) dengan `0` file bocor, serta menerima JPEG asli (`201`).
  - `PUT /api/admin/settings` menolak `javascript:` pada `heroSlides.ctaUrl` (`400`) dan non-HTTPS `http://` pada `mapsEmbedUrl` (`400`), lalu berhasil menyimpan `heroSlides` & `mapsEmbedUrl` baru yang langsung muncul di `GET /api/bootstrap`.
  - State machine pesanan menegakkan `PAID_VERIFIED -> PACKED -> SHIPPED` (menolak lompatan `409`, menolak resi kosong `400 TRACKING_NUMBER_REQUIRED`, log status bersih 0 istilah `18+`/`Perpol`/`chronograph`), pembatalan idempoten mengembalikan stok tepat 1x & menolak batal ganda `409`, logout mencabut sesi server-side (`401`), dan rate limiter `/api/admin/auth/login` memblokir `X-Forwarded-For` spoofing dengan `429 RATE_LIMITED`.
- **Migrasi Idempoten V2 (`seed.ts`):** Simulasi basis data legacy V1 (tanpa `v2_swarna_migrated` & `hero_slides`, dengan `announcementEnabled: true` dan `complianceNoticeShort` berisi `18+ Perpol`) otomatis ter-upgrade pada boot pertama (`announcementEnabled: false`, `complianceNoticeShort: ''`, 5 `heroSlides`, `mapsEmbedUrl` terisi) dan tidak menimpa kustomisasi judul Hero saat server di-restart ulang.

---

## 4. Bukti Click-Through Browser Nyata Chrome CDP (`R-35`, `134/134 PASS`)

Seluruh interaksi di bawah dieksekusi langsung di Google Chrome headless nyata (`C:\Program Files\Google\Chrome\Application\chrome.exe`) via Chrome DevTools Protocol terhadap build produksi `dist/` di `http://127.0.0.1:3089`:

### 4.1 Audit Hero V2 Full-Screen (`100dvh`) & 4 Seksi Landing Page (`/`)
- **Hero Geometri Full 1 Layar (`100dvh`):**
  - Desktop `1440x900`: `heroRect.height = 900px` (`innerHeight = 900px`, `diff = 0px`, `heroRect.top = 0px`), pagination dots di dalam Hero (`dotsIn = true`).
  - Tablet `768x1024`: `heroRect.height = 1024px` (`innerHeight = 1024px`, `diff = 0px`, `heroRect.top = 0px`), `dotsIn = true`.
  - Mobile `375x812`: `heroRect.height = 812px` (`innerHeight = 812px`, `diff = 0px`, `heroRect.top = 0px`), `dotsIn = true`.
- **Hero Kebersihan & Slide Statis:** `0` `<video>`, `5` `<img>` statis tajam (`animOrScale = false`), `0` tombol Jeda/Suara, `0` eyebrow di atas `<h1>`, `0` daftar scene `[SCN-`, `1` CTA primer, `#hero-lcp-poster` `2400x1350` `fetchpriority="high"` loaded, `.navbar-hero-overlay` aktif di `y = 0`.
- **Hero Pagination Dots Click-Through:** Klik Dot 2 -> `aria-selected="true"`, H1 = `"SISTEM RIG & PROTEKSI"`; Klik Dot 4 -> H1 = `"PERFORMA RINGKAS CQB"`; Klik Dot 1 -> H1 = `"PRESISI ARMORY LAPANGAN"`.
- **Skip Link Keyboard:** `Tab` memfokuskan `a[href="#main-content"]` -> `Enter` memindahkan fokus ke `#main-content`.
- **Urutan Exact 4 Seksi + Footer 4 Kolom:** DOM `main` berurutan tepat `["hero-armory", "featured-products", "categories", "our-store"]` diikuti `<footer>` 4 kolom bersih (`footerClean = true`).
- **`#featured-products` Carousel:** Merender `8` kartu bersih (HANYA foto, nama produk, dan harga Rupiah; 0 SKU/badge 18+/FPS/tombol); klik panah Next menggeser `scrollLeft` `0 -> 987px`, klik Prev mengembalikan `987 -> 0px`.
- **`#categories` Grid (9 Kategori):** Merender `9` kartu bersih (HANYA foto ber-`width`/`height` + nama kategori); klik kartu `Optik & Bidik` mengarah ke `/store?category=optics-aiming` dengan H1 `"Optik & Bidik"` dan `3` kartu terfilter.
- **`#our-store` Showroom & Google Maps:** Menampilkan alamat `Jl. Kemang Raya No. 48`, WhatsApp `+62 812-8800-4418`, tautan arah `https://maps.google.com/...`, foto showroom, dan `<iframe>` Google Maps valid (`width="800"`, `height="450"`, `title="Peta lokasi showroom Brakasa Tactical"`).

### 4.2 Navigasi Swarna, Rute Dihapus (`404`) & Toggle Bahasa `ID / EN`
- **Desktop Dropdown `Kategori`:** Klik membuka panel 9 kategori -> tekan `Escape` menutup dropdown.
- **Search Modal:** Klik tombol Search membuka dialog pencarian -> tekan `Escape` menutup dialog.
- **Rute Dihapus (`/loadout-builder`, `/order-lookup`, `/compliance`):** Ketiganya merender `NotFoundPage` (`404`, `"Halaman Tidak Ditemukan"`) dengan hierarki heading valid (`skipped: null`) dan `0` tautan menuju 3 rute tersebut di seluruh DOM.
- **Toggle Bahasa `ID -> EN` & Persistensi Reload:**
  - Klik `EN` di Navbar -> `<html lang="en">`, `localStorage['brakasa-lang'] = "en"`, Navbar menjadi `"SHOP CATEGORIES FEATURED OUR STORE"`, Hero H1 `"FIELD ARMORY PRECISION"`, seksi `"Featured Products"`, `"Categories"` (termasuk `"Assault Rifle"`), `"Our Store"`, Footer `"All rights reserved"`.
  - Setelah `Page.reload()`: `<html lang="en">` dan `"FIELD ARMORY PRECISION"` tetap bertahan.
  - `/store` dalam `EN`: H1 `"Shop"`, `"20 products"`, filter `"Propulsion"` & `"In Stock Only"`.
  - PDP `/store/tokyo-marui-mk18-mod1-mws-gbbr` dalam `EN`: `"Add to Cart"`, deskripsi produk bahasa Inggris (`PRODUCT_EN_LOCALE`), `"Specifications"` & `"Propulsion"` dalam bahasa Inggris, `0` kata `18+`/`Perpol`/`Loadout`.
  - Klik `ID` di Navbar -> kembali `<html lang="id">`, `localStorage['brakasa-lang'] = "id"`, dan tombol `"Tambah ke Keranjang"`.

### 4.3 Alur Belanja E2E V2 (Store -> PDP -> Cart -> Checkout Tanpa 18+ -> Admin V2)
- **Storefront (`/store`):** Pencarian `"MK18"` menyaring ke `2` kartu; pencarian `"zzzznotfound"` menampilkan Empty State (`R-27`, `"Produk tidak ditemukan"`); klik `Reset` mengembalikan `12` kartu halaman pertama.
- **PDP (`/store/vfc-avalon-saber-carbine-mlok-aeg`):**
  - Klik `Perbesar` membuka modal Lightbox foto resolusi penuh -> `Escape` menutup Lightbox.
  - Klik tab `Video` memuat `/media/videos/product-brk-ar-002.mp4` (`1280x720`, `width="1280" height="720"`) -> klik Putar menjalankan video (`paused = false`) -> klik Jeda menghentikan video (`paused = true`).
  - Klik `Tambah ke Keranjang` -> klik `Buka Keranjang` membuka `CartDrawer` (`"Keranjang (1)"`, bebas `18+`/`MANIFEST`) -> klik `Checkout` menuju `/checkout`.
- **Checkout V2 Tanpa 18+ (`/checkout`):**
  - `0` input tanggal lahir / `18+` / `Perpol`; kurir udara (`JNE_REG`, `SICEPAT_REG`) terkunci (`disabled = true`) dan kargo darat aktif (`JNE_TRUCKING`).
  - Submit kosong memicu `8` peringatan validasi `[role="alert"]`.
  - Isi alamat lengkap + terapkan voucher `BRAKASA10` (diskon `Rp 500.000`) + submit -> menerbitkan Invoice `BRK-20261119-968A` bersih (0 `18+`, 0 tautan `/order-lookup`).
- **Admin Operations Center V2 (`/admin/login` -> `/admin/*`):**
  - `/admin/login` bersih tanpa `AUTH //` dengan toggle `ID / EN` & tema; login `admin` sukses masuk `/admin` dan pesanan `BRK-20261119-968A` tampil langsung di antrean Dashboard.
  - `OrderDetailDrawer` bersih (0 blok 18+/Perpol) -> transisi `PENDING_PAYMENT -> PAID_VERIFIED -> PACKED -> SHIPPED` (submit terkunci saat resi kosong, lalu diterima dengan resi `JTR-V2-778899`) -> `Escape` menutup drawer.
  - Toggle `ID / EN` di sidebar Admin mengubah `<html lang="en">`, navigasi sidebar (`Overview`, `Orders`, `Settings`), dan judul dashboard (`Action Queue` / `Metrics Summary`), lalu kembali ke `ID`.
  - `/admin/products` & `ProductEditorModal` bersih (0 checkbox `requiresAge18`, 0 `18+`/`CAT-01`) + `Escape` menutup modal; `/admin/inventory` dan `/admin/vouchers` tampil penuh tanpa prefix mikro.
  - `/admin/settings` merender tepat 3 tab V2 (`Profil Toko & Maps` dengan preview iframe Google Maps, `Hero Slider`, `Pengiriman & Inventori`). Mengubah judul slide 1 menjadi `"BRAKASA LIVE HERO VERIFIED"` -> simpan -> klik tautan SPA `Lihat Toko` (`<Link to="/">`) langsung menampilkan `"BRAKASA LIVE HERO VERIFIED"` di Hero baik saat navigasi SPA maupun setelah reload, lalu dikembalikan ke judul awal dengan bersih.

### 4.4 Matriks 3-Breakpoint x Dual-Theme x ID/EN & Mobile Drawers
- **10 Rute Diuji di `1440x900`, `768x1024`, dan `375x812` (`Dark ID`):** `/`, `/store`, `/store/tokyo-marui-mk18-mod1-mws-gbbr`, `/checkout`, `/admin`, `/admin/products`, `/admin/inventory`, `/admin/orders`, `/admin/vouchers`, `/admin/settings`:
  - **Horizontal Overflow:** `0px` pada seluruh `30/30` kombinasi rute x breakpoint.
  - **Semantik, Media, A11y & Kebersihan V2 (`1440x900`):** 10/10 rute memiliki tepat `1` `<h1>`, `0` skipped heading, `lang` sinkron, `<title>` unik, seluruh gambar/video/iframe ter-load dengan `width`/`height` & `alt`/`title`, `0` isu `cursor: pointer`, `0` kontrol tanpa nama aksesibel, `0` input tanpa label, `0` em/en dash, `0` teks `18+`/`Perpol`/prefix mikro, `0` link usang.
  - **Mobile Tap Target (`375x812`):** `10/10` rute lulus `>= 44x44px` pada seluruh elemen interaktif.
- **Mobile Drawers (`375x812`):** Public `"Menu"` (`#public-mobile-nav`), Store `"Filter"` (`#store-filter-sheet`), dan Admin `"Menu"` (`#admin-mobile-nav`) seluruhnya membuka drawer, menutup saat `Escape`, dan mengembalikan fokus ke tombol pemicu.
- **Dual-Theme Light (`Field Paper Light` `#F2EFE9`) + Bahasa `EN`:**
  - Pada `/`: body beralih ke `rgb(242, 239, 233)` sementara `.hero-armory` tetap terkunci gelap (`rgb(15, 17, 16)`, H1 `rgb(240, 239, 234)`).
  - Rute `/`, `/store`, `/checkout`, `/admin`, `/admin/settings` di `1440x900` dan `375x812` dalam mode `Light + EN` seluruhnya `0px` overflow dan ter-styling penuh.
- **200% Text Zoom (`WCAG 1.4.4`):** `/store` pada `375x812` dengan `html { font-size: 32px }` menghasilkan `overflowPx = 0`.

---

## 5. Anti-Slop Delivery Gate Report (Blocks 1, 2, 3, 4)

### Block 1: Hard Gate (Absolute, Semua Jawaban Harus NO -> PASS)

| Rule | Kriteria Hard Gate | Status | Bukti Empiris |
| :---: | :--- | :---: | :--- |
| **R-02** | Tidak ada em dash atau en dash di teks kode/UI/dokumen QA | **PASS** | Audit statis 77 berkas (`0` hit) + audit DOM ter-render 10 rute (`0` hit) + laporan ini (`0` hit). |
| **R-03** | Mobile responsif penuh: 0 horizontal overflow, tap target `>= 44px`, layout utuh | **PASS** | `0px` overflow pada 40 pengukuran (`1440`, `768`, `375` x Dark/Light x ID/EN), 10/10 rute `>= 44x44px` di `375x812`, `0px` overflow pada 200% text zoom. |
| **R-17** | Tidak ada angka/statistik palsu tanpa sumber nyata | **PASS** | Seluruh angka produk (`20`), stok, harga, dan KPI Dashboard berasal langsung dari query SQLite terverifikasi. |
| **R-18** | Tidak ada testimoni/review fiktif atau avatar AI | **PASS** | Nol bagian testimoni rekaan di seluruh aplikasi. |
| **R-23** | Tidak ada aset/logo maskot/profil fiktif tanpa instruksi | **PASS** | Menggunakan wordmark tipografi resmi `BRAKASA // TACTICAL` dan aset media produk/hero lokal terverifikasi (`38` gambar + `7` video). |
| **R-24** | Tidak ada link navbar/footer mengarah ke rute/seksi mati | **PASS** | Seluruh link menuju `/`, `/store`, `/store?category=...`, `#featured-products`, `#categories`, `#our-store`, `/admin/login` eksis; `0` link ke `/loadout-builder`, `/order-lookup`, `/compliance`. |
| **R-25** | Seluruh teks memenuhi standar kontras WCAG AA (`>= 4.5:1` / `>= 3:1`) | **PASS** | Token warna dual-theme `DESIGN.md` tidak diubah (`>= 5.10:1` body/muted, `>= 6.12:1` aksen, `>= 9.65:1` Hero scrim terkunci gelap di kedua tema). |
| **R-26** | Seluruh tombol, dropdown, form, modal memiliki aksi nyata | **PASS** | Seluruh tombol/link/dropdown/modal/tab/slider/form diuji klik satu per satu di Chrome CDP dan menghasilkan perubahan state nyata. |
| **R-27** | UI data memiliki Empty state, Loading state, dan Error state | **PASS** | `StateViews.tsx` (`EmptyState`, `LoadingState`, `ErrorState`) terpasang di katalog, carousel, PDP, cart, checkout, dan seluruh tabel admin; Empty state katalog teruji live dengan `"zzzznotfound"`. |
| **R-28** | Tidak ada FAQ generik/template yang tidak relevan | **PASS** | Landing page V2 bebas blok FAQ template. |
| **R-32** | Dapat dioperasikan via keyboard (`Tab`, `Enter`, `Escape`) dengan fokus terlihat | **PASS** | `:focus-visible` `2px solid var(--focus-ring)` aktif di `global.css:97`; Skip link `Tab+Enter`, `Escape` pada dropdown kategori, search modal, lightbox PDP, CartDrawer, OrderDetailDrawer, ProductEditorModal, dan 3 mobile drawer lulus 100%. |
| **R-33** | Tidak ada fitur yang ditambahkan lewat skrip patching file/CSS | **PASS** | Seluruh perubahan V2 ditulis langsung pada source code TypeScript/CSS. |
| **R-34** | Kedua tema (`Armory Dark` & `Field Paper Light`) berfungsi penuh | **PASS** | Diuji live di Chrome pada `/` (Hero tetap dark-locked), `/store`, `/checkout`, `/admin`, `/admin/settings` di Desktop & Mobile tanpa patah gaya/kontras. |
| **R-35** | Aplikasi dibangun, dijalankan, dan di-click-through elemen demi elemen | **PASS** | `npm run typecheck`, `npm run build`, 52 uji API/static, dan 134 uji Chrome CDP click-through terekam lengkap di Bagian 3 dan Bagian 4. |
| **R-36** | Tidak ada klaim keamanan/kepatuhan/performa fabrikasi | **PASS** | Nol klaim fabrikasi; Core Web Vitals lapangan (p75 RUM) tidak diklaim karena tidak diukur di lapangan ("not measured"). |
| **R-37** | Dibangun berdasarkan arah desain eksplisit (`DESIGN.md` V2 + Spec V2) | **PASS** | Mengikuti `DESIGN.md` V2 dan `docs/specs/04-V2-SWARNA-OVERHAUL-SPEC.md` secara penuh. |
| **R-38** | Seluruh konten berbasis data nyata SQLite, tanpa konten fiktif terselubung | **PASS** | Seluruh katalog 20 produk, 9 kategori, voucher, profil toko, dan Hero slides ditarik langsung dari SQLite. |
| **R-39** | Semantik & affordance aksesibel (`cursor: pointer`, native elements, `alt`, label, `lang`, `<title>`, landmarks, zoom, reduced-motion) | **PASS** | 10/10 rute lulus audit otomatis `cursor: pointer`, `aria-label`, `<label>`, `alt`, `lang` sinkron `ID/EN`, `<title>` unik, 1 `<h1>`, 0 skipped heading, zoom diizinkan, Hero statis tanpa autoplay loop > 5 detik. |
| **R-40** | Mekanisme performa: dimensi media eksplisit, Hero LCP eager `fetchpriority="high"`, 0 third-party render-blocking | **PASS** | 0 `<img>`/`<video>`/`<iframe>` tanpa `width` & `height`; `#hero-lcp-poster` `2400x1350` `fetchpriority="high"` + `<link rel="preload" as="image">`; 0 script pihak ketiga blocking di `<head>`. |

### Block 2: Purpose-Gate (Teknik Diizinkan Dengan Alasan Tertulis -> PASS)

| Rule | Evaluasi Purpose-Gate | Status | Alasan & Bukti Kepatuhan |
| :---: | :--- | :---: | :--- |
| **R-01** | Gradien/glow hanya untuk hierarki terukur | **PASS** | Hanya digunakan sebagai scrim kontras gelap (`hero-armory-scrim` & scrim bawah kartu kategori) guna menjamin kontras WCAG AA teks di atas foto; 0 gradien biru-ungu/neon. |
| **R-04** | Ikon fungsional & relevan (bukan ikon AI generik) | **PASS** | Menggunakan ikon geometris kustom `TacticalIcons.tsx` & SVG inline admin yang relevan pada fungsi (cari, keranjang, menu, tema, tutup, panah, zoom, peta); 0 sparkle/magic/robot. |
| **R-06** | Tipografi berdasar karakter brand dengan alasan tertulis | **PASS** | Trio `Barlow Condensed` (display tegas), `IBM Plex Sans` (UI bilingual), dan `IBM Plex Mono` (`tabular-nums` harga/spek) terdokumentasi di `DESIGN.md` Bagian 4 & 6; 0 font default AI. |
| **R-07** | Tidak ada grid/blueprint/dot latar dekoratif tanpa alasan | **PASS** | 0 pola grid latar dekoratif; kanvas bersih datar sesuai `DESIGN.md`. |
| **R-08** | Tidak ada panah dekoratif berlebih di semua tombol | **PASS** | Ikon panah/eksternal hanya muncul pada kontrol geser carousel/slider dan tautan eksternal Google Maps. |
| **R-09** | Tidak ada capsule badge AI/eyebrow pill di atas H1 | **PASS** | 0 eyebrow di atas `<h1>` Hero, 0 badge promosi kosong; hanya badge status fungsional (`Habis`/`Sold Out`, status pesanan, ketersediaan kurir). |
| **R-10** | Glassmorphism dibatasi `<= 1-2` elemen | **PASS** | `backdrop-filter: blur(8px)` hanya diterapkan pada 1 elemen sticky `<header>` navbar. |
| **R-12** | Shadow hanya sebagai penanda elevasi overlay | **PASS** | Kartu produk/kategori datar tanpa shadow; `var(--shadow-overlay)` hanya pada dropdown, modal, dan drawer. |
| **R-13** | Tidak ada glow tersebar di komponen | **PASS** | 0 efek glow dekoratif di seluruh kartu, tombol, maupun badge. |
| **R-14** | Variasi kartu & konten sesuai hierarki | **PASS** | Beranda memisahkan Carousel produk 3-elemen, Grid 9 kategori full-bleed `aspect-[4/3]`, dan Split panel Showroom + Google Maps tanpa kartu fitur generik berulang. |
| **R-19** | Gerak terukur selaras dial `MOTION 1` | **PASS** | Hero gambar diam tanpa goyang/Ken-Burns; hanya crossfade opacity manual, hover state halus, dan turun ke `0.01ms` pada `prefers-reduced-motion: reduce`. |
| **R-22** | Tidak ada ilustrasi generik (Undraw/Storyset/3D blob) | **PASS** | 100% fotografi produk/armory lokal dan peta Google Maps nyata. |

### Block 3: Liveliness (Semua Jawaban Harus YES -> PASS)

| Kriteria Liveliness | Status | Bukti |
| :--- | :---: | :--- |
| Dials eksplisit dideklarasikan (`ENERGY / RHYTHM / MOTION`) | **PASS** | Dideklarasikan per zona di `DESIGN.md` Bagian 2.1: Landing (`3 / 3 / 1`), Store/PDP/Checkout (`2 / 2 / 1`), Admin (`1 / 1 / 1`). |
| Output konsisten dengan Dials | **PASS** | Landing tampil tegas (`ENERGY 3`) dengan 4 komposisi berbeda nyata (`RHYTHM 3`: Hero 100dvh -> Carousel -> Grid 9 Kategori -> Split Maps) dan gerak tenang terkendali (`MOTION 1`); Admin seragam & tenang (`1 / 1 / 1`). |
| Satu titik fokus jelas per layar | **PASS** | Hero 100dvh fokus pada foto + 1 H1 + 1 CTA; PDP fokus pada galeri + Buy Box bersih; Checkout fokus pada form 1 langkah + ringkasan total. |
| Whitespace bersifat struktural | **PASS** | Pemisahan antar seksi (`py-12 sm:py-16 lg:py-20`), padding kartu konsisten, dan `border-t` hairline memisahkan blok informasi secara jernih. |
| Satu aksen terukur (tidak nol, tidak berlebihan) | **PASS** | Signal Amber (`#E5A024` Dark) / Burnt Amber (`#8C4F04` Light) digunakan selektif pada CTA utama, indikator slide/bahasa aktif, dan fokus. |
| Identity motif konsisten di seluruh permukaan | **PASS** | Tangga permukaan gunmetal/field paper + hairline 1px, sudut tegas anti-pill `0/2/4/6px`, dan kolom harga/spek `IBM Plex Mono` `tabular-nums`. |
| Design Read dideklarasikan sebelum implementasi | **PASS** | Tercatat eksplisit di `DESIGN.md` Bagian 2.1 dan `docs/specs/04-V2-SWARNA-OVERHAUL-SPEC.md`. |

### Block 4: Craftsmanship & Quality Locks (Semua Jawaban Harus NO -> PASS)

| Kode | Kriteria Craftsmanship & Quality Lock | Status | Bukti |
| :---: | :--- | :---: | :--- |
| **C-1** | Tidak ada keputusan visual/copy yang sekadar "default AI" | **PASS** | Seluruh keputusan palet, tipografi, 4 seksi Swarna, kartu 3-elemen, dan bilingual tercatat alasannya di `DESIGN.md` Bagian 6. |
| **C-2** | Tidak ada elemen interaktif mati tanpa fungsi | **PASS** | 134/134 uji interaksi Chrome CDP lulus; seluruh fitur tidak dipakai dihapus total. |
| **C-3** | Tidak ada seksi pengisi templat yang tidak melayani konten produk | **PASS** | Landing page dipangkas bersih menjadi tepat 4 seksi inti (Hero, Featured Products, Categories, Our Store Maps) + Footer ringkas. |
| **C-4** | Tidak patah di state empty/loading/error, dual theme, 3 breakpoint, atau keyboard-only | **PASS** | Lulus lintas `1440x900`, `768x1024`, `375x812`, `Dark`/`Light`, `ID`/`EN`, 200% zoom, dan keyboard `Tab`/`Enter`/`Escape`. |
| **C-5** | Tidak ada klaim, statistik, atau testimoni rekaan | **PASS** | Nol data fabrikasi di seluruh antarmuka. |
| **R-05** | Struktur halaman bebas templat AI dan sesuai `RHYTHM` dial | **PASS** | 4 seksi dengan komposisi bervariasi nyata sesuai `RHYTHM 3`; Footer 4 kolom spesifik domain (Brand/Showroom, Belanja, Jelajah, Kontak). |
| **R-11** | Skala radius konsisten & bebas tampilan serba-pill | **PASS** | `0` pelanggaran `rounded-full`/`rounded-2xl`/`9999px`/`50%`; variasi `0/2/4/6px` diterapkan konsisten. |
| **R-15** | CTA spesifik konteks produk (bukan "Get Started" / "Learn More" generik) | **PASS** | CTA kontekstual bilingual (`Belanja Sekarang`/`Shop Now`, `Lihat Plate Carrier`/`Explore Plate Carriers`, `Tambah ke Keranjang`/`Add to Cart`, `Buka Google Maps`/`Get Directions`, `Buat Pesanan`/`Place Order`). |
| **R-16** | Nol buzzword pemasaran AI ("AI Powered", "Revolutionary", "Seamless", dll.) | **PASS** | Seluruh copy lugas, spesifik produk taktis, tanpa buzzword AI. |
| **R-20** | Identitas visual tetap unik bila logo ditukar | **PASS** | Kombinasi Armory Dark / Field Paper Light + Amber aksen + Barlow Condensed/IBM Plex Mono + sudut tajam 2px/4px membentuk karakter khas Brakasa Tactical. |
| **R-21** | Dual theme bekerja penuh tanpa menunda toggle | **PASS** | Toggle Dark/Light tersedia dan teruji berfungsi di Navbar, Mobile Drawer, Admin Login, dan Admin Sidebar. |
| **R-29** | Palet disiplin (2 warna inti + 1 aksen di atas netral) | **PASS** | Netral gunmetal/field paper + Ranger Olive & Coyote Earth + 1 aksen Amber. |
| **R-30** | Tidak meniru produk SaaS populer (Linear/Vercel/Stripe/Notion) | **PASS** | Identitas hardware armory mandiri dengan palet Brakasa. |
| **R-31** | Setiap keputusan besar memiliki alasan satu kalimat tertulis | **PASS** | Seluruh 9 keputusan arsitektur & visual terdokumentasi 1 kalimat di `DESIGN.md` Bagian 6. |

---

## 6. Putusan Akhir QA V2

**STATUS AKHIR: LULUS 100% (APPROVED FOR DELIVERY).**
Seluruh kriteria penerimaan pada `docs/specs/04-V2-SWARNA-OVERHAUL-SPEC.md` Bagian 9 dan `antislop` Delivery Gate Blocks 1-4 terpenuhi tanpa cacat tersisa.
