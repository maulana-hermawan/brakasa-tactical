# Riset Benchmark Store Airsoft & Tactical Gear: Brakasa Tactical

Dokumen ini menjadi acuan riset domain, arsitektur katalog, standar presentasi spesifikasi teknis, kepatuhan regulasi Indonesia, kurasi 20 produk awal, serta cetak biru konsep sinematik Hero Video untuk **Brakasa Tactical**. Seluruh benchmark dan kisaran harga didasarkan pada praktik industri tactical e-commerce global dan kondisi pasar airsoft Indonesia yang faktual.

---

## 1. Benchmark 9 Store Airsoft & Tactical Gear Kelas Dunia

Industri e-commerce airsoft dan perlengkapan taktis global terbagi ke dalam tiga arketipe besar: **OEM Tactical Gear Modular** (Crye Precision, Ferro Concepts, Agilite, Spiritus Systems), **Spesialis Airsoft DTC & Retailer** (Novritsch, Evike, RedWolf Airsoft), serta **Technical Tactical Apparel & Hard-Use Brand** (5.11 Tactical, Arc'teryx LEAF / PRO).

### 1.1 Ringkasan Matriks 9 Brand Benchmark

| Brand | Kategori & Model Bisnis | Identitas Visual & Estetika | Struktur Katalog & Navigasi | Kekuatan Utama PDP (Halaman Produk) | Pelajaran Kunci untuk Brakasa Tactical |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Crye Precision** | OEM Mil-Spec Gear & Apparel (US) | Industrial utilitarian, sangat minimalis, tipografi tegas bergaya katalog teknik militer, latar netral kontras tinggi | Berbasis sistem misi: Armor/Equipment, Apparel, Packs, Accessories; fokus pada lini ikonik (JPC 2.0, G3/G4) | Panduan ukuran SAPI plate dan dimensi tubuh sangat presisi, diagram struktur, tanpa teks pemasaran berlebihan | Adopsi ketegasan data teknis, ukuran presisi, dan bahasa katalog yang tenang namun otoritatif |
| **Ferro Concepts** | OEM Modular Tactical Gear (Canada/US) | Gelap/netral modern, fotografi flat-lay loadout presisi tinggi, fokus tekstur Cordura & Tegris | Terorganisir mengelilingi ekosistem modular **ADAPT** (Base Carrier -> Cummerbund -> Front Flap -> Back Panel) | Cross-selling ekosistem modular eksplisit langsung di PDP (mis. saat melihat FCPC V5 langsung muncul opsi 3AC Cummerbund & placard kompatibel) | Terapkan blok **Kompatibilitas Ekosistem** di PDP dan fitur **Loadout Builder** agar pembeli tahu bagian apa yang cocok |
| **Agilite** | OEM Tactical Gear & Ergonomic Systems (Israel/US) | High-impact moody dark lighting, fotografi aksi dinamis di lingkungan konkret/urban, visual fitur ergonomis | Berbasis peran taktis: Plate Carriers (K-Zero/K19), Helmets & Covers, Pouches, Gloves, Hydration | Storytelling visual berbasis fitur (distribusi beban V-shape 8 titik, quick-release, clearance popor senapan) + video demo singkat | Gunakan video demo produk & macro detail hardware (buckle, jahitan, laser-cut) di galeri PDP |
| **Spiritus Systems** | OEM Modular Chest Rig & Placard Ecosystem | Bersih, kontras tinggi, fokus edukasi konfigurasi multi-komponen, warna bumi (Ranger Green, Coyote, Multicam) | Modular ekstrem berbasis konfigurator komponen (Micro Fight Chassis, Inserts, Wing Pouches, Harnesses) | Video panduan rakit dan manual konfigurasi tertanam di PDP untuk mencegah salah beli komponen terpisah | Berikan label jelas apakah produk dijual **standalone** atau membutuhkan insert/aksesoris tambahan (baterai, charger, mag) |
| **Novritsch** | Direct-to-Consumer (DTC) Airsoft Brand (Austria) | Modern seperti brand hardware/teknologi premium, whitespace lapang, visual sinematik full-bleed | Kurasi ketat berdasarkan platform (Rifles, Snipers, Pistols, Gear, BBs) tanpa banjir ribuan SKU membingungkan | Fitur **"Build Your Setup"** (bundling BB, baterai, optik, mag cadangan dengan pemilih varian output daya per negara) dan spec callout visual | Jadikan acuan utama alur checkout/bundling minim friksi dan tampilan mobile yang bersih |
| **Evike** | Mega-Retailer Airsoft Terbesar (US) | Padat data, utilitarian katalog superstore, banyak banner stok dan peringatan regulasi | Taksonomi sangat dalam: Propulsion (AEG/GBB/Spring/HPA), Platform (M4/AK/MP5), Gearbox Parts, Accessories | Kedalaman spesifikasi teknis di tabel/accordion (FPS, Gearbox, Thread Direction, Package Includes) dan modul kompatibilitas sparepart/mag | Ambil kedalaman format tabel spesifikasi teknisnya, tetapi **hindari** kepadatan visual dan banner promosi bertumpuk |
| **RedWolf Airsoft** | Premium Enthusiast & Collector Retailer (HK/Global) | Elegan, gelap/netral kelas kolektor, fokus pada finishing eksternal (Cerakote, CNC, marking berlisensi) | Kategori terstruktur rapi dengan segmen khusus Custom Works, Tokyo Marui/VFC Flagships, dan Upgrade Parts | Metadata terstruktur yang menonjolkan material konstruksi nyata (steel, CNC aluminum, polymer), tipe sistem blowback, dan integrasi review editorial (RWTV) | Adopsi penekanan pada kualitas finishing, keaslian sistem internal (mis. ZET System / ECS Gearbox), dan kredibilitas kurasi |
| **5.11 Tactical** | Global Tactical Apparel & Duty Gear ("Always Be Ready") | Industrial tangguh, latar charcoal gelap (`#100E08`) dipadu aksen safety orange (`#F04A23`), tipografi tebal kokoh | Navigasi berdasarkan kebutuhan profesi & skenario (Duty, Range, Outdoor, EDC, Bags, Footwear) | CTA ber-kontras tinggi, foto studio multi-sudut yang menyorot fungsi saku/resleting, dan filter cuaca/ketahanan | Tiru disiplin aksen warna tunggal berkontras tinggi untuk CTA utama dan navigasi filter berbasis skenario penggunaan |
| **Arc'teryx LEAF / PRO** | Elite Technical-Military Apparel (Canada) | Stealth minimalist, palet bumi muted (Wolf Grey, Crocodile, Ranger Green, Matte Black), ruang negatif luas | Kategori sangat ketat berdasarkan lapisan pakaian (Layering System) dan kondisi lingkungan ekstrem | Fokus ekstrem pada spesifikasi kain teknis (GORE-TEX, ripstop, jahitan waterproof, bobot gram), nuansa eksklusif tanpa gimmick komersial | Jadikan tolok ukur restraint visual: tampil premium, disiplin, tenang, dan anti-klise |

### 1.2 Pola UX/UI yang Terbukti Efektif pada Tactical Store Kelas Dunia

1. **Varian Multi-Dimensi Tanpa Friksi:** Produk taktis jarang hanya memiliki ukuran S/M/L. Varian mencakup warna/kamuflase (Black, Ranger Green, Coyote Brown, Multicam), ukuran plate/baju, atau paket konfigurasi. Kombinasi yang habis stok wajib langsung terlihat nonaktif (disabled/strikethrough) agar pembeli tidak mengalami dead-end.
2. **Transparansi Paket Pembelian ("In The Box" vs "Required to Operate"):** Kesalahan paling sering pembeli airsoft pemula adalah mengira unit AEG sudah termasuk baterai LiPo dan charger, atau GBBR sudah termasuk Green Gas. Store terbaik (Evike, Novritsch, RedWolf) memisahkan secara eksplisit **Isi Paket** dan **Kebutuhan Tambahan** langsung di sebelah tombol beli.
3. **Hierarki Informasi 2 Lapis pada PDP:**
   - **Above the Fold:** Galeri rasio presisi (foto studio + macro detail + klip video produk), kode SKU, badge status stok/regulasi, ringkasan 4-6 spesifikasi kunci (Propulsi, FPS/Joule, Material, Bobot), pemilih varian, dan CTA utama yang tegas.
   - **Below the Fold:** Tab/Accordion terstruktur berisi Spec Sheet Teknis lengkap, Kompatibilitas Ekosistem (mag, baterai, rail, placard), Catatan Keselamatan & Regulasi, serta Produk Pendukung Terkait.
4. **Kejujuran Status Inventori:** Komunitas taktis sangat menghargai status stok faktual (`Tersedia / Ready Stock`, `Stok Terbatas`, `Habis / Out of Stock`) dan informasi jalur ekspedisi darat/kargo untuk barang berisiko (baterai LiPo & tabung gas bertekanan).

---

## 2. Pola Presentasi Spesifikasi Teknis Airsoft & Tactical Gear

Pembeli airsoft serius (skirmisher, milsim player, dan kolektor) membuat keputusan pembelian berdasarkan data teknik terukur, bukan deskripsi pemasaran umum. Setiap halaman produk Brakasa Tactical perlu menyimpan dan menampilkan atribut spesifikasi terstruktur sesuai kategori produk.

### 2.1 Sistem Propulsi (Unit Replika)

| Tipe Propulsi | Mekanisme Kerja | Karakteristik Utama bagi Pembeli | Kebutuhan Operasional |
| :--- | :--- | :--- | :--- |
| **AEG (Automatic Electric Gun)** | Motor listrik menggerakkan gear set & piston udara via gearbox | Paling konsisten sepanjang cuaca, kapasitas mag besar (mid-cap 120-150 rds / hi-cap 300+ rds), biaya operasional efisien | Baterai LiPo 7.4V/11.1V, smart balance charger, BB 6mm |
| **GBBR / GBB (Gas Blowback Rifle / Pistol)** | Gas bertekanan (Green Gas / Propane / HFC134a) mendorong BB sekaligus menggerakkan bolt/slide | Realisme recoil tinggi, bolt-lock saat mag kosong, kapasitas mag realistis (25-40 rds), perawatan lubrikasi rutin | Green Gas / Duster Gas, silikon oil/grease, BB 6mm |
| **CO2** | Kapsul CO2 12g bertekanan tinggi (umum pada pistol/revolver) | Kick recoil keras dan stabil di suhu dingin, tekanan tinggi (perlu cek batas Joule lapangan) | Kapsul CO2 12g, BB 6mm |
| **Spring (Bolt-Action)** | Pegas ditarik manual tiap tembakan (standar sniper rifle) | Sangat senyap, tidak tergantung baterai/gas, konsistensi tembakan sangat presisi untuk jarak jauh | BB berat presisi (0.32g - 0.45g) |

### 2.2 Standar Chronograph: FPS, Joule, dan Berat BB

Menampilkan angka FPS saja tanpa menyebut berat BB uji dapat menyesatkan pembeli. Standar internasional dan komunitas Indonesia menggunakan **energi kinetik (Joule)** yang dihitung dari berat BB dan kecepatan luncur, dengan standar uji pabrikan umumnya memakai **BB 0.20g**.

Tabel referensi konversi konstan (tanpa efek *joule creep* pada sistem gas/sniper laras panjang):

| Energi (Joule) | 0.20g BB (FPS) | 0.25g BB (FPS) | 0.28g BB (FPS) | 0.32g BB (FPS) | Klasifikasi Lapangan Umum |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0.83 J** | ~300 FPS | ~268 FPS | ~253 FPS | ~237 FPS | CQB Indoor Ketat / Sidearm Pistol |
| **1.00 J** | ~328 FPS | ~293 FPS | ~277 FPS | ~259 FPS | Standar CQB Umum / Tokyo Marui Stock |
| **1.14 J** | ~350 FPS | ~313 FPS | ~296 FPS | ~277 FPS | CQB Max / Outdoor Jarak Pendek-Menengah |
| **1.49 J** | ~400 FPS | ~358 FPS | ~338 FPS | ~316 FPS | Standar Assault Rifle Outdoor |
| **1.86 J** | ~447 FPS | ~400 FPS | ~378 FPS | ~354 FPS | DMR (Semi-Auto Lock) |
| **2.00 J** | ~464 FPS | ~415 FPS | ~392 FPS | ~367 FPS | Batas Atas Energi Regulasi Airsoft RI (Perpol/Standar Lapangan) |

**Aturan Presentasi di PDP Brakasa Tactical:** Selalu tampilkan format lengkap, misalnya `370 - 390 FPS (diukur dengan 0.20g BB) / ~1.27 - 1.41 Joule`, disertai badge peran lapangan (mis. `CQB Ready`, `Outdoor Carbine`, atau `Sniper Role`).

### 2.3 Tipe Gearbox, Sistem Internal & Hop-Up

- **Gearbox V2 (Version 2):** Standar platform M4/AR-15, MK18, HK416, MP5, SCAR-L, dan ARP9. Casing dua belah, motor berada terpisah di dalam pistol grip. Keunggulan: ketersediaan part upgrade (ETU, gear 13:1, quick-change spring) paling melimpah di pasar.
- **Gearbox V3 (Version 3):** Standar platform AK-47/74/105, G36, dan AUG. Memiliki *motor cage* menyatu ke shell gearbox dan dinding depan lebih tebal sehingga struktural lebih tahan beban per keras.
- **Sistem Internal GBBR:** Cantumkan arsitektur sistemnya secara eksplisit karena menentukan kompatibilitas magazine dan sparepart, misalnya **Tokyo Marui MWS ZET System** (terkenal tahan lama dan efisien gas) atau **VFC GBB Gen 2/V3 System** (realisme trigger group baja dan tendangan recoil kuat).
- **Sistem Hop-Up:**
  - **Rotary Hop-Up (M4/AEG modern):** Stabil terhadap getaran dan pengaturan halus.
  - **TDC (Top Dead Center) Hop-Up:** Standar emas sniper presisi (seperti Silverback TAC-41 dengan 50 klik terindeks 15 mikrometer) yang menekan bucking vertikal secara merata.
  - **Slider Hop-Up (AK-style) & Guide-Hop (Glock Gen5):** Penyesuaian praktis tanpa bongkar slide (pada VFC Glock 17 Gen5 melalui recoil guide rod).
  - Cantumkan kompatibilitas karet bucking (AEG-spec vs GBB/VSR-spec) serta panjang & diameter inner barrel (mis. `275 mm / 6.03 mm tight-bore`).

### 2.4 Material Konstruksi & Finishing

Pembeli serius membedakan kualitas eksternal berdasarkan jenis logam dan polimer yang digunakan:
- **CNC 6061-T6 Aluminum:** Standar rail handguard M-LOK/RIS, slide pistol kelas atas, dan tabung optik (red dot/LPVO). Ringan, presisi tinggi, dan tahan korosi (biasanya difinishing hard-anodized atau Cerakote).
- **Stamped / Forged Steel:** Digunakan pada receiver seri AK kelas atas (seperti CYMA CM.040 series) serta komponen internal rawan aus (hammer, sear, bolt catch, gear set).
- **Zinc-Aluminum Alloy (ZnAl / Die-Cast Metal):** Umum pada receiver AEG kelas menengah yang tetap kokoh secara bobot dan harga lebih ekonomis.
- **Glass-Filled Nylon Fiber Polymer:** Jauh lebih kuat, kaku, dan matte dibanding plastik ABS mainan; dipakai pada receiver CQB ringan (ARP9), bodi MP7, popor, dan grip.

### 2.5 Kelistrikan, MOSFET/ETU & Konektor Baterai

- **Deans (T-Plug) vs Mini Tamiya:**
  - **Deans (T-Plug):** Resistansi listrik rendah, mampu menghantarkan arus tinggi (11.1V LiPo) tanpa panas berlebih, respons pelatuk (*trigger response*) lebih cepat, dan ukuran ringkas di dalam buffer tube. Menjadi standar baru AEG modern.
  - **Mini Tamiya:** Konektor warisan yang masih ada di beberapa AEG standar (seperti seri CYMA klasik); resistansi lebih tinggi dan berukuran lebih besar.
- **MOSFET & ETU (Electronic Trigger Unit):** Wajib dicantumkan apakah unit sudah memiliki MOSFET/ETU bawaan (mis. G&G ETU, VFC ECS/Gate Aster). Unit tanpa MOSFET berisiko mengikis kontak pelatuk bila dipaksa menggunakan baterai 11.1V LiPo (disarankan 7.4V LiPo untuk non-MOSFET).
- **Kompartemen & Rating Baterai:** Cantumkan tegangan rekomendasi (`7.4V 2S` atau `11.1V 3S LiPo`), `C-rating` (mis. `20C - 25C`), tipe konektor, dan bentuk fisik baterai (Stick / Buffer Tube / Nun-Chuck) agar tidak salah ukuran.

### 2.6 Sistem Mounting & Threading

- **Picatinny (MIL-STD-1913):** Rel berlekuk standar militer untuk mounting optik (red dot, LPVO), PEQ-15 laser, dan bipod. Kompatibilitas universal.
- **M-LOK:** Sistem slot negatif berprofil tipis dan ringan (standar handguard carbine modern) untuk memasang foregrip, senter, atau panel rail tanpa bobot ekstra quad-rail.
- **Outer Barrel Threading:** Standar universal airsoft adalah **14mm CCW (Counter-Clockwise / ulir kiri)** untuk pemasangan tracer unit (mis. Acetech) atau mock suppressor. Beberapa sniper khusus memakai **M24x1 CW** (seperti Silverback TAC-41).
- **Mounting Tactical Gear:**
  - **MOLLE / PALS Laser-Cut:** Slot pemotongan laser pada bahan laminasi Cordura/Squadron; lebih tipis, ringan, dan tidak menyerap air dibanding webbing jahit konvensional.
  - **SwiftClip / G-Hook Placard:** Antarmuka pemasangan cepat chest rig (mis. Micro Fight Mk4) langsung ke bagian dada plate carrier (mis. FCPC V5 / JPC 2.0).
  - **ARC Rail & NVG Shroud (Helm):** Rel samping standar helm FAST untuk memasang adapter headset komunikasi (seperti Earmor M32) dan lampu helm.

### 2.7 Denier Kain & Standar Material Tactical Gear

- **Cordura 500D:** Keseimbangan terbaik antara ketahanan sobek/abrasi dan kelenturan serta bobot ringan; standar utama plate carrier dan chest rig modern (Crye JPC 2.0, Ferro FCPC V5, Spiritus Micro Fight).
- **Cordura 1000D:** Lebih tebal, kaku, dan sangat tahan gesekan berat; sering dipakai pada ransel tempur, dasar tas, atau area berbeban ekstrem (lebih berat dari 500D).
- **Cordura Laminate / Squadron (500D/1000D Bonded):** Dua lapisan Cordura yang dilaminasi menjadi lembaran semi-kaku agar kuat dipotong laser (laser-cut MOLLE) tanpa mudah berserabut.
- **Tegris / CURV Thermoplastic Composite:** Material komposit struktural super ringan dan kaku yang menggantikan Kydex/webbing tebal pada cummerbund dan sabuk taktis modern.
- **50/50 NyCo Ripstop (Nylon-Cotton):** Standar kain seragam tempur (combat pants/shirt G3) yang tahan sobek namun tetap nyaman menyerap keringat di iklim tropis Indonesia.
- **Sertifikasi Pelindung Mata (Eye Protection):** Setiap panduan keselamatan wajib menegaskan standar dampak balistik minimal **ANSI Z87.1+** atau **EN166B** (full-seal goggles) saat bermain airsoft.

---

## 3. Konteks Regulasi & Etika Penjualan Replika Airsoft di Indonesia

Agar **Brakasa Tactical** tampil otentik, kredibel, dan bertanggung jawab di mata pembeli serius maupun masyarakat umum, platform harus mencerminkan pemahaman akurat terhadap kerangka hukum dan etika olahraga airsoft di Indonesia.

### 3.1 Kerangka Regulasi Kepolisian Republik Indonesia

1. **Perkap No. 8 Tahun 2012:** Menjadi pijakan awal pengawasan dan pengendalian senjata api untuk kepentingan olahraga, termasuk klasifikasi airsoft gun sebagai peralatan olahraga menembak.
2. **Perpol No. 5 Tahun 2018:** Secara spesifik mengatur **Pengawasan dan Pengendalian Replika Senjata Jenis Airsoft Gun dan Paintball** demi mencegah penyalahgunaan yang mengganggu Kamtibmas.
3. **Perpol No. 1 Tahun 2022:** Memperbarui dan mempertegas ketentuan perizinan, pengawasan, serta pengendalian peralatan olahraga menembak dan replika di bawah pengawasan Polri.
4. **Sanksi Penyalahgunaan:** Membawa, memamerkan, atau menggunakan replika airsoft untuk intimidasi/penodongan di tempat umum merupakan pelanggaran hukum berat yang dapat diproses pidana berdasarkan KUHP maupun **UU Darurat No. 12 Tahun 1951**.

### 3.2 Ketentuan Teknis, Keanggotaan Klub & Batas Usia

- **Peruntukan Tunggal:** Unit replika airsoft hanya sah digunakan untuk kegiatan **olahraga menembak target/reaksi, simulasi taktis (skirmish/milsim), dan koleksi resmi** di lokasi latihan atau arena pertandingan yang diakui.
- **Naungan Organisasi & Klub Resmi:** Pemilik unit airsoft dianjurkan dan pada koridor hukum diwajibkan terdaftar aktif dengan **Kartu Tanda Anggota (KTA)** pada klub olahraga di bawah naungan induk organisasi/federasi resmi di Indonesia, antara lain **PERBAKIN** (Persatuan Menembak Indonesia), **PORGASI** (Persatuan Olahraga Airsoft Seluruh Indonesia di bawah KORMI), **ABU** (Airsoft Brotherhood Unity), **INNASSOC**, atau **FAI**, serta mengikuti prosedur pendataan/registrasi unit melalui jalur klub ke Kepolisian (Intelkam Polda setempat).
- **Batasan Usia Pembelian (Kebijakan 18+):** Meskipun regulasi keanggotaan atlet menembak Polri membuka rentang usia 15 hingga 65 tahun dengan syarat/pendampingan khusus, sebagai standar etika e-commerce yang bertanggung jawab, **Brakasa Tactical menerapkan batas usia transaksi minimal 18 tahun (18+)** untuk setiap pembelian unit replika airsoft, disertai persetujuan deklarasi tanggung jawab pembeli saat checkout.
- **Penandaan Fisik (Orange Tip & Nomor Seri):** Mengacu pada ketentuan Perpol No. 5 Tahun 2018, unit replika airsoft yang beredar wajib memiliki penandaan **orange tip** pada ujung laras (minimal **2 cm** untuk laras panjang dan minimal **1 cm** untuk pistol/laras pendek) serta nomor seri/registrasi.
- **Batas Daya Lontar & Amunisi:** Menggunakan proyektil **BB plastik kaliber 6 mm** dengan batas energi maksimal **2 Joule** (membedakan secara tegas airsoft gun olahraga dari airgun gotri logam bertekanan tinggi yang berbahaya).

### 3.3 Etika Pengangkutan, Penyimpanan & Keselamatan Lapangan

- **Transportasi Wajib Tertutup:** Dilarang membawa atau memamerkan unit di ruang publik/jalan raya. Saat menuju lapangan skirmish, magazine harus dilepas, chamber dikosongkan, baterai dicabut, dan unit disimpan di dalam **gun bag / hard case terkunci** di bagasi kendaraan.
- **Penyimpanan Aman:** Disimpan dalam kondisi tidak terisi BB/gas/baterai di lokasi aman jauh dari jangkauan anak-anak atau pihak tidak berwenang.
- **Keselamatan Arena:** Wajib menggunakan pelindung mata penuh (*full-seal goggles*) bersertifikasi minimal **ANSI Z87.1+** dan mematuhi batas FPS/Joule serta jarak tembak minimum (MED) masing-masing pengelola lapangan CQB/Outdoor.
- **Logistik Pengiriman Indonesia:** Karena pengiriman udara (kargo pesawat) melarang atau membatasi ketat baterai **LiPo**, tabung **Green Gas bertekanan**, dan replika berbentuk senjata, checkout Brakasa Tactical wajib mengarahkan pengiriman kategori tersebut menggunakan **ekspedisi kargo darat/laut resmi** dengan estimasi waktu transparan.

### 3.4 Implementasi Kepatuhan pada UX Website Brakasa Tactical

- **Footer & Legal Hub:** Ringkasan regulasi Perpol No. 5 Tahun 2018, etika keselamatan, dan pernyataan bahwa Brakasa Tactical hanya menjual replika olahraga airsoft 6mm (bukan senjata api nyata dan bukan airgun gotri logam).
- **Badge & Kotak Kepatuhan di PDP Replika:** Menampilkan keterangan `18+ Only`, `6mm Plastic BB <= 2.0 Joule`, `Orange Tip Included`, serta `Pengiriman Kargo Darat/Laut`.
- **Checkbox Verifikasi Checkout:** Pembeli wajib mencentang verifikasi usia 18+ dan deklarasi penggunaan semata untuk olahraga/koleksi klub resmi (opsional kolom input Nomor KTA Klub PERBAKIN/PORGASI/ABU untuk pencatatan order).

---

## 4. Rekomendasi Kurasi Katalog Awal Brakasa Tactical (20 Produk)

Kurasi awal berjumlah **20 produk atomik** yang mencakup seluruh 9 kategori inti. Seluruh model merupakan produk nyata yang dikenal luas di komunitas airsoft Indonesia, dengan kisaran harga Rupiah (IDR) realistis berdasarkan pasar toko hobi/taktis Indonesia, serta dirancang saling terhubung secara teknis untuk fitur **Loadout Builder**.

### 4.1 Tabel Induk 20 Produk Katalog Awal

| No | SKU | Kategori | Nama Produk | Rekomendasi Harga (IDR) | Rentang Pasar RI (IDR) | Spesifikasi Teknis Kunci |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `BRK-AR-001` | Assault Rifle (GBBR) | **Tokyo Marui MK18 Mod.1 MWS GBBR** | Rp16.500.000 | Rp13.500.000 - Rp18.500.000 | GBBR ZET System; 300-325 FPS (0.20g / ~0.9 J); 35 rds; Cerakote Aluminum + DD RIS II Picatinny; 14mm CCW; ~2.96 kg |
| 2 | `BRK-AR-002` | Assault Rifle (AEG) | **VFC Avalon Saber Carbine M-LOK AEG** | Rp7.850.000 | Rp6.500.000 - Rp8.500.000 | AEG Gearbox V2 ECS (MOSFET/ETU, Quick-Spring); 370-390 FPS (~1.35 J); Full Metal + CNC M-LOK; Deans T-Plug; 14mm CCW; ~2.85 kg |
| 3 | `BRK-AR-003` | Assault Rifle (AEG) | **CYMA CM.040C AK-74M Stamped Steel AEG** | Rp4.950.000 | Rp4.200.000 - Rp5.800.000 | AEG Gearbox V3 Metal; 400-415 FPS (~1.55 J); Stamped Steel Receiver + Nylon Polymer Furniture; 6.03mm Inner Barrel; Mini Tamiya; 14mm CCW; ~3.2 kg |
| 4 | `BRK-SMG-001` | SMG / PDW | **G&G ARP9 2.0 CQB PDW AEG** | Rp7.200.000 | Rp6.500.000 - Rp8.500.000 | AEG Gearbox V2 + Built-in ETU & MOSFET; 330-350 FPS (~1.1 J CQB); Nylon Fiber Polymer + CNC Aluminum M-LOK; Deans/11.1V Ready; 14mm CCW; 1.96 kg |
| 5 | `BRK-SNP-001` | Sniper Rifle | **Silverback TAC-41 P Bolt-Action Sniper** | Rp12.400.000 | Rp11.500.000 - Rp13.500.000 | Spring Bolt-Action; ~410-445 FPS (1.6 - 1.9 J stock, <2.0 J compliant); CNC TDC Hop-Up 50-click; 510mm 6.05mm AEG Barrel; Fiberglass Nylon + CNC 6000-series; M24x1 CW; 2.8 kg |
| 6 | `BRK-PST-001` | Sidearm Pistol | **Umarex / VFC Glock 17 Gen5 GBB** | Rp3.650.000 | Rp3.200.000 - Rp4.500.000 | GBB Green Gas; 300-330 FPS (~0.95 J); CNC Aluminum Slide + Polymer Frame (Licensed); Guide-Hop Quick Adjust; 22 rds; 655 g |
| 7 | `BRK-OPT-001` | Optics & Aiming | **Vector Optics Maverick Gen III 1x22 Red Dot** | Rp1.850.000 | Rp1.500.000 - Rp2.400.000 | 3 MOA Red Dot (11 Brightness); 1 MOA/click; Rubber-Armored 6061-T6 Aluminum; QD Picatinny Riser + Low Mount; IPX4; 185 g |
| 8 | `BRK-OPT-002` | Optics & Aiming | **Vector Optics Forester 1-5x24 SFP LPVO Scope** | Rp3.150.000 | Rp2.600.000 - Rp3.800.000 | 1-5x24 SFP Etched Reticle + Illuminated Center Dot; 1/2 MOA/click; 30mm Monotube 6061-T6 Aluminum; Include 30mm Picatinny Rings; 425 g |
| 9 | `BRK-OPT-003` | Optics & Aiming | **WADSN AN/PEQ-15 Tactical Laser & Illuminator** | Rp1.250.000 | Rp950.000 - Rp1.800.000 | Red/Green Visible Laser + White LED Tactical Light; Nylon Polymer Housing; MIL-STD-1913 Picatinny Mount; Include Remote Pressure Switch; CR123A |
| 10 | `BRK-RIG-001` | Plate Carrier & Rig | **Pew Tactical FCPC V5 Plate Carrier (Cordura 500D)** | Rp2.450.000 | Rp1.800.000 - Rp3.500.000 | Genuine Cordura 500D + Laser-Cut Laminate; Tegris-style Rigid Cummerbund; Quick-Release Buckles; SwiftClip/G-Hook Front Placard Ready; Fit SAPI M Plates; ~1.15 kg |
| 11 | `BRK-RIG-002` | Plate Carrier & Rig | **EmersonGear Micro Fight Mk4 Modular Chest Rig** | Rp1.350.000 | Rp1.100.000 - Rp1.850.000 | Cordura 500D; Modular Chassis + Triple 5.56 Mag Insert + Half Flap + H-Harness; Kompatibel sebagai Placard di Plate Carrier (SwiftClip/Velcro); 620 g |
| 12 | `BRK-HLM-001` | Helmet & Comms | **FMA FAST Maritime High-Cut Bump Helmet** | Rp1.150.000 | Rp850.000 - Rp1.500.000 | Reinforced ABS Polymer Shell; Side ARC Accessory Rails; Aluminum NVG Shroud; Occ-Dial Retention System; Velcro Loop Panels; 680 g (Non-Ballistic Sport Use) |
| 13 | `BRK-HLM-002` | Helmet & Comms | **Earmor M32 Plus Active Tactical Headset** | Rp1.750.000 | Rp1.350.000 - Rp2.200.000 | Active Electronic Hearing Protection (NRR 22 dB); Suppress Impulse >82 dB; Detachable Boom Mic; NATO Military Plug (PTT Ready); Kompatibel ARC Rail Adapter; 370 g |
| 14 | `BRK-APP-001` | Apparel, Gloves, Boots | **EmersonGear G3 Combat Shirt & Pants Set** | Rp2.150.000 | Rp1.500.000 - Rp2.800.000 | 50/50 NyCo Ripstop + Breathable Torso Knit; Integrated Removable Knee Pads; YKK Zippers; Warna Ranger Green / Multicam; Multi-Pocket Tactical Cut |
| 15 | `BRK-APP-002` | Apparel, Gloves, Boots | **Mechanix Wear M-Pact Tactical Gloves** | Rp680.000 | Rp500.000 - Rp850.000 | Thermoplastic Rubber (TPR) Knuckle Impact Guard; Armortex Palm Reinforcement; D3O Padding; TrekDry Breathable; Touchscreen Capable |
| 16 | `BRK-APP-003` | Apparel, Gloves, Boots | **Salomon Forces XA Mid GTX Tactical Boots** | Rp4.950.000 | Rp4.300.000 - Rp6.200.000 | GORE-TEX Waterproof Membrane; Non-Reflective Anti-Debris Mesh & Nubuck; Contagrip All-Terrain Outsole; 3D Advanced Chassis; Protective Toe Cap; ~540 g/sepatu |
| 17 | `BRK-CSM-001` | BB, Gas, LiPo, Upgrades | **BLS Precision 6mm BB 0.28g (1 kg / ~3.570 rds)** | Rp185.000 | Rp175.000 - Rp195.000 | Kaliber 5.95 mm +/- 0.01 mm Polished Precision; Berat 0.28g (ideal untuk AEG Outdoor, GBBR, dan DMR); 1 kg Resealable Bag |
| 18 | `BRK-CSM-002` | BB, Gas, LiPo, Upgrades | **Puff Dino 12kg Green Gas (600ml)** | Rp165.000 | Rp145.000 - Rp190.000 | Tekanan 12 kg/cm2 dengan Silicone Oil Formula; Volume 600ml; Nozzle Logam; Cocok untuk TM MK18 MWS & VFC Glock 17 Gen5; Pengiriman Kargo Darat/Laut |
| 19 | `BRK-CSM-003` | BB, Gas, LiPo, Upgrades | **LiPo 11.1V 1200mAh 25C 3S Stick Battery (Deans)** | Rp245.000 | Rp175.000 - Rp320.000 | 3S 11.1V 1200mAh Continuous 25C; Konektor Deans T-Plug + JST-XH Balance Lead; Profil Stick muat di Buffer Tube VFC Avalon & G&G ARP9 2.0 (MOSFET/ETU Ready) |
| 20 | `BRK-UPG-001` | BB, Gas, LiPo, Upgrades | **Acetech Brighter C Compact Tracer Unit** | Rp1.050.000 | Rp850.000 - Rp1.300.000 | CNC Aluminum Body; Ulir 14mm CCW (include 11mm CW Pistol Adapter); Smart Shake-to-Wake; USB-C Rechargeable; Support Green Tracer BB hingga 35 RPS; 32 g |

### 4.2 Matriks Kompatibilitas Antar-SKU (Dasar Logika Loadout Builder)

Kurasi 20 produk di atas membentuk ekosistem **Loadout Builder** yang saling tervalidasi secara teknis:
- **Daya & Propulsi:** `BRK-CSM-003` (LiPo 11.1V Deans) kompatibel langsung dengan `BRK-AR-002` (VFC Avalon Saber) dan `BRK-SMG-001` (G&G ARP9 2.0) yang sudah memiliki MOSFET/ETU dan konektor Deans. Sebaliknya, `BRK-AR-003` (CYMA CM.040C non-MOSFET Mini Tamiya) memicu peringatan kompatibilitas konektor/tegangan bila dipasangkan dengan LiPo 11.1V Deans. `BRK-CSM-002` (Puff Dino Green Gas) kompatibel langsung dengan `BRK-AR-001` (TM MK18 MWS) dan `BRK-PST-001` (Glock 17 Gen5).
- **Rail & Muzzle:** `BRK-OPT-001` (Maverick Red Dot), `BRK-OPT-002` (Forester LPVO), dan `BRK-OPT-003` (PEQ-15) menggunakan standar `MIL-STD-1913 Picatinny`. `BRK-UPG-001` (Acetech Brighter C) kompatibel ke semua unit berulir `14mm CCW` (`BRK-AR-001`, `BRK-AR-002`, `BRK-AR-003`, `BRK-SMG-001`), tetapi tidak kompatibel langsung dengan `M24x1 CW` milik `BRK-SNP-001` tanpa adapter.
- **Tactical Gear Modular:** `BRK-RIG-002` (Micro Fight Mk4) dapat dipasang sebagai front placard ke `BRK-RIG-001` (FCPC V5). `BRK-HLM-002` (Earmor M32 Plus) dapat diintegrasikan ke side ARC rail `BRK-HLM-001` (FAST Maritime Helmet).

---

## 5. Konsep Sinematik Hero Video (Durasi 25 Detik, <= 30 Detik)

Hero Video Brakasa Tactical harus terasa seperti film komersial perlengkapan taktis kelas dunia ala **Agilite**, **Ferro Concepts**, dan **Crye Precision**: kering, disiplin, bertekstur logam dan kain Cordura, penuh energi mekanis, serta jauh dari estetika sci-fi neon atau transisi lamban generik.

### 5.1 Arahan Sinematografi, Pencahayaan & Teknis Web

- **Total Durasi:** **25,0 detik** (memenuhi batas maksimal `<= 30 detik`), disusun dari **10 scene taktis cepat** dengan durasi tiap scene **2,0 hingga 3,0 detik** (masuk rentang 1-5 detik per scene).
- **Kamera & Shutter:** Rasa visual 24fps dengan **shutter angle 90 derajat** (motion blur minimal agar gerakan *reload*, tarik *charging handle*, dan klik buckle terlihat sangat tajam, agresif, dan mekanis).
- **Lensa:** Kombinasi lensa prime sinema tajam (`24mm` untuk ruang killhouse/hanggar luas, `35mm` untuk aksi hero & over-the-shoulder, `50mm` untuk medium portrait/manipulasi unit, dan `85mm macro/tele` untuk detail hardware & overwatch sniper).
- **Pencahayaan & Color Grading:**
  - *Low-key industrial contrast*: lampu kunci keras ber-grid dari atas/samping, *cool steel rim light* memisahkan siluet gear gelap (Matte Black / Ranger Green) dari bayangan beton, serta *warm amber practical light* dan kabut/haze tipis untuk dimensi kedalaman.
  - Palet grading: Shadow charcoal gunmetal (`#0F1113`), midtone earth-olive & coyote yang natural, highlight amber hangat. Hindari saturasi berlebih dan hindari warna ungu/cyan neon.
- **Audio & Foley (Opsional Unmute):** Default web **autoplay muted loop** sesuai kebijakan browser modern, disertai tombol kontrol `Unmute / Pause` yang minimalis. Saat audio aktif, ritme potongan gambar sinkron dengan *transient* suara industri nyata: deru sub-bass tenang, bunyi klik buckle polimer, gesekan Velcro, hantaman magazine logam, dan hentakan bolt release.
- **Komposisi Safe Area UI Hero:** Bagian kiri-bawah hingga kiri-tengah bingkai dijaga memiliki ruang negatif gelap/kontras stabil agar tipografi Headline utama, deskripsi singkat, dan tombol CTA Brakasa Tactical tetap terbaca jelas tanpa kotak overlay buram yang merusak sinematografi.

### 5.2 Shot List 10 Scene Spesifik (Total 25,0 Detik)

| Scene | Timecode | Durasi | Judul Scene | Framing & Lensa | Gerakan Kamera | Aksi Taktis di Layar | Pencahayaan & Suasana |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `00:00.0 - 00:02.5` | 2,5 dtk | **Armory Bench Prep** | Top-down flat-lay ketat (`35mm T2.0`) | Slow deliberate push-in (dolly in halus) | Meja baja gelap berisi MK18 MWS, FCPC V5 Cordura, magazine, dan kacamata pelindung; tangan bersarung Mechanix M-Pact meraih receiver senapan | Overhead softbox ber-grid membentuk kolam cahaya terpusat; sudut bingkai gelap pekat (vignette alami) |
| **02** | `00:02.5 - 00:04.5` | 2,0 dtk | **Cordura & Buckle Lock** | Extreme Close-Up / Macro (`85mm Macro`) | Quick micro push-in dengan stop mendadak (whip settle) | Tangan mengunci quick-release buckle dan menekan panel Velcro placard Micro Fight Mk4 ke jaring laser-cut Cordura 500D pada dada plate carrier | Hard side key light menonjolkan tekstur anyaman nilon 500D, jahitan bartack, dan kilau matte polimer |
| **03** | `00:04.5 - 00:06.5` | 2,0 dtk | **Mag Seating & Bolt Rack** | Tight Close-Up sisi receiver (`50mm T1.5`) | Handheld mikro-stabil dengan hentakan tipis saat klik | Magazine dimasukkan tegas ke lower receiver MK18, ibu jari menekan bolt release hingga bolt menutup tajam dengan getaran mekanis | Rim light dingin menyusuri bevel rel Picatinny dan finishing Cerakote abu-abu gelap |
| **04** | `00:06.5 - 00:09.0` | 2,5 dtk | **Helmet & Comms Check** | Medium Close-Up sisi 3/4 kanan (`50mm T2.0`) | Smooth arc orbit ke kanan (15 derajat) | Operator merapatkan helm FAST Maritime, menurunkan headset Earmor M32 ke telinga, dan merapikan full-seal eye protection | Backlight industri menembus haze tipis, menghasilkan garis tepi terang pada siluet helm dan bahu |
| **05** | `00:09.0 - 00:11.5` | 2,5 dtk | **Optic & Illuminator Zero** | Macro POV dari belakang optik (`85mm T1.8`) | Rack focus cepat (fokus pindah dari mata operator ke titik merah 3 MOA) | Titik merah Maverick Red Dot menyala tajam di tengah lensa; tangan depan menekan pressure switch menyalakan lampu/laser PEQ-15 menembus kabut | Latar belakang gelap pekat, cahaya merah/amber mikro dan berkas senter taktis memotong partikel debu udara |
| **06** | `00:11.5 - 00:14.5` | 3,0 dtk | **Killhouse Entry Stack** | Wide low-angle (`24mm T2.0`) | Dynamic lateral tracking gimbal menyusuri dinding beton | Dua operator dalam set G3 Combat dan plate carrier bergerak rapat di ambang pintu beton killhouse, melakukan gerakan *slicing the pie* secara sinkron | Sinar lampu sodium hangat dari dalam ruangan berpadu cahaya biru-baja redup dari koridor luar |
| **07** | `00:14.5 - 00:17.0` | 2,5 dtk | **CQB Pivot & Tracer Pulse** | Tight Over-the-Shoulder (`35mm T1.8`) | Handheld taktis energik (shutter 90 derajat super tajam) | Operator memutar sudut barikade kayu/beton dengan G&G ARP9 2.0 + Acetech Brighter C; kilatan singkat 2-3 butir tracer BB melesat menembus ruangan remang | High-contrast chiaroscuro; kilat pulse singkat dari ujung tracer menerangi kabut dan handguard M-LOK |
| **08** | `00:17.0 - 00:19.5` | 2,5 dtk | **Secondary Transition** | Medium-Tight (`50mm T2.0`) | Fast tilt-down mengikuti drop sling lalu snap pan naik | Rifle utama diturunkan rapi pada sling; tangan kanan menarik Glock 17 Gen5 dari holster ke posisi bidik dua tangan presisi | Pencahayaan kontras tinggi menyorot kilau CNC slide logam pistol dan garis sarung tangan taktis |
| **09** | `00:19.5 - 00:22.0` | 2,5 dtk | **Overwatch Bolt Cycle** | Medium-Telephoto compression (`85mm T2.0`) | Slow horizontal parallax slider di balik pilar baja | Marksman di catwalk atas menstabilkan Silverback TAC-41 P dengan Forester LPVO, menarik dan mengunci bolt secara halus dan tenang | Cahaya sore/hanggar menyamping (golden-amber industrial rim), latar depan pilar baja out-of-focus sebagai framing |
| **10** | `00:22.0 - 00:25.0` | 3,0 dtk | **Brakasa Hero Silhouette** | Wide Hero Shot (`35mm Anamorphic feel`) | Slow majestic pull-back (dolly out) lalu hold 0,8 dtk untuk loop | Operator full-loadout berdiri siap di sisi kanan bingkai menghadap kamera 3/4 dengan latar hanggar berkabut; sisi kiri lapang gelap sebagai ruang tipografi Hero Website | Backlight dramatis membentuk siluet tegas dengan haze lembut, fade cepat ke shadow hitam agar loop mulus kembali ke Scene 01 |

### 5.3 Catatan Integrasi ke Pipeline Video & Storefront

- **Sinkronisasi dengan Generative Keyframe Pipeline:** Ke-10 scene di atas didesain memiliki komposisi subjek tunggal/ganda yang jelas dan arah gerak kamera terdefinisi (*push-in*, *lateral pan*, *orbit/parallax*, *handheld micro-shake*, *rack focus blur*, *tracer flash pulse*) sehingga dapat diproduksi secara langsung baik melalui pengambilan gambar live-action maupun melalui pipeline rendering 10 keyframe gambar resolusi tinggi menjadi `hero-tactical-reel.mp4` berdurasi 24-25 detik.
- **Poster Frame & Fallback:** Gunakan frame paling kuat dari Scene 10 (atau Scene 01) sebagai atribut `poster` HTML5 `<video>` terkompresi (WebP/JPEG) sehingga *First Contentful Paint* langsung menampilkan visual sinematik bahkan sebelum berkas `.mp4` selesai diunduh.
