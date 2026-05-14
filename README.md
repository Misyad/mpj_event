# MPJ Event & Ticketing System

Sistem manajemen event untuk publikasi acara, pendaftaran peserta, ticketing, pembayaran, dan absensi QR Code. Project ini menggunakan Next.js App Router sebagai frontend sekaligus backend-for-frontend untuk API event.

## Fitur Utama

- **Public Portal**: Landing page, detail event, registrasi, halaman tiket, sertifikat, dan scanner QR.
- **Registrasi Dual Path**: Mendukung peserta internal via NIAM dan peserta umum.
- **Ticketing & QR**: Membuat kode tiket/QR unik untuk validasi dan check-in.
- **Certificate**: Sertifikat printable tersedia setelah peserta hadir dan event selesai.
- **QR Attendance**: Check-in peserta berbasis web dengan validasi backend.
- **Admin Pusat**: Kelola event, peserta, pembayaran, narasumber, master data, role admin, dan permission.
- **Role Dashboard**: Admin Pusat, Admin Regional, dan User/Peserta memiliki route login dan dashboard masing-masing.
- **Database-backed API**: Route handler Next.js membaca dan menulis data event ke MySQL/MariaDB.
- **AI Chatbot Operasional**: Floating assistant publik/admin untuk FAQ, event, tiket, pembayaran, dan panduan operasional read-only.

## Tech Stack

- **Framework**: Next.js 16.2.4, React 19, App Router.
- **Language**: TypeScript.
- **Styling**: Tailwind CSS 4, shadcn/ui, Base UI, Lucide Icons.
- **Backend/Data**: Next.js Route Handlers, MySQL/MariaDB, `mysql2`.
- **AI**: OpenAI Responses API melalui server-side Route Handler.
- **QR & Utilities**: `qrcode`, `qrcode.react`, `html5-qrcode`, Axios, Sonner.
- **Deployment**: Next.js standalone output.

## Struktur Utama

- `app/(public)/`: Portal publik, event detail, registrasi, ticket, certificate, dan scanner.
- `app/admin-pusat/`: Dashboard utama Admin Pusat untuk operasional event dan RBAC.
- `app/admin/` dan `app/super-admin/`: Route lama yang diarahkan ke `app/admin-pusat/`.
- `app/regional/`: Dashboard dan monitoring regional.
- `app/api/`: API auth, event, ticket, regional, admin, dan super-admin.
- `lib/server/`: Logic server-side untuk database event dan RBAC.
- `database/`: Migration dan seeder MySQL/MariaDB.
- `docs/`: Catatan implementasi backend dan Event V4.

## Instalasi

```bash
npm install
```

## Environment

Salin `.env.example` atau isi `.env.local` dengan konfigurasi database:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=app_db
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAYMENKU_API_BASE_URL=https://paymenku.com/api/v1
PAYMENT_CREDENTIAL_ENCRYPTION_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

Bootstrap database lokal dengan menjalankan SQL berikut secara berurutan:

1. `database/migrations/001_create_event_schema.sql`
2. `database/seeders/001_seed_event_demo_data.sql`

## Pengembangan

```bash
npm run dev
```

## Validasi

```bash
npm run lint
npm run build
```

Catatan: script `npm run build` memakai webpack karena pada environment ini build Turbopack dapat gagal dengan internal error `Invalid distDirRoot: ".next"`. Untuk mencoba Turbopack secara eksplisit, gunakan `npm run build:turbo`.

## Status Implementasi

Sudah tersedia public event listing/detail, registrasi peserta, validasi tiket, QR check-in, sertifikat setelah event selesai, admin event API, manajemen peserta/pembayaran event, master peserta global dan regional berbasis backend, dashboard dan event regional berbasis backend, dashboard role, dan proxy auth/redirect untuk route terproteksi.

### Update Admin Pusat

- **Approval event**: Admin Pusat memiliki alur approve/tolak yang lebih jelas. Status `APPROVED` membuat event siap publikasi sesuai pengaturan event, sedangkan `REJECTED` menandai event ditolak dan menyimpan alasan revisi.
- **Riwayat approval**: Perubahan approval event dicatat melalui activity log admin dan dapat dibaca dari endpoint:

```text
GET /api/admin/events/{id}/approval-logs
```

- **Narasumber**: Halaman Narasumber sudah memakai data backend, mendukung tambah, edit, dan delete. Fitur kirim WA/notifikasi manual dihapus dari UI.
- **Master Data**: Menu Master Data saat ini menjadi penampungan data MPJ Apps untuk Pesantren, Media, dan Kru. Struktur UI disiapkan agar nanti bisa diganti ke API MPJ Apps tanpa rombak besar.
- **Permissions**: Permission matrix menampilkan akses Admin Regional, Super Admin/Admin Pusat, dan User/Peserta agar scope akses lebih jelas.
- **Rekap Keuangan Event**: UI rekap keuangan dibuat lebih mudah dibaca di desktop dan mobile, dengan ringkasan pemasukan, pengeluaran, saldo, transaksi, filter tanggal, dan export CSV.
- **Layout admin**: Sidebar Admin Pusat menjaga area user/logout tetap terlihat pada desktop dan mobile walau menu panjang.

Payment gateway Paymenku tersedia untuk event berbayar dengan metode `gateway`. Credential Paymenku pusat dikelola dari menu Admin Pusat `Payment Gateway`, sementara credential regional dikelola admin regional dari menu `Payment Gateway` miliknya sendiri. Admin Pusat hanya melihat status kelengkapan credential regional tanpa secret. Semua credential disimpan terenkripsi menggunakan `PAYMENT_CREDENTIAL_ENCRYPTION_KEY`. Callback webhook diarahkan ke:

```text
POST /api/paymenku/webhook
```

Webhook wajib memakai header `X-Paymenku-Signature` dan `X-Paymenku-Timestamp`; status peserta baru dikonfirmasi setelah signature valid dan status transaksi Paymenku terverifikasi.

AI chatbot tersedia sebagai floating widget di halaman publik dan admin. Endpoint server-side:

```text
POST /api/ai/chat
```

Chatbot v1 bersifat read-only: boleh membaca FAQ, event publik, status tiket berdasarkan kode yang diberikan user, serta ringkasan operasional admin sesuai session/permission. Chatbot tidak boleh membuat, mengubah, menghapus, mengonfirmasi, atau memverifikasi data.

## Dokumentasi

- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md): Dokumentasi fitur Event & Ticketing.
- [docs/event-v4-implementation-notes.md](./docs/event-v4-implementation-notes.md): Status implementasi Event V4.
- [docs/backend-implementation-plan.md](./docs/backend-implementation-plan.md): Rencana backend dan urutan endpoint.
