# Kontrak API yang tersedia

Sumber implementasi: [Route Handlers v1](../app/api/v1/%5B...path%5D/route.ts), [Auth](../app/api/auth/%5Baction%5D/route.ts), dan [skema validasi](../lib/validation.ts). Tabel berikut menjelaskan kode saat ini; perbedaan dengan PRD dicatat di [status proyek](10-status-dan-lanjutan.md).

## Aturan umum

API workspace memakai base `/api/v1`. Setiap request memerlukan session cookie dan profil aktif. POST/PUT harus membawa `Origin` yang sama persis dengan `APP_URL` atau origin request jika variabel tidak tersedia. Browser same-origin mengirim cookie; klien terpisah perlu menjaga cookie jar dan origin yang benar.

Body menggunakan JSON. UUID berupa string. Timestamp ISO 8601 dengan zona waktu. Nomor tiket dan ID event bigint berupa string. Field tidak dikenal pada body yang divalidasi Zod ditolak. Payload v1 dibatasi 20.000 karakter teks JSON, auth 8.192 karakter, setelah body dibaca; ini belum menggantikan pembatasan ukuran request pada reverse proxy.

Respons normal:

```json
{"data":{"id":"UUID","number":"1042","status":"new","version":1}}
```

Daftar:

```json
{"data":[],"meta":{"next_cursor":null}}
```

Error v1:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Periksa kembali isian Anda.",
    "fields": {"subject":"Minimal 5 karakter"},
    "request_id": "UUID_PENELUSURAN_SERVER"
  }
}
```

`fields` hanya ada jika relevan. Request ID penelusuran berbeda dari request ID idempotensi pada body. Error auth tidak menyertakan ID penelusuran. Respons workspace memakai `Cache-Control: private, no-store`.

## Endpoint baca

| Method dan path | Hasil |
| --- | --- |
| `GET /me` | Profil akun aktif |
| `GET /tickets` | Tiket dan ringkasan pelanggan, dengan pagination |
| `GET /tickets/{id}` | Tiket, notes, events, dan cursor masing-masing riwayat |
| `GET /customers` | Daftar pelanggan |
| `GET /faqs` | FAQ terbit untuk petugas; termasuk draft untuk admin |
| `GET /team` | Daftar profil tim, termasuk status aktif |
| `GET /metrics?days=7` | Metrik; `days` hanya 7 atau 30 |
| `GET /requests/{request_id}` | Hasil mutasi milik aktor saat ini, atau `data:null` |

Daftar tiket menerima `limit` 1–100 (default 25), `cursor` UUID, `q` maksimal 160 karakter, `status`, `owner`, `priority`, `customer` UUID, dan `order` maksimal 100 karakter. `owner` menerima UUID, `me`, atau `unassigned`. `q` mencari subject atau order reference; `order` adalah pencocokan referensi persis. Karakter sintaks filter pada pencarian dinormalisasi server.

Daftar pelanggan, FAQ, dan tim menerima `q`, `cursor`, dan `limit` yang sama. Kolom pencarian masing-masing adalah nama pelanggan, pertanyaan FAQ, dan nama profil. Daftar tiket diurutkan berdasarkan `created_at` lalu UUID menurun. Daftar pelanggan/FAQ/tim saat ini diurutkan berdasarkan UUID menurun, bukan alfabet.

Detail tiket menerima `notes_cursor` UUID dan `events_cursor` string digit maksimal 19 karakter. Notes dan events masing-masing berisi maksimal 25 item. Respons memakai `meta.notes_cursor` dan `meta.events_cursor`. Cursor null berarti tidak ada halaman berikutnya.

## Endpoint mutasi

Semua mutasi tabel di bawah memerlukan `request_id` UUID. Semua mutasi tiket yang sudah ada juga memerlukan `version` integer positif terbaru. ID resource diambil dari path, bukan dari body.

| Endpoint | Payload tambahan | Akses | Status sukses saat ini |
| --- | --- | --- | --- |
| `POST /customers` | `name`, `contact_reference?` | Aktif | 201 |
| `POST /tickets` | Field pembuatan tiket | Aktif | 201 |
| `PUT /tickets/{id}` | Semua field detail yang boleh diedit | Owner/admin | 200 |
| `POST /tickets/{id}/claim` | Tidak ada selain version/request_id | Aktif, tiket baru kosong | 200 |
| `POST /tickets/{id}/assign` | `assigned_to`, `reason` | Admin | 200 |
| `POST /tickets/{id}/notes` | `body` | Owner/admin | 201 |
| `POST /tickets/{id}/responses` | `body`, `sent_at` | Owner/admin | 201 |
| `POST /tickets/{id}/status` | `status`, `resolution?`, `reason?` | Owner/admin sesuai transisi | 200 |
| `POST /tickets/{id}/faqs` | `faq_id` | Owner/admin | 200 |
| `POST /faqs` | `question`, `answer`, `is_published` | Admin | 200 |
| `PUT /faqs/{id}` | `question`, `answer`, `is_published` | Admin | 200 |
| `PUT /team/{id}` | `role`, `is_active` | Admin | 200 |

`POST /team/invitations` adalah pengecualian: menerima `email` dan `display_name`, tanpa `request_id`, dan mengembalikan 201 dengan UUID Auth. Operasi memakai layanan email Auth; tidak mempunyai deduplikasi mutasi database seperti pembuatan tiket. Jangan retry membabi buta setelah timeout; periksa akun dan status undangan terlebih dahulu.

Tidak ada DELETE, edit/hapus catatan, upload lampiran, atau endpoint untuk mengirim pesan kanal asal.

## Validasi field

| Field | Batas setelah trim |
| --- | --- |
| Nama pelanggan | 1–160 karakter |
| Referensi kontak | Maksimal 255; default string kosong |
| Subject | 5–160 karakter |
| Summary / body / reason / resolution | 5–4.000 karakter jika dikirim |
| Order reference | Maksimal 100; default string kosong |
| Pertanyaan FAQ | 5–300 karakter |
| Jawaban FAQ | 5–4.000 karakter |

Category: `general`, `shipping`, `product`, `payment`, `return`. Channel: `whatsapp`, `marketplace`, `email`, `phone`, `other`. Priority: `normal` atau `high`. Status: `new`, `in_progress`, `waiting_customer`, `escalated`, `resolved`. Role: `admin` atau `agent`.

## Contoh pembuatan dan penutupan

Pembuatan:

```json
{
  "request_id":"UUID_BARU_DARI_CLIENT",
  "customer_id":"UUID_PELANGGAN",
  "subject":"Pesanan belum sampai",
  "summary":"Estimasi terlewati dan perlu pemeriksaan petugas.",
  "category":"shipping",
  "channel":"whatsapp",
  "order_reference":"ORD-2402",
  "priority":"normal"
}
```

`received_at` opsional; default waktu server. Server menetapkan creator, nomor, status, dan version. Contoh memakai penanda UUID yang harus diganti UUID valid sebelum request nyata.

Penutupan melalui `/tickets/{id}/status`:

```json
{
  "request_id":"UUID_BARU_DARI_CLIENT",
  "version":4,
  "status":"resolved",
  "resolution":"Pelanggan menerima pembaruan dan mengonfirmasi penyelesaian."
}
```

Buka kembali memakai status `in_progress` atau `escalated` dan `reason`. Claim atau assign diperlukan untuk mendapatkan pemilik sebelum penanganan normal.

## Idempotensi dan konflik

Retry mutasi dengan request ID, path/aksi, resource, version, dan isi yang sama. Hasil sukses pertama disimpan; retry mengembalikan hasil itu meskipun tiket kemudian berubah. Menggunakan ID sama dengan payload berbeda menghasilkan `REQUEST_CONFLICT`. ID unik berlaku per aktor pada `mutation_requests`.

Setelah timeout, baca `/requests/{request_id}`. Jika hasil belum ditemukan, jangan langsung menganggap write pasti gagal; request awal bisa masih berjalan. Retry dengan ID dan payload yang sama agar aman dari duplikasi. Untuk `VERSION_CONFLICT`, baca detail terbaru, tinjau draft, lalu kirim request baru sesuai versi terbaru. Payload error konflik saat ini tidak mengandung `current_version`.

## Auth

Semua endpoint auth menggunakan POST dan pemeriksaan origin:

| Path | Body | Hasil |
| --- | --- | --- |
| `/api/auth/login` | `email`, `password` | Memverifikasi akun dan menyimpan cookie |
| `/api/auth/logout` | Tidak memerlukan body | Menghapus cookie lokal aplikasi |
| `/api/auth/recover` | `email` | Meminta email pemulihan; UI memberi pesan generik |
| `/api/auth/verify` | `token_hash`, `type` (`invite`/`recovery`) | Memverifikasi token email dan menyimpan session |
| `/api/auth/password` | `password` 12–256 karakter | Mengubah kata sandi akun terautentikasi |

Respons sukses auth adalah `{"data":true}`. Logout belum memanggil revokasi session pada provider. Konfigurasi template email ada di [setup](01-setup.md).

## Kode kegagalan

| HTTP | Contoh penyebab |
| --- | --- |
| 400 | Teks JSON tidak dapat diparse |
| 401 | Session tidak valid, login gagal, tautan auth tidak valid |
| 403 | Origin salah, akun nonaktif, atau tindakan tanpa izin |
| 404 | Resource atau endpoint tidak tersedia |
| 409 | Versi/claim/request ID konflik atau kontak duplikat |
| 413 | Body melewati batas karakter aplikasi |
| 422 | Field, waktu, transisi, owner, atau perubahan admin terakhir tidak sah |
| 429 | Bucket API pengguna melampaui 180 request/menit, atau pembatasan Auth provider |
| 500 | Error API v1 yang tidak dipetakan |
| 503 | Setup belum lengkap, database/provider atau pengiriman undangan tidak tersedia |

Bucket API berlaku setelah identitas diverifikasi. Akses langsung ke Data API/RPC Supabase bukan request ke Route Handler ini; lihat [batas keamanan](05-database.md).
