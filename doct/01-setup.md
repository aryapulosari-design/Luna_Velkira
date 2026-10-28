# Setup lokal dan Supabase

## Persyaratan

Gunakan Node.js 24 LTS dan npm untuk menyamai lingkungan yang dipakai saat pengujian awal. Versi paket dikunci dalam [package-lock.json](../package-lock.json): Next.js 16.4.3, React/React DOM 19.3.1, TypeScript 5.9.3, Supabase JS 2.118.0, dan Zod 4.6.5.

Tidak ada ketergantungan pada Supabase untuk menjalankan demo. Workspace nyata memerlukan proyek Supabase yang menyediakan PostgreSQL, Auth, dan konfigurasi email. Gunakan proyek staging terpisah dari produksi.

## Instalasi dan demo

```powershell
Set-Location 'C:\File Arya\velkira\Luma Support'
npm ci
npm run dev
```

Buka `http://127.0.0.1:3000/demo`. Perintah server mengikat alamat loopback sehingga hanya dapat diakses di komputer ini. Jika port 3000 digunakan aplikasi lain, lihat URL yang dicetak terminal dan gunakan port tersebut.

[setup-cache.cjs](../setup-cache.cjs) adalah alat bantu instalasi awal pada komputer Arya saat jaringan dibatasi. Skrip memakai path npm khusus Windows dan cache yang sudah ada; bukan langkah instalasi umum. Jangan mengandalkannya pada komputer baru.

## Konfigurasi environment

Jika belum ada `.env.local`, salin [contoh environment](../.env.example):

```powershell
if (-not (Test-Path -LiteralPath '.env.local')) {
  Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
}
```

Isi file melalui editor:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ISI_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=ISI_SECRET_SERVER_UNTUK_UNDANGAN
APP_URL=http://127.0.0.1:3000
```

| Variabel | Penggunaan | Aturan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Alamat proyek | Harus menunjuk lingkungan yang sesuai |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client Supabase untuk request pengguna | Bukan secret admin; akses tetap bergantung pada session dan RLS |
| `SUPABASE_SECRET_KEY` | API admin Auth untuk mengundang petugas | Hanya server; jangan beri awalan `NEXT_PUBLIC_` |
| `APP_URL` | Origin POST/PUT dan tautan autentikasi | Harus sama dengan origin browser, tanpa garis miring di akhir |

File contoh masih memakai `http://localhost:3000`; ubah menjadi `http://127.0.0.1:3000` jika menggunakan URL di atas. `localhost` dan `127.0.0.1` berbeda origin. Restart dev server setelah mengubah environment. Untuk produksi, isi environment sebelum build karena halaman awal memeriksa konfigurasi saat prerender.

Kode saat ini tidak memakai `DATABASE_URL`; koneksi SQL hanya diperlukan jika pengelola menjalankan migrasi atau tes melalui `psql`.

## Migrasi database

1. Pilih proyek **staging baru** dan pastikan bukan database pelanggan produksi.
2. Buka SQL Editor dengan akses pemilik database.
3. Jalankan seluruh isi [202610280001_luma.sql](../supabase/migrations/202610280001_luma.sql), termasuk transaksi, policies, grants, functions, dan trigger.
4. Periksa bahwa sembilan tabel, fungsi `luma_*`, dan trigger `invited_profile` terbentuk.
5. Jalankan pengujian database sesuai [panduan pengujian](07-pengujian.md).

Migrasi awal tidak memakai `IF NOT EXISTS` dan bukan skrip yang boleh dijalankan berulang pada schema yang sudah terisi. Perubahan berikutnya harus dibuat sebagai migrasi baru. Belum ada konfigurasi Supabase CLI dalam repo; jangan menganggap `supabase db push` sudah siap tanpa konfigurasi tambahan.

## Admin pertama

Nonaktifkan pendaftaran publik pada konfigurasi Supabase Auth. Buat atau undang akun pemilik toko melalui pengelolaan Auth milik proyek. Selesaikan alur akun dan salin UUID pengguna dari Auth; jangan menaruh kata sandi di SQL atau repository.

Trigger hanya otomatis membuat profil `agent` jika baris pengguna baru memiliki `invited_at`. Akun yang dibuat dengan cara lain memerlukan profil manual. Sebelum ada admin aktif, jalankan bootstrap berikut melalui SQL Editor tepercaya. **Ganti UUID dan nama sebelum menjalankan.**

```sql
do $$
declare
  owner_id uuid := 'GANTI_DENGAN_UUID_AUTH_PEMILIK';
begin
  if exists (select 1 from public.profiles where role = 'admin' and is_active) then
    raise exception 'Admin aktif sudah tersedia. Gunakan pengelolaan tim.';
  end if;
  if not exists (select 1 from auth.users where id = owner_id) then
    raise exception 'Pengguna Auth tidak ditemukan';
  end if;
  insert into public.profiles (id, display_name, role, is_active)
  values (owner_id, 'Nama Admin Toko', 'admin', true)
  on conflict (id) do update set role = 'admin', is_active = true;
end;
$$;
```

Ini prosedur awal satu kali oleh pengelola database. Sesudahnya, perubahan akses memakai fitur Tim agar tercatat dalam `team_events`.

## Email undangan dan pemulihan

Atur Site URL serta redirect allowlist Supabase agar sesuai `APP_URL`, kemudian konfigurasi SMTP untuk lingkungan tersebut. Halaman login aplikasi memproses `token_hash` dengan `type=invite` atau `type=recovery`; kode belum menyediakan callback `code` PKCE maupun pembacaan token dari fragment URL.

Karena itu, sesuaikan template email agar tautannya berbentuk berikut. Variabel template mengikuti [dokumentasi resmi Supabase](https://supabase.com/docs/guides/auth/auth-email-templates).

Template undangan:

```html
<a href="{{ .SiteURL }}/login?token_hash={{ .TokenHash }}&amp;type=invite">Aktifkan akun</a>
```

Template pemulihan:

```html
<a href="{{ .SiteURL }}/login?token_hash={{ .TokenHash }}&amp;type=recovery">Atur ulang kata sandi</a>
```

Uji pengiriman, tautan sekali pakai, tautan kedaluwarsa, pengaturan kata sandi, dan login ulang di staging. Mengisi environment saja belum membuktikan email berfungsi.

## Pemeriksaan akhir setup

Masuk melalui `/login`, tambahkan pelanggan, buat tiket, refresh, lalu periksa tiket masih ada. Ulangi dari akun petugas lain yang diundang. Pastikan akun nonaktif tidak dapat mengakses API dan draft FAQ tidak terbaca petugas. Simpan hasil pengujian pada catatan rilis sebelum memakai data nyata.
