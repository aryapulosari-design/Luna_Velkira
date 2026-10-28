# Dokumentasi Luma Support

Dokumentasi ini menjelaskan kode yang tersedia dan cara melanjutkan proyek. Seluruh panduan proyek dipusatkan di folder bernama **`doct`**, sesuai penamaan yang dipilih pemilik proyek.

## Mulai membaca

| Urutan | Dokumen | Pembaca utama |
| --- | --- | --- |
| 01 | [Setup lokal dan Supabase](01-setup.md) | Pengembang dan pemilik akses layanan |
| 02 | [Arsitektur dan peta kode](02-arsitektur.md) | Pengembang berikutnya |
| 03 | [Panduan pengguna](03-panduan-pengguna.md) | Admin toko dan petugas |
| 04 | [Kontrak API](04-api.md) | Pengembang frontend/backend |
| 05 | [Database dan transaksi](05-database.md) | Pengelola database dan backend |
| 06 | [Demo dan presentasi](06-demo.md) | Presenter dan evaluator |
| 07 | [Pengujian](07-pengujian.md) | Pengembang dan penguji |
| 08 | [Deployment dan operasional](08-operasional.md) | Pengelola server |
| 09 | [Troubleshooting](09-troubleshooting.md) | Pengguna dan pengelola |
| 10 | [Status dan pekerjaan lanjutan](10-status-dan-lanjutan.md) | Pemilik produk dan pengembang |

Untuk presentasi, langsung baca panduan 06. Untuk membuat workspace nyata, baca 01, 05, 07, dan 08 secara berurutan. Sebelum menjanjikan fitur kepada pengguna, periksa dokumen 10.

## Lingkungan aplikasi

| Halaman | Kegunaan | Penyimpanan |
| --- | --- | --- |
| `/demo` | Evaluasi dengan data fiktif, tanpa login | Memori halaman; kembali ke awal saat refresh |
| `/` | Workspace operasional | Supabase setelah dikonfigurasi dan pengguna login |
| `/login` | Login, pemulihan, dan pengaturan kata sandi dari tautan undangan | Supabase Auth dan cookie server |

Navigasi Ringkasan, Tiket, Pelanggan, FAQ, dan Tim berada dalam komponen workspace. Belum ada URL terpisah `/tickets`, `/customers`, atau `/team`.

## Aturan pembaruan dokumentasi

1. Perubahan field, endpoint, atau aturan akses harus diikuti pembaruan panduan terkait.
2. Catat hasil pengujian beserta lingkungan dan tanggalnya; bedakan kode tersedia dari fitur terverifikasi.
3. Simpan contoh memakai identitas fiktif. Jangan menaruh password, token sesi, secret key, URL koneksi database berpassword, atau data pelanggan dalam Markdown.
4. Simpan panduan baru di `doct` dan tambahkan tautannya ke indeks ini.
5. Pertahankan [AGENTS.md](../AGENTS.md) di root karena digunakan alat pengembangan. Dokumentasi bawaan dependensi tetap berada dalam paketnya.

Dokumen diperbarui pada **28 Oktober 2026**. Riwayat utama perubahan dan batas implementasi berada di [status proyek](10-status-dan-lanjutan.md).
