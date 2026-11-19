# DESIGN.md: Sistem Desain Visual & Identitas Brand Brakasa Tactical (V2)

Dokumen ini adalah sumber arah visual tunggal (*single source of visual truth*) untuk seluruh antarmuka **Brakasa Tactical V2** (Landing Page 4 Seksi bergaya Swarna Tactical, Storefront Katalog, Product Detail Page, Cart Drawer, Guest Checkout, serta Admin Operations Center) dalam dukungan penuh dua bahasa (**Indonesia / English**) dan dua tema (**Armory Dark / Field Paper Light**).

Perombakan V2 menyelaraskan kebersihan tata letak dan arsitektur informasi dengan referensi [Swarna Tactical](docs/research/05-swarna-tactical-teardown.md) sembari **mempertahankan 100% sistem warna dual-theme, kontras WCAG AA terverifikasi, dan trio tipografi resmi Brakasa Tactical**, serta patuh penuh pada standar `antislop` (`R-01` s.d. `R-40`, `R-31`, `R-37`).

---

## 1. Identitas Brand & Aturan Wordmark (Patuh R-23)

### 1.1 Posisi & Karakter Visual Brand
- **Nama Resmi:** BRAKASA TACTICAL
- **Arketipe Visual:** *Industrial Precision Armory & Field Gear* (toko spesialis airsoft dan perlengkapan taktis lapangan Indonesia).
- **Kepribadian Desain:** Presisi mekanis, bersih, lugas, tahan banting, dan tanpa teks berlebih (*zero over-description*). Referensi material lahir dari logam anodized matte, kertas manual lapangan hangat, tekstil Cordura olive/coyote, dan aksen kuningan industri.
- **Anti-Klise (R-30):** Tidak meniru templat SaaS startup dan tidak memakai warna merah/kuning Swarna; identitas warna tetap eksklusif milik Brakasa Tactical.

### 1.2 Spesifikasi Wordmark Tipografi (Tanpa Maskot Palsu)
Sesuai aturan **`R-23`**, sistem ini tidak menggunakan logo maskot, tengkorak, perisai heraldik, atau siluet senjata karangan:
1. **Primary Horizontal Wordmark (Navbar & Footer):**
   - Struktur teks: `BRAKASA // TACTICAL`
   - `BRAKASA`: `Barlow Condensed`, Weight `700`, Uppercase, `letter-spacing: 0.04em`, warna `var(--text-primary)` (atau `#F0EFEA` terkunci saat navbar berada di atas Hero).
   - `//`: Pemisah indeks presisi, `IBM Plex Mono`, Weight `600`, warna `var(--accent-text)` (`#EBAC3B` di Dark / `#8A4D04` di Light).
   - `TACTICAL`: `IBM Plex Mono`, Weight `500`, Uppercase, `letter-spacing: 0.08em`, warna `var(--text-secondary)`.
2. **Tata Kelola Aset Non-Produk (`R-23` & `R-38`):**
   - Tidak ada blok testimoni rekaan, tidak ada bar logo klien fiktif, tidak ada angka metrik palsu, dan tidak ada label mikro kode dekoratif (`SEC-01 //`, `OPS-01 //`, `[BRK // 01]`).

---

## 2. Design Read, Liveliness Dials & Identity Motif (`antislop` R-37)

### 2.1 Deklarasi Resmi Design Read & Three Dials (V2)

| Zona Produk | Deklarasi Design Read Resmi | ENERGY | RHYTHM | MOTION | Karakter Eksekusi V2 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Landing Page (`/`)** | *"Reading this as: clean Swarna-paced tactical flagship showcase and e-commerce storefront for airsoft and field gear buyers, in a tactile-industrial Brakasa armory palette, dial ENERGY 3 / RHYTHM 3 / MOTION 1."* | **3** (Bold) | **3** (Varied) | **1** (Calm / Deliberate) | Hero foto diam 1 layar penuh (`100dvh`) tanpa video/goyang/auto-loop; diikuti 3 seksi kontras bentuk: Carousel Produk Unggulan 3-elemen, Grid 9 Kategori `aspect-[4/3]`, dan split penuh Our Store + Google Maps. |
| **Storefront, PDP & Checkout (`/store`, `/store/:slug`, `/checkout`)** | *"Reading this as: uncluttered, fast-scanning tactical hardware catalog, spec-sheet PDP, and friction-free single-step guest checkout, dial ENERGY 2 / RHYTHM 2 / MOTION 1."* | **2** (Balanced) | **2** (Structured) | **1** (Tactile States Only) | Kartu katalog super bersih (hanya foto, nama, harga); sidebar filter kiri + mobile sheet; PDP 2 kolom (galeri + lightbox kiri, buy box kanan, deskripsi & tabel spesifikasi 2 kolom rapi di bawah); guest checkout langsung tanpa gerbang usia. |
| **Admin Operations Center (`/admin/*`)** | *"Reading this as: operational catalog, inventory, order fulfillment, and showroom settings console for Brakasa Tactical staff, in a high-legibility industrial dispatch style, dial ENERGY 1 / RHYTHM 1 / MOTION 1."* | **1** (Calm) | **1** (Uniform) | **1** (Functional Feedback Only) | Ketenangan operasional, tabel padat data nyata SQLite, toggle bahasa `ID / EN` & tema di seluruh panel, tanpa label mikro kode. |

### 2.2 Identity Motif Brakasa V2 (Lolos Uji Tukar Logo R-20)
1. **Tangga Permukaan Gunmetal / Field Paper + Garis Hairline 1px:** Tanpa kartu berbayangan (*zero card shadow*), kedalaman dibentuk oleh `--bg-canvas` -> `--bg-surface` -> `--bg-elevated` dengan garis tipis `1px solid var(--border-subtle)`.
2. **Geometri Tajam Anti-Pill (`0px / 2px / 4px / 6px`):** Sudut tegas pada kartu (`2px`), kontrol (`4px`), dan overlay (`6px`) membedakan Brakasa dari antarmuka pill membulat generik.
3. **Kolom Harga & Spesifikasi `tabular-nums` Terkunci:** Seluruh harga Rupiah, tabel spesifikasi PDP, jumlah item, stok, dan data inventori selalu memakai `IBM Plex Mono` dengan `font-variant-numeric: tabular-nums`.

---

## 3. Sistem Warna Dual-Theme Terverifikasi Kontras (`Armory Dark` & `Field Paper Light`)

### 3.1 Disiplin Palet (Patuh R-29, R-33, R-34)
Palet aktif Brakasa Tactical dipertahankan 100% di `src/styles/tokens.css` (2 Warna Inti Brand + 1 Aksen Tunggal di atas fondasi netral):
- **Armory Dark (`:root`, `[data-theme="dark"]`):**
  - Fondasi Netral: `--bg-canvas: #0F1110`, `--bg-surface: #171A18`, `--bg-elevated: #1F2421`, `--text-primary: #F0EFEA`, `--text-secondary: #B5BBB3`, `--text-muted: #949C93`.
  - Border: `--border-subtle: #2E3430`, `--border-strong: #7A847D`.
  - Aksen Tunggal: `--accent-primary: #E5A024` (Signal Amber), `--accent-hover: #F0AE38`, `--accent-foreground: #121412` (`8.27:1 PASS`), `--accent-text: #EBAC3B`, `--focus-ring: #EBAC3B`.
  - Brand Inti: Ranger Olive (`#334434` / `#94B891`) dan Coyote Earth (`#5A4A35` / `#C7B293`).
- **Field Paper Light (`[data-theme="light"]`):**
  - Fondasi Netral: `--bg-canvas: #F2EFE9`, `--bg-surface: #FAF8F4`, `--bg-elevated: #E6E1D8`, `--text-primary: #181A18`, `--text-secondary: #424741`, `--text-muted: #595E56`.
  - Border: `--border-subtle: #CEC8BC`, `--border-strong: #6B665C`.
  - Aksen Tunggal: `--accent-primary: #8C4F04` (Burnt Amber), `--accent-hover: #754103`, `--accent-foreground: #FAF8F4` (`6.12:1 PASS`), `--accent-text: #8A4D04`, `--focus-ring: #8A4D04`.
  - Brand Inti: Ranger Olive (`#334434` / `#2F4230`) dan Coyote Earth (`#664D2C`).
- **Aturan Hero & Navbar Overlay Lintas Tema (`R-34`):**
  - Kontainer Hero (`.hero-armory`) dan Navbar saat berada di puncak `/` (`scrollY <= 10`, `.navbar-hero-overlay`) selalu mengunci permukaan gelap (`#0F1110` / `rgba(15, 17, 16, 0.72)`) serta teks terang `#F0EFEA` dan tombol `#E5A024` di kedua mode tema agar kontras di atas foto Hero selalu lolos WCAG AA (`>= 9.65:1`).

### 3.2 Ringkasan Verifikasi Kontras Empiris (`contrast-check.py`, Patuh R-25)
- **Armory Dark:** `--text-primary` on canvas `16.46:1`, `--text-secondary` on surface `8.96:1`, `--text-muted` on surface `6.21:1`, `--accent-foreground` on `--accent-primary` `8.27:1`, `--border-strong` on elevated `4.07:1` (semua PASS).
- **Field Paper Light:** `--text-primary` on surface `16.50:1`, `--text-secondary` on surface `8.96:1`, `--text-muted` on elevated `5.10:1`, `--accent-foreground` on `--accent-primary` `6.12:1`, `--border-strong` on elevated `4.38:1` (semua PASS).
- **Hero Scrim Worst-Case (`rgba(15, 17, 16, 0.82)`):** Hero H1 `#F0EFEA` `9.65:1 PASS`, tombol CTA `#E5A024` `4.97:1 PASS`.
- **Kombinasi Terlarang:** Teks putih di atas `#E5A024` (`2.24:1 FAIL`); tombol `#E5A024` di atas kanvas terang `#F2EFE9` (`1.95:1 FAIL`).

---

## 4. Tipografi, Radius, Elevasi, Motion & Internasionalisasi (`ID / EN`)

- **Trio Font Non-Blocking (`R-06`, `R-40`):**
  - Display (`h1`, `h2`): `Barlow Condensed` (600, 700), skala `clamp()`.
  - UI & Body: `IBM Plex Sans` (400, 500, 600).
  - Data Numerik & Harga: `IBM Plex Mono` (400, 500, 600) dengan `tabular-nums`.
- **Skala Radius Anti-Pill (`R-11`):**
  - `0px` (`--radius-none`): Navbar sticky, garis pembatas, sel tabel.
  - `2px` (`--radius-plate`): Kartu produk, kartu kategori, badge status, indikator aktif.
  - `4px` (`--radius-control`): Tombol aksi, input form, tombol panah, dan pagination dots Hero (`h-2 w-2 rounded-[4px]` nonaktif / `h-2 w-7 rounded-[4px]` aktif di dalam target tap `>= 44x44px`).
  - `6px` (`--radius-overlay`): Modal pencarian, dropdown kategori, Cart Drawer, dan Mobile Sheet.
  - **Dilarang keras:** `rounded-full`, `rounded-2xl`, `rounded-3xl`, `9999px`, atau `border-radius: 50%`.
- **Elevasi, Glass & Glow (`R-10`, `R-12`, `R-13`):**
  - 0 shadow pada kartu produk/kategori; `var(--shadow-overlay)` hanya untuk Modal, Drawer, dan Dropdown.
  - Maksimal 1 elemen `backdrop-filter: blur(8px)` per viewport (sticky navbar).
  - 0 glow dekoratif dan 0 tekstur grid latar.
- **Gerak & `prefers-reduced-motion` (`R-19`, `R-39`):**
  - Hero slide gambar diam tanpa Ken-Burns, tanpa goyang, dan tanpa timer auto-loop tak berujung; pergantian slide terjadi secara deterministik via pagination dots, panah kiri/kanan, keyboard arrow, dan swipe mobile dengan crossfade opacity bersih.
  - Seluruh transisi otomatis diturunkan ke `0.01ms` saat `prefers-reduced-motion: reduce`.
- **Internasionalisasi `ID / EN` (`LanguageContext`):**
  - Persistensi `localStorage` (`brakasa-lang`), sinkron atribut `<html lang="id|en">`, dan toggle langsung di Navbar desktop, Mobile Drawer, serta Admin Panel.

---

## 5. Arsitektur 4 Seksi Landing Page V2 & Shell Navigasi Swarna

1. **Header Sticky 3 Zona (`Navbar.tsx`):**
   - Kiri: Wordmark `BRAKASA // TACTICAL`.
   - Tengah (Desktop `>= 1024px`): `Belanja`/`Shop`, dropdown `Kategori`/`Categories` (hover grace-delay `180ms` + bridge + klik + Escape untuk 9 kategori), `Unggulan`/`Featured` (`/#featured-products`), `Toko Kami`/`Our Store` (`/#our-store`).
   - Kanan: Search Modal (`Ctrl+K`), Toggle Bahasa `ID | EN`, Theme Toggle (`Armory Dark` / `Field Paper Light`), Cart Drawer Trigger + badge jumlah, serta tombol `Menu` untuk Mobile Drawer (`< 1024px`).
   - Tanpa top announcement bar agar Hero langsung menempel dari `y = 0`.
2. **Seksi 1: Full-Screen Hero Image Slider (`HeroSliderSection.tsx`):**
   - Tinggi penuh 1 layar (`100dvh`, `min-h-[540px]`, `max-h-[1080px]`, `-mt-[56px] lg:-mt-[68px]`).
   - 5 foto resolusi `2400x1350` diam tanpa video/goyang/Ken-Burns, hanya `<h1>` + 1 CTA primer + pagination dots di dalam bingkai bawah Hero + panah kiri/kanan. Tanpa eyebrow atas, tanpa paragraf bawah, tanpa strip scene, tanpa tombol jeda/suara.
3. **Seksi 2: Featured Products Carousel (`FeaturedProductsCarousel.tsx`):**
   - Tepat di bawah Hero (`#featured-products`), header 1 baris bersih (`<h2>` + tombol Prev/Next + tautan `Lihat Semua`/`View All`).
   - Track scroll-snap horizontal (2 kartu mobile, 3 tablet, 4 desktop, maks 8 produk).
   - Setiap kartu menampilkan **HANYA foto (`aspect-[4/3]`), nama produk (`line-clamp-2`), garis pemisah tipis, dan harga Rupiah** (opsional label tenang `Habis`/`Sold Out` hanya bila stok 0).
4. **Seksi 3: Featured Categories Grid (`FeaturedCategoriesGrid.tsx`):**
   - Di bawah carousel produk (`#categories`), hanya `<h2>` + grid simetris `grid-cols-2 md:grid-cols-3` untuk 9 kategori.
   - Setiap kartu `aspect-[4/3]` menampilkan **HANYA foto kategori + nama kategori** di atas scrim bawah dan langsung mengarah ke `/store?category=<slug>`.
5. **Seksi 4: Our Store & Google Maps (`OurStoreSection.tsx`):**
   - Layout split penuh (`#our-store`) di atas Footer: panel info showroom (alamat, jam operasional, WhatsApp, tombol `Buka Google Maps`/`Get Directions`) + foto showroom di kiri, berdampingan dengan embed interaktif Google Maps `<iframe>` (`width={800} height={450}` + `title`) di kanan.
6. **Footer Ringkas 4 Kolom (`Footer.tsx`) & Cart Drawer (`CartDrawer.tsx`):**
   - Footer 4 kolom bersih (Brand, Belanja/Shop, Jelajah/Explore, Kontak/Contact) + bottom bar hak cipta 1 baris.
   - Cart Drawer kanan bersih (header, daftar item, kontrol jumlah `>= 44px`, subtotal, tombol `Checkout`) tanpa blok verifikasi 18+ maupun esai kargo panjang.

---

## 6. Tabel Alasan Satu Kalimat (Wajib R-31)

| Keputusan Desain | Pilihan Spesifik | Alasan Satu Kalimat (`R-31`) |
| :--- | :--- | :--- |
| **Palet Warna & Dual-Theme (`R-29`, `R-34`)** | Netral `Armory Dark` / `Field Paper Light` + Ranger Olive + Coyote Earth + 1 aksen Signal/Burnt Amber | Menjaga identitas material industrial Brakasa yang lulus kontras WCAG AA di kedua mode sambil mengadopsi tata letak bersih Swarna Tactical. |
| **Tipografi Trio (`R-06`)** | `Barlow Condensed`, `IBM Plex Sans`, `IBM Plex Mono` (`tabular-nums`) | Memberikan hierarki judul tegas, keterbacaan UI bilingual yang nyaman, dan perataan angka harga serta spesifikasi yang presisi. |
| **Hero 100dvh Statis (`R-05`, `R-39`)** | Foto tajam `2400x1350` diam + crossfade manual lewat pagination dots/panah/swipe | Menghadirkan kesan flagship layar penuh yang tenang tanpa guncangan visual, tanpa gangguan tombol jeda/suara, dan patuh aksesibilitas gerak. |
| **Navigasi 3 Zona Swarna (`R-03`, `R-32`)** | Wordmark kiri, 4 menu utama + dropdown kategori tengah, utilitas Search/`ID|EN`/Tema/Cart kanan | Mempercepat akses langsung ke kategori katalog dan perpindahan bahasa maupun tema tanpa memenuhi layar dengan pita pengumuman atau rute usang. |
| **Kartu Produk 3-Elemen (`R-14`)** | Foto `aspect-[4/3]` + nama produk `line-clamp-2` + harga Rupiah saja | Membiarkan foto produk berbicara dan mempercepat pemindaian katalog serta carousel beranda tanpa kebisingan badge atau micro-spec. |
| **Grid 9 Kategori Simetris (`R-05`)** | Grid `2/3` kolom `aspect-[4/3]` dengan foto dan nama kategori saja | Membentuk komposisi 3x3 yang seimbang dan memotong jarak klik dari beranda langsung ke daftar katalog terfilter kategori. |
| **Our Store Split + Google Maps (`R-05`, `R-40`)** | Split showroom info + foto + `<iframe>` Google Maps berdimensi eksplisit | Membangun kepercayaan toko fisik lokal secara langsung di atas footer dengan navigasi arah satu klik dan nol pergeseran tata letak (CLS). |
| **Border-Radius & Elevasi (`R-11`, `R-12`)** | Skala `0px / 2px / 4px / 6px`, kartu datar tanpa shadow, pagination dots `rounded-[4px]` | Mempertahankan karakter instrumen mekanis anti-pill sekaligus memisahkan secara jelas permukaan data datar dari modal atau drawer melayang. |
| **Penghapusan Over-Description & 18+ (`R-15`)** | Nol label `SEC-XX //`, nol gerbang usia/Perpol, nol Loadout Builder & Order Lookup | Memangkas friksi belanja dan teks berulang sehingga setiap layar hanya memuat elemen yang benar-benar membantu pembeli memilih dan checkout. |
| **Tombol Kembali PDP (`R-08`, `R-31`)** | Ikon chevron kiri (`IconChevronLeft`) + label `Kembali`/`Back` dalam tombol sekunder `>= 44x44px` (`--radius-control`) | Memberikan penanda arah balik yang langsung dikenali tanpa hiasan berlebih agar pembeli cepat kembali ke posisi katalog terfilter atau fallback aman ke `/store`. |
