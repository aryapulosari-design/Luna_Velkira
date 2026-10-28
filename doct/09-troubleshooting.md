# Troubleshooting

| Gejala | Tindakan |
| --- | --- |
| npm tidak ditemukan | Periksa instalasi Node.js/npm dan buka ulang terminal |
| Instalasi gagal | Periksa jaringan registry, versi runtime, dan error lockfile; jangan langsung menghapus lockfile |
| Port 3000 terpakai | Gunakan port yang dicetak dev server; cocokkan APP_URL untuk workspace nyata |
| Halaman lokal tidak terbuka | Pastikan `npm run dev` masih berjalan; server hanya mengikat loopback |
| Setup diperlukan atau tombol nonaktif | Lengkapi Supabase dan restart server; gunakan `/demo` untuk presentasi |
| ORIGIN_REJECTED / 403 | Cocokkan APP_URL dengan browser, termasuk localhost/127.0.0.1, protokol, dan port |
| Login gagal | Periksa Auth, password, profil aktif, dan role; akun Auth saja belum cukup |
| Undangan gagal | Periksa secret server, role admin, SMTP, batas provider, dan email yang sudah ada |
| Tautan akun tidak membuka form password | Gunakan template token_hash dengan type=invite/recovery seperti panduan setup |
| SETUP_REQUIRED / 503 | Periksa environment server dan secret undangan bila diperlukan |
| DATABASE_UNAVAILABLE / 503 | Periksa status Supabase, migrasi, fungsi, policies, dan grants |
| DUPLICATE / 409 | Cari referensi kontak yang sudah tercatat dan gunakan pelanggan tersebut |
| ASSIGNMENT_CONFLICT / 409 | Muat ulang: tiket mungkin sudah diambil petugas lain |
| VERSION_CONFLICT / 409 | Pertahankan draft, muat ulang, tinjau perubahan, lalu simpan dengan version terbaru |
| REQUEST_CONFLICT / 409 | Jangan memakai request ID sama untuk isi atau tindakan berbeda |
| Tidak dapat menutup tiket | Periksa owner aktif dan ringkasan penyelesaian minimal 5 karakter |
| INVALID_TIME / 422 | Waktu balasan harus setelah penerimaan dan tidak di masa depan; periksa jam perangkat |
| Admin tidak dapat dinonaktifkan | Admin aktif terakhir dilindungi; siapkan admin pengganti yang berhak |
| RATE_LIMIT / 429 | Tunggu satu menit; periksa apakah request dikirim berulang |
| Salin FAQ gagal | Salin teks manual jika browser membatasi clipboard |
| Font berbeda | Google Fonts mungkin tidak tersedia; fallback Arial tetap dipakai |
| Perubahan demo hilang | Normal setelah refresh; demo hanya memakai memori halaman |

## Penyimpanan timeout

Periksa `/api/v1/requests/{request_id}` atau cari tiket/riwayat. Jika perlu retry, gunakan request ID dan payload awal yang sama. Jangan membuat request baru berulang hanya karena notifikasi sukses tidak terlihat.

## Laporan masalah

Catat halaman, langkah reproduksi, waktu/zona waktu, mode demo/nyata, HTTP status, kode error, ID penelusuran, dan revisi aplikasi. Sanitasi screenshot/log. Jangan menyertakan cookie, token email, password, secret, atau data pelanggan nyata.

Rujukan: [setup](01-setup.md), [API](04-api.md), [pengujian](07-pengujian.md), dan [status](10-status-dan-lanjutan.md).
