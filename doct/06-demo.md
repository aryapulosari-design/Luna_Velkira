# Demo dan presentasi

Jalankan `npm run dev` dari root proyek dan buka **http://127.0.0.1:3000/demo**. Jika dependensi belum tersedia, jalankan `npm ci` terlebih dahulu. Demo tidak memerlukan login atau Supabase.

## Isi awal

Tersedia 12 tiket, 8 pelanggan fiktif, 3 anggota tim, dan 5 FAQ termasuk satu draft. Nadia Putri menjadi admin demo; Raka Pratama dan Dinda Safitri menjadi petugas. Referensi kontak menggunakan `example.invalid`.

Dashboard awal berisi 9 tiket terbuka, 3 belum ditugaskan, 2 menunggu pelanggan, dan 3 selesai. Angka dihitung dari fixture dan mengikuti perubahan demo.

## Alur presentasi

1. Tunjukkan Ringkasan, pencarian `ORD-2402`, dan filter status.
2. Buka **Pesanan belum sampai melewati estimasi**, lalu **Ambil tiket ini**.
3. Tambahkan catatan internal tentang pemeriksaan pengiriman contoh.
4. Ubah ke **Menunggu pelanggan**, lalu kembali ke **Ditangani**.
5. Tandai **Selesai** dengan ringkasan; tunjukkan riwayat dan perubahan metrik.
6. Buat tiket baru dengan pelanggan yang tersedia atau tambahkan pelanggan baru.
7. Buka Pusat pengetahuan dan demonstrasikan jawaban serta editor FAQ admin.

## Batas demo

Perubahan hanya berada di memori halaman. Refresh mengembalikan data awal; tab lain mempunyai sesi sendiri. Penambahan petugas adalah simulasi tanpa pengiriman email. Tidak ada pesan, pemeriksaan ekspedisi, atau akses database nyata. FAQ adalah contoh kebijakan.

Jangan memasukkan data pelanggan nyata. Demo tidak membuktikan autentikasi, RLS, konkurensi, atau persistensi lintas perangkat. Workspace operasional tetap pada `/`.

Sumber fixture: [lib/demo.ts](../lib/demo.ts). Pengujian: [tests/demo.test.ts](../tests/demo.test.ts).
