# Luna_Velkira

**Luma Support** adalah aplikasi layanan pelanggan untuk toko online, dikembangkan oleh **VELKIRA**. Aplikasi ini membantu tim mencatat permintaan dari berbagai kanal, membagi tanggung jawab, menindaklanjuti keluhan, dan menyimpan riwayat penanganan dalam satu workspace.

Repository `Luna_Velkira` berisi kode aplikasi, demo interaktif dengan data fiktif, API, migrasi Supabase, pengujian, dan dokumentasi pengembangan.

> **Status proyek:** implementasi awal dengan demo yang dapat dijalankan lokal. Integrasi Supabase nyata dan kesiapan produksi masih memerlukan pengujian lanjutan. Lihat [status proyek](doct/10-status-dan-lanjutan.md).

## Daftar isi

- [Tentang aplikasi](#tentang-aplikasi)
- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Menjalankan proyek](#menjalankan-proyek)
- [Demo interaktif](#demo-interaktif)
- [Setup workspace nyata](#setup-workspace-nyata)
- [Alur kerja tiket](#alur-kerja-tiket)
- [Struktur proyek](#struktur-proyek)
- [API dan database](#api-dan-database)
- [Pengujian](#pengujian)
- [Deployment](#deployment)
- [Dokumentasi lengkap](#dokumentasi-lengkap)
- [Batas implementasi](#batas-implementasi)
- [Melanjutkan pengembangan](#melanjutkan-pengembangan)

## Tentang aplikasi

Permintaan pelanggan sering tersebar di WhatsApp, marketplace, email, dan telepon. Luma memusatkan catatan pekerjaan tersebut dalam tiket agar tim dapat melihat apa yang belum selesai, siapa penanggung jawabnya, dan tindakan terakhir yang dilakukan.

Rilis awal ditujukan untuk **satu toko dengan beberapa petugas**. Pelanggan tetap berkomunikasi melalui kanal asal; aplikasi digunakan oleh admin dan petugas internal. Manajemen penjualan, stok, dan akuntansi berada di luar cakupan.

Pencatatan tiket tidak otomatis mengirim balasan, memeriksa ekspedisi, atau menyetujui refund. Tindakan tersebut tetap dilakukan petugas melalui sistem yang memang digunakan toko.

## Fitur

| Area | Kemampuan yang tersedia |
| --- | --- |
| Ringkasan | Tiket terbuka, belum ditugaskan, menunggu pelanggan, selesai, pekerjaan pengguna, dan median respons awal |
| Tiket | Buat, cari berdasarkan judul/referensi pesanan, filter status/prioritas/pemilik, dan pagination |
| Penanggung jawab | Claim tiket baru, penugasan admin, dan pemindahan dengan alasan |
| Tindak lanjut | Catatan internal dan pencatatan balasan yang sudah dikirim melalui kanal asal |
| Penyelesaian | Penutupan dengan ringkasan dan pembukaan kembali dengan alasan |
| Riwayat | Timeline perubahan tiket dengan aktor dan waktu |
| Pelanggan | Tambah nama/referensi kontak, cari pelanggan, dan lihat tiket terkait |
| FAQ | Pencarian, salin jawaban, pencatatan penggunaan pada tiket, editor, publikasi, dan arsip |
| Tim | Undangan akun, role admin/petugas, status aktif, dan perlindungan admin aktif terakhir |
| Antarmuka | Sidebar desktop, navigasi mobile, form dialog, loading, empty state, error, dan notifikasi |
| Demo | Workspace terpisah dengan data fiktif dan tindakan yang berjalan dalam memori halaman |

Pada workspace nyata, penyimpanan dirancang melalui database dan transaksi Supabase. Pada demo, seluruh data hanya berada di memori browser selama halaman terbuka.

## Teknologi

| Teknologi | Versi / penggunaan |
| --- | --- |
| Next.js | 16.4.3, App Router dan Route Handlers |
| React / React DOM | 19.3.1 |
| TypeScript | 5.9.3, mode strict |
| Supabase JS | 2.118.0, PostgreSQL dan Auth |
| Zod | 4.6.5, validasi input |
| CSS | Stylesheet global, token desain, dan layout responsif |
| Node.js | 24 LTS untuk menyamai lingkungan pengujian awal |
| Pengujian | Node test runner dan skrip SQL integrasi |

Versi dependensi dikunci pada [package-lock.json](package-lock.json). Font Manrope dimuat melalui Google Fonts dengan fallback Arial.

## Menjalankan proyek

### 1. Ambil kode

```bash
git clone https://github.com/aryapulosari-design/Luna_Velkira.git
cd Luna_Velkira
```

### 2. Pasang dependensi

```bash
npm ci
```

### 3. Jalankan server lokal

```bash
npm run dev
```

| Alamat | Kegunaan |
| --- | --- |
| [http://127.0.0.1:3000/demo](http://127.0.0.1:3000/demo) | Demo tanpa login atau konfigurasi Supabase |
| [http://127.0.0.1:3000](http://127.0.0.1:3000) | Workspace operasional / informasi setup |
| [http://127.0.0.1:3000/login](http://127.0.0.1:3000/login) | Login dan alur pemulihan akun |

Server mengikat alamat loopback sehingga hanya dapat diakses dari komputer yang menjalankannya. Jika port 3000 digunakan, periksa URL yang dicetak terminal. Untuk instalasi yang dependensinya sudah tersedia, cukup jalankan `npm run dev`.

## Demo interaktif

Demo tersedia pada `/demo` dengan identitas fiktif:

- **12 tiket** dengan berbagai status dan prioritas.
- **8 pelanggan** dengan referensi kontak `example.invalid`.
- **3 anggota tim**, dengan Nadia Putri sebagai admin demo.
- **5 FAQ**, termasuk satu draft internal.

### Contoh alur presentasi

1. Buka Ringkasan dan coba pencarian `ORD-2402` atau filter status.
2. Buka tiket **Pesanan belum sampai melewati estimasi**.
3. Klik **Ambil tiket ini**, kemudian tambahkan catatan internal.
4. Ubah status ke **Menunggu pelanggan**, lalu kembali ke **Ditangani**.
5. Selesaikan tiket dengan ringkasan dan periksa riwayat serta perubahan metrik.
6. Buat tiket baru atau tampilkan FAQ dan pengelolaan tim.

**Refresh mengembalikan demo ke data awal.** Setiap tab memiliki sesi demo sendiri. Demo tidak mengakses database operasional atau mengirim email/pesan. Jangan memasukkan data pelanggan nyata. Panduan lengkap tersedia di [dokumentasi demo](doct/06-demo.md).

## Setup workspace nyata

Demo bisa digunakan tanpa environment. Untuk login dan penyimpanan operasional, siapkan proyek Supabase staging terlebih dahulu.

### Environment

Salin `.env.example` menjadi `.env.local`, lalu isi:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ISI_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=ISI_SECRET_SERVER_UNTUK_UNDANGAN
APP_URL=http://127.0.0.1:3000
```

| Variabel | Penjelasan |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase yang digunakan |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key; akses tetap dilindungi session dan RLS |
| `SUPABASE_SECRET_KEY` | Secret server untuk operasi admin Auth, seperti undangan petugas |
| `APP_URL` | Origin aplikasi untuk pemeriksaan request dan tautan autentikasi |

File contoh memakai `localhost`; sesuaikan dengan URL browser. `localhost` dan `127.0.0.1` merupakan origin berbeda. Jangan tambahkan slash di akhir `APP_URL`. Restart dev server setelah mengubah environment dan isi konfigurasi produksi sebelum build.

**Jangan commit `.env.local`, secret, password, token, atau URL database berpassword.** Repository mengabaikan file environment privat dan hanya menyertakan contoh kosong.

### Database dan akun

1. Jalankan seluruh [migrasi awal](supabase/migrations/202610280001_luma.sql) pada proyek staging baru.
2. Nonaktifkan pendaftaran publik di Supabase Auth.
3. Siapkan akun pemilik dan bootstrap profil admin melalui prosedur pada [panduan setup](doct/01-setup.md).
4. Konfigurasi SMTP, Site URL, redirect allowlist, dan template email `token_hash` untuk undangan/pemulihan.
5. Uji login admin, undangan petugas, persistensi tiket setelah refresh, serta pembatasan role.

Migrasi awal bukan skrip untuk dijalankan berulang pada database yang sudah terisi. Jangan membuka akses produksi hanya dengan menerapkan DDL tanpa menguji policies dan fungsi transaksi.

## Alur kerja tiket

```text
Permintaan dari kanal asal
        ↓
Cari pelanggan dan tiket yang sudah ada
        ↓
Buat tiket Baru
        ↓
Petugas claim / admin menugaskan
        ↓
Ditangani → Menunggu pelanggan / Eskalasi
        ↓
Catat tindak lanjut dan balasan yang sudah dikirim
        ↓
Selesai dengan ringkasan penyelesaian
        ↓
Buka kembali dengan alasan jika masalah berlanjut
```

Petugas mengubah tiket miliknya; admin dapat menangani seluruh antrean sesuai aturan transisi. Penyelesaian membutuhkan owner aktif. Catatan internal tidak dikirim ke pelanggan, dan riwayat tetap dipertahankan saat tiket dibuka kembali.

## Struktur proyek

```text
Luna_Velkira/
├── app/
│   ├── api/auth/[action]/       Endpoint autentikasi
│   ├── api/v1/[...path]/        API workspace
│   ├── demo/                   Halaman demo
│   ├── login/                  Halaman login
│   ├── globals.css             Token desain dan tampilan
│   └── page.tsx                Entry workspace
├── components/                 Workspace, form, dialog, login, dan ikon
├── lib/                        Domain, validasi, client, server, dan adapter demo
├── supabase/migrations/        Schema, policies, grants, dan transaksi
├── tests/                      Tes Node serta SQL integrasi
├── doct/                       Seluruh panduan proyek
├── .env.example                Contoh environment tanpa secret
├── next.config.ts              Konfigurasi Next.js dan header
├── package.json                Dependensi dan perintah
└── README.md                   Halaman utama repository
```

`AGENTS.md` berisi instruksi pengembangan terkait versi Next.js. `setup-cache.cjs` adalah alat bantu khusus komputer pengembangan awal, bukan langkah instalasi umum. [Peta arsitektur](doct/02-arsitektur.md) menjelaskan tanggung jawab masing-masing berkas.

## API dan database

API operasional berada pada `/api/v1` dan memerlukan session valid serta profil aktif. Endpoint utama meliputi tiket, pelanggan, FAQ, tim, metrik, serta pencarian hasil request setelah timeout. Autentikasi berada pada `/api/auth`.

Mutasi memakai validasi server, pemeriksaan role/owner, version tiket, dan request ID idempotensi. PostgreSQL menyimpan sembilan tabel: `profiles`, `customers`, `tickets`, `ticket_notes`, `ticket_events`, `faqs`, `team_events`, `mutation_requests`, dan `rate_buckets`.

RLS membatasi pembacaan; write aplikasi memakai fungsi transaksi `luma_mutate`. Claim, perubahan status, notes, dan audit dirancang untuk commit bersama. Pembuktian aturan tersebut pada database nyata masih diperlukan.

- [Kontrak endpoint, payload, error, dan pagination](doct/04-api.md)
- [Schema, relasi, grants, RLS, dan transaksi](doct/05-database.md)

## Pengujian

```bash
npm test
npm run typecheck
npm run build
```

| Pemeriksaan | Cakupan / hasil terakhir |
| --- | --- |
| Tes domain | Validasi, identitas palsu, version, transisi, dan batas query |
| Tes client | Pemulihan timeout, konflik tanpa overwrite, dan kegagalan yang belum commit |
| Tes demo | Fixture, metrik, filter, pagination, alur tiket, isolasi sesi, FAQ, dan tim |
| Jumlah tes otomatis | **11 lulus** pada pemeriksaan 28 Oktober 2026 |
| Typecheck dan build | Lulus pada pemeriksaan terakhir |
| HTTP lokal | Workspace, login, dan demo pernah merespons 200 |
| Tes SQL Supabase | Skrip tersedia; belum dijalankan pada database nyata |

Tidak ada workflow CI atau pengujian E2E browser yang sudah dikonfigurasi. Hasil demo bukan bukti keamanan produksi. Baca [panduan pengujian](doct/07-pengujian.md) untuk skenario konkurensi, role, browser, persistensi, dan pemulihan.

## Deployment

Aplikasi membutuhkan runtime Node karena mempunyai session dan API. Setelah environment dan layanan siap:

```bash
npm ci
npm test
npm run typecheck
npm run build
npm start
```

Script start mengikat `127.0.0.1`. Untuk self-hosting, gunakan reverse proxy HTTPS; sesuaikan binding melalui konfigurasi hosting bila platform memerlukannya. Jangan menganggap ekspor statis saja cukup untuk workspace operasional.

Belum ada URL deployment publik yang diverifikasi. Sebelum go-live, selesaikan pengujian Supabase, email, role, backup/restore, monitoring, serta UAT. Prosedur lengkap tersedia pada [panduan operasional](doct/08-operasional.md).

## Dokumentasi lengkap

Seluruh panduan dipusatkan di folder **`doct`**. Mulai dari [indeks dokumentasi](doct/README.md).

| Dokumen | Isi |
| --- | --- |
| [01 — Setup](doct/01-setup.md) | Instalasi, environment, migrasi, bootstrap admin, dan email |
| [02 — Arsitektur](doct/02-arsitektur.md) | Alur data, peta kode, state, dan batas akses |
| [03 — Panduan pengguna](doct/03-panduan-pengguna.md) | Cara kerja admin/petugas, tiket, FAQ, tim, dan metrik |
| [04 — API](doct/04-api.md) | Endpoint, payload, validasi, pagination, dan error |
| [05 — Database](doct/05-database.md) | Tabel, relasi, RLS, grants, transaksi, dan retensi |
| [06 — Demo](doct/06-demo.md) | Menjalankan demo dan skenario presentasi |
| [07 — Pengujian](doct/07-pengujian.md) | Perintah, cakupan tes, dan skenario rilis |
| [08 — Operasional](doct/08-operasional.md) | Deployment, pemantauan, backup, restore, dan rollback |
| [09 — Troubleshooting](doct/09-troubleshooting.md) | Kendala umum dan cara melaporkan masalah |
| [10 — Status](doct/10-status-dan-lanjutan.md) | Hasil pemeriksaan, batas implementasi, dan pekerjaan berikutnya |

Sumber rancangan tersedia pada [PRD asli](Luma%20Support%20PRD%20dan%20Blueprint%20Operasional.docx). [prd.txt](prd.txt) adalah ekstraksi bantu. Untuk perilaku yang tersedia sekarang, cocokkan kode dengan dokumentasi `doct`.

## Batas implementasi

- Belum ada integrasi otomatis WhatsApp, marketplace, ekspedisi, atau pengiriman pesan.
- Belum ada lampiran, ekspor, portal pelanggan, edit pelanggan, atau scheduler retensi/anonimisasi.
- Pengujian Supabase nyata, SMTP, dua koneksi bersamaan, browser desktop/mobile, load test, serta backup/restore belum dibuktikan.
- Editor FAQ belum memakai optimistic version; logout belum mencabut session pada provider.
- Undangan belum mempunyai request ID idempotensi; rate limit API tidak otomatis melindungi panggilan RPC langsung.

Daftar detail dan urutan penyelesaiannya berada pada [status proyek](doct/10-status-dan-lanjutan.md). Jangan memakai data pelanggan produksi sebelum pemeriksaan layanan nyata selesai.

## Melanjutkan pengembangan

1. Baca `AGENTS.md`, peta kode, dan dokumentasi versi Next.js yang terpasang sebelum mengubah implementasi.
2. Gunakan pola dan dependensi yang sudah ada; batasi perubahan pada kebutuhan yang ditangani.
3. Perbarui validasi, API, transaksi, pemanggil, dan pengujian yang terdampak bersama-sama.
4. Tambahkan migrasi baru untuk perubahan database yang sudah diterapkan; jangan mengubah sejarah schema lingkungan bersama.
5. Jalankan pemeriksaan yang relevan dan perbarui panduan dalam `doct` beserta catatan statusnya.
6. Gunakan fixture fiktif dan simpan seluruh secret di environment yang sesuai.

Repository: [aryapulosari-design/Luna_Velkira](https://github.com/aryapulosari-design/Luna_Velkira).
