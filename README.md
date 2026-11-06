# Mantri Gemoy — Sistem Manajemen Apotek

Repositori ini disiapkan untuk proyek Mantri Gemoy.

## Paket starter
File `mantri-gemoy-starter.zip` berisi source code React + TypeScript + Vite, skema awal Supabase, dan template Excel stok awal.

Ekstrak arsip tersebut ke komputer, lalu unggah isi folder `mantri-gemoy/` ke root repositori ini agar GitHub Pages atau layanan hosting dapat membangun aplikasi dari `package.json`.

## Menjalankan lokal
1. `npm install`
2. Salin `.env.example` menjadi `.env.local`
3. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` dari project Supabase khusus Mantri Gemoy.
4. `npm run build`

**Penting:** jangan commit `.env.local` atau Supabase `service_role`/secret key. Tahap starter belum mencakup POS/transaksi penjualan dan belum siap digunakan untuk operasional apotek tanpa pengujian serta validasi apoteker.