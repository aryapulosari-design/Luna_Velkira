# Luma Support

Aplikasi layanan pelanggan satu toko menggunakan Next.js, React, TypeScript, dan Supabase. Workspace mencatat pelanggan, tiket, penanggung jawab, catatan tindak lanjut, FAQ, dan riwayat.

**Dokumentasi lengkap dimulai dari [doct/README.md](doct/README.md).** Folder `doct` menjadi tempat utama dokumentasi proyek.

## Jalankan demo

Gunakan Node.js 24 LTS dan npm. Dari folder proyek:

```powershell
npm ci
npm run dev
```

Jika dependensi sudah terpasang, cukup jalankan `npm run dev`.

Buka [demo lokal](http://127.0.0.1:3000/demo). Demo menyediakan 12 tiket, 8 pelanggan fiktif, 3 anggota tim, dan 5 FAQ contoh. Perubahan hilang saat refresh dan tidak menyentuh Supabase.

## Pilih panduan

| Kebutuhan | Dokumen |
| --- | --- |
| Menyiapkan proyek dan Supabase | [Setup](doct/01-setup.md) |
| Memahami struktur kode | [Arsitektur](doct/02-arsitektur.md) |
| Menggunakan aplikasi | [Panduan pengguna](doct/03-panduan-pengguna.md) |
| Mengembangkan API | [Kontrak API](doct/04-api.md) |
| Memahami tabel dan transaksi | [Database](doct/05-database.md) |
| Menyiapkan presentasi | [Demo](doct/06-demo.md) |
| Menjalankan pemeriksaan | [Pengujian](doct/07-pengujian.md) |
| Deploy dan pemeliharaan | [Operasional](doct/08-operasional.md) |
| Menangani kendala | [Troubleshooting](doct/09-troubleshooting.md) |
| Memeriksa kesiapan rilis | [Status dan pekerjaan lanjutan](doct/10-status-dan-lanjutan.md) |

## Status

Build produksi, typecheck, dan 11 pengujian otomatis terakhir lulus pada pengerjaan awal 28 Oktober 2026. Halaman demo dan workspace merespons HTTP 200. Pengujian Supabase nyata, email, konkurensi database, browser desktop/mobile, deployment, dan backup/restore belum dibuktikan. Aplikasi belum dinyatakan siap produksi.

## Sumber kebutuhan

PRD asli berada di [Luma Support PRD dan Blueprint Operasional.docx](Luma%20Support%20PRD%20dan%20Blueprint%20Operasional.docx). [prd.txt](prd.txt) adalah ekstraksi teks bantu, bukan spesifikasi implementasi terkini. Gunakan kode dan dokumentasi di `doct` untuk melihat perilaku yang tersedia sekarang.
