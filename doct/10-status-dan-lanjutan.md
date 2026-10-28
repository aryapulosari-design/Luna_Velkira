# Status dan pekerjaan lanjutan

Snapshot **28 Oktober 2026**. Kode tersedia tidak otomatis berarti fitur telah diverifikasi pada layanan nyata.

## Hasil saat ini

| Bagian | Status |
| --- | --- |
| Workspace, tiket, pelanggan, FAQ, tim, dan form | Kode tersedia |
| API Auth, session, validasi, dan pemeriksaan akses | Kode tersedia; integrasi nyata belum diuji |
| Migrasi sembilan tabel, RLS, transaksi, dan audit | Kode tersedia; belum dijalankan di Supabase nyata |
| Demo terisolasi dan fixture fiktif | Tersedia dan alur adapter diuji |
| Tes Node | 11 lulus |
| Typecheck dan build produksi | Lulus pada pemeriksaan terakhir |
| HTTP workspace/login/demo | Pernah merespons 200 secara lokal |
| Browser desktop/mobile | Belum diselesaikan; alat tidak dapat memastikan URL Chrome |
| Hosting, SMTP, load test, backup/restore | Belum diverifikasi |

## Prioritas berikutnya

1. Kunci toko awal, pemilik layanan, kebijakan, retensi, target respons, domain, dan anggaran.
2. Siapkan staging, migrasi, admin, SMTP, serta template email.
3. Uji database, dua koneksi bersamaan, akses ilegal langsung ke RPC, dan persistensi lintas perangkat.
4. Uji browser, keyboard, konflik/draft, pagination, dan dataset besar.
5. Perbaiki temuan kritis, lakukan UAT, lalu siapkan produksi, monitoring, backup/restore, dan rollback.
6. Catat hasil beserta tanggal, lingkungan, revisi, dan keputusan pemilik.

## Batas dan perbedaan dari PRD

| Area | Implementasi sekarang |
| --- | --- |
| Navigasi | Satu workspace; belum route per fitur |
| Styling | CSS global, belum CSS Modules |
| Pembuatan FAQ | Respons 200, bukan 201 pada rancangan awal |
| Konflik version | Error 409 tanpa field current_version |
| Editor FAQ | Belum optimistic version untuk dua admin |
| Logout | Menghapus cookie aplikasi; belum revokasi session provider |
| Undangan | Belum request ID idempotensi atau audit undangan khusus |
| Email Auth | Memerlukan token_hash/type; belum callback PKCE/code atau fragment |
| Rate limit | Pada API v1; RPC langsung perlu review tersendiri |
| KPI | Antrean, selesai, milik saya, median respons; KPI kelengkapan/kepemilikan lengkap belum dibuat |
| Fitur lanjutan | Belum lampiran, ekspor, edit pelanggan, anonimisasi, atau scheduler retensi |
| Kanal | Manual; belum WhatsApp, marketplace, atau ekspedisi otomatis |

## Riwayat perubahan

| Tanggal | Perubahan |
| --- | --- |
| 2026-10-28 | Implementasi awal workspace, API, dan migrasi dari PRD |
| 2026-10-28 | Demo, fixture fiktif, dan tes demo; total 11 tes |
| 2026-10-28 | Dokumentasi lengkap dipusatkan di doct |

Tambahkan catatan setelah perubahan yang memengaruhi setup, penggunaan, atau pemeliharaan. Proyek belum dinyatakan siap produksi sampai pemeriksaan layanan nyata selesai.
