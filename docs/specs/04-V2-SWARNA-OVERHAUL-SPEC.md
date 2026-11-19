# 04-V2-SWARNA-OVERHAUL-SPEC.md: Spesifikasi Arsitektur Perombakan Total Brakasa Tactical V2 (Swarna Tactical Layout + ID/EN i18n)

Dokumen ini adalah sumber kebenaran arsitektur, UX/UI, kontrak API/data, sistem internasionalisasi (`ID / EN`), serta pembagian file bebas-bentrok untuk perombakan total **Brakasa Tactical V2**.

Perombakan V2 menyelaraskan seluruh arsitektur informasi, kebersihan visual, dan ritme tata letak dengan temuan empiris [05-swarna-tactical-teardown.md](../research/05-swarna-tactical-teardown.md) sembari **mempertahankan 100% sistem warna dual-theme dan tipografi resmi Brakasa Tactical** dari [DESIGN.md](../../DESIGN.md) (`Armory Dark`, `Field Paper Light`, `Signal Amber`, `Burnt Amber`, `Ranger Olive`, serta `Barlow Condensed` + `IBM Plex Sans` + `IBM Plex Mono`).

---

## 1. Prinsip Mandatori Perombakan V2 & Aturan Anti-Slop

Seluruh engineer dan verifier wajib mematuhi enam mandat utama berikut tanpa pengecualian:

1. **Tema & Palet Tetap Brakasa (Zero Perubahan Warna Inti):**
   - Pertahankan seluruh token warna di `src/styles/tokens.css`:
     - `Armory Dark` (`:root`, `[data-theme="dark"]`): `--bg-canvas: #0F1110`, `--bg-surface: #171A18`, `--bg-elevated: #1F2421`, `--accent-primary: #E5A024`, `--accent-foreground: #121412`, `--brand-olive: #334434`.
     - `Field Paper Light` (`[data-theme="light"]`): `--bg-canvas: #F2EFE9`, `--bg-surface: #FAF8F4`, `--bg-elevated: #E6E1D8`, `--accent-primary: #8C4F04`, `--accent-foreground: #FAF8F4`, `--brand-olive: #334434`.
   - Kontainer Hero (`.hero-armory`) dan Navbar transparan di atas Hero saat `scrollY <= 10` selalu memakai token gelap terkunci (`#0F1110` / `#F0EFEA` / `#E5A024`) di kedua mode tema agar kontras di atas foto Hero selalu lolos WCAG AA (`>= 9.6:1`).
2. **Hero Full 1 Layar (`100dvh`), Statis Tajam, Tanpa Guncangan:**
   - Hapus total pemutar video Hero, hapus animasi kamera goyang/Ken-Burns (`scale`/`translate` dinamis dilarang), hapus daftar scene di bawah Hero (`[SCN-03 / 10] ...`), hapus eyebrow di atas Hero (`SEC-01 // ...`), dan hapus tombol Jeda/Putar serta tombol Suara/Mute.
   - Gunakan slide gambar resolusi tinggi `2400x1350` yang diam dan tajam (`/media/images/hero/hero-scene-*.jpg`), crossfade opacity bersih, headline singkat + 1 CTA primer, serta indikator **pagination dots di dalam bingkai bawah Hero**.
3. **Landing Page 4 Seksi + Footer Bersih Gaya Swarna Tactical:**
   - Urutan eksak: (1) Full-Screen Hero Image Slider -> (2) Featured Products Carousel (HANYA foto, nama produk, harga) -> (3) Featured Categories Grid (HANYA foto, nama kategori, klik ke `/store?category=<slug>`) -> (4) Our Store dengan Google Maps interaktif -> (5) Footer ringkas 4 kolom.
4. **Penghapusan Total 3 Fitur & Seluruh Gerbang Usia 18+ / Perpol:**
   - Hapus permanen rute, halaman, komponen, tautan, dan endpoint terkait: **Loadout Builder** (`/loadout-builder`), **Cek Pesanan** (`/order-lookup`, `/orders/lookup`), dan **Kepatuhan 18+** (`/compliance`).
   - Hapus total verifikasi usia 18+, input tanggal lahir (`buyerDob`), KTA klub, tujuan pemakaian, dan checkbox Perpol No. 5/2018 dari Checkout, CartDrawer, PDP, Footer, Admin, maupun validasi backend `server/services/orderService.ts`.
5. **Nol Over-Description & Nol Label Mikro Kode:**
   - Hapus seluruh eyebrow kode (`SEC-01 // ...`, `OPS-01 // ...`, `CAT-01 // ...`, `INV-01 // ...`, `ORD-01 // ...`, `CFG-01 // ...`, `QUEUE-01 // ...`, `STOCK-02 // ...`, `METRIK-03 // ...`, `BLOK 01..04`, `[BRK // 01]`, `STATUS //`, `AUTH //`, `MANIFEST //`, `PARAM //`, `OVERVIEW //`, `SUMMARY //`, `PAYMENT //`, `LOGISTICS //`, `ORDER //`, `PROMO //`, `MEDIA //`, `KONFIRMASI //`), hapus `.spec-index-row`, dan hapus paragraf penjelasan panjang di bawah judul, kartu, maupun formulir di seluruh halaman publik dan admin.
6. **Toggle Bahasa `ID / EN` Penuh & Aturan Kualitas Kode:**
   - Implementasikan `LanguageContext` (`id` | `en`, persistensi `localStorage` key `brakasa-lang`, sinkron `<html lang="...">`) yang menerjemahkan 100% antarmuka publik dan admin.
   - Patuhi batas radius anti-slop (`DESIGN.md` R-11): **DILARANG** memakai `rounded-full`, `rounded-2xl`, `rounded-3xl`, `9999px`, atau `border-radius: 50%` di seluruh kode CSS/TSX. Untuk pagination dots di Hero, gunakan `h-2 w-2 rounded-[4px]` (tidak aktif, tampil bulat sempurna karena radius `4px` = 1/2 dari `8px`) dan `h-2 w-7 rounded-[4px]` (aktif) di dalam tombol sentuh `min-h-[44px] min-w-[36px]`.
   - **DILARANG** menggunakan karakter em dash (U+2014) atau en dash (U+2013) di seluruh kode, kamus terjemahan, maupun pesan API.

---

## 2. Arsitektur Informasi & Peta Rute V2

### 2.1 Peta Rute Publik & Admin

| Rute | Halaman / Komponen | Status V2 | Catatan |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | **ROMBAK TOTAL** | 4 Seksi Swarna + Footer bersih |
| `/store` | `StoreCatalogPage` | **REFACTOR BERSIH** | Sidebar filter desktop + mobile sheet + `ProductCard` 3-elemen |
| `/store/:slug` | `ProductDetailPage` | **REFACTOR BERSIH** | Galeri + lightbox kiri, Buy Box bersih kanan, Deskripsi + Tabel Spek 2 kolom + Produk Terkait |
| `/checkout` | `CheckoutPage` | **REFACTOR BERSIH** | Guest checkout 1 langkah tanpa blok 18+/Perpol |
| `/loadout-builder` | - | **DIHAPUS TOTAL** | Jatuh ke `NotFoundPage` (`*`) |
| `/order-lookup` | - | **DIHAPUS TOTAL** | Jatuh ke `NotFoundPage` (`*`) |
| `/orders/lookup` | - | **DIHAPUS TOTAL** | Jatuh ke `NotFoundPage` (`*`) |
| `/compliance` | - | **DIHAPUS TOTAL** | Jatuh ke `NotFoundPage` (`*`) |
| `/admin/login` | `AdminLoginPage` | **BERSIH + i18n** | Tanpa eyebrow `AUTH //`, ada toggle `ID / EN` & tema |
| `/admin` | `AdminDashboardPage` | **BERSIH + i18n** | Tanpa `OPS-01 //`, `QUEUE-01 //`, `STOCK-02 //`, `METRIK-03 //`, tanpa kolom 18+ |
| `/admin/products` | `AdminProductsPage` | **BERSIH + i18n** | Tanpa `CAT-01 //`, tanpa flag/tampilan 18+ |
| `/admin/inventory` | `AdminInventoryPage` | **BERSIH + i18n** | Tanpa `INV-01 //` |
| `/admin/orders` | `AdminOrdersPage` | **BERSIH + i18n** | Tanpa `ORD-01 //`, tanpa kolom/blok kepatuhan 18+ di drawer |
| `/admin/orders/:id` | `AdminOrdersPage` | **BERSIH + i18n** | Membuka `OrderDetailDrawer` bersih |
| `/admin/vouchers` | `AdminVouchersPage` | **BERSIH + i18n** | Tanpa `CFG-01 //` |
| `/admin/settings` | `AdminSettingsPage` | **ROMBAK V2 + i18n** | 3 Tab: `Store Profile & Maps`, `Hero Slider`, `Shipping & Inventory` (hapus tab Video Telemetry & Loadout Spotlight) |

### 2.2 Struktur Header & Navigasi Gaya Swarna Tactical (`src/components/layout/Navbar.tsx`)

Hapus pita pengumuman atas (`announcementEnabled`) dari `SiteLayout.tsx` agar Hero langsung menempel di puncak layar `100dvh`.

#### Perilaku Sticky & Transparan di Atas Hero
- Posisi: `sticky top-0 z-40 w-full transition-colors duration-[180ms]`.
- Tinggi: `h-[56px] lg:h-[68px]`.
- Mode visual:
  - Saat di beranda (`/`) dan `window.scrollY <= 10`: latar gelap semi-transparan terkunci `rgba(15, 17, 16, 0.72)` dengan `backdrop-filter: blur(8px)`, border bawah `rgba(240, 239, 234, 0.14)`, teks/ikon terang `#F0EFEA` (berlaku di mode Dark maupun Light agar selalu kontras di atas foto Hero).
  - Saat `window.scrollY > 10` atau di rute selain `/`: latar `var(--glass-surface)` dengan `backdrop-filter: blur(8px)`, border bawah `1px solid var(--border-subtle)`, teks `var(--text-primary)`.
  - Komponen Hero di `/` menggunakan `-mt-[56px] lg:-mt-[68px]` sehingga Hero benar-benar mengisi tepat `100dvh` dari koordinat `y = 0`.

#### Pembagian 3 Zona Desktop (`>= 1024px`)

```text
+---------------------------------------------------------------------------------------------------+
| BRAKASA // TACTICAL  |  Shop   Categories v   Featured   Our Store  |  [Search] [ID|EN] [Th] [Cart]|
+---------------------------------------------------------------------------------------------------+
```

1. **Zona Kiri (Wordmark):**
   - `BRAKASA // TACTICAL` mengarah ke `/`, tinggi target sentuh `min-h-[44px]`.
2. **Zona Tengah (4 Menu Utama Bersih):**
   - `Belanja` / `Shop` -> `/store`
   - `Kategori` / `Categories` -> Dropdown multi-item (buka via hover dengan *grace delay* `180ms` + *invisible bridge* `h-2` di atas panel dropdown, serta klik/Enter/Space untuk keyboard & Escape untuk tutup). Menampilkan daftar 9 kategori terjemahan `ID / EN` (`grid-cols-2`, lebar `min-w-[360px]`, latar `var(--bg-elevated)`, border `1px solid var(--border-strong)`, radius `var(--radius-overlay)`), klik langsung ke `/store?category=<slug>`.
   - `Unggulan` / `Featured` -> `/#featured-products` (jika sedang di `/` scroll halus ke `#featured-products`; jika dari halaman lain navigasi ke `/#featured-products` lalu `SiteLayout` scroll ke elemen ber-id tersebut).
   - `Toko Kami` / `Our Store` -> `/#our-store`.
3. **Zona Kanan (Utilitas):**
   - **Search Trigger (`Ctrl+K`):** Tombol kompak `min-h-[44px] min-w-[44px]` (`radius-control` `4px`) membuka dialog pencarian cepat yang mengirim query ke `/store?q=<query>`. Tanpa pintasan `CQB <= 350 FPS` yang bertele-tele; cukup input search + tombol submit + daftar 4 kategori populer.
   - **Language Toggle (`ID / EN`):** Tombol grup atau tombol toggle eksplisit `min-h-[44px]` menampilkan `ID` / `EN` dengan penanda aktif memakai `--accent-primary` (`aria-label` bilingual, `aria-pressed`). Klik langsung memanggil `setLang('id')` atau `setLang('en')`.
   - **Theme Toggle:** Tombol ikon `Sun` / `Moon` (`min-h-[44px] min-w-[44px]`, `aria-pressed={theme === 'light'}`) beralih penuh antara `Armory Dark` dan `Field Paper Light`.
   - **Cart Drawer Trigger:** Ikon keranjang + badge jumlah item (`tabular-nums`, `min-h-[44px]`). Membuka `CartDrawer` dari sisi kanan.
4. **Mobile Bar (`< 1024px`) & Mobile Drawer:**
   - Bar mobile menampilkan Wordmark di kiri; ikon Search, tombol Cart + badge, dan tombol berlabel eksplisit `Menu` (`min-h-[44px]`) di kanan.
   - Slide-over drawer kanan (`w-[min(86vw,340px)]`, `h-[100dvh]`, focus trap, Escape, return focus):
     1. Header: `BRAKASA` + tombol tutup (`Tutup` / `Close`).
     2. Input pencarian form -> `/store?q=...`.
     3. Daftar tautan: `Beranda`/`Home`, `Belanja`/`Shop`, akordeon `Kategori`/`Categories` (9 kategori), `Unggulan`/`Featured`, `Toko Kami`/`Our Store`.
     4. Footer drawer: Grid 2 tombol pemilih bahasa (`Indonesia (ID)` | `English (EN)`), tombol ganti tema (`Armory Dark` / `Field Paper Light`), dan tautan ringkas `Admin` (`/admin/login`).

---

## 3. Spesifikasi Detail 4 Seksi Landing Page (`/`) & Footer

`src/pages/LandingPage.tsx` merender tepat 4 seksi berurutan tanpa seksi tambahan:

```tsx
<div className="min-w-0">
  <HeroSliderSection />
  <FeaturedProductsCarousel />
  <FeaturedCategoriesGrid />
  <OurStoreSection />
</div>
```

### 3.1 Seksi 1: Full-Screen Hero Image Slider (`src/components/landing/HeroSliderSection.tsx`)

- **Dimensi & Geometri:**
  - `relative -mt-[56px] lg:-mt-[68px] h-[100dvh] min-h-[540px] max-h-[1080px] w-full overflow-hidden bg-[#0F1110]`.
  - Memastikan Hero mengisi penuh 1 layar (`100dvh`) di Mobile (`390px`), Tablet (`768px`), maupun Desktop (`1440px`).
- **Slide Foto Statis Tajam (ZERO Goyang / ZERO Video / ZERO Ken-Burns):**
  - Merender array slide dari `bootstrap.settings.heroSlides` (dengan fallback `DEFAULT_HERO_SLIDES` berisi 5 foto tajam `2400x1350` dari `/media/images/hero/`):
    1. `/media/images/hero/hero-scene-01.jpg` | ID: `PRESISI ARMORY LAPANGAN` / EN: `FIELD ARMORY PRECISION` | CTA: `Belanja Sekarang` / `Shop Now` -> `/store`
    2. `/media/images/hero/hero-scene-02.jpg` | ID: `SISTEM RIG & PROTEKSI` / EN: `MODULAR RIG SYSTEMS` | CTA: `Lihat Plate Carrier` / `Explore Plate Carriers` -> `/store?category=plate-carrier-rig`
    3. `/media/images/hero/hero-scene-05.jpg` | ID: `OPTIK & AKUISISI TARGET` / EN: `OPTICS & TARGETING` | CTA: `Lihat Optik` / `Explore Optics` -> `/store?category=optics-aiming`
    4. `/media/images/hero/hero-scene-07.jpg` | ID: `PERFORMA RINGKAS CQB` / EN: `COMPACT CQB READY` | CTA: `Lihat SMG & PDW` / `Explore SMG & PDW` -> `/store?category=smg-pdw`
    5. `/media/images/hero/hero-scene-10.jpg` | ID: `PERLENGKAPAN TAKTIS LENGKAP` / EN: `COMPLETE TACTICAL GEAR` | CTA: `Buka Katalog` / `Browse Catalog` -> `/store`
  - Setiap `<img>` menggunakan `width={2400} height={1350} className="h-full w-full object-cover object-center"`, tanpa transformasi `scale` atau `translate` saat aktif (benar-benar diam dan tajam).
  - Slide 0 (`index === 0`): `id="hero-lcp-poster"`, `fetchPriority="high"`, `loading="eager"`, `decoding="sync"`. Slide 1..N: `loading="lazy"`, `decoding="async"`.
  - Transisi antar slide: **crossfade opacity murni** (`transition-opacity duration-[450ms] ease-out`), otomatis menjadi instan (`0.01ms`) saat `prefers-reduced-motion: reduce`.
  - Autoplay: interval `6000ms` (hanya bila `!reducedMotion && !isHovered && !isFocusWithin`).
  - Mendukung geser sentuh (*touch swipe* horizontal kiri/kanan, threshold `>= 48px`) di perangkat mobile.
- **Lapisan Scrim & Konten Minimalis:**
  - Scrim gelap terkunci (`hero-armory-scrim` dari `tokens.css`) memastikan teks selalu terbaca tajam di atas foto.
  - Blok konten rata kiri-bawah (`container-brakasa relative z-10 flex h-full flex-col justify-end pb-20 sm:pb-24`):
    - **TANPA** eyebrow teks kecil di atas `<h1>`.
    - **TANPA** paragraf deskripsi panjang di bawah `<h1>`.
    - **Hanya 1 `<h1>`** (`Barlow Condensed` 700 uppercase, `clamp(2.5rem, 5.6vw, 4.75rem)`, `line-height: 0.96`, `color: var(--hero-text-primary)`, `max-w-[14ch]`).
    - **Hanya 1 CTA Primer** (`btn-brakasa`, latar `var(--hero-cta-bg)` `#E5A024`, teks `var(--hero-cta-fg)` `#121412`, `min-h-[48px] px-7`).
- **Navigasi Slide di Dalam Hero (Pagination Dots + Panah Samping):**
  - **Pagination Dots (`bottom-5`, rata tengah horizontal di dalam hero):**
    - `<div role="tablist" aria-label={...} className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1">`
    - Setiap dot adalah `<button type="button" role="tab" aria-selected={isActive} aria-label={...}>` berdimensi tap target `min-h-[44px] min-w-[36px] inline-flex items-center justify-center bg-transparent border-0 p-1`.
    - Elemen visual dot di dalam button (`<span>`):
      - Aktif: `block h-2 w-7 rounded-[4px] bg-[#E5A024] transition-all duration-[180ms]`
      - Nonaktif: `block h-2 w-2 rounded-[4px] bg-[#F0EFEA]/45 hover:bg-[#F0EFEA]/75 transition-all duration-[180ms]`
  - **Panah Kiri/Kanan (Desktop/Tablet `hidden sm:inline-flex`):**
    - Diposisikan `absolute top-1/2 -translate-y-1/2 left-4 / right-4 z-20`, ukuran `min-h-[44px] min-w-[44px]`, `border border-[#7A847D] bg-[#0F1110]/60 text-[#F0EFEA] rounded-[4px] hover:bg-[#0F1110]/85`.
  - **Elemen yang WAJIB ABSEN:** Nol tombol Pause/Play, nol tombol Audio/Mute, nol bilah scene `[SCN-XX / 10]`, nol `SEC-01 //`.

### 3.2 Seksi 2: Featured Products Carousel (`src/components/landing/FeaturedProductsCarousel.tsx`)

- **Posisi:** Tepat di bawah Hero (`id="featured-products"`, `py-12 sm:py-16 lg:py-20`, `scroll-mt-20`).
- **Header Seksi (1 Baris Bersih):**
  - Kiri: `<h2>` (`Produk Unggulan` / `Featured Products`, `font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold uppercase tracking-tight`).
  - Kanan: Tombol panah Prev/Next (`min-h-[44px] min-w-[44px]`, `btn-secondary`) + tautan `Lihat Semua` / `View All` (-> `/store`, `min-h-[44px]`).
  - **Tanpa** eyebrow dan **tanpa** subjudul penjelasan.
- **Sumber Data & Track Carousel:**
  - Sumber: `bootstrap.featuredProducts` (8 produk `is_featured = 1` dari SQLite; fallback fetch `/api/products?featured=true&limit=8` bila bootstrap belum terisi).
  - Track horizontal native CSS scroll-snap (`flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`).
  - Lebar item responsif:
    - Mobile (`< 640px`): `w-[calc(50%-8px)] min-w-[162px] shrink-0 snap-start` (2 kartu tampil penuh berdampingan).
    - Tablet (`640px - 1023px`): `sm:w-[calc(33.333%-13.33px)]` (3 kartu).
    - Desktop (`>= 1024px`): `lg:w-[calc(25%-15px)]` (4 kartu).
  - Tombol Prev/Next menggeser `trackRef.current.scrollBy({ left: direction * trackWidth * 0.75, behavior: 'smooth' })` dan memperbarui state `disabled` (`canScrollPrev`, `canScrollNext`) pada event `scroll` dan `resize`.
- **Komponen Kartu (`ProductCard` Minimalis Gaya Swarna):**
  - Menggunakan `src/components/store/ProductCard.tsx` versi V2 yang sama persis dengan katalog `/store`:
    1. **Foto Produk:** `<div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--bg-elevated)]">` berisi `<img src={product.primaryImageUrl} width={1600} height={900} className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />`. Jika `product.stockQty <= 0`, tampilkan 1 label tenang `Habis` / `Sold Out` di pojok kanan atas (`bg-[#0F1110]/85 text-[#F0EFEA] text-[11px] font-mono-tech uppercase px-2 py-0.5 rounded-[2px]`); jika stok tersedia, **NOL badge sama sekali**.
    2. **Nama Produk:** `<h3 className="mt-3 mb-0 min-h-[2.75rem] line-clamp-2 text-sm sm:text-[0.9375rem] font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors">{product.name}</h3>`.
    3. **Harga Produk:** `<div className="mt-2.5 border-t border-[var(--border-subtle)] pt-2.5 font-mono-tech text-sm sm:text-base font-semibold tabular-nums text-[var(--text-primary)]">{formatIdr(product.priceIdr)}</div>`.
  - Seluruh kartu adalah satu `<Link to={`/store/${product.slug}`}>` utuh (`rounded-[2px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 sm:p-3.5 transition-colors hover:border-[var(--border-strong)]`).
  - **DIHAPUS DARI KARTU:** SKU, brand, kategori pill, badge `18+`, badge `VIDEO`, tombol pratinjau video hover, baris spec 3 kolom (Propulsi/FPS/Stok), bobot gram, deskripsi singkat, tombol `Detail`, dan tombol `+ Keranjang`.

### 3.3 Seksi 3: Featured Categories Grid (`src/components/landing/FeaturedCategoriesGrid.tsx`)

- **Posisi:** Di bawah Featured Products (`id="categories"`, `py-12 sm:py-16 lg:py-20 border-t border-[var(--border-subtle)]`, `scroll-mt-20`).
- **Header Seksi:**
  - Hanya `<h2>`: `Kategori` / `Categories` (`font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold uppercase tracking-tight mb-6 sm:mb-8`).
  - **Tanpa** eyebrow, **tanpa** paragraf penjelasan.
- **Grid 9 Kategori Simetris:**
  - `grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5`.
  - Seluruh 9 kartu membentuk 3 baris x 3 kolom sempurna di tablet/desktop dan 2 kolom rapi di mobile.
- **Anatomi Kartu Kategori (HANYA Foto + Nama Kategori):**
  - `<Link to={`/store?category=${encodeURIComponent(cat.slug)}`} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[2px] border border-[var(--border-subtle)] bg-[#0F1110]">`
  - Foto: `<img src={cat.imageUrl} alt={localizedName} width={1600} height={900} loading="lazy" className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />`.
  - Overlay scrim bawah: `linear-gradient(180deg, rgba(15,17,16,0.06) 35%, rgba(15,17,16,0.82) 100%)`.
  - Nama Kategori di kiri-bawah: `<span className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5 font-display text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-wide text-[#F0EFEA] leading-tight">{getCategoryName(cat.slug, lang)}</span>`.
  - **DIHAPUS:** Jumlah produk (`3 SKU`), subtitle kategori, tombol `Shop Now`, dan label `CAT-01 //`.

#### Pemetaan Foto Representatif 9 Kategori (Terverifikasi `1600x900` di Disk)

| No | Slug Kategori | Nama ID | Nama EN | Path Foto Representatif |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `assault-rifle` | `Senapan Serbu` | `Assault Rifle` | `/media/images/products/brk-ar-001.jpg` |
| 2 | `smg-pdw` | `SMG & PDW` | `SMG & PDW` | `/media/images/products/brk-smg-001.jpg` |
| 3 | `sniper-rifle` | `Senapan Sniper` | `Sniper Rifle` | `/media/images/products/brk-snp-001.jpg` |
| 4 | `sidearm-pistol` | `Pistol Sidearm` | `Sidearm Pistol` | `/media/images/products/brk-pst-001.jpg` |
| 5 | `optics-aiming` | `Optik & Bidik` | `Optics & Aiming` | `/media/images/products/brk-opt-002.jpg` |
| 6 | `plate-carrier-rig` | `Plate Carrier & Rig` | `Plate Carrier & Rig` | `/media/images/products/brk-rig-001.jpg` |
| 7 | `helmet-comms` | `Helm & Komunikasi` | `Helmet & Comms` | `/media/images/products/brk-hlm-001.jpg` |
| 8 | `apparel-footwear` | `Pakaian & Sepatu` | `Apparel & Footwear` | `/media/images/products/brk-app-001.jpg` |
| 9 | `consumables-upgrades` | `Konsumabel & Upgrade` | `Consumables & Upgrades` | `/media/images/products/brk-upg-001.jpg` |

### 3.4 Seksi 4: Our Store dengan Google Maps (`src/components/landing/OurStoreSection.tsx`)

- **Posisi:** Di bawah Categories, tepat di atas Footer (`id="our-store"`, `border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]`, `scroll-mt-20`).
- **Tata Letak Split Full-Width Gaya Swarna:**
  - Wrapper: `grid grid-cols-1 lg:grid-cols-2 lg:min-h-[460px]`.
  - **Sisi Kiri (`grid grid-cols-1 sm:grid-cols-2`):**
    - **Panel Info Showroom (`p-6 sm:p-8 lg:p-10 flex flex-col justify-center gap-5 bg-[var(--bg-surface)]`):**
      - `<h2>`: `Toko Kami` (ID) / `Our Store` (EN) (`font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold uppercase tracking-tight m-0`).
      - Daftar ringkas (`space-y-2.5 text-sm text-[var(--text-secondary)]`):
        - Alamat: `armoryProfile.address` (`Jl. Kemang Raya No. 48, Jakarta Selatan 12730`)
        - Jam Operasional: `armoryProfile.operatingHours` (ID: `Senin - Sabtu, 10:00 - 19:00 WIB` / EN: `Monday - Saturday, 10:00 - 19:00 WIB`)
        - Kontak: `armoryProfile.whatsappNumber` (`+62 812-8800-4418`, `font-mono-tech tabular-nums`)
      - 1 Tombol Primer (`btn-brakasa btn-primary w-fit min-h-[48px]`):
        - Label: `Buka Google Maps` (ID) / `Get Directions` (EN)
        - `href={mapsDirectionsUrl}` (`https://maps.google.com/?q=Jl.+Kemang+Raya+No.+48,+Jakarta+Selatan`), `target="_blank" rel="noopener noreferrer"`.
    - **Panel Foto Showroom (`relative min-h-[260px] sm:min-h-full overflow-hidden bg-[#0F1110]`):**
      - `<img src="/media/images/hero/hero-scene-01.jpg" alt={...} width={2400} height={1350} loading="lazy" className="block h-full w-full object-cover" />` (tanpa teks overlay).
  - **Sisi Kanan (`relative min-h-[340px] lg:min-h-full bg-[var(--bg-elevated)] border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)]`):**
    - Embed interaktif Google Maps wajib memiliki atribut dimensi eksplisit `width="800"` dan `height="450"` serta `title`:
      ```tsx
      <iframe
        title={t.ourStore.mapTitle}
        src={mapsEmbedUrl}
        width={800}
        height={450}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        className="block h-full min-h-[340px] w-full border-0"
      />
      ```
    - Default `mapsEmbedUrl`: `https://maps.google.com/maps?q=Jl.%20Kemang%20Raya%20No.%2048%2C%20Jakarta%20Selatan%2012730&t=&z=15&ie=UTF8&iwloc=&output=embed`.

### 3.5 Footer Bersih Gaya Swarna (`src/components/layout/Footer.tsx`)

- **Permukaan:** `bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] mt-auto`.
- **Grid 4 Kolom Ringkas (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10 sm:py-12`):**
  1. **Brand:** Wordmark `BRAKASA // TACTICAL`, alamat singkat 1 baris, jam buka 1 baris. (Nol paragraf legal/compliance!).
  2. **Belanja / Shop:** `Semua Produk` (`/store`), `Senapan Serbu` (`/store?category=assault-rifle`), `SMG & PDW` (`/store?category=smg-pdw`), `Optik & Bidik` (`/store?category=optics-aiming`), `Plate Carrier & Rig` (`/store?category=plate-carrier-rig`).
  3. **Jelajah / Explore:** `Beranda` (`/`), `Produk Unggulan` (`/#featured-products`), `Kategori` (`/#categories`), `Toko Kami` (`/#our-store`), `Portal Admin` (`/admin/login`).
  4. **Kontak / Contact:** WhatsApp (`+62 812-8800-4418`), Email (`armory@brakasa.id`), tautan `Google Maps` (`target="_blank" rel="noopener noreferrer"`).
- **Bottom Bar (1 Baris Rapi):**
  - `border-t border-[var(--border-subtle)] py-4 text-xs text-[var(--text-muted)]`:
  - `© 2026 Brakasa Tactical. Hak cipta dilindungi.` (ID) / `© 2026 Brakasa Tactical. All rights reserved.` (EN).
- **DIHAPUS:** `SEC-06 // ...`, `[BRK // 01]`, `KHUSUS OLAHRAGA & KOLEKSI 18+`, kotak logistik kargo esai, dan tautan `/loadout-builder`, `/order-lookup`, `/compliance`.

---

## 4. Perombakan Storefront, PDP, Cart Drawer, Checkout & Admin

### 4.1 Store Catalog (`/store`, `StoreCatalogPage.tsx` & `CatalogFilterPanel.tsx`)

- **Header Katalog Minimalis:**
  - Hapus `spec-index-row` (`STORE // ...`) dan paragraf deskripsi panjang di bawah `<h1>`.
  - Tampilkan hanya `<h1>` (nama kategori aktif bila filter kategori dipilih, atau `Katalog` / `Shop`) di kiri dan jumlah hasil (`20 produk` / `20 products`, `tabular-nums`) di kanan.
- **Filter Sidebar (Desktop `w-[260px]`) & Mobile Sheet (`< 1024px`):**
  - Hapus `PARAM // FILTER KATALOG`; ganti heading `Filter` yang bersih.
  - Pertahankan seluruh filter fungsional nyata (`Kategori`, `Platform`, `Propulsi`, `Rentang FPS`, `Rentang Harga`, `Hanya Stok Tersedia`, `Ada Video Demo`, `Urutkan`), seluruh label & opsi diterjemahkan penuh `ID / EN`.
- **Toolbar & Grid Produk:**
  - Input pencarian + dropdown urutan + tombol `Filter` (mobile) + chip filter aktif.
  - Grid: `grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5`.
  - Kartu menggunakan **`ProductCard` minimalis 3-elemen** (foto, nama produk, harga saja).

### 4.2 Product Detail Page (`/store/:slug`, `ProductDetailPage.tsx`, `ProductGallery.tsx`, `SpecSheetTable.tsx`)

- **Breadcrumb 1 Baris:** `Beranda / Katalog / <Kategori>` (ID) / `Home / Shop / <Category>` (EN).
- **Above the Fold (Split 2 Kolom `lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,1fr)] gap-8 lg:gap-10`):**
  - **Kiri (`ProductGallery`):**
    - Media utama `aspect-[4/3]` atau `aspect-video`, tombol toggle `Foto` / `Video` jika produk punya `demoVideoUrl`, tombol `Perbesar` / `Zoom` membuka Lightbox modal (`max-w-[90vw] max-h-[90vh]`, Escape + focus trap) untuk gambar, dan baris thumbnail bersih di bawah.
    - Hapus teks `MEDIA 01 / 03` jika berisik; pertahankan `aria-label` aksesibilitas penuh.
  - **Kanan (Buy Box Bersih):**
    - Baris 1: `brand` dan `SKU` ringkas tanpa `//` (`Tokyo Marui - BRK-AR-001`).
    - Baris 2: `<h1>` Nama Produk (`Barlow Condensed` 700 uppercase).
    - Baris 3: Harga dominan (`IBM Plex Mono` `text-2xl sm:text-3xl font-semibold tabular-nums text-[var(--accent-text)]`).
    - Baris 4: Indikator status stok 1 baris dengan warna status + teks (`Tersedia (9)` / `In Stock (9)`, `Stok Terbatas (2)` / `Low Stock (2)`, atau `Habis` / `Out of Stock`).
    - Baris 5: Kontrol jumlah (`-`, input angka, `+`) berdampingan dengan tombol CTA primer lebar penuh `Tambah ke Keranjang` / `Add to Cart` (`min-h-[48px]`).
    - Baris 6 (opsional bila `addedFeedback` aktif): Konfirmasi ringkas 1 baris + tombol `Buka Keranjang` / `View Cart`.
    - **DIHAPUS DARI BUY BOX:** Badge `WAJIB 18+`, kotak kuning `18+ / <= 2,0 JOULE / ORANGE TIP / KARGO DARAT`, badge kelas kargo ramai, tombol `Muat ke Loadout Builder`, label `Harga Armory`, dan blok `QUICK SPEC MATRIX (2X3)`.
- **Below the Fold (Struktur Vertikal Bersih Gaya Swarna, Tanpa Tab Rumit & Tanpa Tab Kepatuhan):**
  1. **Deskripsi / Description:** `<h2>` + border bawah + paragraf `product.description` (serta daftar ringkas `Isi Paket` / `In the Box` bila tersedia, tanpa eyebrow `OVERVIEW //`).
  2. **Spesifikasi / Specifications:** `<h2>` + border bawah + tabel 2 kolom bersih `SpecSheetTable` (seluruh label parameter diterjemahkan `ID / EN`; **hapus** baris `Kepatuhan Orange Tip & 18+` dan hapus teks `(Patuh batas <= 2,00 J Perpol 5/2018)`).
  3. **Produk Terkait / Similar Products:** `<h2>` + border bawah + grid 4 kolom (`grid-cols-2 lg:grid-cols-4 gap-4`) dari `data.compatibleProducts` menggunakan komponen `ProductCard` bersih (foto + nama + harga saja). **Hapus** komponen `CompatibilityCallout.tsx` beserta semua tautan `/compliance` dan `/loadout-builder`.

### 4.3 Cart Drawer (`src/components/layout/CartDrawer.tsx`)

- **Header Drawer:** Hanya `<h2>` `Keranjang (N)` / `Cart (N)` + tombol `Tutup` / `Close`. Hapus eyebrow `MANIFEST KERANJANG // LIVE SYNC`.
- **Body Drawer:**
  - **Hapus** seluruh blok `VERIFIKASI 18+ WAJIB` dan penjelasan panjang kargo udara/darat.
  - **Hapus** tombol `Buka Loadout Builder` pada kondisi kosong.
  - Daftar item bersih: thumbnail `aspect-[4/3]` `w-20`, nama produk (tautan ke PDP), harga satuan & subtotal baris, kontrol `- / qty / +` (`min-h-[44px] min-w-[44px]`), dan tombol hapus.
  - Tetap pertahankan peringatan blokir checkout jika ada item `outOfStock` (singkat, 1 kalimat, bilingual).
- **Footer Drawer:**
  - Subtotal bersih (`Subtotal` + `formatIdr(subtotalIdr)`). Hapus kalimat penjelasan tambahan di bawah subtotal.
  - 1 tombol CTA primer penuh: `Checkout`.

### 4.4 Checkout (`src/pages/CheckoutPage.tsx`, `ShippingCargoSection.tsx`, `OrderSummaryPanel.tsx`)

- **Header:** Hanya `<h1>` `Checkout` (tanpa eyebrow `CHECKOUT // ...` dan tanpa paragraf panjang di bawah judul).
- **Layout 2 Kolom (`lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)]`):**
  - **Kolom Kiri (Form 1 Langkah, 3 Seksi Bersih tanpa `BLOK 01/03/04`):**
    1. **Alamat Pengiriman / Shipping Address:** Nama lengkap, Email, WhatsApp/Telepon, Kota/Kabupaten, Kecamatan, Kode Pos (5 digit), Alamat lengkap, Catatan (opsional).
    2. **Pengiriman / Shipping (`ShippingCargoSection`):** Pilih Zona Wilayah -> Pilih Ekspedisi (tetap mengunci kurir udara untuk unit/LiPo/gas secara akurat dengan badge ringkas `Tersedia` / `Tidak Tersedia`, tanpa kotak peringatan esai panjang) -> Checkbox opsional `Packing Kayu` / `Wooden Crating`.
    3. **Voucher & Pembayaran / Voucher & Payment:** Input kode voucher + tombol terapkan + tombol promo aktif + radio 4 metode pembayaran (`VA BCA`, `VA Mandiri`, `QRIS`, `Transfer Bank`) + tombol submit `Buat Pesanan` / `Place Order`.
    - **DIHAPUS TOTAL:** `ComplianceAgeSection`, seluruh state & validasi `buyerDob`, `clubKtaNumber`, `usagePurpose`, `age18Confirmed`, `legalDeclarationAccepted`.
  - **Kolom Kanan (`OrderSummaryPanel`):**
    - Hapus `SUMMARY // RINGKASAN PESANAN`, hapus badge `Verifikasi 18+ Aktif`, hapus kalimat footer panjang.
    - Tampilkan daftar item, subtotal, diskon voucher (jika ada), ongkos kirim, packing kayu (jika dicentang), dan total akhir.
  - **Tampilan Konfirmasi Invoice Setelah Order Berhasil:**
    - Hapus eyebrow `INVOICE DITERBITKAN // ...`, `PAYMENT // ...`, `LOGISTICS // ...`, badge `Usia 18+ Terverifikasi`, dan tombol `Pantau Status Pesanan` (`/order-lookup`).
    - Pertahankan nomor invoice + tombol salin, instruksi rekening/VA pembayaran + tombol salin, rincian item & total, tombol `Cetak Invoice` / `Print Invoice`, dan tautan `Kembali ke Katalog` / `Back to Shop` (`/store`).

### 4.5 Admin Operations Center (`/admin/*`)

Seluruh panel admin tetap fungsional 100% terhadap SQLite dan mendapat pembersihan V2 + dukungan penuh `ID / EN`:

1. **`AdminLayout.tsx` & `AdminLoginPage.tsx`:**
   - Tambahkan **Toggle Bahasa `ID / EN`** di sidebar desktop, topbar/drawer mobile, dan header `AdminLoginPage`, sejajar dengan tombol Theme Toggle.
   - Hapus label mikro `BRK // ADMIN`, `OPS CENTER`, dan `AUTH // ADMIN OPERATIONS CENTER` serta paragraf penjelasan panjang di bawah judul login.
   - Ganti label navigasi `Pengaturan & Hero Video` menjadi `Pengaturan` / `Settings`.
2. **Penghapusan Eyebrow Kode & 18+ di Semua Halaman Admin:**
   - `AdminDashboardPage.tsx`: Hapus `OPS-01 //`, `QUEUE-01 //`, `STOCK-02 //`, `METRIK-03 //`. Ganti header kolom `Pembeli & 18+` menjadi `Pembeli` / `Customer` dan hapus badge `18+ (X th)`.
   - `AdminOrdersPage.tsx`: Hapus `ORD-01 //`. Ganti kolom `Pelanggan & 18+` menjadi `Pelanggan` / `Customer` dan hapus badge `18+ (X th)`.
   - `OrderDetailDrawer.tsx`: Hapus `ORDER // INSPEKSI & TINDAKAN` dan **hapus seluruh Blok 2 (`Verifikasi Kepatuhan 18+ & Perpol No. 5/2018`)**.
   - `AdminProductsPage.tsx` & `ProductEditorModal.tsx`: Hapus `CAT-01 //`, `KONFIRMASI //`, teks `| Wajib 18+`, dan checkbox `requiresAge18` (default kirim `false` saat upsert). Ganti tab `Info Dasar & Kepatuhan` menjadi `Info Dasar` / `Basic Info`.
   - `AdminInventoryPage.tsx` & `StockAdjustModal.tsx`: Hapus `INV-01 //`, `INVENTORI //`, dan kalimat catatan kaki berulang.
   - `AdminVouchersPage.tsx` & `VoucherEditorModal.tsx`: Hapus `CFG-01 //`, `PROMO //`, `KONFIRMASI //`.
   - `MediaPickerModal.tsx`: Hapus `MEDIA // PUSTAKA ASET`.
3. **Pembaruan `AdminSettingsPage.tsx` (3 Tab V2):**
   - Hapus `CFG-02 //` dan hapus tab `Loadout Spotlight` serta formulir Video Hero + 10 Scene Telemetry.
   - **Tab 1: `Profil Toko & Maps` / `Store Profile & Maps`:** Nama toko, alamat, kota, jam operasional, WhatsApp, email, `mapsEmbedUrl`, `mapsDirectionsUrl`. (Hapus input `complianceNoticeShort`, `announcementEnabled`, `announcementText`).
   - **Tab 2: `Hero Slider` / `Hero Slider`:** Editor daftar slide statis Hero (`heroSlides`): pilih gambar dari `MediaPickerModal` (`mediaTypeFilter="image"`), input `headlineId`, `headlineEn`, `ctaLabelId`, `ctaLabelEn`, `ctaUrl`, tombol Naik/Turun, Tambah Slide, Hapus Slide (min 1, maks 8 slide).
   - **Tab 3: `Pengiriman & Inventori` / `Shipping & Inventory`:** Biaya packing kayu, default low-stock threshold, dan tabel tarif per zona wilayah.

---

## 5. Kontrak Data & Backend V2 (`shared/types.ts` + `server/*`)

### 5.1 Pembaruan Kontrak di `shared/types.ts`

Pertahankan kompatibilitas tipe yang masih dipakai Admin/Store, lalu tambahkan/perbarui tipe berikut:

```ts
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

export interface CategoryWithCount extends Category {
  activeProductCount: number;
  imageUrl: string;
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
```

Perbarui `SiteSettingsBundle`, `PublicSiteSettings`, `AdminSettingsUpdateRequest`, dan `BootstrapResponse`:
- Tambahkan `heroSlides: HeroSlideConfig[]` pada `SiteSettingsBundle`, `PublicSiteSettings`, dan `AdminSettingsUpdateRequest`.
- Tambahkan `featuredProducts: ProductSummary[]` pada `BootstrapResponse` (maksimal 8 produk aktif dengan `is_featured = 1`, urutan `p.id ASC`).
- Pertahankan `heroConfig`, `heroScenes`, `spotlightConfig` sebagai opsional/legacy di `SiteSettingsBundle` agar data lama tidak memicu crash JSON parse, sementara UI V2 hanya membaca/menulis `heroSlides`, `armoryProfile`, `shippingSettings`, dan `inventoryDefaults`.

### 5.2 Pembaruan Endpoint & Layanan Backend

1. **`server/services/orderService.ts`:**
   - **HAPUS** seluruh blok validasi usia 18+ (`if (requiresAge18) { ... AGE_VERIFICATION_FAILED ... }`) di dalam `createAtomicOrder`.
   - Saat menyimpan baris ke tabel `orders`, isi kolom legacy compliance dengan nilai netral aman: `requires_age_18 = 0`, `buyer_dob = NULL`, `buyer_age_years = NULL`, `age_18_confirmed = 0`, `sport_use_declaration = 0`, `club_kta_number = NULL`, `usage_purpose = NULL`. (Tidak perlu `ALTER TABLE` / merusak DB eksisting).
   - Bersihkan teks log status order (`Pembayaran telah diverifikasi oleh tim Brakasa Tactical.`, `Pesanan sedang dikemas dan siap dikirim.`) agar bebas istilah `kepatuhan 18+` dan `chronograph <= 2,0 Joule`.
   - Tetap pertahankan validasi ketat yang penting: stok atomik (`stock_qty >= qty`), batas kurir kargo darat/laut (`calculateShippingCost`), validasi voucher atomik, dan auto-restock saat order dibatalkan oleh admin.
2. **`server/routes/orders.ts`:**
   - Hapus route `POST /api/orders/lookup` dan `orderLookupSchema`.
   - Di `createOrderSchema`, hapus kewajiban field `compliance` (abaikan bila tidak dikirim).
3. **`server/routes/public.ts`:**
   - Hapus route `POST /api/loadout/evaluate` dan hapus import `server/services/loadoutService.ts` (hapus file `server/services/loadoutService.ts`).
   - Pada `GET /api/bootstrap`:
     - Sertakan `imageUrl` pada tiap item `categories` memakai peta kanonik 9 kategori (`CATEGORY_IMAGE_MAP`), dengan fallback ke gambar produk aktif pertama di kategori tersebut atau `/media/images/products/brk-ar-001.jpg`.
     - Sertakan `featuredProducts` (maksimal 8 produk `is_featured = 1`, aktif, belum dihapus).
     - Sertakan `settings.heroSlides` (diurutkan `sortOrder ASC`).
4. **`server/routes/adminSettings.ts`:**
   - Tambahkan validasi Zod `heroSlideSchema` (`id`, `imageUrl` via `safeUrlSchema`, `altId`, `altEn`, `headlineId`, `headlineEn`, `ctaLabelId`, `ctaLabelEn`, `ctaUrl` via `safeUrlSchema`, `sortOrder`) dan dukung simpan `heroSlides` ke `site_settings` key `'hero_slides'`.
   - Perluas `armoryProfileSchema` menerima `operatingHoursEn`, `mapsEmbedUrl` (wajib protokol `https://` yang aman), dan `mapsDirectionsUrl` (`https://`) sebagai field opsional.
5. **`server/db/seed.ts` & `server/db/helpers.ts`:**
   - Definisikan `SEED_HERO_SLIDES` (5 slide tajam dari `HERO_KEYFRAME_PATHS[0, 1, 4, 6, 9]`) dan masukkan via `INSERT OR IGNORE INTO site_settings (key, value_json) VALUES ('hero_slides', ...)`.
   - Tambahkan **migrasi idempoten V2** di `seedDatabase()` menggunakan kunci penanda `site_settings.key = 'v2_swarna_migrated'`:
     - Jika kunci `'v2_swarna_migrated'` belum ada, perbarui `armory_profile` untuk menyetel `announcementEnabled: false`, `announcementText: ''`, `complianceNoticeShort: ''`, `operatingHoursEn: 'Monday - Saturday, 10:00 - 19:00 WIB'`, `mapsEmbedUrl`, dan `mapsDirectionsUrl`, lalu tulis `'hero_slides'` dan kunci `'v2_swarna_migrated' = '{"version":2}'`.
     - Dengan cara ini, basis data `storage/brakasa.db` yang sudah ada di workspace langsung ter-upgrade bersih tanpa menghapus produk maupun riwayat pesanan!
6. **`server/middleware/htmlShell.ts`:**
   - Hapus cabang metadata untuk `/loadout-builder`, `/order-lookup`, `/orders/lookup`, dan `/compliance`.
   - Bersihkan `<title>` dan `<meta name="description">` untuk `/`, `/store`, `/checkout` agar bebas kata `18+`, `Perpol`, dan `Loadout Builder`:
     - `/`: `Brakasa Tactical | Airsoft & Tactical Gear`
     - `/store`: `Katalog | Brakasa Tactical`
     - `/checkout`: `Checkout | Brakasa Tactical`
   - Pada `/`, preload gambar slide pertama Hero (`heroSlides[0]?.imageUrl || '/media/images/hero/hero-scene-01.jpg'`) dengan `<link rel="preload" as="image" ... fetchpriority="high" />` dan `#hero-lcp-shell` berdimensi `height:100dvh;min-height:540px;` serta `<img id="hero-lcp-poster" width="2400" height="1350" ... />`.
7. **`index.html`:**
   - Tambahkan skrip inline sinkronisasi bahasa sebelum render tepat di bawah skrip tema agar `<html lang="...">` sesuai `localStorage.getItem('brakasa-lang')` sejak frame pertama tanpa FOUC.

---

## 6. Arsitektur Toggle Bahasa `ID / EN` (`LanguageContext` + Modular i18n)

Agar seluruh tim frontend bisa bekerja paralel tanpa konflik file kamus, sistem i18n dipisah menjadi 1 context inti + 3 modul kamus domain yang bertipe ketat (`TypeScript`):

### 6.1 `src/context/LanguageContext.tsx` (Dimiliki Track 2)

```ts
export type Language = 'id' | 'en';

export interface LanguageContextValue {
  lang: Language;
  setLang: (next: Language) => void;
  toggleLang: () => void;
  t: CommonDictionary;
  tr: (idText: string, enText: string) => string;
  getCategoryName: (slug: string, fallbackName?: string) => string;
}
```

Aturan perilaku:
- `STORAGE_KEY = 'brakasa-lang'`.
- Nilai awal dibaca dari `localStorage.getItem('brakasa-lang')` -> fallback ke atribut `<html lang>` -> default `'id'`.
- `useEffect` memperbarui `document.documentElement.setAttribute('lang', lang)` dan menyimpan ke `localStorage`.
- Mendengarkan event `window.addEventListener('storage', ...)` agar perubahan bahasa di satu tab sinkron ke tab lain.
- `LanguageProvider` membungkus `<App />` tepat di dalam `<ThemeProvider>` (sehingga seluruh rute publik dan admin dapat memanggil `useLanguage()`).

### 6.2 Pemisahan 3 Modul Kamus Bebas-Bentrok

| Modul Kamus | Pemilik | Ruang Lingkup Terjemahan (`id` & `en`) |
| :--- | :--- | :--- |
| `src/i18n/common.ts` | Track 2 (`v2-i18n-shell-lp`) | Navbar, dropdown kategori, 9 nama kategori, search modal, mobile menu, Hero default/controls, Featured Products, Featured Categories, Our Store + Maps, Footer, CartDrawer, CartContext announcements, StateViews (`Loading`/`Empty`/`Error`), NotFoundPage, label umum (`Tutup`/`Close`, `Batal`/`Cancel`, `Simpan`/`Save`), helper status stok & order (`format.ts`). |
| `src/i18n/store.ts` | Track 3 (`v2-store-checkout`) | `getStoreCopy(lang)`: StoreCatalogPage (header, toolbar, pagination, chips, empty/error), CatalogFilterPanel (semua label filter, platform, propulsion, sort options, preset FPS), ProductCard (`Habis`/`Sold Out`), ProductDetailPage (breadcrumb, buy box, stok, tombol keranjang, lightbox, deskripsi, isi paket, tabel spesifikasi 2 kolom & semua label parameter spek, produk terkait), CheckoutPage + ShippingCargoSection + OrderSummaryPanel (semua label form, placeholder, pesan validasi, metode pembayaran, voucher, zona/kurir, packing kayu, halaman invoice selesai). |
| `src/i18n/admin.ts` | Track 4 (`v2-admin`) | `getAdminCopy(lang)`: AdminLayout (grup menu & seluruh item sidebar, topbar mobile, profil peran, tombol tema/bahasa/storefront/keluar), AdminLoginPage, AdminDashboardPage, AdminProductsPage + ProductEditorModal, AdminInventoryPage + StockAdjustModal, AdminOrdersPage + OrderDetailDrawer, AdminVouchersPage + VoucherEditorModal, AdminSettingsPage (3 tab V2: Store Profile & Maps, Hero Slider, Shipping & Inventory), MediaPickerModal. |

### 6.3 Helper Format Terlokalisasi (`src/lib/format.ts`)

Perbarui helper di `src/lib/format.ts` agar menerima parameter opsional `lang: Language = 'id'` (tetap kompatibel dengan pemanggilan tanpa argumen kedua):
- `formatIdr(amount: number): string` -> `Rp 16.500.000` (konsisten IDR di kedua bahasa).
- `formatWeight(grams: number, lang?: Language): string` -> `2.850 g (2,85 kg)` (ID) / `2,850 g (2.85 kg)` (EN).
- `formatDateTimeId(isoString: string, lang?: Language): string` -> memakai locale `'id-ID'` atau `'en-GB'` dengan zona `Asia/Jakarta` + `WIB`.
- `getShippingClassLabel(cls: ShippingClass, lang?: Language): string` -> **hapus teks `(Unit Replika 18+)`**; gunakan ID: `Kargo Darat/Laut (Unit)` / EN: `Land/Sea Cargo (Unit)`.
- `getOrderStatusLabel(status: OrderStatus, lang?: Language): string` -> terjemahan lengkap 6 status pesanan (`Menunggu Pembayaran` / `Pending Payment`, `Pembayaran Diverifikasi` / `Payment Verified`, `Dikemas` / `Packed`, `Dikirim` / `Shipped`, `Selesai` / `Completed`, `Dibatalkan` / `Cancelled`).

---

## 7. Daftar Audit Penghapusan Over-Description & 18+ Per Berkas

Ringkasan target pembersihan yang wajib diselesaikan oleh tiap track:

1. **Seluruh file di `src/pages/` dan `src/components/`:**
   - 0 kemunculan `spec-index-row` (hapus definisi CSS-nya di `src/styles/global.css`).
   - 0 kemunculan prefix mikro `SEC-01`, `SEC-06`, `OPS-01`, `CAT-01`, `INV-01`, `ORD-01`, `CFG-01`, `CFG-02`, `QUEUE-01`, `STOCK-02`, `METRIK-03`, `BLOK 01`, `BLOK 03`, `BLOK 04`, `[BRK // 01]`, `AUTH //`, `STATUS //`, `MANIFEST //`, `PARAM //`, `OVERVIEW //`, `SUMMARY //`, `PAYMENT //`, `LOGISTICS //`, `ORDER //`, `PROMO //`, `MEDIA //`, `KONFIRMASI //`.
   - 0 kemunculan teks `18+`, `Perpol`, `Loadout Builder`, `Cek Pesanan`, `/loadout-builder`, `/order-lookup`, `/compliance` di seluruh kode UI publik dan admin.
2. **Backend (`server/`):**
   - `server/services/orderService.ts`: 0 penolakan `AGE_VERIFICATION_FAILED`.
   - `server/routes/orders.ts`: 0 route `/lookup`.
   - `server/routes/public.ts`: 0 route `/loadout/evaluate`.
   - `server/middleware/htmlShell.ts`: 0 metadata untuk rute yang dihapus, 0 teks `18+` / `Perpol`.

---

## 8. Pembagian File Bebas-Bentrok & Urutan Eksekusi Tim Engineer

Setiap file di repositori hanya boleh disentuh oleh **tepat satu** agent sesuai matriks di bawah ini.

### 8.1 Matriks Kepemilikan File Eksklusif

| Track / Agent | File Dimiliki (Edit / Create / Delete) | Ketergantungan |
| :--- | :--- | :--- |
| **Track 1: `v2-contracts-backend`** | **Edit:** `shared/types.ts`, `server/db/helpers.ts`, `server/db/seed.ts`, `server/services/orderService.ts`, `server/routes/public.ts`, `server/routes/orders.ts`, `server/routes/adminSettings.ts`, `server/middleware/htmlShell.ts`, `index.html`<br>**Delete:** `server/services/loadoutService.ts` | Tidak ada (Wave 1) |
| **Track 2: `v2-i18n-shell-lp`** | **Create:** `src/i18n/common.ts`, `src/context/LanguageContext.tsx`, `src/components/landing/HeroSliderSection.tsx`, `src/components/landing/FeaturedProductsCarousel.tsx`, `src/components/landing/FeaturedCategoriesGrid.tsx`, `src/components/landing/OurStoreSection.tsx`<br>**Edit:** `src/context/CartContext.tsx`, `src/lib/format.ts`, `src/styles/global.css`, `src/App.tsx`, `src/components/ui/StateViews.tsx`, `src/components/ui/TacticalIcons.tsx`, `src/components/layout/SiteLayout.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/CartDrawer.tsx`, `src/pages/LandingPage.tsx`<br>**Delete:** `src/components/landing/HeroVideoSection.tsx`, `src/components/landing/ShopByMissionSection.tsx`, `src/components/landing/LoadoutSpotlightSection.tsx`, `src/components/landing/FieldVideoShowcaseSection.tsx`, `src/components/landing/CompliancePreviewSection.tsx` | Membaca kontrak `shared/types.ts` (Bagian 5.1) dan `ProductCardProps` (`{ product, priorityImage? }`) |
| **Track 3: `v2-store-checkout`** | **Create:** `src/i18n/store.ts`<br>**Edit:** `src/components/store/ProductCard.tsx`, `src/components/store/CatalogFilterPanel.tsx`, `src/components/store/ProductGallery.tsx`, `src/components/store/SpecSheetTable.tsx`, `src/pages/StoreCatalogPage.tsx`, `src/pages/ProductDetailPage.tsx`, `src/pages/CheckoutPage.tsx`, `src/components/checkout/ShippingCargoSection.tsx`, `src/components/checkout/OrderSummaryPanel.tsx`<br>**Delete:** `src/pages/LoadoutBuilderPage.tsx`, `src/pages/OrderLookupPage.tsx`, `src/pages/CompliancePage.tsx`, `src/components/checkout/ComplianceAgeSection.tsx`, `src/components/store/CompatibilityCallout.tsx`, `src/components/loadout/LoadoutManifestPanel.tsx`, `src/components/loadout/LoadoutSlotCard.tsx`, `src/components/loadout/ProductPickerModal.tsx` | Menggunakan `LanguageContext` (Track 2) & `shared/types.ts` (Track 1) |
| **Track 4: `v2-admin`** | **Create:** `src/i18n/admin.ts`<br>**Edit:** `src/components/admin/AdminLayout.tsx`, `src/components/admin/OrderDetailDrawer.tsx`, `src/components/admin/ProductEditorModal.tsx`, `src/components/admin/StockAdjustModal.tsx`, `src/components/admin/VoucherEditorModal.tsx`, `src/components/admin/MediaPickerModal.tsx`, `src/pages/admin/AdminLoginPage.tsx`, `src/pages/admin/AdminDashboardPage.tsx`, `src/pages/admin/AdminProductsPage.tsx`, `src/pages/admin/AdminInventoryPage.tsx`, `src/pages/admin/AdminOrdersPage.tsx`, `src/pages/admin/AdminVouchersPage.tsx`, `src/pages/admin/AdminSettingsPage.tsx` | Menggunakan `LanguageContext` (Track 2) & `shared/types.ts` (Track 1) |
| **Track 5: `v2-qa-verifier`** | **Edit:** `tests/verify_api_security.mjs`, `tests/browser_clickthrough.mjs`<br>**Create:** `docs/qa/03-V2-OVERHAUL-VERIFICATION.md` | Wave 3 (setelah Wave 1 & Wave 2 selesai + `npm run typecheck && npm run build`) |

### 8.2 Gelombang Eksekusi yang Disarankan

1. **Wave 1 (Paralel Penuh):** `v2-contracts-backend` + `v2-i18n-shell-lp` berjalan bersamaan.
   - Keduanya saling bersepakat pada kontrak eksak di Bagian 5.1 dan Bagian 6.1 dokumen ini.
   - Catatan penting: `v2-i18n-shell-lp` mengimpor `ProductCard` (`{ product, priorityImage? }`) yang sudah ada di repo; `v2-store-checkout` akan merampingkan implementasinya pada Wave 2 tanpa mengubah signature props.
2. **Wave 2 (Paralel Penuh setelah Wave 1 selesai):** `v2-store-checkout` + `v2-admin` berjalan bersamaan.
   - Keduanya sudah memiliki `shared/types.ts`, `LanguageContext.tsx`, dan `src/i18n/common.ts` yang aktif sehingga masing-masing bisa langsung menjalankan `npm run typecheck` secara bersih.
3. **Wave 3 (Build & Verifikasi End-to-End):** `v2-qa-verifier` menjalankan `npm run typecheck`, `npm run build`, memperbarui skrip QA V2, lalu memverifikasi seluruh gerbang berikut.

---

## 9. Kriteria Penerimaan & Gerbang Verifikasi QA V2

Seluruh butir berikut wajib PASS 100% di browser nyata (Desktop `1440x900`, Tablet `768x1024`, Mobile `390x844`) pada mode **Armory Dark** dan **Field Paper Light**, serta dalam bahasa **ID** dan **EN**:

1. **Build & Static Checks:**
   - `npm run typecheck` dan `npm run build` keluar dengan kode `0` tanpa warning/error TypeScript.
   - `0` karakter em dash / en dash di seluruh `shared/`, `server/`, `src/`.
   - `0` pelanggaran `rounded-full` / `rounded-2xl` / `9999px` / `border-radius: 50%`.
   - `0` teks mikro (`SEC-01 //`, `OPS-01 //`, `[BRK // 01]`, `[SCN-`, `BLOK 01`, `spec-index-row`) dan `0` teks `18+` / `Perpol` di seluruh UI ter-render.
2. **Hero Full-Screen (`100dvh`) & 4 Seksi Landing Page:**
   - Tinggi Hero terukur `>= 98%` dari tinggi viewport (`100dvh`), nol `<video>` di Hero, nol tombol Pause/Audio, nol strip scene di bawah Hero, pagination dots berada di dalam bingkai Hero dan klik dot berpindah slide secara deterministik.
   - Urutan DOM Landing Page tepat: Hero Slider -> Featured Products Carousel -> Featured Categories Grid -> Our Store dengan iframe Google Maps (`width` & `height` eksplisit, `src` valid) -> Footer.
   - Kartu produk di Carousel dan `/store` hanya menampilkan foto, nama produk, dan harga (nol micro-spec, nol badge ramai, nol deskripsi kecil).
   - Klik salah satu dari 9 kartu kategori di Landing Page mengarahkan ke `/store?category=<slug>` dan menyaring daftar produk secara akurat.
3. **Penghapusan Fitur & Alur Checkout Tanpa 18+:**
   - Navigasi ke `/loadout-builder`, `/order-lookup`, `/compliance` menampilkan `NotFoundPage` (tidak ada tautan menuju 3 rute tersebut di navbar, footer, PDP, cart, maupun checkout).
   - `POST /api/loadout/evaluate` dan `POST /api/orders/lookup` mengembalikan `404 API_NOT_FOUND`.
   - `POST /api/orders` untuk unit replika (mis. `BRK-AR-002`) **BERHASIL `201 Created` tanpa mengirim field `compliance` / `buyerDob`** sambil tetap mengurangi stok SQLite secara atomik dan menegakkan aturan kurir kargo darat/laut.
4. **Toggle Bahasa `ID / EN` & Dual Theme:**
   - Klik toggle `ID / EN` di navbar langsung mengubah `<html lang="en">` / `<html lang="id">`, menerjemahkan navigasi, hero, judul seksi, nama kategori, filter katalog, PDP, cart drawer, checkout, our store, footer, dan panel admin, serta bertahan setelah reload halaman (`localStorage` `brakasa-lang`).
   - Toggle `Armory Dark` <-> `Field Paper Light` berjalan mulus di semua halaman publik dan admin tanpa masalah kontras teks maupun overflow horizontal (`scrollWidth <= innerWidth`).
5. **Admin Panel V2:**
   - Login admin, kelola produk/stok/pesanan/voucher, dan simpan perubahan **Hero Slider** serta **Profil Toko & Maps** di `/admin/settings` tersimpan ke SQLite dan langsung tercermin di halaman depan `/`.
