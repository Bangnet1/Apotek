# Mantri Gemoy — Pharmacy Management System

Starter Tahap 1 untuk apotek fisik satu cabang di Karawang.

## Stack
- React + TypeScript + Vite
- Tailwind CSS
- Supabase Auth + PostgreSQL + RLS
- XLSX untuk impor stok awal
- Lucide React + Recharts

## Jalankan lokal
1. Install Node.js LTS.
2. Salin `.env.example` menjadi `.env.local`.
3. Isi URL Supabase dan **publishable key** dari project Supabase Anda.
4. Jalankan:
   ```bash
   npm install
   npm run dev
   ```
5. Buka URL lokal yang ditampilkan Vite.

## Setup Supabase
1. Buat project Supabase baru atau pilih project khusus Mantri Gemoy.
2. Buka SQL Editor, jalankan `supabase/migrations/001_phase1_schema.sql`.
3. Buat user melalui Authentication > Users (email/password).
4. Tambahkan profil untuk user tersebut melalui SQL Editor:
   ```sql
   insert into public.profiles (id, full_name, role)
   values ('UUID_AUTH_USER', 'Nama Pemilik', 'owner');
   ```
   Ganti UUID dengan ID dari Authentication > Users.
5. Buat profil lain dengan role `cashier` atau `pharmacist`.
6. Jangan aktifkan sign-up publik. Buat akun staf oleh pemilik/admin.

## Role
- `owner`: akses seluruh modul Tahap 1.
- `cashier`: operasional kasir (modul POS akan hadir di tahap 2).
- `pharmacist`: verifikasi kefarmasian dan data stok yang relevan.

## Impor stok Excel
Template: `templates/template-stok-awal.xlsx`.
Kolom wajib: `sku`, `barcode`, `nama_produk`, `kategori`, `jenis_obat`, `satuan`, `harga_beli`, `harga_jual`, `stok_awal`, `nomor_batch`, `tanggal_expired` (format YYYY-MM-DD).
Impor memvalidasi baris dan menampilkan pratinjau. Untuk tahap ini impor mengirim produk, batch, dan mutasi stok per baris. Uji terlebih dahulu pada database percobaan sebelum mengimpor stok operasional.

## Keamanan penting
- Hanya gunakan publishable key pada browser. Jangan pernah memasukkan `service_role`/secret key ke `.env` frontend.
- RLS aktif pada seluruh tabel aplikasi. Profil pengguna harus dibuat oleh pemilik melalui Supabase Dashboard/SQL.
- Data resep dan pasien bersifat sensitif; akses harus dibatasi dan audit trail ditambahkan sebelum modul resep dipakai.
- Tahap 1 belum merupakan sistem kasir siap produksi dan belum menjalankan transaksi penjualan.
- Jangan menggunakan data contoh sebagai data stok nyata.
- Pengelolaan dan penyerahan obat wajib mengikuti ketentuan apotek dan keputusan apoteker penanggung jawab.

## Struktur
```text
src/
  components/      # layout, sidebar, topbar, UI
  lib/             # Supabase client
  pages/           # Dashboard, Produk, Stok, Supplier, Pengaturan
  types/           # tipe data
  App.tsx
  main.tsx
  styles.css
supabase/
  migrations/      # skema database
templates/         # template Excel
```

## Status Tahap 1
- [x] UI dashboard responsif
- [x] Login Supabase
- [x] Produk & kategori (CRUD dasar)
- [x] Supplier (CRUD dasar)
- [x] Batch, expired, dan mutasi stok
- [x] Impor Excel dengan pratinjau
- [ ] POS, transaksi atomik, dan struk — Tahap 2
- [ ] Modul resep — Tahap 3 setelah alur kerja apoteker disepakati
- [ ] WhatsApp API — Tahap 3
