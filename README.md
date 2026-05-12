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

## Tech Stack

- **Framework**: Next.js 16.2.4, React 19, App Router.
- **Language**: TypeScript.
- **Styling**: Tailwind CSS 4, shadcn/ui, Base UI, Lucide Icons.
- **Backend/Data**: Next.js Route Handlers, MySQL/MariaDB, `mysql2`.
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

Pekerjaan lanjutan yang masih terbuka:

- Integrasi provider Payment Core eksternal jika pembayaran dipisah dari aplikasi ini.

## Dokumentasi

- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md): Dokumentasi fitur Event & Ticketing.
- [docs/event-v4-implementation-notes.md](./docs/event-v4-implementation-notes.md): Status implementasi Event V4.
- [docs/backend-implementation-plan.md](./docs/backend-implementation-plan.md): Rencana backend dan urutan endpoint.
