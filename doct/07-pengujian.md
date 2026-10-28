# Pengujian

## Perintah lokal

```powershell
npm test
npm run typecheck
npm run build
```

Tidak ada script lint atau E2E browser pada package.json saat ini.

## Cakupan otomatis

| Berkas | Tes | Cakupan |
| --- | --- | --- |
| [domain.test.ts](../tests/domain.test.ts) | 4 | Validasi, identitas browser, version, transisi, dan query |
| [client.test.ts](../tests/client.test.ts) | 3 | Timeout, konflik tanpa overwrite, dan hasil yang belum commit |
| [demo.test.ts](../tests/demo.test.ts) | 4 | Fixture, metrik, filter/pagination, alur tiket, isolasi sesi, FAQ, dan tim |

Hasil terakhir pada 28 Oktober 2026: **11 tes, typecheck, dan build produksi lulus**. Pemeriksaan HTTP lokal workspace, login, dan demo pernah berhasil. Interaksi browser dan database nyata belum dibuktikan.

## Database staging

[tests/database.sql](../tests/database.sql) mencakup akun anonim/nonaktif, pembatasan role, claim, version, retry, notes, resolution, reopen, FAQ draft, dan admin terakhir. Skrip dibungkus transaksi yang diakhiri ROLLBACK. Sequence dapat tetap maju walau transaksi di-rollback; gunakan database terisolasi.

1. Terapkan migrasi pada staging tanpa data produksi.
2. Jalankan seluruh berkas tes melalui SQL Editor sebagai pengelola database.
3. Pastikan tidak ada assertion gagal dan transaksi mencapai ROLLBACK.
4. Jika terhenti dalam transaksi gagal, jalankan `ROLLBACK;` pada sesi yang sama.
5. Catat tanggal, lingkungan, revisi migrasi, dan hasil.

Alternatif jika `psql` tersedia dan koneksi staging sudah tersimpan aman di environment:

```powershell
psql "$env:LUMA_STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/database.sql
```

Skrip belum dijalankan terhadap Supabase nyata. Pergantian role dalam satu transaksi bukan pengujian dua koneksi bersamaan.

## Wajib sebelum rilis

- Dua akun claim/update tiket bersamaan: satu menang, pihak lain konflik, audit konsisten.
- Timeout setelah commit, klik ganda, dan retry request ID sama tidak menggandakan record.
- Login, SMTP, undangan, recovery, link kedaluwarsa, refresh token, logout, dan akun nonaktif.
- Persistensi setelah refresh, logout/login, serta perangkat lain.
- Pagination lebih dari 25 record, termasuk pencarian plus cursor dan timestamp sama.
- Akses JWT langsung ke RPC/Data API, actor palsu, role salah, dan write tabel langsung.
- Desktop/mobile, keyboard, focus dialog, draft, validasi, error/loading, dan clipboard gagal.
- Backup/restore, rollback, serta load test 10 petugas dan 10.000 tiket.

Gunakan data fiktif dan catat hasil baru pada [status proyek](10-status-dan-lanjutan.md).
