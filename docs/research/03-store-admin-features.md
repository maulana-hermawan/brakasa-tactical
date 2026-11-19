# Riset Produk E-Commerce Flows, Storefront & Admin Operations: Brakasa Tactical

Dokumen ini merumuskan arsitektur fitur end-to-end untuk **Brakasa Tactical**, mencakup narasi Landing Page berbasis produk nyata, pengalaman Storefront spesialis airsoft dan tactical gear, fitur pembeda **Interactive Tactical Loadout Builder**, alur Checkout patuh regulasi Indonesia beserta **Order Lookup**, hingga **Admin Operations Center** yang sepenuhnya digerakkan oleh data operasional real-time.

---

## Ringkasan Benchmark & Prinsip Desain Produk

Berdasarkan kajian terhadap peritel airsoft dan tactical gear kelas dunia (**Evike**, **RedWolf Airsoft**, **Taiwangun**, **Novritsch**, **Crye Precision**, **Ferro Concepts**, **Spiritus Systems**) serta konteks regulasi dan logistik Indonesia (**Perpol No. 5 Tahun 2018**, aturan *Dangerous Goods* kargo darat), terdapat lima prinsip produk yang menentukan kepercayaan dan konversi pembeli serius:

1. **Zero Compatibility Anxiety**: Kegagalan kecocokan baterai (Deans vs Mini Tamiya, ukuran ruang buffer tube/handguard), magasin (platform M4/AK/SMG, AEG vs GBBR), dan sistem mounting (Picatinny 1913 vs M-LOK) adalah sumber retur nomor satu di toko airsoft. Sistem wajib memvalidasi kecocokan sebelum barang masuk keranjang.
2. **Spec-Driven Discovery, Bukan Brosur Generik**: Pembeli tactical mencari angka konkret (FPS, Joule, propulsi, material CNC/Cordura, berat dalam gram, kelayakan CQB/Woodland) serta bukti visual gerak melalui video demo nyata, bukan paragraf pemasaran kosong.
3. **Kepatuhan Hukum yang Jelas namun Minim Friksi**: Penjualan replika olahraga di Indonesia wajib menegakkan batas usia 18+, batas energi kinetik <= 2,0 Joule, penggunaan di area olahraga/koleksi berizin, dan pengiriman darat/kargo yang transparan agar transaksi aman dan kredibel.
4. **Satu Sumber Kebenaran Data (Single Source of Truth)**: Spesifikasi JSON produk, metadata kompatibilitas, stok, video demo, dan pengaturan Hero dikelola terpusat di Admin dan langsung mencerminkan kondisi live di Landing Page, Katalog, PDP, serta Loadout Builder.
5. **Admin Berbasis Keputusan Operasional (No Vanity / Fake Metrics)**: Dashboard admin hanya menampilkan antrean kerja nyata dan agregasi SQL langsung dari database. Tidak ada angka simulasi, grafik karangan, atau tren persentase sintetis.

---

## 1. Landing Page Narrative Architecture

Landing page Brakasa Tactical disusun sebagai **alur penceritaan produk dan fungsi lapangan**, bukan template SaaS/AI yang berisi kartu fitur identik atau angka klaim palsu. Setiap seksi memiliki peran konversi yang jelas dan terhubung langsung ke katalog produk nyata di database.

### Alur Seksi Landing Page (Urutan Vertikal)

| Urutan | Seksi | Tujuan Utama | Sumber Data | Aksi Konversi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Cinematic Action Hero Video + Telemetry Scene Switcher** | Membangun otoritas visual taktis dalam < 3 detik lewat video aksi cepat dan kontrol scene interaktif | `store_settings` (hero video & daftar scene) + link produk/filter nyata | Klik CTA ke Katalog / Loadout Builder, atau klik scene telemetry untuk langsung melihat gear pada scene tersebut |
| 2 | **Shop by Mission / Platform** | Memandu pembeli memilih gear berdasarkan medan main nyata (bukan sekadar daftar kategori kaku) | Aggregasi jumlah SKU & rentang harga live per misi dari `products` | Deep-link ke `/store?mission=...` dengan filter sudah aktif |
| 3 | **Interactive Loadout Spotlight** | Menunjukkan cara produk saling terintegrasi pada rig operator secara visual ("Shop the Rig") | Konfigurasi hotspot terhubung ke `product_id` aktif (harga & stok live) | Klik titik hotspot -> Quick inspect -> Tambah ke keranjang / Buka preset di Loadout Builder |
| 4 | **Field Video Showcase** | Membuktikan detail mekanisme, propulsi, dan konstruksi unit melalui video demo nyata | Query `products` yang memiliki `video_url` terisi | Putar video inline/modal + tombol langsung ke PDP atau tambah keranjang |
| 5 | **Panduan Kepatuhan & Klasifikasi FPS Indonesia** | Mengedukasi batas legal Perpol No. 5/2018, kelas FPS lapangan, dan alat konversi FPS/Joule | Referensi hukum & kalkulator klien interaktif | Filter cepat katalog berdasarkan kelas FPS (CQB <= 350 FPS, Woodland, DMR/Sniper) |
| 6 | **Footer Fungsional** | Akses cepat navigasi, lacak pesanan, kebijakan kargo darat, kepatuhan 18+, dan kontak armory | `store_settings` + rute aktif | Navigasi katalog, Order Lookup, Loadout Builder, dan akses `/admin` |

### 1.1 Cinematic Action Hero Video (`<= 30s`, Fast Cuts `1-5s` + Telemetry Scene Switcher)

**Spesifikasi Pengalaman & UX:**
- **Format & Durasi**: Video aksi taktis berdurasi **<= 30 detik** (target optimal 20-26 detik) dengan pergantian shot cepat tiap **1-5 detik** (CQB breach, transisi primary ke sidearm, pengecekan optic/rail, pergerakan woodland recce, detail plate carrier).
- **Kebijakan Autoplay Ramah Browser & Performa**:
  - Autoplay wajib **muted** (`autoplay muted loop playsinline`) agar tidak diblokir browser desktop/mobile dan tidak mengejutkan pengguna.
  - Wajib menyertakan atribut `poster` beresolusi tinggi (WebP) dan kontainer berasio aspek terkunci untuk mencegah *Cumulative Layout Shift* (CLS).
  - Kontrol eksplisit dan mudah dijangkau jempol: tombol **Mute/Unmute**, **Play/Pause**, dan indikator progres durasi tipis.
  - Otomatis `pause` ketika video keluar dari viewport (`IntersectionObserver`) untuk menghemat baterai dan CPU pada perangkat mobile.
- **Interactive Telemetry Scene Switcher**:
  - Alih-alih judul generik seperti "Slide 1 / Slide 2", tampilkan **bar pemilih scene taktis** (4-5 chapter yang disinkronkan dengan timestamp video, misalnya `00:00 CQB ENTRY`, `00:06 RECCE OPTICS`, `00:12 GBB SIDEARM`, `00:18 RIG & PLATE CARRIER`).
  - Saat pengguna mengklik salah satu scene, pemutar langsung melompat (`video.currentTime = scene.startSec`) tanpa reload halaman.
  - Overlay telemetry minimalis berbasis data nyata menampilkan metadata scene aktif: kode misi, rentang FPS rekomendasi, platform utama, dan tautan produk/filter langsung ("Lihat Unit di Scene Ini").
  - Tidak ada pill-badge klise di atas H1 dan tidak ada overlay gradien neon yang menutupi aksi video.

### 1.2 Shop by Mission / Platform

Pembeli airsoft tidak selalu tahu kode SKU, tetapi mereka selalu tahu **peran dan medan bermain** mereka. Seksi ini menyajikan 4 jalur eksplorasi dengan ritme visual asimetris (bukan 4 kartu seragam monoton), masing-masing menampilkan profil FPS, karakteristik medan, dan jumlah SKU tersedia secara live:

1. **CQB (Close Quarters Battle)**
   - Profil: Arena indoor/urban, jarak tembak 0-15 meter, manuver ruang sempit.
   - Batas FPS: `<= 350 FPS` (0.20g / `<= 1.14 J`), MED 0 meter.
   - Sorotan gear: SMG/PDW, SBR AEG kompak, tracer unit, full-face mask/goggle + lower mesh, compact chest rig.
   - Target URL: `/store?mission=cqb&maxFps=350`
2. **Woodland Recce**
   - Profil: Hutan/medan terbuka, jarak menengah hingga jauh, daya tahan dan kamuflase non-organik (Ranger Green, Multicam, Tan/Coyote).
   - Batas FPS: `351-400 FPS` untuk Assault Rifle, hingga `450 FPS` (`<= 2.0 J`) untuk DMR/Sniper dengan MED lapangan.
   - Sorotan gear: Carbine M4/AK, DMR/Bolt-Action, LPVO/Scope, hydration carrier, boonie/bump helmet, BB berat 0.28g-0.36g.
   - Target URL: `/store?mission=woodland-recce`
3. **SpeedQB / Competition**
   - Profil: Arena kompetitif cepat, respons pelatuk instan, bobot ultra-ringan.
   - Batas FPS: `300-330 FPS` (0.20g / `<= 1.01 J`).
   - Sorotan gear: Short-stroke Hi-Capa GBB, compact ARP/PDW, speed belt/chest rig minimalis, full-face thermal mask.
   - Target URL: `/store?mission=speedqb`
4. **Rig & Protection**
   - Profil: Perlengkapan pendukung keselamatan dan manajemen muatan untuk semua misi.
   - Sorotan gear: Plate Carrier (Cordura 500D/1000D, laser-cut MOLLE), Chest Rig/Placard modular, Bump Helmet, ANSI Z87.1+ Eye Protection, Tactical Gloves & Boots.
   - Target URL: `/store?mission=rig-protection`

### 1.3 Interactive Loadout Spotlight ("Shop the Operator Rig")

Diadaptasi dari pola *interactive hotspot breakdown* terbaik pada brand modular seperti Crye Precision, Ferro Concepts, dan Spiritus Systems:

- **Visual Utama**: Satu visual operator/flatlay tactical loadout beresolusi tinggi dengan 4-6 **titik hotspot bernomor/koordinat taktis** yang responsif di desktop maupun mobile.
- **Titik Hotspot yang Dipetakan ke Produk Nyata**:
  1. `01 / HEAD & EYEPRO`: Bump Helmet / Ballistic Goggle + Lower Mesh
  2. `02 / PRIMARY REPLICA`: Assault Rifle / PDW beserta indikator FPS & propulsi
  3. `03 / OPTIC & RAIL`: Red Dot / Holographic Sight (Picatinny 1913)
  4. `04 / PLATE CARRIER`: Modular Plate Carrier / Chest Rig (Cordura 500D)
  5. `05 / SIDEARM & HOLSTER`: GBB Tactical Pistol + Mag Pouch
- **Mekanisme Interaksi**:
  - Desktop: Klik/hover hotspot menyorot komponen aktif pada panel inspeksi di samping visual (bukan popover mengambang yang saling bertumpuk).
  - Mobile: Daftar tab hotspot di bawah gambar agar mudah diketuk tanpa salah sentuh (*fat-finger safe*).
  - Panel inspeksi menampilkan: foto produk, nama, spec singkat (FPS / material / berat), **status stok real-time**, harga IDR, tombol **"Tambah ke Keranjang"**, dan tautan **"Lihat Detail"**.
  - Aksi kolektif di bawah panel: ringkasan total harga + total berat seluruh rig, dengan tombol **"Muat Rig Ini di Loadout Builder"** (otomatis mengisi slot Loadout Builder dengan produk-produk tersebut) serta **"Tambah Semua Item Tersedia ke Keranjang"**.

### 1.4 Field Video Showcase

- Menampilkan etalase produk pilihan yang **benar-benar memiliki file video demo** (`video_url IS NOT NULL`).
- Tata letak: 1 pemutar utama berfokus detail (dengan judul produk, badge propulsi & FPS, durasi video, kontrol audio, dan tombol langsung "Lihat Spesifikasi / Tambah ke Keranjang") + daftar pilih 3-5 video produk lain di samping/bawahnya.
- Dilengkapi tautan langsung ke katalog berfilter video (`/store?hasVideo=true`) untuk pembeli yang ingin menelusuri seluruh produk dengan video demo.

### 1.5 Panduan Kepatuhan & Klasifikasi FPS Airsoft Indonesia

Menjadikan Brakasa Tactical tampil otentik, edukatif, dan bertanggung jawab secara hukum di ekosistem airsoft Indonesia:

- **Ringkasan Kepatuhan Hukum (Mengacu Perpol No. 5 Tahun 2018)**:
  - **Batas Energi Hukum**: Kekuatan lontar BB replika airsoft maksimal **2,0 Joule** (sekitar ~460 FPS menggunakan BB 0.20g). Unit di atas batas tersebut melampaui definisi legal replika olahraga.
  - **Usia & Peruntukan**: Pembelian replika khusus usia **18 tahun ke atas** semata-mata untuk kegiatan **olahraga airsoft, rekreasi lapangan tertutup/terizin, atau koleksi pribadi** (mengacu pendaftaran & pembinaan klub resmi seperti PORGASI, ABU, FAI, atau Perbakin setempat).
  - **Larangan Publik & Atribut**: Dilarang membawa/memamerkan unit di jalanan atau ruang publik, dilarang digunakan untuk ancaman/bela diri ilegal, dan dilarang menggunakan seragam loreng organik resmi TNI/Polri.
  - **Identifikasi Replika & Keselamatan**: Penggunaan *orange tip* penanda replika saat pengiriman/penyimpanan, transportasi dalam tas/hardcase tertutup dengan magasin dilepas dan baterai/gas terpisah, serta wajib pelindung mata standar balistik (ANSI Z87.1+) di zona bermain.
- **Tabel Klasifikasi FPS, Joule & MED Lapangan Indonesia**:

| Kelas Misi / Role | Berat BB Acuan | Rentang FPS (0.20g eq.) | Batas Energi (Joule) | MED (Jarak Aman Min.) | Rekomendasi Proteksi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SpeedQB / Strict CQB** | 0.20g | 300 - 330 FPS | <= 1.01 J | 0 meter (Point Blank) | Full-face mask / Goggle ANSI + Lower Mesh wajib |
| **CQB / Urban** | 0.20g - 0.25g | 330 - 350 FPS | <= 1.14 J | 0 - 3 meter | Goggle ANSI Z87.1+ & Lower Mesh wajib |
| **Woodland Assault (AEG/GBBR)** | 0.25g - 0.28g | 351 - 400 FPS | 1.15 - 1.49 J | 5 - 10 meter | Goggle ANSI + Lower Mesh direkomendasikan |
| **Woodland Recce / DMR / Sniper** | 0.28g - 0.36g | 401 - 450 FPS | 1.50 - 1.88 J (Maks 2.0 J) | 15 - 25 meter (Wajib bawa Sidearm CQB) | Goggle ANSI + Sidearm <= 350 FPS untuk jarak dekat |

- **Mini Kalkulator Interaktif FPS <-> Joule**: Pengguna dapat memilih berat BB (`0.20g`, `0.25g`, `0.28g`, `0.30g`, `0.36g`) dan memasukkan FPS untuk melihat energi dalam Joule (`E = 0.5 * m * v^2`) beserta status kelayakan (CQB / Woodland / DMR / Melampaui Batas Legal 2.0 J).

### 1.6 Footer Fungsional

Struktur 4 kolom pragmatis tanpa link mati:
- **Kolom 1 (Identitas Armory & Kepatuhan)**: Nama Brakasa Tactical, ringkasan kebijakan 18+ olahraga/koleksi, alamat gudang/armory, jam operasional, dan kontak CS (dari `store_settings`).
- **Kolom 2 (Navigasi Katalog)**: Tautan langsung ke kategori utama (Rifle & SMG, Sidearm Pistol, Optics & Aiming, Plate Carrier & Rig, Helm & Proteksi, Consumables/Power).
- **Kolom 3 (Fitur & Layanan Pembeli)**: Tautan ke **Loadout Builder**, **Cek Status Pesanan (Order Lookup)**, **Katalog Dengan Video Demo**, dan **Panduan Kepatuhan & Pengiriman Kargo Darat**.
- **Kolom 4 (Jaminan Logistik & Portal)**: Ringkasan pengiriman kargo darat aman untuk replika/LiPo/gas, metode pembayaran didukung, serta tautan teks diskret menuju **Admin Portal (`/admin`)**.

---

## 2. Storefront Features (Pengalaman Pembeli)

### 2.1 Pencarian Instan & Filter Multi-Dimensi (`/store`)

Sistem katalog dirancang seperti *technical armory index* yang cepat, akurat, dan mendukung *shareable URL state* (`/store?q=mk18&platform=M4&propulsion=AEG&maxFps=350&hasVideo=1`).

**Pencarian Instan (Instant Search):**
- Input pencarian dengan *debounce* 250ms yang mengeksekusi query ke endpoint `GET /api/products`.
- Mencocokkan kata kunci terhadap: `name`, `sku`, `brand`, `platform`, `category`, `short_description`, serta nilai kunci dalam `specs` (mis. "Deans", "Cordura", "M-LOK", "Blowback").
- Menampilkan *quick-suggestion dropdown* saat mengetik di header global (maks 5 hasil teratas lengkap dengan thumbnail, harga IDR, status stok, dan label FPS/video) plus tautan "Lihat semua hasil untuk '...'".

**Dimensi Filter Lengkap:**
1. **Kategori**: Assault Rifle, SMG / PDW, Sniper / DMR, Sidearm Pistol, Optics & Aiming, Plate Carrier & Rig, Helmet & Protection, Apparel & Boots, Power / Magazines / Consumables.
2. **Misi / Peran**: CQB, Woodland Recce, SpeedQB, Rig & Protection.
3. **Platform**: `M4 / AR-15`, `AK Series`, `SMG / PDW`, `Pistol (Hi-Capa / G-Series)`, `Bolt-Action`, `Universal / MOLLE`.
4. **Propulsi**: `AEG`, `GBBR`, `GBB Pistol`, `CO2`, `Spring`, `Non-Replica (Gear/Aksesori)`.
5. **Rentang FPS**:
   - Preset sekali klik: `CQB Legal (<= 350 FPS)`, `Woodland (351 - 400 FPS)`, `DMR / Sniper (401 - 450 FPS)`.
   - Input rentang manual `minFps` - `maxFps`.
6. **Status Stok**:
   - Checkbox `Hanya Stok Tersedia` (`inStock=true`)
   - Filter cepat `Stok Terbatas` (`1 <= stock <= low_stock_threshold`)
7. **Rentang Harga (IDR)**: Input `minPrice` - `maxPrice` + preset praktis (`< Rp 1.000.000`, `Rp 1 - 3 Juta`, `Rp 3 - 6 Juta`, `> Rp 6 Juta`).
8. **Toggle "Ada Video Demo" (`hasVideo=true`)**: Menyaring hanya produk yang memiliki video demonstrasi asli.

**UX Filter & Sorting:**
- Setiap chip filter aktif tampil di atas grid produk dengan tombol `x` untuk hapus satuan dan tombol **"Reset Semua Filter"**.
- Sorting: `Unggulan (Featured)`, `Terbaru`, `Harga: Rendah ke Tinggi`, `Harga: Tinggi ke Rendah`, `FPS: Rendah ke Tinggi`, `FPS: Tinggi ke Rendah`.
- Pada mobile: filter berada dalam *bottom sheet / slide-over drawer* dengan tombol sticky **"Terapkan Filter (N Produk)"** agar layar tetap lega.
- **Kartu Produk Informatif (Tanpa Clutter)**: Menampilkan foto/thumbnail (dengan indikator ikon "VIDEO" jika ada video demo), kategori & platform, nama produk, 3 micro-spec padat (mis. `AEG | 340 FPS | 2.65 kg` atau `Cordura 500D | MOLLE | 1.15 kg`), badge status stok live (`Tersedia`, `Sisa 3`, `Habis`), harga IDR, dan aksi cepat "Detail" / "+ Keranjang".

---

### 2.2 Halaman Detail Produk (Product Detail Page / `/store/[slug]`)

Halaman PDP dirancang untuk menjawab seluruh pertanyaan teknis pembeli dalam sekali gulir tanpa keraguan:

1. **Galeri Media Hibrida (Foto Generatif + Pemutar Video Demo Terintegrasi)**:
   - Thumbnail utama menampilkan foto produk resolusi tinggi; **video demo produk** muncul langsung sebagai item media terintegrasi di urutan awal galeri (dengan ikon play + label `Video Demo`) sehingga tidak tersembunyi di bawah lipatan halaman.
   - Pemutar video HTML5 native yang di-styling rapi dengan poster frame, toggle mute/unmute, play/pause, scrubber, dan dukungan lightbox zoom untuk foto detail.
2. **Blok Ringkasan Pembelian & Kepatuhan**:
   - Breadcrumb (`Store / Kategori / Platform`), SKU produk, Brand, dan status stok akurat dari database.
   - Badge informatif kondisional:
     - `18+ Replika Olahraga` (bila `requires_age_18 = true`)
     - `CQB Legal <= 350 FPS` / `Woodland 351-400 FPS` / `DMR <= 2.0 J` (otomatis dari nilai FPS)
     - `Wajib Kargo Darat` (bila unit replika, baterai LiPo, atau tabung gas)
   - Pemilih kuantitas dengan batas atas otomatis mengikuti `product.stock` (tombol nonaktif bila `stock === 0`).
   - Dua CTA utama: **"Tambah ke Keranjang"** dan **"Gunakan di Loadout Builder"** (langsung membuka `/loadout-builder` dengan slot produk ini sudah terisi).
3. **Tabel Spesifikasi Teknis Lengkap (Terstruktur dari JSON `specs`)**:
   - Untuk **Unit Replika**: Propulsi, Kecepatan (FPS @0.20g), Energi Kinetik (Joule), Sistem Gearbox / Blowback, Mode Tembak (Safe/Semi/Full-Auto), Hop-Up (Adjustable Rotary/Standard), Material Receiver & Handguard, Sistem Rail (Picatinny 1913 / M-LOK), Konektor Baterai (Deans T-Plug / Mini Tamiya) atau Tipe Gas (Green Gas / CO2 12g), Kapasitas Magasin, Panjang Total & Inner Barrel, Berat (gram), Ulir Muzzle (mis. 14mm CCW), Isi Paket (*In the Box*).
   - Untuk **Tactical Gear / Optics / Consumables**: Material Kain/Body (Cordura 500D/1000D, 6061-T6 CNC), Sistem Mounting (MOLLE/PALS Laser-Cut, Picatinny 1913, RMR), Reticle / Pembesaran / Baterai Optic, Sertifikasi Proteksi (ANSI Z87.1+), Tegangan & Kapasitas (LiPo 7.4V/11.1V mAh, C-Rating, Konektor), Berat (gram), Ukuran/Fit.
4. **Panel Indikator Kompatibilitas (Compatibility Callout)**:
   - Merender atribut dari JSON `compatibility` menjadi badge mudah pindai:
     - **Daya / Propulsi Cocok**: mis. `Baterai LiPo 11.1V Stick - Konektor Deans (T-Plug)` atau `Green Gas / Propane`
     - **Kompatibilitas Magasin**: mis. `Standard M4/AR-15 AEG Mid-Cap & Hi-Cap`
     - **Mounting Aksesori**: mis. `Top Rail Picatinny 20mm + Handguard M-LOK`
     - **Rekomendasi BB**: mis. `0.25g - 0.28g Seamless Bio/Precision BB`
5. **Produk Pelengkap dalam Satu Rig (Compatible Rig Pairings)**:
   - Tidak menggunakan rekomendasi acak. Server/query memilih 3-4 produk lain yang stoknya `> 0` berdasarkan aturan kecocokan `compatibility`:
     - Contoh jika membuka **M4 AEG (Deans, Picatinny)**: menampilkan (1) Baterai LiPo Deans yang cocok, (2) Red Dot Picatinny, (3) Magasin M4 Mid-Cap atau BB 0.25g, (4) Plate Carrier / Chest Rig M4 placard.
   - Setiap item pelengkap memiliki tombol **"+ Tambah"** langsung agar pembeli mudah melengkapi rig dari PDP.

---

### 2.3 Fitur Unggulan Pembeda: Interactive Tactical Loadout Builder (`/loadout-builder`)

Fitur ini menjadi pembeda utama Brakasa Tactical dibanding toko e-commerce umum. Dirancang dengan inspirasi keterlibatan *gunsmith/loadout configurator* modern namun tetap ringan, cepat, dan 100% berbasis katalog database nyata.

#### Struktur Slot Loadout (5 Slot Inti + 1 Opsional)

| Slot | Wajib/Opsional | Kategori Produk yang Diizinkan | Contoh Atribut yang Dievaluasi |
| :--- | :--- | :--- | :--- |
| **1. Primary Replica** | Inti | Assault Rifle, SMG/PDW, Sniper/DMR | `platform`, `propulsion`, `fps`, `railSystem`, `batteryConnector`, `batterySpace`, `magFamily`, `weightGrams` |
| **2. Sidearm** | Opsional (Disarankan wajib bila Primary > 400 FPS) | Sidearm Pistol (GBB / CO2) | `propulsion`, `fps`, `gasType`, `magFamily`, `weightGrams` |
| **3. Optic & Aiming** | Opsional | Optics & Aiming | `mountType` (Picatinny/RMR/Dovetail), `opticClass` (Red Dot/Holo/LPVO/Scope), `weightGrams` |
| **4. Plate Carrier / Rig & Protection** | Inti | Plate Carrier, Chest Rig, Helmet/Protection | `supportedMagFamily` (5.56/M4, 7.62/AK, SMG/9mm, Universal), `rigProfile` (Minimalist/Full), `weightGrams` |
| **5. Power & Consumables** | Inti (Multi-item: Daya + BB/Mag) | Baterai LiPo, Green Gas, CO2, BB, Magasin Ekstra | `powerType` (LiPo/Gas/CO2), `connector` (Deans/Tamiya), `batteryShape` (Stick/Brick/PEQ), `magFamily`, `bbWeight`, `weightGrams` |

#### Fitur Preset Misi Cepat
Pengguna baru maupun veteran dapat memulai dari 1-klik preset (diisi dinamis dari produk aktif yang cocok di database):
- **Preset CQB Entry (`<= 350 FPS`)**: Compact M4/SMG AEG + Red Dot + Minimalist Plate Carrier/Chest Rig + LiPo Deans + BB 0.25g.
- **Preset Woodland Recce (`351-400+ FPS`)**: Carbine/DMR + Magnified LPVO/Scope + GBB Sidearm + Full Modular Rig + BB 0.28g/0.30g + Power/Gas.
- **Preset SpeedQB Light (`<= 330 FPS`)**: Compact PDW atau Hi-Capa GBB + Micro Red Dot + Lightweight Rig + Gas/LiPo + BB 0.20g/0.25g.
- **Mulai Kosong (Custom Build)**.

#### Mesin Pengecekan Kompatibilitas Otomatis (Real-Time Compatibility Engine)

Setiap perubahan slot langsung menjalankan evaluasi deterministik (fungsi murni TypeScript yang bisa diuji unit test) dengan 3 level status: `COMPATIBLE` (hijau/olive), `WARNING` (amber, butuh perhatian/rekomendasi), dan `CONFLICT` (merah, tidak cocok secara fisik/elektrik).

**Daftar Aturan Pengecekan Otomatis:**
1. **Kecocokan Sistem Daya vs Propulsi (`POWER_PROPULSION_MATCH`)**:
   - Jika Primary adalah `AEG` dan slot Power belum berisi baterai LiPo -> `WARNING`: *"Unit AEG membutuhkan baterai LiPo & charger agar siap pakai."*
   - Jika Primary adalah `AEG` dengan konektor `Deans (T-Plug)` namun pengguna memilih baterai `Mini Tamiya` (atau sebaliknya) -> `CONFLICT`: *"Ketidakcocokan konektor: unit memakai Deans T-Plug, sedangkan baterai memakai Mini Tamiya."* + tombol **"Ganti ke Baterai Deans"**.
   - Jika Primary bertipe `PDW / Compact Buffer Tube` dan pengguna memilih baterai `Large Brick` -> `CONFLICT`: *"Dimensi baterai terlalu besar untuk kompartemen stock PDW. Gunakan baterai LiPo Stick."*
   - Jika Primary/Sidearm adalah `GBBR` atau `GBB Pistol` dan belum ada Green Gas / CO2 yang sesuai -> `WARNING`: *"Unit Gas Blowback membutuhkan Green Gas / tabung CO2 12g sesuai spesifikasi magasin."*
   - Jika Primary `GBBR` namun pengguna memilih baterai LiPo tanpa unit AEG -> `WARNING`: *"Unit GBBR bertenaga gas, baterai LiPo tidak diperlukan kecuali untuk perangkat pendukung."*
2. **Kecocokan Mounting Optic & Rail (`OPTIC_RAIL_MATCH`)**:
   - Memeriksa kesesuaian `optic.mountType` terhadap `primary.railSystem` (mis. Optic `Picatinny 20mm` cocok pada top rail `Picatinny 1913`; Optic `RMR Footprint` cocok untuk slide pistol RMR-ready atau memerlukan adapter Picatinny).
   - Jika `primary.platform === 'SMG/PDW'` dan pengguna memilih `Long-Range Sniper Scope (>4x)` -> `WARNING`: *"Scope pembesaran besar kurang ideal pada platform CQB/PDW. Pertimbangkan Red Dot atau Holographic Sight."*
3. **Kecocokan Magasin & Placard Rig (`MAG_PLATFORM_MATCH`)**:
   - Jika pengguna menambah magasin ekstra di slot Consumables, cek kesesuaian `mag.platform` & `mag.propulsion` terhadap Primary/Sidearm. Jika berbeda -> `CONFLICT`: *"Magasin [X] tidak kompatibel dengan platform/sistem propulsi unit utama Anda."*
   - Jika Plate Carrier/Chest Rig memiliki placard spesifik (mis. khusus `SMG 9mm`) sementara Primary adalah `M4/AK` -> `WARNING`: *"Placard rig dioptimalkan untuk magasin SMG; pastikan menggunakan insert pouch yang sesuai untuk magasin rifle."*
4. **Kecocokan Berat BB & Kelayakan Medan FPS (`FIELD_FPS_COMPLIANCE`)**:
   - Menghitung profil FPS Primary dan Sidearm:
     - Jika Primary `<= 350 FPS`: badge `CQB & Indoor Legal`.
     - Jika Primary `351 - 400 FPS`: badge `Woodland Standard (MED 5-10m)`.
     - Jika Primary `> 400 FPS` dan belum ada Sidearm `<= 350 FPS`: `WARNING`: *"Unit utama di atas 400 FPS wajib mematuhi MED jarak jauh. Tambahkan Sidearm CQB (<= 350 FPS) untuk pertempuran jarak dekat."*
     - Jika Primary `> 400 FPS` namun BB yang dipilih `0.20g`: `WARNING`: *"Untuk akurasi optimal pada unit > 400 FPS, disarankan BB 0.28g atau 0.30g."*
     - Validasi hukum: menandai energi kinetik estimasi `<= 2.0 Joule (Patuh Perpol 5/2018)`.

#### Kalkulasi Live & Manifest Panel (Sticky Sidebar / Bottom Drawer Mobile)
- **Total Berat Loadout**: penjumlahan akurat `weightGrams` seluruh item terpilih, ditampilkan dalam gram dan kilogram (mis. `4.850 g / 4,85 kg`) + indikator kelas beban:
  - `Ultralight (< 4,0 kg)` - ideal SpeedQB & CQB cepat
  - `Balanced Tactical (4,0 - 6,5 kg)` - ideal Skirmish & Woodland
  - `Heavy Direct Action (> 6,5 kg)` - full carrier + rifle + sidearm lengkap
- **Ringkasan Status Kompatibilitas**: hitungan jelas (`0 Konflik | 1 Rekomendasi` atau `Seluruh Komponen Kompatibel`).
- **Kalkulasi Total Harga**: rincian harga per slot + subtotal total (IDR) + deteksi otomatis kelas pengiriman (`Memerlukan Kargo Darat` bila ada unit/LiPo/gas).
- **Aksi Final**:
  - **"Tambahkan Seluruh Loadout ke Keranjang"**: memvalidasi stok seluruh item terpilih; jika ada konflik kritis, tampilkan konfirmasi eksplisit agar pembeli sadar sebelum lanjut; setiap item dimasukkan sebagai line item keranjang tersendiri agar mutasi stok per SKU presisi saat checkout.
  - **"Salin Tautan Build"**: menyimpan ID produk terpilih pada query URL (`/loadout-builder?primary=...&sidearm=...&optic=...&rig=...&consumables=...`) agar mudah dibagikan ke rekan satu tim/komunitas.

---

### 2.4 Keranjang Belanja Persisten, Checkout Kepatuhan & Order Lookup

#### A. Persistent Shopping Cart (Drawer + `/cart`)
- State keranjang disimpan persisten di `localStorage` (dengan versioning schema agar aman saat update) dan melakukan **sinkronisasi validasi live** terhadap endpoint backend (`POST /api/cart/validate` atau `GET /api/products?ids=...`) setiap kali drawer/halaman cart/checkout dibuka.
- Validasi live memastikan:
  - Harga yang ditampilkan selalu harga terbaru dari database (mencegah manipulasi harga sisi klien).
  - Kuantitas otomatis diperingatkan/disesuaikan bila melebihi stok terbaru, atau item ditandai `Stok Habis` bila stok menjadi `0`.
  - Menampilkan badge peringatan dini bila isi keranjang memerlukan **Verifikasi 18+** atau **Ekspedisi Kargo Darat**.

#### B. Alur Checkout Lengkap (`/checkout`)

Struktur 2 kolom (Form terstruktur di kiri, Ringkasan Pesanan sticky di kanan) dengan 4 tahap jelas dalam satu alur rapi (tanpa reload halaman membingungkan):

1. **Informasi Pembeli & Alamat Pengiriman**:
   - Nama Lengkap (wajib sesuai identitas untuk verifikasi usia), Email, No. WhatsApp/HP Indonesia (`08...` / `+62...`).
   - Provinsi / Zona Pengiriman, Kota/Kabupaten, Kecamatan, Kode Pos, Alamat Lengkap, Catatan Pengiriman.
2. **Verifikasi Syarat Usia 18+ & Deklarasi Legal (Kondisional Otomatis)**:
   - Aktif otomatis bila minimal 1 item di keranjang memiliki flag `requires_age_18 = true` (semua replika airsoft dan komponen terbatas).
   - **Tanggal Lahir (Wajib)**: input `YYYY-MM-DD` (atau DD/MM/YYYY) dengan perhitungan usia di sisi klien DAN divalidasi ulang di server (`age >= 18`). Pesanan ditolak dengan pesan jelas bila usia `< 18 tahun`.
   - **Nomor KTA Klub / Keanggotaan (Opsional namun direkomendasikan)**: input teks untuk nomor KTA PORGASI / ABU / FAI / Perbakin (disimpan pada record pesanan untuk memudahkan verifikasi admin).
   - **Tujuan Penggunaan**: pilihan radio terstruktur (`Olahraga Skirmish / Klub`, `Latihan Target / Rekreasi Area Terizin`, `Koleksi Pribadi`).
   - **Dua Checkbox Deklarasi Eksplisit (Default: Unchecked)**:
     - `[ ]` *"Saya menyatakan berusia 18 tahun atau lebih dan seluruh data identitas yang saya isi adalah benar."*
     - `[ ]` *"Saya memahami bahwa replika airsoft tunduk pada Perpol No. 5 Tahun 2018 (energi <= 2 Joule), hanya digunakan untuk olahraga/koleksi di area yang diizinkan, dilarang dibawa di ruang publik, dan wajib dikirim melalui jalur ekspedisi darat/kargo yang sesuai."*
3. **Pemilihan Ekspedisi Darat / Kargo & Packing Kayu (Dangerous Goods Aware)**:
   - Backend dan frontend mengevaluasi `shipping_class` tertinggi di keranjang:
     - `REGULAR` (hanya apparel/gear kain/plastik/BB tanpa unit/LiPo/gas): boleh Kurir Reguler (JNE Reg / SiCepat Reg) maupun Kargo Darat.
     - `CARGO_BATTERY` (mengandung Baterai LiPo): jalur udara diblokir; tersedia **JNE Trucking (JTR)**, **Indah Cargo Darat**, **Ambil di Armory**.
     - `CARGO_REPLICA` (mengandung unit Airsoft Gun): jalur udara diblokir; tersedia **JNE Trucking (JTR)**, **Indah Cargo Darat**, **Dakota Cargo Darat**, **Ambil di Armory** + opsi centang **Packing Kayu Pelindung Unit** (direkomendasikan/aktif otomatis untuk unit laras panjang, dengan biaya transparan terpisah).
     - `CARGO_GAS` (mengandung Green Gas / CO2 bertekanan): jalur udara dan reguler diblokir ketat; hanya tersedia **Kargo Khusus Darat/Laut (Penanganan Gas Bertekanan)** atau **Ambil di Armory**, disertai catatan informatif mengenai estimasi waktu jalur darat murni.
   - **Kalkulasi Ongkir Deterministik**:
     - Menghitung total berat keranjang (`Math.ceil(totalWeightGrams / 1000)` kg, dengan minimum berat kargo sesuai layanan, mis. JTR min. 10 kg atau tarif flat berat kargo bertingkat per zona wilayah Indonesia: Jabodetabek, Jawa, Bali/Sumatera, Kalimantan/Sulawesi, Indonesia Timur).
     - Semua tarif zona & biaya packing kayu dapat dikonfigurasi dari `store_settings` di Admin.
4. **Kupon Diskon / Voucher & Konfirmasi Pembayaran**:
   - Input kode voucher dengan tombol **"Terapkan"** yang memanggil `POST /api/vouchers/validate` (mengembalikan nominal potongan, pesan validasi spesifik jika kadaluwarsa, kuota habis, atau belum memenuhi minimum belanja).
   - Pemilihan metode pembayaran (contoh: Transfer Bank Virtual Account BCA/Mandiri, QRIS, Transfer Manual Rekening Armory) dengan rincian subtotal, ongkir, biaya packing kayu, diskon voucher, dan **Grand Total (IDR)**.
   - **Proses Pembuatan Pesanan Atomik (`POST /api/orders`)**:
     - Seluruh validasi (stok, harga dari DB, umur >= 18, deklarasi, syarat ekspedisi kargo, validasi kupon) **wajib diverifikasi ulang di server**.
     - Dalam satu transaksi SQLite (`BEGIN IMMEDIATE ... COMMIT`):
       1. Cek ketersediaan stok tiap item.
       2. Kurangi stok produk (`products.stock = stock - qty`).
       3. Catat mutasi stok di `stock_movements` (`type = 'ORDER_DEDUCT'`, `reference_code = invoice_number`).
       4. Insert record `orders` dan `order_items` (menyimpan snapshot harga, nama, SKU, dan data kepatuhan 18+).
       5. Insert entri awal `order_status_logs` (`status = 'PENDING_PAYMENT'`).
       6. Jika menggunakan voucher, increment `vouchers.used_count` secara atomik (dengan guard `used_count < usage_limit`).
     - Mengembalikan `invoice_number` (format rapi mis. `BRK-YYYYMMDD-XXXX`) dan langsung mengarahkan pembeli ke halaman konfirmasi/instruksi pembayaran dengan tautan ke **Order Lookup**.

#### C. Halaman Cek Status Pesanan / Order Lookup (`/orders/lookup`)
- Dirancang agar pembeli tamu (*guest checkout*) tidak perlu membuat akun namun tetap mendapatkan visibilitas penuh dan mengurangi pertanyaan status pesanan ke CS:
  - **Form Verifikasi 2 Bidang**: Nomor Invoice (auto-trim & uppercase, toleran dengan atau tanpa awalan) + Email atau No. HP yang digunakan saat checkout (mencegah enumerasi pesanan orang lain).
  - **Ringkasan Atas Lipatan (Above the Fold)**:
    - Nomor Invoice, Tanggal Pesanan, Badge Status aktif, Estimasi Kargo/Pengiriman, serta **Nomor Resi & Nama Ekspedisi** (muncul menonjol begitu status `SHIPPED` beserta tombol "Salin Resi").
  - **Timeline Progres Linear (5 Tahap Manusiawi)**:
    1. `Menunggu Pembayaran` (Menunggu konfirmasi transfer/pembayaran)
    2. `Diverifikasi` (Pembayaran & verifikasi kepatuhan 18+ disetujui)
    3. `Dikemas` (Unit sedang dicek QC/chronograph & dikemas aman)
    4. `Dikirim` (Diserahkan ke ekspedisi kargo darat + nomor resi aktif)
    5. `Selesai` (Pesanan diterima pelanggan)
    *(Jika dibatalkan, stepper menampilkan status terminal `Dibatalkan` beserta alasan pembatalan dan catatan pengembalian stok/dana).*
  - **Detail Pesanan & Riwayat Aktivitas**:
    - Daftar item yang dipesan (thumbnail, nama, SKU, qty, harga satuan, subtotal).
    - Rincian biaya (subtotal, diskon voucher, ongkir kargo, packing kayu, grand total).
    - Status verifikasi usia 18+ & metode pengiriman.
    - Log timestamp kronologis setiap perubahan status dari tabel `order_status_logs`.
    - Tombol **"Cetak Ringkasan Invoice"** (`window.print()` dengan CSS print-friendly bersih).

---

## 3. Admin Operations Center Features (`/admin`)

Admin Operations Center dirancang sebagai ruang kendali operasional yang tajam, padat informasi, bebas dekorasi palsu, dan memprioritaskan akurasi inventori serta kecepatan pemrosesan pesanan.

### 3.1 Autentikasi Admin Aman & Proteksi Route API

- **Rute Login Terpisah (`/admin/login`)**: Form email/username + password tanpa petunjuk kredensial sensitif di respons error (pesan generik: *"Email atau kata sandi tidak valid"*).
- **Penyimpanan Kata Sandi**: Hash kuat di sisi server menggunakan `crypto.scryptSync` (dengan salt acak per user) dan perbandingan `crypto.timingSafeEqual`.
- **Manajemen Sesi Berbasis HttpOnly Cookie**:
  - Setelah login berhasil, server membuat token acak kriptografis (`crypto.randomBytes(32).toString('hex')`), menyimpan hash token beserta `expires_at` dan `admin_user_id` di tabel `admin_sessions`.
  - Cookie disetel dengan flag keamanan: `HttpOnly; SameSite=Lax; Path=/` (ditambah `Secure` bila dijalankan via HTTPS produksi), sehingga tidak dapat diakses JavaScript (`document.cookie`) dan aman dari pencurian token via XSS.
  - Tidak menyimpan token admin di `localStorage` atau `sessionStorage`.
- **Proteksi Menyeluruh Middleware**:
  - Seluruh endpoint `/api/admin/*` (kecuali `POST /api/admin/auth/login`) wajib melalui middleware `requireAdminSession` yang memverifikasi cookie terhadap tabel `admin_sessions` dan memeriksa `expires_at > CURRENT_TIMESTAMP`.
  - Akses tanpa sesi valid langsung mengembalikan `401 Unauthorized` pada API dan redirect ke `/admin/login` pada halaman SSR/CSR admin.
  - **Rate Limiting Login**: pembatasan percobaan gagal per IP/email dalam jendela waktu tertentu untuk mencegah brute-force.
  - **Logout Bersih**: `POST /api/admin/auth/logout` menghapus baris sesi dari `admin_sessions` dan menimpa cookie dengan `Max-Age=0`.

### 3.2 Dashboard Operasional Real-Time (`/admin`)

Aturan mutlak: **0 angka karangan, 0 grafik dummy, 0 persentase pertumbuhan palsu**. Seluruh widget dihitung langsung dari query SQLite saat halaman dimuat (dengan tombol refresh manual dan indikator timestamp pembaruan terakhir).

1. **Strip KPI Operasional Real-Time (4 Kartu Terverifikasi DB)**:
   - **Pendapatan Terkonfirmasi**: `SUM(total_amount)` dari pesanan berstatus `VERIFIED`, `PACKING`, `SHIPPED`, `COMPLETED` (menampilkan juga nominal terpisah `Menunggu Pembayaran` sebagai sub-info nyata, bukan dicampur).
   - **Pesanan Perlu Tindakan**: `COUNT(*)` pesanan dengan status `PENDING_PAYMENT`, `VERIFIED`, atau `PACKING` (klik langsung memfilter halaman Pesanan ke antrean aktif).
   - **SKU Stok Kritis / Habis**: `COUNT(*)` produk aktif dengan `stock <= low_stock_threshold` (termasuk `stock = 0`).
   - **Katalog Aktif**: `COUNT(*)` produk aktif beserta jumlah produk yang memiliki video demo.
2. **Antrean Kerja Utama (Two-Column Action Queues)**:
   - **Antrean Pesanan Prioritas**: Menampilkan pesanan terbaru yang belum selesai (`PENDING_PAYMENT`, `VERIFIED`, `PACKING`), lengkap dengan nomor invoice, nama pembeli, total IDR, badge `18+` & ekspedisi kargo, serta tombol aksi cepat **"Proses Pesanan"**.
   - **Peringatan Stok Kritis**: Menampilkan daftar SKU dengan stok terendah (`stock <= low_stock_threshold`), menampilkan `SKU`, nama produk, stok tersisa vs threshold, dan tombol langsung **"Restock Cepat"** yang membuka modal tambah stok dan langsung menulis ke Stock Ledger.
3. **Ringkasan Distribusi Status Pesanan & Log Mutasi Terbaru**:
   - Hitungan nyata per status pesanan (`Menunggu Bayar`, `Diverifikasi`, `Dikemas`, `Dikirim`, `Selesai`, `Dibatalkan`) dari `GROUP BY status`.
   - Daftar 8-10 entri terakhir dari `stock_movements` (penjualan otomatis, restock, koreksi, pengembalian stok pembatalan) agar admin segera memantau pergerakan fisik barang.

### 3.3 Manajemen Produk & Media Penuh (`/admin/products`)

- **Daftar Produk Operasional**:
  - Pencarian cepat (nama/SKU), filter kategori, filter status aktif, filter stok (`Semua`, `Kritis`, `Habis`), filter `Ada Video`.
  - Tabel padat informasi: thumbnail, Nama + SKU + Platform, Kategori & Propulsi/FPS, Harga (IDR), Stok (dengan highlight warna bila kritis/habis), toggle inline **Featured** dan **Status Aktif**, serta tombol Edit / Duplikat / Hapus.
- **Form Tambah & Edit Produk Lengkap**:
  - **Tab 1 - Informasi Dasar & Kepatuhan**: Nama, Slug (auto-generate & editable), SKU unik, Brand, Kategori, Misi (`cqb`, `woodland-recce`, `speedqb`, `rig-protection`), Platform, Propulsi, FPS (angka opsional untuk gear non-replika), Berat (gram), Harga (IDR), Stok awal (saat create; setelah dibuat, perubahan stok diarahkan melalui Ledger agar teraudit!), Ambang stok kritis (`low_stock_threshold`), Flag `Featured`, `Aktif`, `Wajib Usia 18+`, dan `Kelas Pengiriman` (`REGULAR`, `CARGO_BATTERY`, `CARGO_REPLICA`, `CARGO_GAS`).
  - **Tab 2 - Spesifikasi Teknis & Kompatibilitas JSON**:
    - Menyediakan **form terstruktur** untuk atribut umum (`gearbox`, `hopUp`, `material`, `railSystem`, `batteryConnector`, `batterySpace`, `magFamily`, `gasType`, `bbWeightRec`, `inTheBox`, `denier`, `mountType`) sekaligus **editor raw JSON** dengan validasi sintaks real-time untuk atribut khusus.
    - Data ini langsung dikonsumsi oleh tabel spesifikasi PDP dan mesin pengecekan **Loadout Builder**.
  - **Tab 3 - Manajemen Media (Gambar & Video Demo)**:
    - Unggah gambar baru (`.webp`, `.jpg`, `.png`) dan video demo produk (`.mp4`, `.webm`) melalui endpoint terproteksi `POST /api/admin/media/upload` dengan validasi MIME type, ekstensi aman, dan batas ukuran file (mis. gambar <= 5 MB, video <= 25 MB), disimpan rapi di direktori media statis proyek.
    - Fitur **Pilih dari Pustaka Media Lokal** agar admin dapat memilih aset generatif/video yang sudah dirender tanpa unggah ulang.
    - Pengaturan gambar utama (`primary_image`), daftar galeri tambahan (`gallery_images` JSON array), dan tautan video demo (`video_url`) + pratinjau pemutar langsung di form admin.
- **Penghapusan Produk Aman**:
  - Jika produk sudah pernah masuk dalam `order_items`, sistem melakukan **soft-delete / arsip (`is_active = 0`, `deleted_at = timestamp`)** agar integritas riwayat pesanan dan laporan pendapatan historis tidak pernah rusak.

### 3.4 Manajemen Inventori & Riwayat Mutasi Stok (`/admin/inventory`)

Mengadopsi standar *immutable stock ledger* untuk akuntabilitas gudang armory:

- **Tampilan Inventori Real-Time**:
  - Menampilkan seluruh SKU aktif beserta `stock`, `low_stock_threshold`, status (`AMAN`, `KRITIS`, `HABIS`), nilai stok (`stock * price`), dan tanggal mutasi terakhir.
  - Dua tombol aksi terkontrol per SKU:
    1. **Restock (`+`)**: Memasukkan jumlah penambahan stok masuk, nomor referensi (mis. `PO-2026-014` atau `RESTOCK-ARMORY`), dan catatan.
    2. **Koreksi Stok (`+/-`)**: Untuk penyesuaian hasil *cycle count / stock opname* atau barang cacat/karantina, dengan **alasan wajib diisi** dan validasi agar stok akhir tidak bernilai negatif (`stock_after >= 0`).
- **Otomatisasi Mutasi**:
  - Checkout berhasil -> otomatis mencatat `ORDER_DEDUCT` (negatif) dengan referensi nomor invoice.
  - Pembatalan pesanan -> otomatis mencatat `ORDER_RESTOCK` (positif) dengan referensi nomor invoice.
- **Tabel Riwayat Mutasi Stok (`stock_movements`)**:
  - Filter berdasarkan produk, tipe mutasi (`RESTOCK`, `ADJUSTMENT`, `ORDER_DEDUCT`, `ORDER_RESTOCK`, `INITIAL`), dan pencarian referensi invoice/PO.
  - Kolom lengkap: Waktu, Produk/SKU, Tipe Mutasi (badge warna semantik), Perubahan (`+10` / `-2`), Stok Sebelum -> Stok Sesudah, Referensi, Catatan, dan Aktor (`Admin` / `System Checkout`).

### 3.5 Manajemen Pesanan End-to-End (`/admin/orders`)

- **Daftar Pesanan dengan Tab Filter Status**:
  - Tab jumlah live: `Semua`, `Menunggu Pembayaran`, `Diverifikasi`, `Dikemas`, `Dikirim`, `Selesai`, `Dibatalkan`.
  - Pencarian berdasarkan nomor invoice, nama pembeli, email/HP, atau nomor resi.
  - Indikator cepat di baris tabel: badge kepatuhan `18+` (menampilkan usia pembeli terhitung), badge metode kargo (`JTR` / `Indah Cargo` / `Packing Kayu`), dan total nominal.
- **Panel Detail & Pemrosesan Pesanan (`/admin/orders/[id]`)**:
  - **Informasi Pembeli & Kepatuhan**: Nama, email, WA, alamat lengkap, **Tanggal Lahir & Usia terhitung**, Nomor KTA klub (bila diisi), Tujuan Penggunaan, dan timestamp persetujuan deklarasi Perpol 5/2018.
  - **Manifest Item & Rincian Biaya**: Daftar produk dibeli (SKU, qty, harga snapshot), subtotal, kode & nominal diskon voucher, jenis ekspedisi kargo, biaya ongkir, biaya packing kayu, dan grand total.
  - **Kontrol Transisi Status (State Machine Terjaga)**:

```text
PENDING_PAYMENT ──► VERIFIED ──► PACKING ──► SHIPPED (wajib resi) ──► COMPLETED
       │               │            │
       └───────────────┴────────────┴──► CANCELLED (auto-restock atomik)
```

  - **Aturan Bisnis Transisi Status**:
    - `PENDING_PAYMENT` -> `VERIFIED`: Admin memverifikasi bukti pembayaran dan kelengkapan data kepatuhan 18+ (dapat menambahkan catatan verifikasi).
    - `VERIFIED` -> `PACKING`: Pesanan masuk tahap QC/chronograph dan pengemasan aman (termasuk packing kayu jika dipilih).
    - `PACKING` -> `SHIPPED`: **Form wajib meminta Nama Ekspedisi & Nomor Resi Kargo** sebelum tombol simpan aktif. Nomor resi tersimpan di `orders.tracking_number` dan langsung tampil di halaman Order Lookup pembeli.
    - `SHIPPED` -> `COMPLETED`: Menandai pesanan telah diterima pelanggan.
    - `-> CANCELLED`: Tersedia sebelum status `SHIPPED` (dan tidak berlaku untuk pesanan yang sudah `COMPLETED` atau sudah `CANCELLED`). Wajib mengisi **alasan pembatalan**. Ketika dikonfirmasi, transaksi SQLite atomik melakukan:
      1. Memastikan `orders.stock_restored = 0` (guard idempotensi agar stok tidak pernah dikembalikan dua kali).
      2. Mengubah status pesanan menjadi `CANCELLED` dan `stock_restored = 1`.
      3. Menambahkan kembali `qty` tiap baris `order_items` ke `products.stock`.
      4. Mencatat mutasi `ORDER_RESTOCK` ke tabel `stock_movements` dengan referensi `invoice_number`.
      5. Jika pesanan memakai voucher, opsional menjaga histori voucher tetap akurat atau mencatat log pembatalan.
      6. Menulis catatan ke `order_status_logs`.
  - **Audit Trail Pesanan**: Timeline riwayat setiap perubahan status beserta nama admin dan catatan internal/eksternal.

### 3.6 Manajemen Voucher / Promo (`/admin/vouchers`) & Pengaturan Toko / Hero Video (`/admin/settings`)

#### A. Manajemen Voucher / Promo
- CRUD penuh untuk kode promo:
  - `code` (unik, otomatis uppercase tanpa spasi, mis. `BRAKASA10`, `CQBREADY`).
  - `description` (label kampanye internal/eksternal).
  - `discount_type`: `PERCENT` (persentase 1-90%) atau `FIXED` (nominal Rupiah).
  - `discount_value` dan `max_discount_amount` (batas plafon Rupiah khusus tipe `PERCENT`).
  - `min_order_amount` (minimum subtotal belanja).
  - `usage_limit` (kuota total) vs `used_count` (dihitung real-time dari transaksi nyata).
  - `starts_at` dan `expires_at` (rentang jadwal aktif).
  - `is_active` (toggle aktif/nonaktif seketika).
- Validasi tidak mengizinkan penghapusan paksa voucher yang sudah dipakai transaksi (gunakan nonaktifkan) agar riwayat diskon pada pesanan lama tetap teraudit.

#### B. Pengaturan Toko & Hero Video
Disimpan pada tabel key-value terstruktur `store_settings` dan dibagi dalam 3 bagian terorganisir:
1. **Profil & Operasional Armory**: Nama toko, tagline, alamat fisik/pickup, nomor WhatsApp CS, email support, jam operasional, dan teks pengumuman bar atas (opsional, bisa diaktifkan/dinonaktifkan).
2. **Konfigurasi Hero Video & Telemetry Scenes**:
   - Pilihan/unggah file video hero (`hero_video_url`) dan gambar poster (`hero_poster_url`) dengan pratinjau langsung.
   - Headline & subheadline hero serta tautan CTA utama/sekunder.
   - **Editor Daftar Telemetry Scenes** (array JSON terpandu): untuk setiap chapter scene, admin dapat mengatur `startSec`, `endSec`, `code` (mis. `SCN-01`), `title` (mis. `CQB ENTRY`), `telemetryMeta` (mis. `AEG | 335 FPS | 1.04 J`), dan `targetUrl` (`/store?mission=cqb` atau `/store/[slug]`).
3. **Pengaturan Logistik Kargo & Inventori**:
   - Ambang batas stok kritis default (`default_low_stock_threshold`, mis. `5`).
   - Biaya Packing Kayu default (mis. `Rp 75.000`).
   - Tabel tarif dasar ongkir per zona & kurir darat/kargo (Jabodetabek, Jawa, Sumatera/Bali, Kalimantan/Sulawesi, Indonesia Timur) agar kalkulasi ongkir di checkout 100% dinamis tanpa hardcode permanen.

---

## 4. Kontrak Integrasi Data & Peta Rute (Siap Eksekusi Tim Engineering)

Bagian ini menyelaraskan seluruh fitur di atas menjadi peta entitas database SQLite dan rute API/halaman yang ringkas serta bebas ambiguitas.

### 4.1 Entitas Database Inti (SQLite)

| Tabel | Kolom Kunci | Peran Utama |
| :--- | :--- | :--- |
| `products` | `id`, `slug`, `sku`, `name`, `brand`, `category`, `mission`, `platform`, `propulsion`, `fps`, `weight_grams`, `price`, `stock`, `low_stock_threshold`, `requires_age_18`, `shipping_class`, `is_featured`, `is_active`, `primary_image`, `gallery_images` (JSON), `video_url`, `short_description`, `description`, `specs` (JSON), `compatibility` (JSON), `created_at`, `updated_at` | Sumber data tunggal untuk Katalog, PDP, Loadout Spotlight, Field Video Showcase, dan Loadout Builder |
| `stock_movements` | `id`, `product_id`, `type`, `change_qty`, `stock_before`, `stock_after`, `reference_code`, `note`, `actor`, `created_at` | Ledger inventori append-only untuk audit stok 100% transparan |
| `orders` | `id`, `invoice_number`, `status`, `customer_name`, `customer_email`, `customer_phone`, `shipping_zone`, `shipping_address`, `shipping_city`, `shipping_postal_code`, `shipping_courier`, `shipping_cost`, `wooden_packing`, `wooden_packing_cost`, `tracking_number`, `voucher_code`, `discount_amount`, `subtotal_amount`, `total_amount`, `payment_method`, `buyer_dob`, `buyer_age_verified`, `club_kta_number`, `usage_purpose`, `legal_declaration_accepted`, `stock_restored`, `cancel_reason`, `created_at`, `updated_at` | Transaksi pelanggan lengkap dengan data kepatuhan 18+ dan logistik darat/kargo |
| `order_items` | `id`, `order_id`, `product_id`, `product_name`, `product_sku`, `unit_price`, `quantity`, `line_total`, `weight_grams` | Snapshot item pesanan yang imun terhadap perubahan harga/edit produk di masa depan |
| `order_status_logs` | `id`, `order_id`, `from_status`, `to_status`, `note`, `actor`, `created_at` | Riwayat kronologis status untuk tampilan Order Lookup pembeli & audit admin |
| `vouchers` | `id`, `code`, `description`, `discount_type`, `discount_value`, `max_discount_amount`, `min_order_amount`, `usage_limit`, `used_count`, `starts_at`, `expires_at`, `is_active`, `created_at` | Manajemen promo & validasi diskon server-side |
| `store_settings` | `key`, `value` (JSON/TEXT), `updated_at` | Konfigurasi toko, Hero Video + Telemetry Scenes, Loadout Spotlight hotspots, dan tarif kargo |
| `admin_users` & `admin_sessions` | `admin_users(id, email, name, password_hash, role)` & `admin_sessions(id, admin_user_id, token_hash, expires_at, created_at)` | Autentikasi admin aman berbasis HttpOnly cookie |

### 4.2 Peta Rute Halaman & API

**Halaman Storefront (Publik):**
- `/` : Landing Page (Hero Video + Telemetry Switcher, Shop by Mission, Interactive Loadout Spotlight, Field Video Showcase, Panduan Kepatuhan & Kalkulator FPS, Footer Fungsional)
- `/store` : Katalog dengan Instant Search & Filter Multi-Dimensi (termasuk Filter Video Demo)
- `/store/[slug]` : Halaman Detail Produk (Galeri Foto + Video Demo, Tabel Spec JSON, Indikator Kompatibilitas, Produk Pelengkap Satu Rig)
- `/loadout-builder` : Interactive Tactical Loadout Builder + Real-Time Compatibility Engine + Kalkulasi Berat & Harga
- `/cart` : Keranjang Belanja Persisten dengan validasi stok live
- `/checkout` : Checkout Lengkap (Verifikasi 18+ & Deklarasi, Kalkulasi Kargo Darat/Packing Kayu, Kupon Diskon)
- `/orders/lookup` : Cek Status Pesanan Tamu (Invoice + Email/HP, Timeline Status, Nomor Resi, Cetak Ringkasan)

**Halaman Admin Operations Center (Terproteksi Sesi Cookie):**
- `/admin/login` : Login Admin
- `/admin` : Dashboard Operasional Real-Time (KPI SQL nyata, Antrean Pesanan, Peringatan Stok Kritis, Mutasi Terbaru)
- `/admin/products` : Manajemen Produk, Spesifikasi JSON, & Pustaka/Unggah Media (Foto & Video)
- `/admin/inventory` : Manajemen Stok, Restock/Koreksi, & Riwayat Mutasi Stok (Stock Ledger)
- `/admin/orders` & `/admin/orders/[id]` : Manajemen Pesanan End-to-End, Verifikasi 18+, Input Resi, & Pembatalan Auto-Restock
- `/admin/vouchers` : Manajemen Voucher & Promo
- `/admin/settings` : Pengaturan Toko, Hero Video + Telemetry Scenes, Spotlight Rig, & Tarif Kargo Darat

**Endpoint API Inti:**
- **Publik**:
  - `GET /api/storefront/home` (settings hero + scenes + spotlight rig dengan stok live + field videos + ringkasan misi)
  - `GET /api/products` (search, filter multi-dimensi, facet counts, sorting, pagination)
  - `GET /api/products/[slug]` (detail produk + compatible pairings)
  - `POST /api/cart/validate` (validasi harga, stok live, kebutuhan 18+, kelas pengiriman)
  - `POST /api/vouchers/validate` (cek kelayakan & kalkulasi diskon kupon)
  - `POST /api/shipping/calculate` (kalkulasi opsi ekspedisi darat/kargo berdasarkan berat, zona, dan `shipping_class`)
  - `POST /api/orders` (pembuatan order atomik + verifikasi 18+ server-side + potong stok + ledger)
  - `POST /api/orders/lookup` (pencarian pesanan dengan invoice + verifikasi email/HP)
- **Admin (Wajib Cookie Sesi `HttpOnly` via Middleware `requireAdminSession`)**:
  - `POST /api/admin/auth/login`, `POST /api/admin/auth/logout`, `GET /api/admin/auth/me`
  - `GET /api/admin/dashboard` (agregasi SQL real-time, antrean pesanan, stok kritis, mutasi terbaru)
  - `GET/POST /api/admin/products`, `GET/PATCH/DELETE /api/admin/products/[id]`
  - `POST /api/admin/media/upload` & `GET /api/admin/media`
  - `GET /api/admin/inventory`, `POST /api/admin/inventory/adjust` (restock / koreksi ke Stock Ledger)
  - `GET /api/admin/orders`, `GET /api/admin/orders/[id]`, `PATCH /api/admin/orders/[id]/status` (state machine + wajib resi saat `SHIPPED` + auto-restock atomik saat `CANCELLED`)
  - `GET/POST /api/admin/vouchers`, `PATCH/DELETE /api/admin/vouchers/[id]`
  - `GET/PATCH /api/admin/settings`

---

## 5. Checklist Kriteria Kelulusan Fitur (Acceptance Criteria)

- [ ] **Landing Page**: Hero video <= 30 detik berputar halus (muted autoplay + kontrol mute/pause), Telemetry Scene Switcher mengubah timestamp video secara presisi, 4 jalur Shop by Mission membuka filter katalog yang tepat, Interactive Loadout Spotlight menampilkan stok live dan dapat masuk keranjang/builder, serta panduan Perpol No. 5/2018 & kalkulator FPS/Joule berfungsi akurat.
- [ ] **Storefront & PDP**: Filter multi-dimensi (Kategori, Platform, Propulsi, Rentang FPS, Status Stok, Rentang Harga, "Ada Video Demo") bekerja kombinasi penuh dengan sinkronisasi URL; PDP memutar video demo langsung di galeri media, merender tabel spesifikasi JSON, menampilkan kompatibilitas, dan menawarkan item pelengkap yang kompatibel.
- [ ] **Loadout Builder**: Mampu merakit 5 slot taktis, mendeteksi konflik nyata (konektor Deans vs Tamiya, baterai vs GBBR, magasin beda platform, optic/rail, MED > 400 FPS tanpa sidearm), menghitung total berat & harga live, serta memindahkan seluruh item ke keranjang dengan validasi stok.
- [ ] **Checkout & Order Lookup**: Menolak checkout replika jika tanggal lahir < 18 tahun atau deklarasi tidak dicentang; otomatis mengunci pengiriman ke jalur darat/kargo bila ada unit/LiPo/gas; memvalidasi voucher di server; mengurangi stok dan mencatat ledger secara atomik; Order Lookup menampilkan timeline status & nomor resi dengan verifikasi 2 bidang.
- [ ] **Admin Operations**: API `/api/admin/*` mengembalikan `401` tanpa cookie sesi `HttpOnly` valid; Dashboard 100% menampilkan angka hasil query database tanpa data fiktif; CRUD produk + spec JSON + media foto/video berjalan penuh; Restock/koreksi tercatat di Stock Ledger; status `SHIPPED` memaksa input nomor resi; dan status `CANCELLED` mengembalikan stok secara otomatis dan idempoten.
