# Panduan admin dan petugas

Panduan ini berlaku untuk workspace nyata setelah Supabase disiapkan. Untuk presentasi tanpa login, gunakan [panduan demo](06-demo.md).

## Peran

| Tindakan | Petugas aktif | Admin aktif |
| --- | --- | --- |
| Membaca antrean, pelanggan, dan riwayat | Ya | Ya |
| Membuat pelanggan dan tiket | Ya | Ya |
| Mengambil tiket baru tanpa pemilik | Ya | Ya |
| Mengedit, mencatat, dan mengubah status | Tiket miliknya | Semua tiket, sesuai aturan transisi |
| Menugaskan atau memindahkan tiket | Tidak | Ya, dengan alasan |
| Membaca FAQ | Yang diterbitkan | Termasuk draft/arsip |
| Mengedit FAQ, mengundang, dan mengubah akses tim | Tidak | Ya |

Pelanggan tidak mempunyai akun portal pada versi ini. Kontak dan balasan tetap dilakukan melalui kanal asal.

## Memulai pekerjaan

1. Buka `/login` dan masuk memakai akun undangan.
2. Periksa Ringkasan untuk melihat tiket terbuka dan belum ditugaskan.
3. Gunakan **Milik saya** untuk pekerjaan yang sedang menjadi tanggung jawab Anda.
4. Cari judul atau referensi pesanan sebelum membuat tiket untuk mengurangi masalah yang tercatat dua kali.

Pencarian tiket belum mencari isi catatan, nama pelanggan, atau nomor internal `#1042`. Gunakan halaman Pelanggan untuk mencari nama lalu **Lihat tiket**. Filter status, prioritas, dan pemilik dapat dipakai bersama; daftar menggunakan pagination.

## Membuat pelanggan dan tiket

Tambahkan nama pelanggan serta referensi kontak seperlunya. Referensi kontak yang sama setelah normalisasi huruf dan spasi ditolak database. Nama sama tanpa kontak belum otomatis digabung.

Pada **Buat tiket**, pilih pelanggan yang tersedia atau buka **Tambah pelanggan baru**. Isi judul, ringkasan, kategori, kanal, prioritas, serta waktu penerimaan. Referensi pesanan opsional. Waktu penerimaan tidak boleh di masa depan. Setelah simpan berhasil, tiket berstatus Baru dan belum memiliki pemilik.

Tidak ada pemeriksaan otomatis yang memastikan pesanan ada di marketplace atau status ekspedisi benar. Ringkasan harus berdasarkan informasi yang benar-benar diterima.

## Menangani tiket

Klik judul tiket untuk membuka detail. Tiket baru tanpa pemilik dapat diambil melalui **Ambil tiket ini**. Claim menetapkan satu penanggung jawab dan status Ditangani. Admin dapat menugaskan atau memindahkan tiket kepada petugas aktif dengan alasan; penugasan juga mengubah status menjadi Ditangani.

Gunakan **Catatan internal** untuk konteks tim. Gunakan **Balasan yang sudah dikirim** hanya setelah membalas pelanggan melalui kanal asal, lalu isi waktu pengiriman sebenarnya. Waktu itu harus sesudah penerimaan dan tidak boleh berada di masa depan. Mencatat balasan tidak mengirim pesan.

**Edit detail tiket** dapat mengubah judul, ringkasan, kategori, kanal, prioritas, dan referensi pesanan. Perubahan pelanggan atau waktu penerimaan tiket yang sudah dibuat belum disediakan.

## Status

| Status saat ini | Tindakan berikutnya |
| --- | --- |
| Baru | Ambil/tugaskan agar Ditangani, atau eskalasikan lewat aktor yang berhak |
| Ditangani | Menunggu pelanggan, Eskalasi, atau Selesai |
| Menunggu pelanggan | Ditangani atau Selesai |
| Eskalasi | Admin mengubah ke Ditangani atau menugaskan petugas |
| Selesai | Buka kembali ke Ditangani atau Eskalasi dengan alasan |

Penutupan memerlukan pemilik aktif dan ringkasan penyelesaian. Sistem membuat catatan penyelesaian dan riwayat bersama perubahan status. Buka kembali mempertahankan catatan lama dan mengosongkan waktu selesai aktif. UI saat ini meminta alasan pada semua perubahan status; server secara khusus mewajibkannya untuk penyelesaian dan pembukaan kembali.

## FAQ

Cari kebijakan pada Pusat pengetahuan atau Referensi FAQ di detail tiket. Tinjau jawaban sebelum menyalin. Tombol **Catat penggunaan FAQ** pada detail menyalin jawaban dan membuat event pada tiket. Menyalin dari daftar FAQ umum tidak menghubungkan penggunaan ke tiket.

Admin dapat menyimpan FAQ sebagai terbit atau draft/arsip. Tidak ada penghapusan permanen FAQ; pengarsipan menggunakan `is_published=false`. FAQ demo adalah kebijakan contoh dan tidak boleh langsung dianggap sebagai kebijakan toko nyata.

## Tim

Admin mengundang petugas dengan nama dan email. Akun baru yang dibuat melalui trigger undangan memperoleh peran petugas. Admin dapat mengubah peran atau menonaktifkan akun; admin aktif terakhir dilindungi dari penonaktifan atau penurunan peran.

Tiket akun yang dinonaktifkan tidak dipindahkan otomatis. Admin harus meninjau dan menugaskan ulang tiket terbukanya. Riwayat tetap merujuk akun semula. Jangan membagikan akun atau kata sandi antarpetugas.

## Membaca dashboard

| Metrik | Definisi |
| --- | --- |
| Tiket terbuka | Seluruh tiket dengan status selain Selesai |
| Belum ditugaskan | Tiket belum selesai tanpa penanggung jawab |
| Menunggu pelanggan | Tiket dengan status tersebut saat ini |
| Tiket selesai | Tiket yang waktu selesai aktifnya berada pada 7/30 hari terakhir |
| Milik saya | Tiket terbuka dengan pemilik akun saat ini |
| Median respons awal | Median selisih penerimaan dan balasan pertama tercatat untuk tiket yang dibuat pada periode tersebut |

Pilihan periode tidak membatasi seluruh antrean; hanya metrik selesai dan respons awal yang memakai periode. Median belum terukur jika belum ada balasan tercatat. Tiket yang dibuka kembali tidak lagi masuk hitungan selesai aktif, meskipun histori penyelesaiannya masih ada.

## Konflik dan kegagalan

Jika petugas lain lebih dulu mengubah tiket, muat ulang detail sebelum mencoba lagi. Draft tetap berada dalam komponen selama form tidak ditutup; periksa kembali isinya terhadap versi terbaru. Jangan mengulang dengan request ID lama jika isi sudah berbeda.

Saat koneksi gagal, aplikasi tidak boleh dianggap berhasil hanya karena tombol sudah ditekan. Cari tiket atau periksa riwayat untuk memastikan hasilnya. Peringatan meninggalkan form membantu mencegah draft hilang, tetapi bukan penyimpanan draft permanen.
