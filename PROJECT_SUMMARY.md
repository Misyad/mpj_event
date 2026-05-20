# Snapshot Proyek MPJ Event

Dokumen ini merangkum kondisi terbaru aplikasi **MPJ Event**: event publik, dashboard admin, master data, role, permission, dan backend pendukungnya.

## Ringkasan

MPJ Event adalah aplikasi event dan ticketing berbasis Next.js App Router dengan backend route handler internal dan database MySQL. Sistem mendukung tiga role utama:

1. **Admin Pusat / Super Admin**: full access operasional pusat, role, permission, master regional, master data, pembayaran, approval, dan analytics.
2. **Admin Regional**: akses scoped regional untuk event, peserta, finance monitoring, dan master data regional.
3. **User / Peserta**: akses publik untuk registrasi event, profil, tiket, sertifikat, dan riwayat event.

## Event & Ticketing

- Listing event publik menggunakan data backend dan poster upload lokal.
- Registrasi mendukung jalur **NIAM** dan **UMUM**.
- Lookup NIAM memakai endpoint backend `/api/members/niam`.
- Payment manual dan gateway tersedia, termasuk validasi pembayaran dan rekap finance.
- QR ticket/check-in tersedia melalui endpoint ticket verification/check-in.
- Sertifikat event sudah memiliki endpoint generate, revoke, dan public verification.

## Master Data

Master Data sudah DB-backed dan tidak lagi dummy/local-only.

- **Pesantren**: CRUD via `/api/admin/master-data/pesantren`.
- **Media**: CRUD via `/api/admin/master-data/media`.
- **Kru / NIAM**: CRUD via `/api/admin/master-data/crew`.
- Endpoint publik `/api/institutions` digunakan oleh form registrasi untuk pilihan instansi.
- Data master memiliki scope:
  - `pusat`: dikelola Admin Pusat dan bisa dibaca Admin Regional.
  - `regional`: dikelola Admin Regional sesuai `region_id`.
- Admin Regional hanya bisa mengubah data regional miliknya sendiri.
- User/Peserta hanya memakai data master secara read-only melalui flow publik.

## Master Regional

Master Regional sudah memiliki backend tersendiri:

- `GET /api/regionals`
- `GET /api/regionals?active=1`
- `POST /api/regionals`
- `PATCH /api/regionals/[id]`

Semua endpoint Master Regional dikunci untuk **Super Admin/Admin Pusat**. Admin Regional tidak bisa mengakses endpoint ini.

## Role & Permission

Backend role admin sudah mencakup:

- List role dan permission: `/api/super-admin/roles`.
- Permission matrix: `/api/super-admin/permissions`.
- Update permission role: `/api/super-admin/roles/[id]/permissions`.
- Admin regional management: `/api/super-admin/admins`.
- Suspend, reset password, force logout, dan activity log admin regional.

Permission resmi saat ini:

- `*`
- `participants.read`
- `participants.create`
- `participants.update`
- `participants.verify`
- `events.read`
- `events.create`
- `events.update`
- `master-data.read`
- `master-data.write`
- `regional.manage`
- `analytics.read`
- `competition.verify`
- `competition.score`
- `settings.read`

Validasi backend permission sudah diperketat:

- Permission tidak dikenal ditolak.
- Permission duplikat dibersihkan sebelum disimpan.
- Permission `*` hanya boleh untuk Super Admin.
- Super Admin wajib tetap memiliki `*`.

## Dashboard & Role Access

- Admin Pusat memiliki akses ke dashboard pusat, audit logs, event pusat, narasumber, peserta, master data, master regional, finance, roles, permissions, dan payment gateway.
- Admin Regional memiliki akses ke dashboard regional, event regional, peserta regional, finance regional, payment gateway regional, dan master data regional.
- User/Peserta memiliki akses dashboard publik, profil, event terdaftar, sertifikat, ticket, dan registrasi event.

## Verifikasi Terakhir

Validasi lokal terakhir yang berhasil:

- `npm run lint`
- `npm run build`

Smoke test live terakhir yang berhasil:

- Super Admin bisa membaca roles, permissions, admins, dan regionals.
- Admin Regional ditolak dari endpoint super-admin dan Master Regional.
- Endpoint Master Data sudah permission-based untuk Admin Pusat dan Admin Regional sesuai scope.
