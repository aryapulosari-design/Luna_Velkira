# Deployment dan operasional

Prosedur berikut belum menjadi bukti deployment. Hosting, domain, SMTP, monitoring, dan backup/restore proyek belum diverifikasi.

## Persiapan

1. Siapkan hosting Node, Supabase staging/produksi terpisah, domain HTTPS, dan SMTP milik pemilik toko.
2. Sepakati FAQ, retensi, eskalasi/refund, target respons, serta penanggung jawab layanan.
3. Luluskan pemeriksaan pada [pengujian](07-pengujian.md) dan selesaikan temuan kritis.
4. Isi environment hosting, APP_URL, Site URL, redirect allowlist, serta template email.
5. Terapkan migrasi teruji, bootstrap admin, dan smoke test memakai akun admin/petugas.

## Menjalankan produksi

```powershell
npm ci
npm test
npm run typecheck
npm run build
npm start
```

Script start mengikat `127.0.0.1`. Pada server sendiri, letakkan reverse proxy HTTPS di depannya. Jika hosting membutuhkan binding lain, sesuaikan start command pada konfigurasi hosting. Static export saja tidak dapat menjalankan Auth dan API.

Isi environment sebelum build dan rebuild setelah konfigurasi publik berubah. Pastikan proxy/CDN tidak menyimpan cache bersama untuk respons privat. Rujukan runtime: [self-hosting Next.js](https://nextjs.org/docs/app/guides/self-hosting).

## Smoke test setelah deploy

- Demo menampilkan fixture dan label yang benar; API nyata tidak membocorkan data anonim.
- Login, undangan, pengaturan password, recovery, dan login ulang berhasil.
- Tiket tetap ada setelah refresh dan dapat dibaca akun berhak pada perangkat lain.
- Petugas tidak dapat mengelola tim, membaca FAQ draft, atau mengubah tiket orang lain.
- Claim, notes, status, dan audit konsisten; origin asing ditolak dan cookie Secure di HTTPS.

## Pemantauan

Belum ada integrasi monitoring atau endpoint health khusus. Pengelola perlu mengatur uptime, error API, kegagalan Auth/email, latensi, koneksi, dan kapasitas database. Log cukup berisi kode error dan ID penelusuran; hindari kontak, isi keluhan, password, token, dan secret.

Rate limit Route Handler tidak otomatis berlaku pada panggilan RPC langsung. Lengkapi pembatasan request di infrastruktur dan uji jalur Supabase tersebut sebelum produksi.

## Backup dan pemulihan

Verifikasi layanan backup, jadwal, retensi, lokasi, serta pemilik akses. Uji restore ke lingkungan terpisah dan periksa hubungan Auth/profiles, customers, tickets, notes, events, serta ledger request. Restore tabel pelanggan saja tidak memulihkan workspace lengkap.

RPO 24 jam dan RTO 8 jam dari PRD masih target rancangan. Catat waktu backup terakhir dan durasi restore aktual sebelum menjanjikan layanan.

## Rollback dan perawatan

Rollback aplikasi dilakukan dengan deploy ulang revisi teruji. Jangan menghapus transaksi pelanggan atau menjalankan DROP/TRUNCATE sebagai rollback aplikasi. Tidak ada rollback schema otomatis; siapkan migrasi kompatibel dan prosedur pemulihan per perubahan.

Tinjau akun aktif, owner tiket, FAQ, dependensi, log, kapasitas, dan backup secara berkala. Nonaktifkan akun lewat Tim dan pindahkan tiketnya secara terpisah. Retensi, anonimisasi, dan pembersihan ledger belum mempunyai scheduler.
