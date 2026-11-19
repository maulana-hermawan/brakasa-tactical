# Brakasa Tactical

Platform e-commerce dan katalog perlengkapan airsoft serta gear taktis lapangan berbasis React, Express, dan SQLite bawaan Node.js.

## Ringkasan Fitur

- **Storefront & Katalog (`/`, `/store`):** Landing page 4 seksi (Hero slider layar penuh, carousel produk unggulan, grid 9 kategori, informasi showroom + Google Maps) serta katalog dengan pencarian dan filter kategori, profil misi, platform, propulsi, rentang FPS, rentang harga, ketersediaan stok, dan video demo.
- **Product Detail Page (`/store/:slug`):** Galeri foto resolusi tinggi dengan lightbox zoom, pemutar video demo `.mp4`, tombol navigasi Kembali cerdas (`history.back` dengan fallback aman ke `/store`), lembar spesifikasi teknis `tabular-nums`, dan daftar produk terkait.
- **Cart Drawer & Guest Checkout (`/checkout`):** Sinkronisasi stok secara real-time, validasi stok atomik saat pemesanan, pemilihan kurir berbasis kelas pengiriman dan zona wilayah, opsi packing kayu, kode voucher promo, serta tampilan invoice siap cetak.
- **Bilingual Penuh (`ID / EN`):** Dukungan antarmuka Bahasa Indonesia dan Bahasa Inggris di seluruh halaman publik maupun panel admin, termasuk deskripsi produk dan tabel spesifikasi.
- **Dual-Theme (`Armory Dark` / `Field Paper Light`):** Sistem warna gelap dan terang terverifikasi kontras WCAG AA dengan tombol pergantian tema langsung di navigasi.
- **Admin Operations Center (`/admin`):** Dashboard ringkasan operasional, manajemen produk dan unggah media (foto/video), mutasi inventori stok, pemrosesan pesanan dan input nomor resi, manajemen voucher, serta pengaturan Hero slider, profil showroom, dan ekspedisi.

## Prasyarat di PC Lain

- **Node.js v24 atau lebih baru** (wajib v24+ karena server menggunakan modul bawaan `node:sqlite`, sehingga tidak memerlukan compiler C++, `node-gyp`, maupun instalasi database eksternal).
- **npm** (terpasang otomatis bersama Node.js).

Periksa versi Node.js di terminal sebelum memulai:

```bash
node -v
```

## Cara Menjalankan di PC Lain

1. Clone repositori dan masuk ke direktori proyek:

```bash
git clone <repo-url>
cd brakasa-tactical
```

*(Sesuaikan `brakasa-tactical` dengan nama folder hasil clone jika berbeda.)*

2. Instal seluruh dependensi:

```bash
npm install
```

3. **Mode Produksi (1 port di `http://localhost:3000`, direkomendasikan):**

```bash
npm run build
npm start
```

Buka `http://localhost:3000` di browser. Database lokal (`storage/brakasa.db`) beserta katalog awal, akun admin, dan voucher uji akan dibuat otomatis pada startup pertama.

4. **Mode Pengembangan (Hot Reload):**

```bash
npm run dev
```

- Frontend Vite: `http://localhost:5173`
- Backend API Express: `http://localhost:3001` (diproxy otomatis oleh Vite untuk `/api`, `/media`, dan `/uploads`)

## Perintah npm Lainnya

- `npm run typecheck` : Menjalankan pengecekan tipe TypeScript (`tsc --noEmit`).
- `npm run build` : Membangun bundle client produksi (`dist/client`) dan server (`dist/server/index.mjs`).
- `npm start` : Menjalankan server produksi (port default `3000`, dapat diubah dengan env `PORT`).
- `npm run dev` : Menjalankan server API dan Vite dev server secara paralel.

## Akses Admin Default & Kode Voucher Uji

### Login Admin Panel

- **URL:** `http://localhost:3000/admin/login` (atau `http://localhost:5173/admin/login` pada mode pengembangan)
- **Username:** `admin`
- **Password:** `BrakasaArmory#2026`

*(Kredensial awal dapat dikustomisasi melalui environment variable `BRAKASA_ADMIN_USER`, `BRAKASA_ADMIN_EMAIL`, dan `BRAKASA_ADMIN_PASS` sebelum inisialisasi database pertama kali.)*

### Kode Voucher Uji

| Kode | Manfaat | Ketentuan |
| :--- | :--- | :--- |
| `BRAKASA10` | Diskon 10% hingga Rp500.000 | Minimum subtotal Rp2.000.000 |
| `CQBREADY` | Potongan langsung Rp250.000 | Minimum subtotal Rp3.500.000 |
| `KARGOFREE` | Subsidi ongkir kargo hingga Rp150.000 | Minimum subtotal Rp5.000.000 (ekspedisi berbayar) |

## Struktur Ringkas Proyek

- `src/` : Aplikasi frontend React 19, TypeScript, Tailwind CSS v4, dan kamus `i18n` (`ID/EN`).
- `server/` : Server Express 5, skema & seeder SQLite (`node:sqlite`), API publik, dan API admin.
- `shared/` : Definisi tipe TypeScript dan konstanta bersama client-server.
- `public/media/` : Aset foto dan video demo produk.
- `storage/` : Penyimpanan database SQLite lokal dan unggahan admin (dikecualikan dari Git).
