# Mantri Gemoy — Pharmacy Management System

Starter Tahap 1 untuk apotek fisik satu cabang di Karawang.

## Stack
- React + TypeScript + Vite
- Tailwind CSS
- Supabase Auth + PostgreSQL + RLS
- XLSX untuk impor stok awal
- Lucide React + Recharts

## Koneksi Supabase
Aplikasi sudah diarahkan ke project Supabase khusus Mantri Gemoy:
- Project URL: `https://bispnfwbfmcmpplyzeme.supabase.co`
- Browser key: Supabase **publishable key** (bukan service-role/secret key)
- Skema Tahap 1: `supabase/migrations/001_phase1_schema.sql`

Publishable key memang digunakan pada browser dan dilindungi oleh Supabase Auth serta RLS. Jangan pernah memasukkan `service_role` atau secret key ke aplikasi frontend.

Untuk pengembangan lokal, Anda tetap dapat menimpa konfigurasi melalui `.env.local`:
```env
VITE_SUPABASE_URL=https://bispnfwbfmcmpplyzeme.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## Jalankan lokal
1. Install Node.js LTS.
2. Jalankan `npm install`.
3. Jalankan `npm run dev`.
4. Buka URL lokal yang ditampilkan Vite.

## Setup akun pertama
Skema database Tahap 1 sudah diterapkan pada project di atas. Tabel aplikasi masih kosong.
1. Buat akun pemilik melalui Supabase Dashboard > Authentication > Users (email/password).
2. Salin UUID user tersebut.
3. Jalankan SQL berikut di SQL Editor, ganti UUID dan nama:
   ```sql
   insert into public.profiles (id, full_name, role)
   values ('UUID_AUTH_USER', 'Nama Pemilik', 'owner');
   ```
4. Buat akun staf melalui Dashboard dan tambahkan profil dengan role `cashier` atau `pharmacist`.
5. Jangan aktifkan sign-up publik. Buat akun staf oleh pemilik/admin.

Dashboard Supabase: https://supabase.com/dashboard/project/bispnfwbfmcmpplyzeme

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
