# Teardown Referensi UX/UI & Arsitektur Layout: Swarna Tactical

Dokumen ini menyajikan pembedahan empiris atas struktur layout, navigasi, arsitektur informasi, komponen UI, serta pola interaksi dari **[Swarna Tactical](https://swarnatactical.com/)** beserta situs pendamping resminya **[Apparel Swarnatactical Lifestyle](https://apparel.swarnatactical.com/)**. Seluruh temuan diambil langsung dari inspeksi HTML SSR, stylesheet, bundle komponen Next.js produksi, dan payload publik yang dimuat oleh situs aktif `swarnatactical.com`.

Tujuan utama dokumen ini adalah menjadi cetak biru referensi layout dan kebersihan UX/UI untuk perombakan **Brakasa Tactical V2**, dengan tetap mempertahankan sistem warna dual-theme asli Brakasa Tactical (`Armory Dark` `#0F1110`, `Field Paper Light` `#F2EFE9`, aksen `Signal Amber` `#E5A024` / `Burnt Amber` `#8C4F04`, dan `Ranger Olive` `#334434`).

---

## Ringkasan Profil Teknis & Estetika Swarna Tactical

| Aspek | Temuan Empiris di `swarnatactical.com` | Temuan Tambahan di `apparel.swarnatactical.com` | Arah Adopsi untuk Brakasa Tactical V2 |
| :--- | :--- | :--- | :--- |
| **Stack & Rendering** | Next.js App Router (Turbopack), Tailwind CSS, Radix UI / shadcn (`Drawer` Vaul, `Sheet`, `Accordion`, `Select`), Embla Carousel, `next-intl` | Ekosistem Next.js yang sama, fokus fashion/apparel taktis dengan tipografi editorial lebih besar | Tetap gunakan React + Vite + Tailwind + SQLite Brakasa; terapkan disiplin komponen dan proporsi ruangnya |
| **Tipografi** | `Chakra Petch` (`font-chakra`) + `Poppins`; heading uppercase `font-extrabold tracking-tight` | `Chakra Petch` + Sans display uppercase tegas | Pertahankan tipografi Brakasa (`Barlow Condensed`, `IBM Plex Sans`, `IBM Plex Mono`) dengan skala heading ringkas dan lugas |
| **Breakpoint Navigasi** | Custom breakpoint `navbar: 62rem` (`992px`) untuk transisi desktop-mobile | Breakpoint standar `lg` (`1024px`) | Gunakan `lg` (`1024px`) sebagai batas bar desktop penuh vs mobile drawer |
| **Palet Warna Situs Referensi** | Permukaan terang `#FFFFFF`, teks `#333333`, border `#D9D9D9`, aksen merah `#E7181C`, navbar gelap `#0D0D0D`, footer `bg-gray-800` | Header putih sticky, utility bar hitam, aksen kuning `#FACC15` di footer | **Jangan tiru warna merah/kuning Swarna.** Pertahankan token warna resmi Brakasa (`Armory Dark` / `Field Paper Light` + `Signal Amber` / `Burnt Amber` + `Ranger Olive`) |
| **Prinsip Kepadatan Informasi** | Kartu produk hanya memuat foto, judul (2 baris), dan harga; nol paragraf penjelasan di atas/bawah kartu | Kartu kategori hanya foto 1:1 dan 1 baris nama kategori tanpa deskripsi atau badge | Adopsi 100% prinsip minim teks; hapus seluruh eyebrow kode (`SEC-01 // ...`) dan over-description di semua halaman |
| **Sistem Bahasa** | Multi-bahasa via `next-intl` (`id` Indonesia, `en` English, `ko`) dengan toggle langsung di navbar & mobile drawer | Konten mayoritas ID/EN | Adopsi toggle bahasa penuh **`ID / EN`** (`LanguageContext`) dengan persistensi `localStorage` dan sinkronisasi `<html lang>` |

---

## 1. Header & Navigasi Swarna Tactical

### 1.1 Struktur Bar & Perilaku Sticky/Transparan

Pada `swarnatactical.com`, seluruh navigasi dibungkus dalam elemen `<nav>` yang menempel di puncak layar dan tetap transparan gelap agar menyatu di atas media Hero full-screen:

- **Posisi & Z-Index:** `sticky top-0 left-0 right-0 z-50`.
- **Perilaku Scroll (`window.scrollY > 10`):**
  - Saat berada di puncak halaman (`scrollY <= 10`): latar gelap semi-transparan `bg-[#0D0D0D]/75`.
  - Saat pengguna mulai menggulir (`scrollY > 10`): aktifkan `backdrop-blur-sm shadow-lg` dengan permukaan kaca gelap (`bg-[#0D0D0D]/75` pada wrapper dan `bg-[#0D0D0D]/25` pada lapisan dalam) sehingga konten di belakangnya terlihat halus tanpa mengurangi keterbacaan tautan putih.
- **Tinggi Bar:** `h-14` (`56px`) pada mobile/tablet di bawah `992px`, dan `navbar:h-20` (`80px`) pada desktop (`>= 992px`), dengan padding horizontal `px-4 sm:px-6 lg:px-12`.
- **Top Utility Strip (Opsional di Swarna):** Swarna memasang strip tipis hitam (`bg-black border-b border-white/10 py-2 text-[10px] md:text-[11px] uppercase tracking-[0.3em]`) hanya untuk lintas-tautan ke subdomain `Apparel Swarnatactical`. Untuk Brakasa Tactical V2 yang merupakan satu toko terpadu, utility strip ini **tidak diperlukan** agar Hero benar-benar mendapat ruang penuh 1 layar (`100dvh`) dan header tetap ramping 1 baris.

### 1.2 Pembagian 3 Zona Horizontal (Desktop `>= 992px`)

```text
+---------------------------------------------------------------------------------------------------+
| [LOGO KIRI (w-1/6)]   |   [MENU UTAMA TENGAH (flex-1 justify-center)]   |   [UTILITAS KANAN]      |
|  Wordmark / Logo      |   Shop v | Kategori v | Produk | Our Store      | [Search] [Cart] [ID/EN] |
+---------------------------------------------------------------------------------------------------+
```

1. **Zona Kiri (Logo / Wordmark):**
   - Lebar proporsional `w-1/6 flex-shrink-0`.
   - Logo mengarah langsung ke `/` (`h-8 navbar:h-14 w-auto`).
2. **Zona Tengah (Menu Utama + Dropdown Kategori/Koleksi):**
   - Container: `hidden navbar:flex items-center justify-center flex-1 gap-8`.
   - Susunan 5 menu top-level aktual di `swarnatactical.com` (semuanya ringkas, `uppercase text-xs font-medium tracking-wide whitespace-nowrap shrink-0`):
     1. **Fire Arms** (dropdown 4 kaliber -> merek -> model unit)
     2. **Shop By Categories** (dropdown 6 kategori induk: *Handgun Accessories*, *Optics*, *Rifle Accessories*, *Tactical Apparel & Bags*, *Tactical, Combat & Survival Gear*, *Gift & Souvenir* -> subkategori level 2)
     3. **Shop By Guns** (dropdown 7 platform: *Handgun*, *Rifle*, *PCC / AR 9*, *Shotguns*, *SMG*, *Sniper Rifle*, *Archery & Crossbow*)
     4. **Brands** (tautan langsung ke `/brands`)
     5. **Promotions** (dropdown: *Single Sale*, *Bundle Promo*, *Buy 2 Get 1*)
   - **Mekanisme Dropdown Multi-Level (`tQ` & `tG`):**
     - Terbuka via **hover** (dengan *grace timeout* `200ms` di level 1 dan `150ms` di sub-menu agar tidak langsung tertutup saat kursor berpindah diagonal) maupun **klik** untuk aksesibilitas keyboard.
     - Menggunakan *invisible bridge* (`absolute -top-2 left-0 right-0 h-2 bg-transparent`) di atas panel dropdown sehingga tidak ada celah mati saat kursor turun dari label menu ke isi panel.
     - Panel dropdown gelap (`bg-[#1a1a1a] border-gray-700 min-w-[250px]`, sub-panel `min-w-[200px]`), chevron berputar `rotate-180 duration-200` saat aktif.
   - Sebagai pembanding, pada `apparel.swarnatactical.com`, susunan desktop dibuat lebih minimalis lagi memakai grid 3 kolom (`lg:grid-cols-3`): 3 item kiri (`Shop`, `Categories v`, `Promotions v`), logo di tengah, dan inline search + ikon Account + ikon Cart di kanan.
3. **Zona Kanan (Ikon Utilitas & Kontrol):**
   - **Search:**
     - Desktop: input kapsul kompak (`h-6 rounded-full px-4 py-4 text-xs`) dengan tombol ikon kaca pembesar tertanam di kanan (`absolute right-2`). Menekan `Enter` atau klik ikon langsung mengarahkan ke `/shop?search=<query>`.
     - Mobile (`< 992px`): tombol ikon kaca pembesar ringkas di navbar, plus form pencarian penuh di bagian atas mobile drawer.
   - **Account / Admin:**
     - Saat belum login: ikon `User` (`w-5 h-5`) + teks `Sign In` (`hidden navbar:inline`).
     - Saat sudah login: dropdown ikon `User` berisi 2 menu saja: `Dashboard` (`/dashboard`) dan `Sign Out`.
     - Untuk Brakasa Tactical V2 (storefront langsung tanpa wajib akun pelanggan), slot ini dapat disederhanakan menjadi tautan ikon/label ringkas menuju **Admin** (`/admin`) tanpa mengganggu alur belanja tamu.
   - **Cart Trigger:**
     - Ikon keranjang (`ShoppingCart`) dengan badge penghitung item (`absolute -top-1 -right-1 text-xs rounded-md font-semibold`). Klik tombol langsung membuka **Cart Drawer** dari kanan.
   - **Language Toggle (`ID / EN`):**
     - Di desktop: tombol kompak `flex items-center gap-1 text-xs uppercase` terdiri dari ikon `Globe` (`w-4 h-4`) + kode pendek aktif (`ID` atau `EN`) + ikon `ChevronDown` (`w-3 h-3`). Dropdown lebar `w-40` menampilkan nama bahasa lengkap (`Indonesia`, `English`) dengan ikon centang (`Check`) pada bahasa aktif.
     - Di mobile: tidak memakan ruang header; ditempatkan di bagian bawah Mobile Drawer dalam bentuk grid pilihan tombol bahasa (`grid-cols-2` untuk ID/EN) dengan border & tint aksen pada pilihan aktif.
   - **Theme Toggle:**
     - Swarna memiliki komponen tombol ikon `Sun` / `Moon` (`size="icon-sm"`) tepat di sebelah Language Toggle. Pada Brakasa Tactical V2, tombol ini wajib tetap terlihat jelas dan aktif untuk berpindah penuh antara `Armory Dark` dan `Field Paper Light`.

### 1.3 Mobile Navigation Drawer (`< 992px`)

- Dibuka dari ikon hamburger 3 garis (`w-6 h-6`) di sisi kanan bar mobile.
- Menggunakan slide-over panel dari kanan (`w-[300px] max-w-[85vw] h-full flex flex-col`).
- Susunan vertikal yang bersih dari atas ke bawah:
  1. Header drawer: logo kiri + tombol tutup (`X`) kanan.
  2. Search bar form penuh (`pl-9 pr-3 py-2 text-sm rounded-md`) + tombol submit ikon search.
  3. Daftar navigasi scrollable (`flex-1 overflow-y-auto`): item dengan anak kategori memiliki label tautan di kiri dan tombol chevron toggle di kanan (`border-l pl-3` saat terbuka).
  4. Pemilih Bahasa (`Language`) dan kontrol tema di zona footer drawer.
  5. Tautan Admin / Akun di paling bawah.

### 1.4 Pemetaan Navigasi untuk Brakasa Tactical V2

Mengikuti instruksi perombakan V2 (menghapus **Loadout Builder**, **Cek Pesanan**, dan **Kepatuhan 18+**), struktur navigasi Brakasa Tactical V2 yang setia pada pola Swarna Tactical adalah:

- **Kiri:** Wordmark `BRAKASA // TACTICAL` (tautan ke `/`).
- **Tengah (Desktop):**
  1. `Shop` / `Katalog` (`/store`)
  2. `Categories` / `Kategori` (dropdown seluruh kategori produk Brakasa yang langsung mengarah ke `/store?category=<slug>`)
  3. `Featured` / `Unggulan` (`/#featured-products` atau `/store?sort=featured`)
  4. `Our Store` / `Toko Kami` (`/#our-store`)
- **Kanan (Desktop):** Input/ikon Search -> Toggle Bahasa `ID / EN` -> Theme Toggle (`Dark / Light`) -> Ikon Admin (`/admin`) -> Tombol Cart Drawer dengan badge jumlah item.

---

## 2. Hero Full-Screen (1 Layar Penuh)

### 2.1 Temuan Empiris pada `swarnatactical.com` & `apparel.swarnatactical.com`

Kedua situs Swarna Tactical memperlakukan Hero sebagai **kanvas visual penuh yang tenang, tajam, dan tidak berisik**:

1. **Gambar Slide Statis Tajam Tanpa Guncangan:**
   - Seluruh slide Hero aktif di `swarnatactical.com` (`api_banners.json`) berjenis `media_type: "image"` dengan gambar diam resolusi tinggi.
   - **Tidak ada** animasi Ken-Burns (`scale` terus-menerus), **tidak ada** efek getaran/goyang kamera, dan **tidak ada** video dengan tombol suara/jeda yang memakan layar.
   - Pergantian slide menggunakan transisi mulus: geser horizontal Embla (`loop: true`, `Autoplay delay: 5000ms`, jeda saat hover kursor) pada `swarnatactical.com`, atau crossfade halus (`transition-opacity duration-1000 ease-in-out`) pada `apparel.swarnatactical.com`.
2. **Art Direction Responsif & Proporsi 1 Layar Penuh:**
   - Swarna memisahkan aset desktop `1920x1080` (`16:9`) dan mobile `1080x1080` (`1:1`) melalui `<picture><source media="(max-width: 767px)" ... /><img ... /></picture>` dengan `fetchPriority="high"` dan `loading="eager"` khusus pada slide pertama (slide berikutnya `loading="lazy"`).
   - Pada `apparel.swarnatactical.com`, tinggi Hero dibatasi presisi agar selalu pas 1 layar penuh (`max-h-[calc(100dvh-102px)]` di desktop dan `max-h-[75dvh]` di mobile) di atas latar gelap `bg-black`.
   - Pada Brakasa Tactical V2 (header transparan sticky/overlay di atas Hero), proporsi ideal adalah **`h-[100dvh] min-h-[580px] max-h-[1080px]`** dengan foto beresolusi tinggi `object-cover object-center` sehingga tidak ada celah kosong di bawah maupun pemotongan wajah/unit utama.
3. **Headline & CTA Minimalis (Zero Clutter):**
   - Pada komponen Hero `swarnatactical.com` (`872901`), blok teks hanya dirender bila slide memiliki `title` / `subTitle`:
     - Headline: `text-white text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wider`.
     - Subheadline (opsional & sangat singkat): 1 kalimat pendek `text-xs md:text-base lg:text-lg`.
     - CTA tunggal: 1 tombol solid kontras tinggi (`px-6 py-3 uppercase font-bold tracking-wider`), ditempatkan di area bawah-kiri (`bottom-6 md:bottom-10 left-6 md:left-10`) atau menyatu di bawah headline.
   - Lapisan scrim gelap hanya berfungsi menjamin kontras teks (`bg-gradient-to-t from-black/75 via-black/25 to-black/30`), tetap mengunci teks terang pada kedua tema (Dark dan Light).
4. **Indikator Titik (*Pagination Dots*) di Dalam Hero:**
   - Pada `apparel.swarnatactical.com`, kontrol navigasi slide ditempatkan **di dalam bingkai bawah Hero**:
     - Container: `absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2`.
     - Titik aktif: pil ramping `h-1.5 w-8 rounded-full bg-white transition-all` (di Brakasa V2 gunakan warna aksen `Signal Amber` `#E5A024` atau putih bersih).
     - Titik nonaktif: `h-1.5 w-4 rounded-full bg-white/40 hover:bg-white/70 transition-all`.
   - Panah kiri/kanan opsional berada di tepi vertikal tengah (`absolute left-4 / right-4 top-1/2 -translate-y-1/2 z-20 size-10 bg-black/40 border border-white/40 text-white hover:bg-black/70`).
5. **Elemen yang Sengaja Absen di Swarna Tactical:**
   - **Nol teks eyebrow kecil** di atas headline (tidak ada `SEC-01 // BRAKASA ARMORY 18+ ...`).
   - **Nol daftar scene / strip indeks** di bawah Hero (tidak ada `[SCN-03 / 10] Mag Seating & Bolt Rack ...`).
   - **Nol tombol Play/Pause** dan **nol tombol Audio/Mute** mengambang di sudut Hero.
   - **Nol kartu statistik/telemetry** bertumpuk di atas gambar Hero.

```text
+---------------------------------------------------------------------------------------------------+
| [Header Sticky Transparan Gelap: Logo | Shop | Categories | Featured | Our Store | Search ID Cart]|
|                                                                                                   |
|                                                                                                   |
|  [<]                                                                                         [>]  |
|        FOTO HERO STATIS TAJAM 100dvh (TANPA ZOOM/GOYANG, TANPA VIDEO AUDIO/PAUSE)                 |
|                                                                                                   |
|        HEADLINE SINGKAT 2-4 KATA                                                                  |
|        [ CTA TUNGGAL ]                                                                            |
|                                                                                                   |
|                                       (====) (--) (--) (--)                                       |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Featured Products Carousel

### 3.1 Struktur & Kontainer Carousel (`New Arrivals` / `Best Sellers`)

Pada `swarnatactical.com`, seluruh etalase produk unggulan di beranda memakai pola carousel horizontal yang konsisten (`735269` & `28570`):

- **Padding Seksi:** `w-full px-4 md:px-8 py-8 lg:py-20` dengan lebar konten `md:max-w-6xl mx-auto` (atau `max-w-7xl mx-auto`).
- **Header Seksi Bersih:**
  - Judul `h2`: `text-3xl md:text-5xl uppercase font-extrabold` (rata tengah di `swarnatactical.com`, atau rata kiri dengan tautan `View All` di sisi kanan seperti di `apparel.swarnatactical.com`).
  - Untuk Brakasa Tactical V2: tampilkan **HANYA judul seksi** (mis. `Featured Products` / `Produk Unggulan`) dan tautan ringkas `Lihat Semua` / `View All` tanpa paragraf penjelasan di bawah judul dan tanpa label mikro `SEC-02 //`.
- **Jumlah Item & Grid Carousel:**
  - Maksimum **8 produk** dimuat di dalam carousel beranda (`slice(0, 8)`), dengan Embla option `align: "start"`.
  - Lebar tiap kartu per breakpoint:
    - Mobile (`< 640px`): `basis-1/2` (2 kartu tampak berdampingan)
    - Tablet (`640px - 1023px`): `sm:basis-1/3` (3 kartu)
    - Desktop (`>= 1024px`): `lg:basis-1/4` (4 kartu)
  - Jarak antar kartu: `gap-4` (`16px`) / `md:px-4` agar napas visual lapang dan foto produk menonjol.
- **Kontrol Geser / Panah:**
  - Tombol panah kiri dan kanan (`w-7 h-7` atau `w-10 h-10` untuk target sentuh nyaman) diposisikan di tepi luar track (`-left-5 md:left-0` dan `-right-5 md:right-0`), plus dukungan geser (*swipe*) horizontal native di perangkat sentuh.
  - Tombol CTA bawah opsional `View All` / `Lihat Semua` (`mt-10` atau di kanan sejajar judul) menuju `/store`.

### 3.2 Anatomi Kartu Produk Super Bersih (`ProductCard`)

Inspeksi kode komponen `ProductCard` produksi Swarna Tactical (`137887`) membuktikan betapa disiplinnya hierarki informasi pada kartu produk mereka:

| Lapisan Kartu | Implementasi Aktual di `swarnatactical.com` | Aturan Wajib Brakasa Tactical V2 |
| :--- | :--- | :--- |
| **1. Wadah Foto** | `relative aspect-square xl:aspect-7/8 w-full overflow-hidden bg-gray-800/2 rounded-none`, foto `object-contain` | Rasio seragam `aspect-square` (`1:1`) atau `aspect-[4/5]` / `aspect-[7/8]`, latar permukaan netral `var(--bg-surface)` / `var(--bg-elevated)`, tepi tajam (`2px` atau `0px`) |
| **Interaksi Hover Foto** | `group-hover:opacity-75`; bila produk memiliki `>= 2` foto, galeri otomatis berganti setiap `850ms` selama hover dan kembali ke foto 0 saat mouse keluar | Efek halus (`scale-[1.03] duration-300` atau swap ke foto kedua bila tersedia) tanpa lonjakan layout |
| **Status Habis Stok** | Bila `soldOut`: foto `opacity-40 grayscale` + stempel tunggal miring `-12deg` bertuliskan `Sold` | Bila stok 0: tampilkan indikator teks tunggal `Habis` / `Sold Out` yang bersih, tanpa deretan badge tambahan |
| **2. Nama Produk** | `<div class="mt-3 flex h-12 items-end"><a href="..."><h3 class="text-md font-bold leading-6 line-clamp-2 group-hover:text-primary transition-colors">` | **Hanya 1 elemen judul (`line-clamp-2`)** dengan tinggi seragam (`min-h-[3rem]`) agar seluruh baris harga sejajar horizontal |
| **3. Harga Produk** | `<div class="mt-2 border-t pt-2 flex flex-wrap items-center gap-x-2">` berisi nominal Rupiah (`Rp 4.788.000`) + opsional harga coret & `-X%` bila diskon | **Hanya nominal harga Rupiah (`tabular-nums`)** dipisahkan garis tipis `1px solid var(--border-subtle)` |
| **Elemen yang DIHAPUS** | Tidak merender deskripsi singkat, tidak merender chip kategori, tidak merender spesifikasi teknis, tidak merender tombol Add to Cart di kartu | **Dilarang keras** menampilkan micro-spec (FPS/Joule/Gearbox), badge ramai, kategori pill, deskripsi kecil, atau tombol beli cepat di kartu beranda/katalog |

```text
+---------------------------+
|                           |
|                           |
|       FOTO PRODUK         |  <- aspect-square / aspect-[7/8]
|      (object-contain      |     tanpa badge promo/spec ramai
|       atau object-cover)  |
|                           |
+---------------------------+
  Tokyo Marui MK18 Mod.1
  MWS GBBR                     <- Hanya Nama Produk (max 2 baris, tinggi tetap)
-----------------------------  <- border-t 1px halus
  Rp 16.500.000                <- Hanya Harga (tabular-nums)
```

---

## 4. Featured Categories Grid

### 4.1 Perbandingan Dua Varian Grid Kategori Swarna Tactical

Swarna Tactical menerapkan dua gaya kartu kategori yang keduanya sangat bersih dan berfokus pada klik langsung menuju katalog terfilter:

1. **Varian A: Overlay Gelap `aspect-[4/3]` (`swarnatactical.com`, modul `475253`)**
   - **Grid Responsif:** `grid-cols-2 md:grid-cols-3 gap-3 md:gap-4` (2 kolom di mobile, 3 kolom di tablet dan desktop). Pada live site menampilkan 12 kartu kategori (4 baris x 3 kolom di desktop).
   - **Rasio Kartu:** `aspect-[4/3]` dengan `overflow-hidden rounded-md bg-black`.
   - **Efek Visual Halus:** Foto mengisi wadah dengan transisi `transition-transform duration-500 group-hover:scale-105`, dilapisi gradasi gelap bawah `bg-gradient-to-t from-black/85 via-black/40 to-black/20` agar teks putih selalu terbaca tajam di atas foto apa pun.
   - **Konten Kartu:** Seluruh kartu dibungkus `<Link>` menuju rute kategori terfilter (mis. `/shop/by/categories/SIGHT`, `/shop/by/categories/HOLSTER`). Di Swarna utama ada judul `h3` (`text-base md:text-xl font-extrabold uppercase tracking-wide`) plus tombol kecil kuning `SHOP NOW`.
2. **Varian B: Ultra-Minimal Foto + Nama Saja (`apparel.swarnatactical.com`)**
   - **Grid Responsif:** `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 md:gap-x-6 gap-y-8`.
   - **Rasio Kartu:** `aspect-square` (`1:1`), `group-hover:scale-105 transition-transform duration-500 ease-out`.
   - **Konten Kartu:** **HANYA foto dan 1 baris nama kategori** (`UPPER WEAR`, `BOTTOM WEAR`, `BAGS & PACKS`, `BLADE & KNIVES`, `SHOOTING GLASSES`, `FOOT WEAR`) tanpa subtitle, tanpa deskripsi, tanpa hitungan SKU, dan tanpa tombol `SHOP NOW` tambahan.

### 4.2 Spesifikasi Sintesis untuk Brakasa Tactical V2 (Seksi 3)

Untuk menyatukan kekuatan visual kedua varian Swarna dan mematuhi instruksi V2 (**HANYA foto dan nama kategori saja**, langsung menuju `/store?category=<slug>`):

- **Jumlah Kolom:**
  - Mobile (`< 640px`): `grid-cols-2 gap-3` (2 kolom)
  - Tablet (`640px - 1023px`): `sm:grid-cols-3 gap-4` (3 kolom)
  - Desktop (`>= 1024px`): `lg:grid-cols-3 gap-5` (3 kolom untuk 6 atau 9 kategori Brakasa sehingga membentuk 2 atau 3 baris penuh yang simetris tanpa kartu yatim)
- **Rasio & Komposisi Kartu:**
  - Gunakan rasio `aspect-[4/3]` (pola utama `swarnatactical.com`) agar proporsional terhadap foto replika laras panjang maupun gear taktis.
  - Efek visual halus: `transition-transform duration-500 group-hover:scale-105` + gradasi bawah halus (`from-black/80 via-black/25 to-transparent`) dengan teks nama kategori `uppercase font-bold tracking-wide text-white` di kiri-bawah (atau nama kategori bersih di bawah foto).
  - **Tanpa** subtitle, **tanpa** jumlah item, **tanpa** tombol `SHOP NOW` redundan, dan **tanpa** kode `CAT-01 //`.
- **Target Klik Langsung (9 Kategori Brakasa):**
  - `Assault Rifle` -> `/store?category=assault-rifle`
  - `SMG & PDW` -> `/store?category=smg-pdw`
  - `Sniper Rifle` -> `/store?category=sniper-rifle`
  - `Sidearm Pistol` -> `/store?category=sidearm-pistol`
  - `Optics & Aiming` -> `/store?category=optics-aiming`
  - `Plate Carrier & Rig` -> `/store?category=plate-carrier-rig`
  - `Helmet & Comms` -> `/store?category=helmet-comms`
  - `Apparel & Footwear` -> `/store?category=apparel-footwear`
  - `Consumables & Upgrades` -> `/store?category=consumables-upgrades`

---

## 5. Our Store & Maps Section

### 5.1 Bedah Tata Letak Aktual di `swarnatactical.com` (Modul `65059`)

Seksi **Our Store** (terjemahan ID: **Toko Kami**) di `swarnatactical.com` ditempatkan tepat di atas Footer dengan tata letak split-screen penuh tanpa container sempit agar peta terasa lega dan langsung dapat digunakan:

```text
Desktop (>= 1024px, tinggi lg:h-[50vh], border-t, full-bleed):
+---------------------------+---------------------------+---------------------------------------------------+
|   KIRI-1 (25% / lg:w-1/2  |   KIRI-2 (25% / lg:w-1/2  |              KANAN (50% / md:w-1/2)               |
|   dari separuh kiri)      |   dari separuh kiri)      |                                                   |
|                           |                           |                                                   |
|  OUR STORE                |   [FOTO SHOWROOM FISIK]   |        [EMBED INTERAKTIF GOOGLE MAPS]             |
|  Alamat lengkap toko      |   background-size: cover  |        iframe w-full h-full                       |
|  Senin - Minggu,          |   tanpa teks overlay      |        loading="lazy"                             |
|  09:00 - 21:00 WIB        |                           |        allowFullScreen                            |
|                           |                           |                                                   |
|  [ GET DIRECTIONS >> ]    |                           |                                                   |
+---------------------------+---------------------------+---------------------------------------------------+
```

Detail struktural yang diamati dari DOM dan komponen produksi:

- **Wrapper Luar:** `section.w-full.border-t` > `div.w-full.flex.flex-col.md:flex-row.lg:h-[50vh]`.
- **Panel Kiri (`w-full md:w-1/2 flex flex-col-reverse lg:flex-row`):**
  - **Kolom Info Toko (`lg:w-1/2 p-6 md:p-8 flex flex-col justify-center gap-6`):**
    - Judul `h3`: `text-3xl font-bold uppercase tracking-tight` (`Our Store` / `Toko Kami`).
    - Alamat jalan 1 blok ringkas (`text-sm text-muted-foreground`).
    - Jam operasional 1 baris (`text-sm text-muted-foreground`, mis. `Monday - Sunday, 09:00 - 21:00 WIB`).
    - 1 tombol primer persegi tajam (`uppercase rounded-none flex gap-2 w-fit`): `Get Directions` + ikon `ChevronsRight` (`w-5 h-5`), membuka tautan Google Maps resmi di tab baru (`target="_blank" rel="noopener noreferrer"`).
  - **Kolom Foto Showroom (`lg:w-1/2 h-[40vh] lg:h-full`):**
    - Foto nyata ruang pamer fisik toko (`background-size: cover; background-position: center`). Di mobile/tablet (`< 1024px`), `flex-col-reverse` otomatis menaruh foto di atas teks sehingga ritme baca alami: Foto -> Info -> Peta.
- **Panel Kanan (`w-full md:w-1/2 h-[40vh] md:h-auto lg:h-full`):**
  - Embed `<iframe>` Google Maps interaktif penuh dengan `loading="lazy"`, `allowFullScreen`, `referrerPolicy="no-referrer-when-downgrade"`, dan `style={{ border: 0 }}`.
- **Peningkatan Teknis untuk Brakasa Tactical V2:**
  - Bila Brakasa belum memiliki foto interior showroom terpisah, gunakan komposisi split 2 kolom simetris (`md:grid-cols-2`) atau 3 panel dengan foto showroom/hero armory yang tajam, dan **wajib** menyertakan atribut eksplisit `width="800" height="450"` serta `title="Lokasi Brakasa Tactical"` pada `<iframe>` Google Maps demi mencegah CLS dan memenuhi standar aksesibilitas.
  - Tambahkan 1 baris kontak langsung (telepon/WhatsApp) ringkas di bawah jam operasional agar setara dengan kebutuhan kunjungan pelanggan lokal, tanpa menambahkan paragraf panjang.

---

## 6. Store Catalog, Product Detail Page (PDP), Cart Drawer, Checkout & Footer

### 6.1 Store Catalog (`/shop` & Halaman Kategori `/shop/by/...`)

Inspeksi `swarna_shop.html` dan chunk `31nrhqvv_vblj.js` menunjukkan arsitektur katalog yang sangat fungsional dan bersih:

- **Header Katalog Ringkas:**
  - Pada `/shop`, Swarna menampilkan banner gelap lebar dengan H1 `Shop` (`text-white font-extrabold uppercase text-3xl md:text-5xl`).
  - Pada halaman terfilter (`/shop/by/...`), header dibuat bahkan lebih ringkas tanpa banner besar: hanya 1 baris breadcrumb (`Shop / Category`) dan H1 nama kategori (`text-2xl font-bold uppercase tracking-tight`) dengan `mb-8`. Pola ringkas ini sangat cocok untuk Brakasa V2 agar produk langsung tampil *above the fold*.
- **Layout 2 Kolom (`max-w-7xl mx-auto px-4 py-8 lg:py-12`, `flex gap-6`):**
  - **Sidebar Filter Kiri (Desktop `hidden lg:block w-60 flex-shrink-0`):**
    - Accordion multi-seksi (`type="multiple"`) dengan garis pemisah tipis `border-b`.
    - Isi filter memakai daftar checkbox berlabel rapi di dalam scroll area (`max-h-[250px] overflow-y-auto`).
    - Pada mobile/tablet (`< lg`), sidebar disembunyikan dan digantikan tombol `Filter` (`variant="outline" size="sm"`, ikon `SlidersHorizontal`) yang membuka `Sheet` dari sisi kiri (`side="left" className="w-72 overflow-y-auto"`).
  - **Toolbar Atas Katalog (`flex flex-col md:flex-row gap-3 items-start md:items-center justify-between`):**
    - Kiri: Tombol `Filter` (khusus mobile) + Input Search (`w-full sm:w-64`, debounce `500ms`) + indikator jumlah ringkas (`Showing 1-16 of 2086 products`).
    - Kanan: Dropdown Sort (`w-full md:w-48`: *All*, *Latest*, *Lowest Price*, *Highest Price*, *Available Stock*) + dropdown jumlah per halaman (`w-24`: `4, 8, 12, 16, 20, 40`).
    - Seluruh status filter, pencarian, urutan, dan halaman disinkronkan langsung ke URL query string (`window.history.replaceState`) sehingga tautan dapat dibagikan dan tombol Back browser bekerja sempurna.
- **Grid Produk & Pagination:**
  - Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`.
  - Setiap kartu menggunakan komponen **`ProductCard` minimalis yang sama persis dengan Carousel Beranda** (hanya foto, nama produk, dan harga).
  - Pagination numerik ringkas di tengah bawah (`Previous`, maksimal 5 nomor halaman dengan ellipsis, `Next`).

### 6.2 Product Detail Page (PDP `/shop/:id`)

Inspeksi `swarna_pdp1.html`, `swarna_apparel_pdp.html`, dan chunk `1q-rrcl0wl01j.js` menunjukkan struktur PDP 2 lapis yang jernih tanpa distraksi:

1. **Breadcrumb 1 Baris:** `Home / Shop / <Nama Produk>` (`text-sm text-muted-foreground mb-6`).
2. **Above the Fold (`flex flex-col lg:flex-row gap-4 md:gap-8 lg:gap-12`):**
   - **Kolom Kiri (`lg:w-1/2`) Galeri Media:**
     - Foto utama besar (`relative w-full h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden`).
     - Tombol zoom lightbox di pojok kanan atas (`absolute top-2 right-4`) yang membuka modal penuh `90vw x 90vh` berlatar hitam (`object-contain`).
     - Carousel thumbnail horizontal di bawahnya (`basis-1/2 sm:basis-1/3 lg:basis-1/4`, tinggi `h-[100px]`) dengan panah kiri/kanan. Saat varian warna/ukuran dipilih dan memiliki foto khusus, galeri otomatis berpindah menampilkan foto varian tersebut.
   - **Kolom Kanan (`lg:w-1/2 flex flex-col gap-5`) Panel Pembelian (Buy Box):**
     - Baris judul: `h1` (`text-3xl md:text-4xl font-extrabold uppercase tracking-tight leading-tight`) + tombol Share di kanan.
     - Metadata identitas 2 baris ringkas (`text-sm text-muted-foreground`): `Brand: <Nama>` dan `SKU: <Kode>`.
     - Harga dominan: `text-2xl md:text-3xl font-bold text-primary` (+ harga coret & badge diskon bila promo).
     - Pemilih Varian (bila ada): grup tombol pill `Type / Size` dan `Color` (`variant="default"` saat aktif, `variant="outline"` saat tidak aktif; klik ulang untuk batal pilih).
     - Status stok 1 baris dengan dot warna + label teks eksplisit (`bg-green-500` `Ready Stock` atau `bg-red-500` `Out of Stock`).
     - Baris aksi pembelian sejajar horizontal (`flex flex-col sm:flex-row gap-3`): input `Quantity` (`sm:w-28`) + tombol primer `Add to Cart` (`flex-1`) + tombol Wishlist (opsional). Bila stok habis, tampilkan opsi fallback ringkas.
3. **Below the Fold (Tanpa Tab Rumit atau Eyebrow Kode):**
   - **Product Description:** `h2` (`text-xl font-bold uppercase tracking-tight mb-4`) + `<hr class="border-border mb-6">` + konten deskripsi bersih (`text-sm leading-relaxed`).
   - **Additional Information / Spesifikasi Teknis:** `h2` + `<hr>` + tabel 2 kolom bersih (`w-1/2` Nama Atribut | `w-1/2` Nilai). Pada Brakasa Tactical V2, tabel 2 kolom bersih inilah tempat ideal untuk data teknis airsoft (FPS/Joule, Propulsi, Material, Kapasitas Mag, Berat, Isi Paket) tanpa memenuhi kartu katalog atau buy box dengan chip ramai.
   - **Similar Products:** `h2` + `<hr>` + grid 4 kolom (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`) dengan kartu super bersih (foto + judul + harga saja).

### 6.3 Cart Drawer (Slide-Over Kanan Tanpa Halaman `/cart`)

Pada `swarnatactical.com`, alamat `/cart` mengembalikan `404` karena pengalaman keranjang belanja **100% terpusat pada Slide-Over Drawer dari sisi kanan** (`2s7l_4gmewn1p.js`, menggunakan Vaul `Drawer` `direction="right"`):

- **Dimensi & Overlay:** `w-3/4 sm:max-w-sm h-full flex flex-col`, latar backdrop `bg-black/50`.
- **Zona Header (Sticky Top):** latar lembut `bg-muted/40`, judul `CART` / `KERANJANG` (`font-bold uppercase`) di kiri dan tombol tutup `X` (`h-8 w-8`) di kanan.
- **Zona Daftar Item (Scrollable `flex-1 overflow-y-auto`):**
  - Tiap item tersusun rapi dengan pemisah `border-b`: thumbnail `75x60px` (`object-contain`), judul `text-sm font-semibold truncate`, varian ringkas, harga satuan, baris kontrol kuantitas (`-` / input angka / `+`, tombol `-` otomatis berubah menjadi ikon `Trash` merah saat qty mencapai `0`), serta baris kanan bawah `qty x harga satuan = subtotal`.
- **Zona Footer (Sticky Bottom):**
  - Ringkasan total item & subtotal bersih.
  - 1 tombol CTA lebar penuh `w-full`: `Checkout`.
- **Catatan Penghapusan Friksi untuk Brakasa V2:**
  - Swarna Tactical menerapkan checkbox pilih item, syarat login, dan verifikasi KTP/KTA karena menjual senjata api sungguhan (*firearms*).
  - Untuk **Brakasa Tactical V2**, **hapus seluruh gerbang login, KTP/KTA, dan verifikasi usia 18+/21+**; semua item di keranjang otomatis dihitung ke subtotal dan tombol `Checkout` langsung mengantar ke `/checkout` tanpa friksi.

### 6.4 Checkout

- Pada Swarna Tactical, klik `Checkout` di Cart Drawer langsung membuat sesi checkout dan memindahkan pengguna ke halaman checkout terfokus tanpa navigasi rumit, lengkap dengan catatan pengiriman kurir yang ringkas.
- Untuk **Brakasa Tactical V2**, halaman `/checkout` harus tetap bersih dan 1 langkah:
  - Kiri: Form data pengiriman (Nama, Email, WhatsApp, Alamat, Kota/Provinsi, Kurir) + input kode Voucher opsional.
  - Kanan: Ringkasan pesanan (daftar item, subtotal, diskon voucher, ongkir, total bayar) + tombol konfirmasi pesanan.
  - **Hapus total** input tanggal lahir, checkbox kepatuhan 18+/Perpol, dan catatan hukum panjang di bawah form.

### 6.5 Footer

Inspeksi `swarna_home.html` menunjukkan Footer yang tegas, mudah dipindai, dan bebas paragraf esai panjang:

- **Struktur Kolom (`swarnatactical.com`):**
  - Latar gelap kontras (`bg-gray-800 text-white`), container `max-w-7xl mx-auto px-4 py-10 navbar:py-14`.
  - Grid 5 kolom desktop (`grid-cols-2 navbar:grid-cols-5 gap-8`):
    1. **Products / Produk:** `Shops`, `New Arrivals`, `Brands`, `Promotions`, dll.
    2. **Explorer / Jelajah:** `Homepage`, `About Us`, `Gallery`, `Articles`.
    3. **Support / Bantuan:** `FAQ`, `Terms & Conditions`, `Privacy Policy`, `Contact Us`.
    4. **Contacts / Kontak:** Daftar kontak ringkas dengan ikon `Phone` (`w-4 h-4 text-primary`), nama, peran, dan nomor.
    5. **Social Media / Media Sosial:** Tombol ikon kotak/bulat kompak (`p-2 bg-white/10 rounded hover:bg-primary`) untuk Instagram, Facebook, YouTube, TikTok.
- **Bottom Bar (`border-t border-white/10 py-4 px-4`):**
  - 1 baris rapi (`flex flex-col navbar:flex-row items-center justify-between gap-2 text-xs text-white/40`): hak cipta di kiri (`© 2026 ... All rights reserved.`) dan nama perusahaan/tautan ringkas di kanan.
- **Adaptasi Footer untuk Brakasa Tactical V2:**
  - Cukup 3 hingga 4 kolom bersih (`Brand & Alamat Singkat`, `Katalog / Shop`, `Informasi / Bantuan`, `Kontak & Sosial Media`) tanpa esai panjang, tanpa banner kepatuhan, tanpa label mikro `SEC-XX //`, dan mendukung penuh terjemahan `ID / EN` serta dual-theme Brakasa.

---

## 7. Ringkasan Urutan Seksi & Matriks Keputusan Adopsi untuk Brakasa Tactical V2

### 7.1 Perbandingan Urutan Seksi Landing Page

| Urutan | Landing Page `swarnatactical.com` (Aktual) | Landing Page `apparel.swarnatactical.com` (Aktual) | Target Landing Page **Brakasa Tactical V2** |
| :---: | :--- | :--- | :--- |
| **Header** | Sticky dark transparent nav (`Logo` / 5 menu dropdown / `Search`, `Account`, `Cart`, `ID-EN`) | Sticky white 3-col nav (`Shop`, `Categories`, `Promotions` / `Logo` / `Search`, `Account`, `Cart`) | Sticky dark/theme-aware nav ala Swarna (`Logo` / `Shop`, `Categories v`, `Featured`, `Our Store` / `Search`, `ID/EN`, `Theme`, `Admin`, `Cart`) |
| **Seksi 1** | Full-width Hero Image Carousel (statis, panah kiri/kanan, tanpa audio/pause) | Full-viewport Hero Crossfade (`100dvh`, statis, **pagination dots di dalam hero**) | **Hero Full-Screen (`100dvh`)**: slide foto tajam tidak goyang, headline singkat + CTA tunggal, **pagination dots di dalam hero**, tanpa scene strip, tanpa eyebrow, tanpa tombol pause/audio |
| **Seksi 2** | *Our Top Brands* Carousel (4 kolom) | *Categories* Grid (6 kolom, foto + nama saja) | **Featured Products Carousel**: 2/3/4 kolom geser horizontal, **HANYA foto, nama produk, dan harga** |
| **Seksi 3** | *Featured Categories* Grid (`grid-cols-2 md:grid-cols-3`, `aspect-[4/3]`) | *New Arrivals* Grid/Carousel | **Featured Categories Grid**: 2/3 kolom (`aspect-[4/3]`), efek hover halus `scale-105`, **HANYA foto + nama kategori**, klik langsung ke `/store?category=<slug>` |
| **Seksi 4** | *New Arrivals* & *Best Sellers* Carousels + *Trust Bar* (4 ikon) + **Our Store & Google Maps Split** | *Best Sellers* + *Trust Bar* (5 ikon) | **Our Store & Maps Section**: info showroom fisik Brakasa (alamat, jam buka, kontak, tombol Google Maps) berdampingan dengan embed peta interaktif Google Maps |
| **Footer** | Dark 5-col clean links + contacts + social + 1-line copyright | Dark brand + 4-col links + 1-line copyright | **Footer Bersih Ala Swarna**: 3-4 kolom ringkas, kontak showroom, bottom bar 1 baris, bebas over-description |

### 7.2 Daftar Tegas: Adopsi vs Sesuaikan vs Hapus

| Kategori Keputusan | Elemen Spesifik |
| :--- | :--- |
| **ADOPSI PENUH (Dari Swarna Tactical)** | 1. Struktur header sticky-blur transparan di atas Hero dengan dropdown kategori hover/klik dan mobile drawer kanan.<br>2. Hero 1 layar penuh (`100dvh`) memakai gambar statis tajam tanpa efek goyang, navigasi *pagination dots* di dalam bingkai Hero, tanpa tombol suara/jeda.<br>3. Kartu produk super bersih (`ProductCard`): foto rasio seragam + nama produk `line-clamp-2` bertinggi tetap + garis pemisah tipis + harga Rupiah saja.<br>4. Featured Categories Grid (`2/3` kolom `aspect-[4/3]`, `group-hover:scale-105`) dengan tampilan foto + nama kategori langsung menuju `/store?category=<slug>`.<br>5. Seksi **Our Store** berdampingan langsung dengan iframe Google Maps interaktif + tombol petunjuk arah.<br>6. Katalog `/store` dengan sidebar filter desktop + `Sheet` filter mobile + toolbar search/sort sinkron URL.<br>7. PDP 2 kolom bersih (galeri + lightbox kiri, buy box kanan, spesifikasi 2 kolom rapi di bawah).<br>8. Cart Drawer slide-over kanan dan Footer gelap/netral ringkas.<br>9. Toggle bahasa fungsional penuh **`ID / EN`**. |
| **SESUAIKAN (Identitas Brakasa Tactical)** | 1. **Pertahankan palet warna & dual-theme Brakasa**: `Armory Dark` (`#0F1110` / `#171A18`) dan `Field Paper Light` (`#F2EFE9` / `#FAF8F4`) dengan aksen `Signal Amber` (`#E5A024`) / `Burnt Amber` (`#8C4F04`) serta `Ranger Olive` (`#334434`).<br>2. **Pertahankan tipografi Brakasa**: `Barlow Condensed`, `IBM Plex Sans`, dan `IBM Plex Mono` (`tabular-nums` untuk harga dan tabel spek PDP).<br>3. **Guest Checkout tanpa wajib login**: alur Cart Drawer -> Checkout berlangsung mulus tanpa kewajiban akun/KTP.<br>4. **Atribut teknis iframe & a11y**: sertakan `width`, `height`, dan `title` eksplisit pada iframe Google Maps serta `aria-label` lengkap pada dots/panah slider. |
| **HAPUS TOTAL (Dari Kode V1 Brakasa & Bagian Tidak Relevan Swarna)** | 1. Hapus rute & fitur **Loadout Builder** (`/loadout-builder`), **Cek Pesanan** (`/order-lookup`), dan **Kepatuhan 18+** (`/compliance`).<br>2. Hapus seluruh modal/blok **verifikasi usia 18+/21+**, tanggal lahir, checkbox Perpol, dan syarat KTP/KTA di frontend maupun backend.<br>3. Hapus seluruh label mikro dekoratif (`SEC-01 // ...`, `OPS-01 // ...`, `[BRK // 01]`, `[SCN-03 / 10]`), eyebrow kecil di atas judul, dan paragraf penjelasan panjang (*over-description*) di seluruh halaman.<br>4. Hapus daftar scene di bawah Hero, animasi kamera goyang/Ken-Burns, tombol jeda, dan tombol suara pada Hero.<br>5. Hapus badge spesifikasi ramai dan teks deskripsi singkat dari seluruh kartu produk di Landing Page maupun Katalog. |
