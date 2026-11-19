# Riset Referensi UX/UI Modern, Standar Studio Manusia, dan Sistem Anti-AI-Slop: Brakasa Tactical

Dokumen ini menjadi acuan resmi bagi tim UX, UI, dan Frontend Engineer **Brakasa Tactical** untuk membangun Landing Page, Storefront E-Commerce, Loadout Builder, dan Admin Operations Center yang terasa dirancang studio desain manusia kelas atas, bukan hasil templat generik AI. Seluruh panduan di bawah memadukan temuan riset referensi situs e-commerce hardware/tactical/industrial modern, kajian kritis pola "AI UI Slop", serta seluruh aturan sistem `antislop` (Core `R-01` s.d. `R-40`, `antislop-ui`, `antislop-human`, `antislop-layoutmobile`, dan `antislop-copywriting`).

---

## 1. Studi Kritis: Anatomi "Website Buatan AI" vs. Desain Studio Manusia

### 1.1 Mengapa Website Buatan AI Mudah Dikenali
Secara teknis, model generatif melakukan konvergensi distribusi (*distributional convergence*) menuju rata-rata statistik dari data latih web 2020 sampai 2024 (templat Tailwind UI, Dribbble SaaS, dan starter kit komponen generik). Ketika spesifikasi desain dibiarkan terbuka, setiap keputusan yang tidak ditetapkan secara sadar akan jatuh ke nilai default model. Seperti dicatat dalam berbagai kritik desain modern, **"tampilan AI adalah akumulasi dari semua keputusan desain yang tidak diambil secara sengaja oleh manusia"**.

Dampaknya pada e-commerce peralatan teknis dan taktis seperti Brakasa Tactical bersifat fatal terhadap kepercayaan pembeli: konsumen airsoft dan tactical gear adalah pembeli berorientasi spesifikasi (*spec-literate buyers*) yang menilai kredibilitas toko dari ketelitian detail mekanis. Tampilan "vibe-coded" dengan gradien ungu, kartu seragam, dan klaim pemasaran kosong langsung memicu skeptisisme terhadap keaslian produk dan keamanan transaksi.

### 1.2 Referensi Studio Manusia: Benchmark E-Commerce Hardware, Tactical & Industrial
Riset pada katalog **Awwwards**, **Godly.website**, serta flagship digital merek hardware dan perlengkapan teknis kelas dunia memperlihatkan pola konsisten yang membedakan desain berkelas dari templat massal:

| Merek / Referensi | Bahasa Visual Utama | Pola UX/UI yang Relevan untuk Brakasa Tactical |
|---|---|---|
| **Teenage Engineering** | Presisi mekanis, tata letak grid teknik, label kode produk monospace, monokrom berpadu satu aksen sinyal (kuning/oranye) | Format spesifikasi produk seperti lembar data teknik (*spec sheet*), indikator stok bernomor batch/SKU, kontras tinggi tanpa dekorasi berlebihan. |
| **Leica** | Monolitik, gelap matte berkarakter, penekanan pada ruang negatif dan fotografi makro optik/logam | Split-screen Product Detail Page (visual produk dominan di sisi kiri, panel spesifikasi dan aksi akuisisi terkunci presisi di sisi kanan). |
| **Polestar** | Brutalisme digital Skandinavia, permukaan gelap bertekstur ringan, warna bumi bernuansa rendah, garis pemisah tipis 1px | Hierarki permukaan taktil tanpa bayangan mengambang (*soft drop-shadow*), pembagian modul dengan garis struktural tajam. |
| **Arc'teryx / Veilance** | Editorial teknis, narasi fungsi material (denier, tahan cuaca), tipografi mikro-teknis yang rapi | Penyajian detail material nyata (Cordura 500D/1000D, CNC 6061-T6 Aluminum, gearbox V2/V3) berdampingan dengan fotografi aksi lapangan. |
| **Mystery Ranch & Peak Design** | Utilitarian tahan banting, grid modular load-bearing, penekanan pada ergonomi dan kompatibilitas modul | Interaksi yang memperlihatkan cara kerja dan kompatibilitas perlengkapan (sangat relevan untuk Loadout Builder dan sistem mounting M-LOK / MOLLE / Picatinny). |
| **Acronym / Stone Island Shadow Project** | Tipografi tegas, lembar spesifikasi terstruktur, katalog padat informasi yang tetap mudah dipindai | Navigasi cepat berbasis kategori teknis, filter multi-atribut tanpa elemen dekoratif yang menghambat pencarian. |
| **Leatherman / Gerber Gear** | Presisi hardware mekanis dalam katalog berfilter ketat dan tabel perbandingan spesifikasi | Filter katalog berbasis parameter teknis nyata (propulsi AEG/GBBR/CO2, FPS, tipe rail, material) dan perbandingan langsung antar unit. |
| **Anduril & Rimowa** | Kewibawaan industrial-aerospace, kontras tajam, komposisi asimetris antara visual berskala besar dan blok data presisi | Ritme antar-seksi yang asimetris (rasio 2fr/1fr atau full-bleed media diselingi indeks katalog), bukan pengulangan kotak seragam. |

### 1.3 Perbandingan Langsung: Pola Default AI vs. Standar Studio Brakasa Tactical

| Dimensi | Pola Default AI ("AI Slop") | Standar Studio Brakasa Tactical |
|---|---|---|
| **Filosofi Desain** | Mengisi kerangka templat SaaS (Hero + Logo Bar + 3 Kartu + Bento + Testimoni + FAQ + Footer 4 kolom). | Komposisi digerakkan oleh konten nyata (`C-3`): showcase video aksi, katalog terkurasi, spec sheet mekanis, loadout builder, dan kepatuhan regulasi 18+. |
| **Grid & Ritme** | Simetris kaku, padding seragam, kartu ukuran identik berulang di tiap seksi. | **Bespoke Editorial Grid & Asymmetric Rhythm**: kombinasi seksi full-bleed hero, split editorial 7:5, indeks katalog terstruktur, dan panel teknis berkepadatan tinggi. |
| **Permukaan & Kedalaman** | `rounded-2xl` di semua elemen, bayangan buram besar, glassmorphism + neon glow berlapis. | **Tactile Surface Hierarchy**: permukaan matte berlapis (`#0F1110` -> `#171A18` -> `#1F2421`), garis struktural tajam 1px, sudut mekanis kecil (`2px` sampai `6px`). |
| **Tipografi** | `Inter` / `Space Grotesk` untuk semua, heading monospace raksasa, label uppercase berjarak lebar klise. | **Industrial Spec-Sheet Typography**: display tegas terkompresi + UI sans berlegibilitas tinggi + tabular mono khusus angka FPS/SKU/IDR/berat (`font-variant-numeric: tabular-nums`). |
| **Interaksi Mikro** | Fade-up + floating + bounce + glow pada semua kartu; tombol tanpa `cursor: pointer`. | **Authentic Mechanical Micro-Interactions**: transisi cepat dan mantap (`120ms` sampai `180ms`), perubahan border/warna seketika seperti mekanisme shutter atau bolt catch, menghormati `prefers-reduced-motion`. |

---

## 2. Design Direction, Liveliness Dials & Prinsip Inti Antislop

Mengacu pada `antislop` Core (`R-37`, Part 3, dan Craftsmanship Standards `C-1` s.d. `C-5`), membuang pola slop saja tidak cukup karena hanya menghasilkan tampilan steril tanpa jiwa (*Sterile Default*). Oleh karena itu, arah desain Brakasa Tactical ditetapkan secara eksplisit sebelum implementasi:

### 2.1 Design Read Resmi Brakasa Tactical
> **Landing Page:** "Reading this as: flagship tactical showcase & e-commerce entry for airsoft enthusiasts and serious gear collectors, in a tactile-industrial editorial style, dial **ENERGY 3 / RHYTHM 3 / MOTION 2**."
>
> **Storefront, PDP & Loadout Builder:** "Reading this as: specification-driven technical hardware storefront for discerning Indonesian airsoft buyers, in a utilitarian field-manual & armory spec-sheet style, dial **ENERGY 2 / RHYTHM 2 / MOTION 1**."
>
> **Admin Operations Center:** "Reading this as: operational inventory and order fulfillment console for Brakasa Tactical store staff, in a high-legibility industrial dispatch style, dial **ENERGY 1 / RHYTHM 1 / MOTION 1**."

### 2.2 Lima Tuas Liveliness (*Five Levers*)
1. **One Focal Point per Screen:** Pada Landing Page, Hero Video aksi taktis adalah satu-satunya pusat gravitasi visual di atas lipatan (*above the fold*); pada PDP, galeri/video produk dan matriks spesifikasi mekanis mendominasi; pada Admin Dashboard, antrean pesanan aktif dan peringatan stok kritis menjadi fokus utama.
2. **Hierarchical Contrast:** Pembedaan skala tipografi tajam antara judul display (48px sampai 72px di desktop), subjudul fungsional, body copy (15px sampai 16px), dan indeks spesifikasi tabular mono (12px sampai 13px).
3. **Whitespace as Structure:** Ruang kosong digunakan untuk memisahkan bab narasi dan memberi nafas pada tabel spesifikasi, dengan skala jarak yang mengecil proporsional di mobile (`antislop-layoutmobile`).
4. **One Deliberate Accent:** **Signal Amber / Brass** (`#E5A024` di Dark Mode; `#8C4F04` di Light Mode) hanya dipakai pada titik aksi utama (CTA akuisisi, fokus keyboard, indikator aksi aktif, peringatan stok rendah). Tidak disebar ke garis, ikon dekoratif, atau latar belakang.
5. **Identity Motif:** Garis pembatas struktural tajam 1px berpadu **indeks kode taktis monospace** (mis. `SKU: BRK-AEG-001`, `SEC.02 / ARSENAL`, penanda sudut potong mekanis `clip-path` atau bracket teknis `[04]` pada penghitung keranjang/filter) yang konsisten di seluruh halaman.

### 2.3 Lima Standar Craftsmanship (`C-1` s.d. `C-5`)
- **C-1 (Intentionality):** Setiap keputusan warna, font, grid, dan komponen memiliki alasan tertulis 1 kalimat (`R-31`).
- **C-2 (Functional Completeness):** Setiap tombol, filter, tab, modal, drawer keranjang, dan aksi admin berfungsi penuh atau tidak ditampilkan (`R-26`).
- **C-3 (Content-Driven Composition):** Tidak ada seksi pengisi templat (tidak ada logo bar klien palsu, tidak ada kartu harga 3 kolom jika bukan langganan SaaS, tidak ada FAQ generik).
- **C-4 (Resilience):** Semua tampilan memiliki state kosong (*empty*), memuat (*loading*), dan galat (*error*) yang informatif (`R-27`), bekerja di mode Gelap dan Terang (`R-34`), di seluruh lebar layar (`R-03`), serta navigasi keyboard penuh (`R-32`).
- **C-5 (Evidence Over Claims):** Semua angka di storefront dan admin dihitung langsung dari database SQLite nyata; tidak ada testimoni fiktif, ulasan karangan, atau statistik pemasaran palsu (`R-17`, `R-18`, `R-36`, `R-38`).

---

## 3. Daftar Jebakan "AI UI Slop" yang WAJIB Dihindari

Bagian ini memecah pola terlarang secara konkret untuk tiga modul utama Brakasa Tactical beserta referensi aturan `antislop` yang mengikatnya.

### 3.1 Jebakan di Landing Page (WAJIB Dihindari)

| Jebakan AI Slop | Wujud Konkret yang Dilarang | Aturan | Pengganti Berstandar Studio di Brakasa Tactical |
|---|---|---|---|
| **Bento-Grid Klise** | Mosaik kotak-kotak kartu membulat dengan ikon kecil dan kalimat generik sebagai seksi "Keunggulan Kami". | `R-05`, `R-14` | Gunakan komposisi editorial asimetris: mis. 1 seksi split 7:5 menampilkan unit unggulan + lembar spesifikasi teknis nyata, diikuti jalur kategori horizontal/asimetris berbasis kebutuhan loadout. |
| **Purple / Cyan / Neon Glow** | Latar belakang hitam-ungu, gradien biru-ungu pada tombol, radial orb bersinar di belakang hero, atau efek neon hijau "cyber-military". | `R-01`, `R-13` | Gunakan sistem warna matte Gunmetal/Obsidian + Warm Stone Field Paper + Ranger Olive + satu aksen Signal Amber/Brass tanpa glow dekoratif. |
| **Eyebrow Pill-Badge di Atas H1** | Kapsul membulat tipis dengan titik berkedip bertuliskan "TACTICAL GEAR NO. 1" atau "NEW COLLECTION 2026" tepat di atas H1. | `R-09`, `R-19`, `R-31` | Hapus pill di atas H1. Biarkan H1 berbicara langsung dengan tegas; jika perlu konteks seri katalog, tampilkan sebagai metadata teks polos terstruktur tanpa kapsul, border, atau titik animasi palsu. |
| **Decorative Status Dot** | Titik hijau/oranye menyala dan berdenyut (*pulse loop*) di samping judul atau menu navigasi yang tidak menandai status live nyata. | `R-13`, `R-19`, `R-31` | Titik indikator hanya boleh muncul untuk status inventori/sistem nyata (mis. stok tersedia/kritis) tanpa efek glow dan tanpa animasi pulse tak berujung. |
| **Kartu Fitur Identik & "3 Langkah"** | Barisan 3 atau 6 kartu berukuran sama persis berisi ikon Lucide + judul + 2 baris deskripsi, atau seksi "Cara Kerja 1-2-3" berbentuk lingkaran bernomor. | `R-05`, `R-14` | Variasikan bentuk penyajian sesuai bobot informasi (daftar spesifikasi bernomor, split panel dengan foto nyata, atau tabel perbandingan platform AEG vs GBBR). |
| **Trusted By Logo Bar & Testimoni Fiktif** | Deretan logo fiktif di bawah hero, atau kartu ulasan berisi avatar AI ("Budi Santoso, Komandan Tim Alpha") serta klaim "10.000+ Operator Puas". | `R-17`, `R-18`, `R-36`, `R-38` | Hapus total. Ganti dengan bukti faktual: informasi standar kualitas unit (uji kronograf FPS, standar material CNC/Cordura), kebijakan kepatuhan olahraga airsoft Indonesia 18+, dan tautan langsung ke katalog nyata. |
| **Template 4-Column Footer & Dead Links** | Footer 4 kolom seragam (*Product / Company / Resources / Legal*) dengan tautan mati (`href="#"`) atau navbar berisi menu halaman yang belum dibangun. | `R-05`, `R-24`, `R-26` | Rancang footer ramping yang hanya memuat tautan nyata yang benar-benar ada (Katalog, Loadout Builder, Cek Status Pesanan, Panduan Regulasi & Keselamatan 18+, Kontak/Alamat Operasional, Syarat & Kebijakan Privasi). |
| **CTA Generik, Buzzword & Em Dash** | Tombol "Explore Now", "Discover", "Learn More"; kata "Revolutionary", "Cutting Edge", "Next-Gen", "Seamless"; emoji di judul/tombol; karakter em dash (U+2014). | `R-02`, `R-04`, `R-15`, `R-16` | Gunakan CTA spesifik berbasis aksi: "Lihat Katalog Unit", "Rakit Loadout Sekarang", "Cek Status Pesanan". Hapus semua buzzword, emoji UI, dan em dash. |
| **Glassmorphism & Shadow Berlebihan** | `backdrop-blur` di navbar, semua kartu, modal, dan drawer secara bersamaan; semua kotak memakai shadow besar hingga halaman terasa melayang. | `R-10`, `R-12` | Batasi `backdrop-filter` maksimal pada 1 sampai 2 elemen fungsional (mis. bilah kontrol video hero atau header lengket di atas media). Kartu katalog berdiri rata dengan kontras permukaan dan garis 1px. |

### 3.2 Jebakan di Storefront, PDP & Loadout Builder (WAJIB Dihindari)

| Jebakan AI Slop | Wujud Konkret yang Dilarang | Aturan | Pengganti Berstandar Studio di Brakasa Tactical |
|---|---|---|---|
| **Kartu Produk Kosmetik Tanpa Data Teknis** | Kartu produk hanya menampilkan foto, nama, harga, dan bintang rating 5.0 palsu tanpa atribut yang dicari pembeli airsoft. | `R-17`, `R-38`, `C-3` | Tampilkan ringkasan spec inti dalam font tabular mono: Kode SKU, Propulsi (`AEG` / `GBBR` / `CO2` / `Gear`), FPS/Joule atau Denier (`500D Cordura`), status stok nyata dari DB, dan harga IDR rata kanan/sejajar. |
| **Pill-Shape Seragam (`rounded-full`)** | Semua tombol filter, chip kategori, input pencarian, kartu, dan tombol beli dibuat serba kapsul membulat penuh. | `R-11` | Gunakan radius terukur bergaya industrial (`2px` tag/status, `4px` tombol & input, `6px` kartu/panel). Variasi radius membedakan elemen kontrol dari wadah data. |
| **Ikon Lucide Seragam Tanpa Makna & Panah di Setiap Tombol** | Memakai ikon tipis membulat standar di setiap label serta menempelkan panah (`->` / `↗`) pada hampir semua tombol beli/filter. | `R-04`, `R-08` | Gunakan ikon bermakna dengan bobot stroke tegas (`1.75px` sampai `2px`, ujung lancip/kotak bila memungkinkan) hanya jika memperjelas fungsi; sebagian besar tombol aksi cukup teks jelas tanpa panah dekoratif. |
| **Hover-Only Info & Layout Pecah di Tablet/Mobile** | Detail spesifikasi atau tombol "Tambah ke Keranjang" hanya muncul saat hover; grid melompat dari 4 kolom langsung ke 1 kolom tanpa state tablet; overflow horizontal pada tabel spec. | `R-03`, `antislop-layoutmobile` | Sediakan 3 state reflow nyata (1 kolom mobile < 640px, 2 kolom tablet 640px sampai 1024px, 3 sampai 4 kolom desktop > 1024px). Semua aksi tersedia lewat tap minimal 44x44px dengan jarak antar target. |
| **Kontrol Tanpa Affordance & Label Form Hilang** | `<div onClick>` sebagai kartu/tombol, `button` tanpa `cursor: pointer` (karena Tailwind preflight), input checkout/filter hanya memakai `placeholder` tanpa `<label>`. | `R-32`, `R-39` | Terapkan base CSS `cursor: pointer` untuk seluruh kontrol aktif, gunakan `<button>` untuk aksi dan `<a href>` untuk navigasi, sediakan `<label for>` eksplisit di setiap field checkout & filter, dan pertahankan `:focus-visible` kontras tinggi. |
| **Happy-Path Only pada Katalog & Keranjang** | Tidak ada tampilan jelas saat pencarian/filter nihil, saat data sedang dimuat, atau saat checkout gagal/stok habis. | `R-27` | Setiap tampilan data wajib punya Empty State (sebutkan sebab + tombol reset filter/kembali ke katalog), Loading State berlabel jelas, dan Error State dengan instruksi tindakan lanjutan. |

### 3.3 Jebakan di Admin Operations Center (WAJIB Dihindari)

Mengacu langsung pada bab **App & Dashboard** di `antislop-ui`:

| Jebakan AI Slop | Wujud Konkret yang Dilarang | Aturan | Pengganti Berstandar Studio di Brakasa Tactical |
|---|---|---|---|
| **Default Dashboard Shell** | Susunan otomatis "sidebar kiri + 4 kartu stat identik + 1 grafik garis + 1 tabel generik" sebelum menentukan pekerjaan staf gudang/admin. | `C-3`, `R-20` | Bangun hierarki layar dari keputusan kerja harian admin: (1) Antrean Pesanan Perlu Verifikasi/Kirim, (2) Peringatan SKU Stok Kritis, (3) Ringkasan Metrik Operasional Nyata dari database. |
| **Stat Cards dengan Angka & Delta Palsu** | Kartu hardcoded `Rp 482.500.000`, `1.248 Pesanan`, atau lencana hijau `+14.2% minggu ini` tanpa rangkaian data historis nyata. | `R-17`, `R-36`, `R-38` | Setiap metrik wajib hasil kueri SQL `COUNT`/`SUM` real-time. Tampilkan persentase delta HANYA jika periode pembanding di database benar-benar ada dan diberi label periode yang jelas; jika tidak, tampilkan angka absolut saja tanpa delta. |
| **Filler Activity Feed** | Daftar log palsu seperti "Sarah Chen mengubah harga produk, 2 jam lalu" dengan avatar acak untuk membuat admin tampak ramai. | `R-18`, `R-38` | Hanya tampilkan **Riwayat Mutasi Stok & Log Pesanan** yang benar-benar tercatat di tabel database saat transaksi/restock terjadi. Jika kosong, tampilkan Empty State jujur. |
| **Charts Without a Question** | Grafik donat/garis bertajuk generik "Overview" atau "Analytics" tanpa sumbu jelas dan tanpa keputusan yang bisa diambil staf. | `C-3`, `R-25` | Hanya buat visualisasi jika menjawab pertanyaan operasional spesifik (mis. "Jumlah Pesanan per Status Pemenuhan Saat Ini" atau "Mutasi Stok Keluar 7 Hari Terakhir"), dengan kontras antar segmen minimal `3:1`. Jika tabel ringkas lebih cepat dibaca, pilih tabel. |
| **Generic Table Columns & Dead 3-Dot Menu** | Kolom baku `Name, Status, Date, Actions` dengan menu titik tiga berisi tombol yang tidak bekerja. | `R-26` | Pilih kolom berdasarkan keputusan cepat staf: mis. Tabel Pesanan menampilkan `No. Invoice`, `Pembeli & Verifikasi 18+`, `Item & Total (IDR)`, `Status`, `No. Resi`, dan tombol aksi langsung yang 100% berfungsi. |
| **Filler Data Realistis Palsu di Form/Tabel** | Placeholder input berupa `John Doe`, `johndoe@example.com`, `08123456789` yang menyerupai data asli. | `R-23`, `R-38` | Gunakan placeholder instruksional jujur (`Nama lengkap penerima`, `nama@domain.com`, `Contoh: JNE-882910...`) dan biarkan sel tabel kosong atau tampilkan `-` bila resi belum diinput. |
| **Scaffold Sidebar Tidak Didesain** | Daftar datar 8+ menu identik tanpa pengelompokan, status aktif hanya sedikit lebih gelap, collapse memotong teks, dan hilang total di layar HP. | `R-03`, `R-24`, `R-25`, `R-39` | Kelompokkan menu dengan label tenang (`OPERASIONAL`, `KATALOG`, `PENGATURAN`), tandai item aktif dengan bar samping + bobot font + kontras warna, tombol collapse memiliki `aria-expanded`, ikon memiliki `aria-label`, dan di mobile berubah menjadi drawer/sheet yang dapat ditutup lewat tombol dan `Escape`. |

---

## 4. Sistem Warna Taktis Terverifikasi WCAG AA

Sistem warna Brakasa Tactical dirancang dengan pendekatan **Dual-Mode Penuh (`R-21` & `R-34`)**:
1. **Armory Dark Mode (Default Landing Page & Opsional Store/Admin):** Latar Gunmetal/Obsidian bernuansa olive-charcoal sangat rendah (`#0F1110`), bukan hitam murni `#000000` yang menyilaukan atau `slate-950` default Tailwind.
2. **Field Paper Light Mode (Tersedia via Toggle di Seluruh Halaman, Sangat Ideal untuk Katalog Siang & Operasi Admin):** Latar Warm Stone / kertas manual lapangan (`#F2EFE9`) dan kartu off-white hangat (`#FAF8F4`), bukan putih steril `#FFFFFF` datar.

Sesuai **`R-29`**, palet aktif dibatasi ketat pada **2 Core Brand Colors** (*Ranger Olive* & *Coyote Tan*) + **1 Single Deliberate Accent** (*Signal Amber / Brass*), di atas fondasi netral.

### 4.1 Token Warna & Hasil Validasi Empiris (`contrast-check.py`)

Seluruh pasangan warna di bawah telah diuji langsung menggunakan `C:\Users\MSI GAMING\.gemini\config\plugins\antislop\skills\antislop-human\contrast-check.py` (dengan `--selftest` lulus 9/9 pasangan referensi). Syarat WCAG AA (`R-25`): **>= 4.5:1** untuk teks normal, **>= 3.0:1** untuk teks besar (18px+) dan batas komponen non-teks / fokus (WCAG 1.4.11).

#### A. Armory Dark Mode (`data-theme="dark"`)

| Token CSS | Hex | Peran & Alasan 1 Kalimat (`R-31`) | Pasangan Uji | Rasio Teruji | Status WCAG AA |
|---|---|---|---|---|---|
| `--bg-canvas` | `#0F1110` | Dasar kanvas Gunmetal matte yang menonjolkan fotografi produk gelap tanpa silau biru. | `#F0EFEA` on `#0F1110` | **16.46:1** | PASS (Normal & Large) |
| `--bg-surface` | `#171A18` | Permukaan panel & kartu katalog untuk membedakan kedalaman tanpa drop-shadow berat. | `#F0EFEA` on `#171A18` | **15.23:1** | PASS (Normal & Large) |
| `--bg-elevated` | `#1F2421` | Permukaan modal, drawer keranjang, dan baris aktif agar terpisah tegas dari dasar tabel. | `#F0EFEA` on `#1F2421` | **13.69:1** | PASS (Normal & Large) |
| `--text-primary` | `#F0EFEA` | Teks utama warm alabaster yang mengurangi kelelahan mata dibanding putih murni `#FFFFFF`. | (diuji di 3 permukaan) | **13.69 - 16.46:1** | PASS (Normal & Large) |
| `--text-secondary` | `#B5BBB3` | Teks deskripsi produk dan rincian teknis sekunder berkarakter sage-grey. | `#B5BBB3` on `#1F2421` | **8.05:1** (9.68:1 di canvas) | PASS (Normal & Large) |
| `--text-muted` | `#949C93` | Metadata SKU, label kolom tabel, dan timestamp yang tetap mudah dibaca pada kondisi terang. | `#949C93` on `#1F2421` | **5.58:1** (6.71:1 di canvas) | PASS (Normal & Large) |
| `--border-subtle` | `#2E3430` | Garis struktural dekoratif 1px pemisah seksi/grid (bukan batas input interaktif). | Struktural non-kritis | N/A (Dekoratif) | Sesuai fungsi |
| `--border-interactive` | `#6E7871` / `#7A847D` | Batas input form, tombol sekunder, dan checkbox agar terlihat jelas oleh pengguna low-vision. | `#6E7871` on `#171A18`; `#7A847D` on `#1F2421` | **3.83:1** / **4.07:1** | PASS Non-Text (>= 3.0:1) |
| `--accent-cta-bg` | `#E5A024` | Aksen tunggal **Signal Amber/Brass** (terinspirasi selongsong kuningan & reticle optik) khusus CTA utama. | `#121412` on `#E5A024` | **8.27:1** | PASS (Normal & Large) |
| `--accent-cta-edge` | `#E5A024` | Batas visual tombol CTA Signal Amber terhadap kanvas/permukaan gelap. | `#E5A024` on `#171A18` | **7.84:1** (8.47:1 di canvas) | PASS Non-Text (>= 3.0:1) |
| `--accent-text` / `--focus-ring` | `#EBAC3B` | Tautan aksen, harga promo aktif, dan garis fokus keyboard (`:focus-visible`). | `#EBAC3B` on `#1F2421`; on `#0F1110` | **7.88:1** / **9.47:1** | PASS (Normal & Focus) |
| `--brand-olive-fill` | `#334434` | Core Brand 1 (**Ranger Olive**) untuk blok identifikasi brand, tombol sekunder solid, atau header badge. | `#F0EFEA` on `#334434` | **9.04:1** | PASS (Normal & Large) |
| `--brand-olive-text` | `#94B891` | Label kategori taktis dan indikator status aktif bernuansa olive di atas permukaan gelap. | `#94B891` on `#171A18` | **7.95:1** | PASS (Normal & Large) |
| `--brand-coyote-text` | `#C7B293` | Core Brand 2 (**Coyote Sand**) untuk penanda kategori apparel/gear dan spesifikasi material Cordura. | `#C7B293` on `#171A18` | **8.53:1** | PASS (Normal & Large) |
| `--status-success` | `#7FD198` on `#18291E` | Badge stok tersedia / pesanan selesai (selalu disertai teks/ikon, bukan warna saja). | `#7FD198` on `#18291E` | **8.35:1** | PASS (Normal & Large) |
| `--status-warning` | `#F5B84B` on `#2E2414` | Badge stok menipis / menunggu verifikasi pembayaran atau usia 18+. | `#F5B84B` on `#2E2414` | **8.59:1** | PASS (Normal & Large) |
| `--status-danger` | `#F5897D` on `#301A18` | Badge stok habis / galat validasi form / pesanan dibatalkan. | `#F5897D` on `#301A18` | **6.81:1** | PASS (Normal & Large) |
| `--tag-olive` | `#A6C8A3` on `#202B21` | Tag teknis fungsional (mis. `AEG`, `GBBR`, `M-LOK`, `500D`). | `#A6C8A3` on `#202B21` | **7.99:1** | PASS (Normal & Large) |

#### B. Field Paper Light Mode (`data-theme="light"`)

| Token CSS | Hex | Peran & Alasan 1 Kalimat (`R-31`) | Pasangan Uji | Rasio Teruji | Status WCAG AA |
|---|---|---|---|---|---|
| `--bg-canvas` | `#F2EFE9` | Dasar kanvas **Warm Stone / Field Paper** seperti manual peralatan lapangan, tidak steril seperti `#FFFFFF`. | `#181A18` on `#F2EFE9` | **15.25:1** | PASS (Normal & Large) |
| `--bg-surface` | `#FAF8F4` | Permukaan kartu produk, lembar spesifikasi, dan tabel admin untuk keterbacaan sesi kerja panjang. | `#181A18` on `#FAF8F4` | **16.50:1** | PASS (Normal & Large) |
| `--bg-elevated` | `#E6E1D8` | Permukaan sidebar filter, toolbar admin, dan blok ringkasan checkout bernuansa khaki halus. | `#181A18` on `#E6E1D8` | **13.44:1** | PASS (Normal & Large) |
| `--text-primary` | `#181A18` | Teks utama tinta karbon yang tajam di atas kertas lapangan hangat. | (diuji di 3 permukaan) | **13.44 - 16.50:1** | PASS (Normal & Large) |
| `--text-secondary` | `#424741` | Teks deskripsi produk dan isi tabel sekunder bernuansa charcoal-olive. | `#424741` on `#E6E1D8` | **7.30:1** (8.96:1 di surface) | PASS (Normal & Large) |
| `--text-muted` | `#595E56` | Metadata SKU, caption, dan label formulir sekunder yang lulus AA bahkan di atas permukaan khaki. | `#595E56` on `#E6E1D8` | **5.10:1** (6.26:1 di surface) | PASS (Normal & Large) |
| `--border-subtle` | `#CEC8BC` | Garis pemisah grid dan batas kartu non-interaktif yang bersih. | Struktural non-kritis | N/A (Dekoratif) | Sesuai fungsi |
| `--border-interactive` | `#6B665C` / `#706B61` | Batas kotak input, dropdown, checkbox, dan tombol sekunder agar selalu >= 3:1 di mode terang. | `#6B665C` on `#F2EFE9`; `#706B61` on `#FAF8F4` | **4.97:1** / **4.99:1** | PASS Non-Text (>= 3.0:1) |
| `--accent-cta-bg` | `#8C4F04` | Aksen tunggal **Burnt Amber / Aged Brass** di mode terang agar tombol CTA lulus kontras teks DAN kontras tepi. | `#FAF8F4` on `#8C4F04` | **6.12:1** | PASS (Normal & Large) |
| `--accent-cta-edge` | `#8C4F04` | Batas visual tombol CTA Burnt Amber terhadap kanvas Warm Stone (`#F2EFE9`). | `#8C4F04` on `#F2EFE9` | **5.66:1** (6.12:1 di surface) | PASS Non-Text (>= 3.0:1) |
| `--accent-text` / `--focus-ring` | `#8A4D04` / `#8C4F04` | Tautan aksen dan ring fokus keyboard yang tetap jelas di semua permukaan terang. | `#8A4D04` on `#E6E1D8`; `#8C4F04` on `#E6E1D8` | **5.13:1** / **4.98:1** | PASS (Normal & Focus) |
| `--brand-olive-fill` | `#334434` | Core Brand 1 (**Ranger Olive**) konsisten lintas tema untuk tombol solid sekunder dan aksen header. | `#FAF8F4` on `#334434` | **9.81:1** | PASS (Normal & Large) |
| `--brand-olive-text` | `#2F4230` | Teks kategori taktis dan item navigasi aktif di mode terang. | `#2F4230` on `#E6E1D8` | **8.30:1** (9.42:1 di canvas) | PASS (Normal & Large) |
| `--brand-coyote-text` | `#664D2C` | Core Brand 2 (**Coyote Umber**) untuk metadata material dan label kategori perlengkapan lapangan. | `#664D2C` on `#E6E1D8` | **6.06:1** (6.87:1 di canvas) | PASS (Normal & Large) |
| `--status-success` | `#1B5831` on `#E0F0E5` | Badge stok tersedia / terverifikasi di mode terang. | `#1B5831` on `#E0F0E5` | **7.14:1** | PASS (Normal & Large) |
| `--status-warning` | `#7C4403` on `#F8EBD4` | Badge stok kritis / menunggu verifikasi di mode terang. | `#7C4403` on `#F8EBD4` | **6.64:1** | PASS (Normal & Large) |
| `--status-danger` | `#9A1F15` on `#F9E2DF` | Badge stok habis / galat validasi di mode terang. | `#9A1F15` on `#F9E2DF` | **6.58:1** | PASS (Normal & Large) |
| `--tag-olive` | `#293B2A` on `#E0E7DF` | Tag spesifikasi fungsional di mode terang. | `#293B2A` on `#E0E7DF` | **9.51:1** | PASS (Normal & Large) |

### 4.2 Jebakan Kontras yang Terbukti FAIL (Hasil Uji `contrast-check.py`)
Tim UI dan Frontend **DILARANG** menggunakan kombinasi berikut karena telah terbukti gagal melalui pengujian skrip:
1. **Teks putih di atas tombol Signal Amber (`#FFFFFF` on `#E5A024`):** Rasio **2.24:1 (FAIL)**. Di Dark Mode, tombol `#E5A024` wajib memakai teks gelap `#121412` (`8.27:1 PASS`).
2. **Tombol Signal Amber cerah tanpa border gelap di atas kanvas Light Mode (`#E5A024` on `#F2EFE9`):** Rasio tepi **1.95:1 (FAIL non-text 3:1)**. Solusinya: gunakan Burnt Amber `#8C4F04` dengan teks `#FAF8F4` (`6.12:1` teks, `5.66:1` tepi) sebagai CTA Light Mode, atau gunakan tombol `#E5A024` hanya jika dibingkai border solid `1.5px` `#8C4F04` (`5.66:1`).
3. **Grey-on-Grey di Dark Mode (`#555555` on `#0F1110`):** Rasio **2.54:1 (FAIL)**. Jangan pernah menurunkan warna teks muted di bawah `#949C93`.
4. **Grey-on-Stone di Light Mode (`#8E8E93` on `#F2EFE9`):** Rasio **2.84:1 (FAIL)**. Teks muted Light Mode tidak boleh lebih pucat dari `#595E56`.

### 4.3 Aturan Implementasi Tema (`R-21`, `R-33`, `R-34`)
- Definisikan seluruh token di atas lewat CSS Custom Properties pada `:root` dan `[data-theme="light"]` / `[data-theme="dark"]` langsung di berkas CSS sumber (dilarang memodifikasi CSS dengan skrip patch eksternal sesuai `R-33`).
- Simpan preferensi tema di `localStorage` dan baca melalui inline script minimal di `<head>` (tanpa network call) untuk mencegah kilatan tema salah (*FOUC*), dengan default `dark` pada kunjungan pertama sesuai karakter Armory & Hero Video sinematik.
- Setiap komponen baru (Landing, Storefront, Checkout, Loadout Builder, Admin) wajib diverifikasi di KEDUA mode sebelum dinyatakan selesai (`R-34`).

---

## 5. Sistem Tipografi Berkarakter (Industrial Spec-Sheet Hierarchy)

Mengacu pada **`R-06`** dan `antislop-ui`, kita secara sadar **menghindari keenam font default AI** (*Inter*, *Geist*, *Space Grotesk*, *Geist Mono*, *JetBrains Mono*, *Fira Code*) dan memilih trio Google Fonts open-source yang memiliki kesatuan geometris industrial, siap dimuat cepat (`font-display: swap`), dan memiliki alasan jelas (`R-31`):

### 5.1 Rekomendasi Trio Font & Alasan 1 Kalimat (`R-31`)

1. **Display / Judul Utama: `Barlow Condensed` (Weights: 600 SemiBold, 700 Bold)**
   - *Alasan 1 kalimat:* Proporsi terkompresi dengan terminal agak mengotak terinspirasi penanda jalan dan mesin industri memberi wibawa cetak stensil taktis tanpa jatuh ke estetika gim cyberpunk atau font SaaS generik.
   - *Pemakaian:* Hero `H1`, judul seksi utama (`H2`), nama seri produk di PDP, dan judul besar editorial.
   - *Catatan huruf kapital:* Gunakan Sentence Case atau Title Case yang terkendali pada narasi; uppercase hanya diperbolehkan untuk judul display singkat (maks 4 sampai 5 kata) dengan tracking ketat (`0.01em` sampai `0.03em`), bukan wide-tracking klise (`R-06`).

2. **UI & Body Copy: `IBM Plex Sans` (Weights: 400 Regular, 500 Medium, 600 SemiBold)**
   - *Alasan 1 kalimat:* Dirancang khusus untuk dokumentasi perangkat keras dan antarmuka rekayasa presisi sehingga sangat nyaman dibaca dalam deskripsi bahasa Indonesia, formulir checkout, dan tabel operasional Admin Panel berkepadatan tinggi.
   - *Pemakaian:* Paragraf narasi, navigasi, tombol CTA, deskripsi produk, formulir verifikasi 18+, tabel admin, dan seluruh pesan sistem/galat.

3. **Technical Tabular Mono: `IBM Plex Mono` (Weights: 400 Regular, 500 Medium, 600 SemiBold)**
   - *Alasan 1 kalimat:* Berbagi tinggi-x (*x-height*) dan geometri tajam dengan `IBM Plex Sans` sekaligus menjaga kesejajaran vertikal pixel-presisi untuk angka kronograf FPS, Joule, berat gram, kode SKU, stok, dan harga Rupiah.
   - *Pemakaian KHUSUS (Strict Scoping per `R-06`):* Hanya untuk data terstruktur dan numerik (`font-variant-numeric: tabular-nums;`): FPS (`390 FPS`), energi (`1.41 J`), SKU (`BRK-AEG-001`), harga (`Rp 4.850.000`), total bobot Loadout (`6.420 g`), jumlah stok, kode resi, dan stempel waktu order. **DILARANG** dipakai sebagai heading besar dekoratif atau paragraf panjang.

### 5.2 Skala Tipografi Fluida (`clamp()`) & Anti-Fixed-Px (`R-03`, `antislop-layoutmobile`)

Gunakan skala fluida berbasis `rem` dan `clamp()` agar teks dapat diperbesar hingga 200% tanpa terpotong (WCAG 1.4.4) dan otomatis menyesuaikan proporsi antara layar 360px dan 1440px:

| Peran | Font Family | Ukuran Fluida | Line-Height | Letter-Spacing | Catatan |
|---|---|---|---|---|---|
| **Hero H1** | `Barlow Condensed` 700 | `clamp(2.5rem, 5.2vw, 4.5rem)` | `0.98` | `-0.01em` | Hanya 1 `<h1>` per dokumen HTML (`R-39`). |
| **Section H2** | `Barlow Condensed` 600 | `clamp(1.75rem, 3vw, 2.75rem)` | `1.08` | `0em` | Tanpa garis warna kiri dekoratif (`R-01`). |
| **Card / PDP Title H3** | `IBM Plex Sans` 600 | `clamp(1.0625rem, 1.4vw, 1.25rem)` | `1.3` | `-0.01em` | Sentence case, mudah dipindai di katalog. |
| **Body / Deskripsi** | `IBM Plex Sans` 400 | `clamp(0.9375rem, 1vw, 1rem)` | `1.6` | `0em` | Lebar kolom teks dibatasi `60ch` sampai `68ch`. |
| **UI Label / Nav / CTA** | `IBM Plex Sans` 500/600 | `0.875rem` sampai `0.9375rem` | `1.2` | `0.01em` | Tinggi target tombol minimal `44px` (`R-03`). |
| **Spec Key / Metadata** | `IBM Plex Mono` 500 | `0.75rem` sampai `0.8125rem` | `1.4` | `0.04em` | Tracking maksimal `0.06em` (bukan `0.2em` AI slop). |
| **Numeric Data (FPS/IDR/SKU)** | `IBM Plex Mono` 500/600 | `0.875rem` sampai `1.125rem` | `1.2` | `0em` | Wajib `font-variant-numeric: tabular-nums;`. |

---

## 6. Pola UX, Aksesibilitas & Performa untuk Hero Video Taktis (<= 30 Detik)

Brakasa Tactical menampilkan Hero Video sinematik berdurasi <= 30 detik (sekitar 20 sampai 28 detik) dengan potongan adegan cepat (*fast-cut*) tiap 1 sampai 5 detik. Tanpa rekayasa UX yang ketat, video latar belakang mudah melanggar tiga aturan Hard Gate sekaligus: **`R-25` (Kontras)**, **`R-39` (Aksesibilitas & Motion)**, dan **`R-40` (Performa LCP/CLS)**.

Berikut cetak biru implementasi yang wajib diikuti oleh tim Frontend:

### 6.1 Strategi LCP Poster & Anti-CLS (`R-40`)
1. **Poster sebagai elemen `<img>` nyata di HTML awal (bukan sekadar atribut `poster` atau CSS `background-image`):** Browser memprioritaskan `<img fetchpriority="high">` pada pemindaian HTML pertama sehingga LCP tercapai segera sebelum berkas `.mp4` selesai diunduh.
2. **Jangan pernah beri `loading="lazy"` pada gambar poster hero.** Berikan atribut dimensi eksplisit (`width="1920" height="1080"`) dan `aspect-ratio` pada container agar CLS tetap nol.
3. **Pemuatan video progresif yang ringan:** Gunakan `<video autoplay muted loop playsinline preload="metadata">` yang ditumpuk tepat di atas `<img>` poster (z-index lapisan video di atas poster setelah event `playing` atau `canplay`, lalu fade opacity 250ms). Jika berkas video memiliki trek audio ambient taktis opsional, status awal **WAJIB `muted`** agar autoplay diizinkan browser dan tidak mengejutkan pengguna.
4. **Dilarang melaporkan skor Lighthouse atau nilai LCP/CLS sebelum diukur nyata (`R-36`, `R-40`).**

### 6.2 Kontrol Play/Pause Eksplisit & Aksesibilitas (`R-39` / WCAG 2.2.2)
Karena video berdurasi > 5 detik dan bergerak otomatis di samping teks:
- **Tombol Play/Pause Wajib Terlihat Permanen:** Letakkan bilah kontrol kompak di pojok kanan bawah area hero (di atas lipatan baik di desktop maupun mobile) berisi tombol `<button type="button">` untuk **Jeda / Putar Video** dengan label teks singkat + ikon (`aria-pressed`, `aria-label="Jeda video latar taktis"` / `"Putar video latar taktis"`).
- **Tombol Mute/Unmute (Opsional bila video memiliki audio):** Kontrol terpisah dengan default `muted`, tidak menyatu dengan tombol Play/Pause.
- **Standar Interaksi:** Ukuran minimal **44x44px** (`R-03`), `cursor: pointer`, latar permukaan solid/translusen tinggi (`#171A18` dengan teks `#F0EFEA` teruji **15.23:1**), border `#6E7871` (`3.83:1`), dan `:focus-visible` `#EBAC3B` (`9.47:1`).
- **Indikator Scene / Progress (Jika Digunakan):** Hanya boleh terikat langsung pada properti nyata `video.currentTime / video.duration` (dilarang membuat animasi progress palsu yang tidak sinkron dengan playback).

### 6.3 Fallback `prefers-reduced-motion: reduce` (`R-39`)
Pengguna dengan sensitivitas vestibular atau gangguan fokus yang mengaktifkan *Reduce Motion* di OS tidak boleh menerima potongan adegan cepat otomatis:
- **CSS Layer:** Sembunyikan autoplay otomatis atau tahan elemen video pada frame statis poster saat `@media (prefers-reduced-motion: reduce)` aktif, kecuali pengguna secara sadar menekan tombol "Putar Video".
- **JavaScript Layer:** Saat mount komponen, cek `window.matchMedia('(prefers-reduced-motion: reduce)').matches`. Jika `true`, panggil `video.pause()`, set state `isPlaying = false`, dan tampilkan poster resolusi tinggi secara penuh. Pengguna tetap dapat memutar video secara manual lewat tombol "Putar Video" bila menginginkannya.

### 6.4 Scrim Teruji Kontras di Seluruh Area Teks (`R-25`)
Fast-cut adegan taktis sering menampilkan kilatan cahaya, langit terang, atau dinding beton pucat di belakang teks. Pengujian pada satu frame gelap saja tidak sah menurut `R-25` dan `antislop-human`.

Kami menghitung warna latar komposit **kasus terburuk** (scrim warna `#0F1110` diletakkan di atas frame video putih murni `#FFFFFF`) lalu memverifikasinya lewat `contrast-check.py`:

| Opasitas Scrim (`#0F1110` di atas `#FFFFFF`) | Warna Komposit Terburuk | Hero H1 (`#F0EFEA`) | Hero Body (`#D4D8D2`) | Hero Amber (`#F0B443`) | Kesimpulan |
|---|---|---|---|---|---|
| 72% (`rgba(15, 17, 16, 0.72)`) | `#525453` | 6.63:1 (PASS) | 5.29:1 (PASS) | **4.11:1 (FAIL normal)** | Cukup untuk H1/Body, GAGAL untuk teks normal Amber. |
| 78% (`rgba(15, 17, 16, 0.78)`) | `#434544` | 8.39:1 (PASS) | 6.70:1 (PASS) | Belum optimal | Aman untuk H1/Body. |
| **82% (`rgba(15, 17, 16, 0.82)`)** | **`#393B3A`** | **9.80:1 (PASS)** | **7.82:1 (PASS)** | **6.08:1 (PASS)** | **STANDAR WAJIB di seluruh zona teks!** |

**Resep CSS Gradient Scrim Direkomendasikan (Desktop & Mobile):**
- **Desktop (teks di kiri-bawah, aksi video terbuka di kanan-atas):** Gunakan dua lapisan gradien terarah sehingga sisi teks selalu tertutup minimal **82% sampai 88%** opasitas `#0F1110`, sementara area tengah-kanan turun ke **25% sampai 35%** agar detail aksi video tetap sinematik dan tidak kusam:
  ```css
  .hero-scrim {
    background:
      linear-gradient(
        90deg,
        rgba(15, 17, 16, 0.88) 0%,
        rgba(15, 17, 16, 0.82) 42%,
        rgba(15, 17, 16, 0.32) 75%,
        rgba(15, 17, 16, 0.45) 100%
      ),
      linear-gradient(
        0deg,
        rgba(15, 17, 16, 0.88) 0%,
        rgba(15, 17, 16, 0.25) 45%,
        rgba(15, 17, 16, 0.50) 100%
      );
  }
  ```
- **Mobile (< 768px, teks di bawah):** Gunakan gradien vertikal kuat dari bawah (`rgba(15, 17, 16, 0.92)` 0% -> `rgba(15, 17, 16, 0.84)` 55% -> `rgba(15, 17, 16, 0.30)` 100%).

### 6.5 Struktur Markup Referensi Hero Video (Anti-Slop Compliant)

```html
<section class="hero-armory" aria-label="Brakasa Tactical Field Showcase">
  <!-- 1. Poster LCP nyata di HTML awal, fetchpriority high, dimensi eksplisit (R-40) -->
  <img
    src="/media/hero-poster.webp"
    alt="Operator airsoft memeriksa unit AEG taktis di area latihan"
    width="1920"
    height="1080"
    fetchpriority="high"
    decoding="async"
    class="hero-poster"
  />

  <!-- 2. Video taktis <= 30s, default muted, playsinline, aria-hidden karena dekoratif/latar -->
  <video
    id="hero-tactical-video"
    class="hero-video"
    muted
    loop
    playsinline
    preload="metadata"
    width="1920"
    height="1080"
    aria-hidden="true"
  >
    <source src="/media/hero-tactical-reel.mp4" type="video/mp4" />
  </video>

  <!-- 3. Directional Scrim terverifikasi >= 82% di zona teks (R-25) -->
  <div class="hero-scrim" aria-hidden="true"></div>

  <!-- 4. Konten Hero (tanpa pill badge di atas H1 sesuai R-09) -->
  <div class="hero-content">
    <h1>Perlengkapan Airsoft &amp; Taktis Berstandar Presisi Lapangan</h1>
    <p>
      Unit AEG, GBBR, optik, dan sistem load-bearing yang telah melalui uji kronograf
      dan spesifikasi material transparan untuk komunitas olahraga airsoft 18+ Indonesia.
    </p>
    <div class="hero-actions">
      <a href="/store" class="btn-primary">Lihat Katalog Unit</a>
      <a href="/loadout-builder" class="btn-secondary">Rakit Loadout</a>
    </div>
  </div>

  <!-- 5. Kontrol Video Eksplisit >= 44x44px (R-03, R-32, R-39 / WCAG 2.2.2) -->
  <div class="hero-video-controls">
    <button
      type="button"
      id="hero-play-toggle"
      aria-pressed="true"
      aria-label="Jeda video latar hero"
      class="video-ctrl-btn"
    >
      <span aria-hidden="true">||</span>
      <span>Jeda Video</span>
    </button>
  </div>
</section>
```

*Catatan Mobile Height (`antislop-layoutmobile`):* Hindari `height: 100vh`. Gunakan `min-height: clamp(540px, 82svh, 860px)` di desktop dan `min-height: auto; padding-block: 5rem 2.5rem` (atau `min-height: 72svh`) di mobile agar area video sinematik tetap dominan tanpa memotong CTA utama di bawah bilah alamat browser mobile.

---

## 7. Hierarki Permukaan, Radius, Motion, Mobile Reflow & Copywriting

### 7.1 Tactile Surface Hierarchy, Radius & Dose Caps (`R-10`, `R-11`, `R-12`, `R-13`)
- **Sistem Radius Industrial (`R-11`):**
  - `0px`: Garis pembatas struktural full-bleed, tabel spesifikasi PDP, header lengket.
  - `2px`: Tag spesifikasi teknis (`AEG`, `500D Cordura`, status stok), indikator bar aktif sidebar.
  - `4px`: Semua tombol CTA/sekunder, input teks, dropdown filter, checkbox.
  - `6px`: Kartu produk katalog, panel ringkasan loadout, modal dialog, drawer.
  - **Larangan:** Tidak ada `rounded-2xl` (16px+) atau `rounded-full` untuk tombol utama, input, dan kartu.
- **Dose Cap Elevasi & Efek:**
  - **Shadow (`R-12`):** Nol shadow pada kartu katalog dan panel statis (gunakan pembedaan warna permukaan + border 1px). Shadow keras terukur (`0 12px 32px rgba(0, 0, 0, 0.35)`) hanya diizinkan pada elemen yang melayang secara fungsional di atas halaman: Modal, Cart Drawer, dan Dropdown Menu.
  - **Glassmorphism (`R-10`):** Maksimal 1 elemen per layar (mis. bilah kontrol video hero atau header saat scroll di atas hero), dengan kontras latar tetap di atas 82% untuk teks.
  - **Glow (`R-13`):** Nol glow dekoratif. Hanya `:focus-visible` outline tegas `2px solid var(--focus-ring)` dengan `outline-offset: 2px`.

### 7.2 Authentic Micro-Interactions (`R-19`, `R-39`)
- **Karakter Gerak:** Terinspirasi klik tuas pengaman (*selector switch*) dan dial optik, bukan efek memantul (*spring bounce*).
  - Hover/Active tombol & tautan: `transition: background-color 140ms ease-out, border-color 140ms ease-out, color 140ms ease-out;` disertai penekanan ringan `transform: translateY(1px)` saat `:active`.
  - Pergantian varian produk atau tab spesifikasi: transisi opacity ringkas `160ms` tanpa pergeseran tata letak.
  - **Larangan:** Tidak ada animasi `bounce`, `float`, `pulse` tanpa henti, atau `fade-up` serentak di setiap paragraf/kartu. Seluruh transisi non-esensial dibungkus `@media (prefers-reduced-motion: no-preference)`.

### 7.3 Standar Mobile Reflow (`R-03`, `antislop-layoutmobile`)
- **Tiga Rentang Lebar Nyata (Anti Two-State Layout):**
  - Mobile (`< 640px`): 1 kolom utama (atau 2 kolom kompak khusus grid thumbnail produk bila lebar kartu >= 165px dengan teks tidak terpotong), filter katalog masuk ke drawer/sheet bertombol jelas `"Filter (N)"`, navigasi menggunakan tombol berlabel `"Menu"` (bukan ikon hamburger telanjang tanpa label).
  - Tablet / Laptop Kecil (`640px` sampai `1024px`): 2 kolom untuk katalog dan split editorial seimbang; sidebar admin otomatis collapse ke sheet atau rail berlabel jelas.
  - Desktop (`> 1024px`): Grid 12 kolom editorial (Landing), 3 sampai 4 kolom katalog dengan sidebar filter tetap (Storefront), dan tata letak split 65/35 pada PDP.
- **Zero Horizontal Overflow:** Tabel spesifikasi panjang dan tabel order admin pada layar sempit menggunakan container `overflow-x: auto` terbatas pada tabel atau pola reflow kartu data per baris, dengan `min-width: 0` pada semua anak flex/grid.
- **Tap Targets & Keyboard Mobile:** Minimal `44px x 44px` dengan jarak >= `8px` antar target berdekatan; padding bawah cukup pada halaman checkout/form agar input yang difokuskan tidak tertutup keyboard virtual.

### 7.4 Panduan Copywriting Otentik Brakasa Tactical (`R-02`, `R-15`, `R-16`, `R-36`, `antislop-copywriting`)
Suara merek Brakasa Tactical bersifat **lugas, teknis, terukur, dan bertanggung jawab** (seperti teknisi gudang senjata olahraga berpengalaman, bukan copywriter startup SaaS).

| Konteks | Contoh Slop AI (DILARANG) | Contoh Copy Standar Brakasa Tactical (DISARANKAN) |
|---|---|---|
| **Hero Headline** | "Elevate Your Tactical Journey to the Next Level" | "Unit Airsoft & Perlengkapan Taktis Berstandar Presisi Lapangan" |
| **Hero Subheadline** | "Discover cutting-edge, revolutionary gear seamlessly crafted for ultimate performance." | "Koleksi replika AEG, GBBR, optik, dan plate carrier dengan data FPS terukur serta spesifikasi material lengkap untuk olahraga airsoft 18+." |
| **CTA Utama** | "Explore Now ->", "Get Started", "Discover More" | "Lihat Katalog Unit", "Rakit Loadout", "Tambah ke Keranjang", "Cek Status Pesanan" |
| **Notice Regulasi 18+** | "Safety is the currency of trust. Read that again." | "Penjualan unit replika airsoft khusus usia 18 tahun ke atas untuk kebutuhan olahraga, skirmish lapangan resmi, dan koleksi." |
| **Empty State Katalog** | "No data available." | "Tidak ada produk yang cocok dengan filter ini. Hapus sebagian filter atau tampilkan semua unit." |
| **Empty State Admin** | "Belum ada data." | "Belum ada pesanan yang menunggu verifikasi. Pesanan baru dari storefront akan muncul di daftar ini secara otomatis." |
| **Tanda Baca** | Menggunakan karakter em dash (U+2014) atau double hyphen di tengah kalimat. | Gunakan koma, titik, titik dua, atau tanda kurung secara alami (`R-02`). |

---

## 8. Ringkasan Alasan Keputusan (Reason Ledger `R-31`) & Checklist Delivery Gate

### 8.1 Reason Ledger Cepat untuk Tim Desain & Frontend
- **Warna:** Gunmetal matte (`#0F1110`) + Field Paper (`#F2EFE9`) + Ranger Olive (`#334434`) + Coyote + aksen tunggal Signal/Burnt Amber (`#E5A024`/`#8C4F04`) mencerminkan material anodized logam, kanvas lapangan, dan kuningan industri sambil lulus WCAG AA di kedua tema.
- **Tipografi:** `Barlow Condensed` (otoritas industrial), `IBM Plex Sans` (keterbacaan tinggi di formulir & admin), dan `IBM Plex Mono` tabular (presisi kolom angka FPS/SKU/IDR) menghindari 6 font default AI.
- **Layout:** Komposisi asimetris berbasis konten nyata (Hero Video -> Jalur Kategori -> Unit Unggulan + Spec Sheet -> Loadout Builder -> Regulasi 18+) menggantikan urutan templat SaaS.
- **Radius & Elevasi:** Sudut tajam terukur (`2px` sampai `6px`) dan hierarki permukaan + garis 1px menggantikan kartu membulat melayang agar terasa seperti instrumen fisik.
- **Hero Video:** Poster `<img>` `fetchpriority="high"`, tombol Play/Pause >= 44px, `prefers-reduced-motion`, dan scrim >= 82% menjaga sinematika aksi tanpa mengorbankan LCP dan aksesibilitas.

### 8.2 Ringkasan Gerbang Verifikasi Sebelum Rilis (Delivery Gate)
Tim UX/UI dan Frontend wajib melampirkan laporan **PASS/FAIL berbasis bukti** sebelum menyerahkan hasil akhir:
1. **Hard Gate:** Nol karakter em dash (`R-02`), nol overflow mobile & tap target >= 44px (`R-03`), nol angka/testimoni/klaim karangan (`R-17`, `R-18`, `R-36`, `R-38`), nol tautan mati/tombol kosong (`R-24`, `R-26`), kontras lulus `contrast-check.py` di Light & Dark Mode termasuk scrim hero (`R-25`, `R-34`), tiga state data lengkap (`R-27`), navigasi keyboard + `:focus-visible` (`R-32`), kontrol Play/Pause video + `prefers-reduced-motion` + `cursor: pointer` + label form (`R-39`), poster hero `fetchpriority="high"` + media berdimensi (`R-40`), dan laporan uji klik nyata setelah build berjalan (`R-35`).
2. **Purpose-Gate & Quality Locks:** Bebas bento-grid klise, pill di atas H1, glow/glass berlebihan, emoji dekoratif, kartu seragam, dan dashboard shell statis dengan metrik palsu (`R-01` s.d. `R-31`).
