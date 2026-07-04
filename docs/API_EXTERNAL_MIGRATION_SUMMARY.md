# Ringkasan API Untuk Migrasi External API

Dokumen ini merangkum API yang saat ini tersedia di project **MPJ Event & Ticketing System** dan kebutuhan endpoint yang perlu disiapkan jika backend dipindahkan ke project API external.

## 1. Gambaran Arsitektur Saat Ini

API utama project saat ini berada di beberapa tempat:

- `app/api`: Next.js Route Handlers yang dipanggil langsung oleh frontend.
- `lib/server`: business logic server-side yang langsung membaca/menulis ke MySQL/MariaDB.
- `api-event`: modul Laravel API alternatif untuk deployment shared hosting.
- `backend`: Node.js API sederhana untuk service event terpisah.

Frontend saat ini mayoritas memanggil endpoint lokal `/api/...`. Karena itu, migrasi external API paling aman dilakukan bertahap dengan mempertahankan route Next.js sebagai proxy/BFF terlebih dahulu.

## 2. Auth & Session

Endpoint saat ini:

```text
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/user-register
POST /api/auth/user-register/request-otp
POST /api/auth/user-register/verify-otp
```

Kebutuhan external API:

- Login untuk Admin Pusat/Super Admin, Admin Regional, dan User/Peserta.
- Refresh token.
- Logout dan revoke session.
- Registrasi user publik.
- Request dan verifikasi OTP.
- Token/session harus membawa role dan permission.

Role yang digunakan:

```text
super-admin
regional-admin
user
```

## 3. Public Event & Registration

Endpoint saat ini:

```text
GET  /api/events
GET  /api/events/[id]
POST /api/events/[id]/register
POST /api/events/[id]/payment-proof
POST /api/events/payment-verified
GET  /api/institutions
GET  /api/members/niam
```

Kebutuhan external API:

- Listing event publik.
- Detail event publik.
- Registrasi peserta jalur NIAM/internal.
- Registrasi peserta jalur umum.
- Upload bukti pembayaran.
- Validasi NIAM/member.
- List institusi/pesantren/media/kru untuk pilihan form registrasi.
- Update status peserta setelah pembayaran verified.

Catatan migrasi:

- Response event harus menyertakan status publikasi, status pendaftaran, harga NIAM, harga umum, kuota, poster, narasumber, dan custom fields.
- Registrasi perlu mengembalikan data participant, payment, dan ticket/QR token jika sudah tersedia.

## 4. Ticket & Attendance

Endpoint saat ini:

```text
POST /api/tickets/verify
POST /api/tickets/check-in
```

Kebutuhan external API:

- Verifikasi tiket/QR.
- Check-in peserta.
- Validasi tiket tidak ditemukan.
- Validasi tiket sudah pernah discan.
- Validasi status pembayaran peserta.
- Simpan log attendance.

## 5. Admin Event

Endpoint saat ini:

```text
GET,POST             /api/admin/events
GET,PATCH,PUT,DELETE /api/admin/events/[id]
GET                  /api/admin/events/[id]/approval-logs
GET,POST             /api/admin/events/[id]/staff
PATCH,DELETE         /api/admin/events/[id]/staff/[staffId]
POST                 /api/admin/events/[id]/participants/[participantId]/confirm
```

Kebutuhan external API:

- CRUD event pusat.
- Approval dan reject event.
- Riwayat approval.
- Kelola staff/panitia event.
- Konfirmasi peserta manual.
- Validasi permission admin.

Catatan migrasi:

- Event perlu mendukung scope `pusat` dan `regional`.
- Approval log sebaiknya masuk audit/activity log.

## 6. Regional Event

Endpoint saat ini:

```text
GET,POST /api/regional/events
PATCH    /api/regional/events/[id]
POST     /api/regional/events/[id]/submit
POST     /api/regional/events/[id]/archive
```

Kebutuhan external API:

- Admin regional bisa membuat event regional.
- Admin regional hanya bisa melihat dan mengubah event pada `region_id` miliknya.
- Submit event regional untuk approval Admin Pusat.
- Archive event regional.

## 7. Participants

Endpoint saat ini:

```text
GET,POST /api/admin/participants
PATCH    /api/admin/participants/[id]
POST     /api/admin/participants/[id]/cancel
GET      /api/admin/participants/export

GET,POST /api/regional/participants
PATCH    /api/regional/participants/[id]
POST     /api/regional/participants/[id]/cancel
POST     /api/regional/participants/import
GET      /api/regional/participants/export
```

Kebutuhan external API:

- List peserta.
- Tambah peserta manual.
- Update peserta.
- Cancel peserta.
- Import peserta regional.
- Export peserta ke CSV.
- Filter berdasarkan event, status pembayaran, status hadir, tipe registrasi, scope, dan regional.

Catatan migrasi:

- Endpoint admin pusat boleh melihat data global.
- Endpoint regional wajib dibatasi berdasarkan `region_id`.

## 8. Finance

Endpoint saat ini:

```text
GET /api/finance/payments
GET /api/finance/events/summary
GET /api/finance/events/recap
GET /api/finance/events/export

GET      /api/events/[id]/finance/summary
GET      /api/events/[id]/finance/export
GET,POST /api/events/[id]/finance/transactions
PATCH    /api/events/[id]/finance/transactions/[transactionId]
POST     /api/events/[id]/finance/transactions/[transactionId]/void
```

Kebutuhan external API:

- Monitoring pembayaran.
- Summary finance global dan per event.
- Rekap pemasukan, pengeluaran, saldo, dan jumlah transaksi.
- CRUD transaksi manual.
- Void transaksi.
- Export finance ke CSV.

Catatan migrasi:

- Transaksi finance memiliki tipe `income` dan `expense`.
- Status transaksi minimal mendukung `posted` dan `void`.
- Sumber transaksi perlu membedakan pembayaran peserta dan transaksi manual.

## 9. Payment Gateway / Paymenku

Endpoint saat ini:

```text
GET,PATCH /api/finance/payment-gateway
GET,POST  /api/super-admin/payment-gateways
GET       /api/paymenku/channels
POST      /api/paymenku/status/[id]
POST      /api/paymenku/webhook
```

Kebutuhan external API:

- Simpan credential payment gateway secara terenkripsi.
- Ambil daftar channel Paymenku.
- Buat transaksi payment gateway saat registrasi event berbayar.
- Cek status transaksi.
- Terima webhook Paymenku.
- Validasi signature webhook.
- Update payment dan participant setelah transaksi valid.

Catatan migrasi:

- `/api/regional/payment-gateway` saat ini disabled dan mengembalikan `403`.
- Credential regional bisa disiapkan nanti jika model bisnis membutuhkan payment gateway per regional.

## 10. Certificate

Endpoint saat ini:

```text
GET,PATCH,POST /api/admin/events/[id]/certificates
PATCH          /api/admin/events/[id]/certificates/[certificateId]
GET            /api/public/me/certificates
```

Kebutuhan external API:

- Generate sertifikat peserta.
- List sertifikat event.
- Update konfigurasi sertifikat event.
- Revoke/reissue sertifikat.
- List sertifikat milik user.
- Verifikasi sertifikat publik berdasarkan kode.

Catatan migrasi:

- External API perlu menyimpan nomor sertifikat, verification code, status, template URL, generated file URL, checksum, dan timestamp penerbitan.

## 11. Master Data

Endpoint saat ini:

```text
GET,POST /api/admin/master-data/pesantren
PATCH    /api/admin/master-data/pesantren/[id]

GET,POST /api/admin/master-data/media
PATCH    /api/admin/master-data/media/[id]

GET,POST /api/admin/master-data/crew
PATCH    /api/admin/master-data/crew/[id]
```

Kebutuhan external API:

- CRUD pesantren.
- CRUD media.
- CRUD kru/NIAM.
- Public read-only endpoint untuk form registrasi.
- Scope data `pusat` dan `regional`.

Catatan migrasi:

- Admin Pusat bisa mengelola data scope pusat.
- Admin Regional hanya bisa mengelola data regional miliknya.
- User publik hanya membaca data untuk registrasi.

## 12. Speakers / Narasumber

Endpoint saat ini:

```text
GET,POST             /api/admin/speakers
GET,PATCH,PUT,DELETE /api/admin/speakers/[id]
```

Kebutuhan external API:

- CRUD narasumber.
- List narasumber untuk form create/edit event.
- Relasi narasumber dengan event.

## 13. Regional Management

Endpoint saat ini:

```text
GET,POST /api/regionals
PATCH    /api/regionals/[id]
```

Kebutuhan external API:

- List regional.
- Filter regional aktif.
- Create regional.
- Update regional.
- Hanya bisa diakses Admin Pusat/Super Admin.

## 14. RBAC / Super Admin

Endpoint saat ini:

```text
GET      /api/super-admin/roles
GET      /api/super-admin/permissions
PATCH    /api/super-admin/roles/[id]/permissions
GET,POST /api/super-admin/admins
PATCH    /api/super-admin/admins/[id]
POST     /api/super-admin/admins/[id]/suspend
POST     /api/super-admin/admins/[id]/reset-password
POST     /api/super-admin/admins/[id]/force-logout
GET      /api/super-admin/admins/[id]/activity
GET      /api/super-admin/users
GET      /api/super-admin/audit-logs
```

Kebutuhan external API:

- List role.
- List permission.
- Update permission role.
- CRUD admin regional.
- Suspend admin.
- Reset password admin.
- Force logout admin.
- Activity log admin.
- List public users.
- Audit logs.

Permission yang digunakan:

```text
*
participants.read
participants.create
participants.update
participants.verify
events.read
events.create
events.update
master-data.read
master-data.write
regional.manage
analytics.read
competition.verify
competition.score
settings.read
```

Catatan migrasi:

- Permission `*` hanya untuk Super Admin/Admin Pusat.
- Permission tidak dikenal harus ditolak.
- Admin Regional tidak boleh mengakses endpoint super-admin.

## 15. Dashboard

Endpoint saat ini:

```text
GET /api/dashboard/admin-pusat
GET /api/dashboard/regional
GET /api/dashboard/user
```

Kebutuhan external API:

- Summary dashboard Admin Pusat.
- Summary dashboard Admin Regional.
- Summary dashboard User/Peserta.
- Data dashboard perlu mengikuti role dan scope user.

## 16. User Profile

Endpoint saat ini:

```text
GET,PATCH /api/public/me
GET       /api/public/me/events
GET       /api/public/me/certificates
```

Kebutuhan external API:

- Ambil profil user login.
- Update profil user.
- Riwayat event user.
- Sertifikat user.

## 17. Upload / File

Endpoint saat ini:

```text
POST /api/admin/uploads/poster
POST /api/admin/uploads/finance-proof
POST /api/admin/uploads/certificate-template
GET  /api/uploads/posters/[filename]
```

Kebutuhan external API:

- Upload poster event.
- Upload bukti finance.
- Upload template sertifikat.
- Serve file publik atau signed URL.

Catatan migrasi:

- External API perlu menentukan storage: local disk, S3-compatible/object storage, atau storage MPJ existing.
- Response upload sebaiknya mengembalikan URL publik, nama file, MIME type, dan ukuran file.

## 18. AI Chat

Endpoint saat ini:

```text
POST /api/ai/chat
```

Kebutuhan external API:

- Endpoint ini opsional untuk dipindahkan.
- Jika tetap di Next.js, API external cukup menyediakan data event/ticket/profile yang dibutuhkan chatbot.
- Jika dipindahkan, external API perlu menjaga chatbot tetap read-only.

## 19. Health & Debug

Endpoint saat ini:

```text
GET  /api/health/db
GET  /api/debug/users
POST /api/debug/users/seed-test
```

Kebutuhan external API:

- Health check database/API.
- Debug endpoint tidak perlu dibawa ke production external API.

## 20. Laravel `api-event` Existing Routes

Modul Laravel `api-event` sudah memiliki route berikut:

```text
GET    /api-event/v1/event
GET    /api-event/v1/event/niam/validate/{niam}
GET    /api-event/v1/event/ticket/{token}
POST   /api-event/v1/event/{id}/register
POST   /api-event/v1/event/payment/proof
GET    /api-event/v1/event/{id}

GET    /api-event/v1/event/admin/list
POST   /api-event/v1/event/admin
GET    /api-event/v1/event/admin/{id}
PUT    /api-event/v1/event/admin/{id}
DELETE /api-event/v1/event/admin/{id}
PATCH  /api-event/v1/event/admin/{id}/status
POST   /api-event/v1/event/admin/{id}/custom-fields
POST   /api-event/v1/event/admin/{id}/poster
GET    /api-event/v1/event/admin/{id}/participants
GET    /api-event/v1/event/admin/{id}/stats
GET    /api-event/v1/event/admin/{id}/export-csv

POST   /api-event/v1/event/attendance/check-in
GET    /api-event/v1/event/attendance/{eventId}/log
GET    /api-event/v1/event/attendance/verify/{token}

GET    /api-event/v1/event/finance/summary
GET    /api-event/v1/event/finance/recap
GET    /api-event/v1/event/finance/export
GET    /api-event/v1/event/{eventId}/finance/transactions
POST   /api-event/v1/event/{eventId}/finance/transactions
PUT    /api-event/v1/event/{eventId}/finance/transactions/{transactionId}
POST   /api-event/v1/event/{eventId}/finance/transactions/{transactionId}/void
```

Catatan:

- Laravel `api-event` mencakup sebagian besar domain event, registration, ticket, attendance, payment proof, dan finance.
- Laravel `api-event` belum mencakup seluruh kebutuhan RBAC, user profile, dashboard lengkap, regional management, master data lengkap, payment gateway credential, dan certificate flow lengkap.

## 21. Prioritas Migrasi

Prioritas utama:

```text
Auth
Events
Registration
Participants
Tickets/check-in
Payments
Finance
Master Data
RBAC
Regional
User Profile
Uploads
```

Prioritas belakangan:

```text
AI Chat
Debug endpoints
Dev preview endpoints
Legacy backend Node API
Laravel api-event jika bukan target utama
```

## 22. Rekomendasi Strategi Migrasi

Rekomendasi awal:

- Pertahankan Next.js route `/api/...` sebagai proxy/BFF ke external API.
- Frontend tetap memanggil endpoint lokal yang sama.
- Business logic dan database dipindahkan bertahap ke external API.
- Setelah external API stabil, pertimbangkan frontend direct fetch ke `NEXT_PUBLIC_API_BASE_URL`.

Alasan:

- Perubahan frontend lebih kecil.
- Session cookie masih bisa dikontrol oleh Next.js.
- Risiko regresi lebih rendah.
- Endpoint lama bisa dimigrasikan satu per satu.

## 23. Standar Response Yang Disarankan

Response sukses:

```json
{
  "ok": true,
  "data": {}
}
```

Response error:

```json
{
  "ok": false,
  "error": "Pesan error"
}
```

Untuk list/pagination:

```json
{
  "ok": true,
  "data": [],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100
  }
}
```

## 24. Kebutuhan External API Minimum

External API perlu menyediakan:

- Auth access token dan refresh token.
- RBAC role dan permission.
- Scope regional.
- Database schema untuk event, participants, payments, finance, certificates, users, roles, permissions, regionals, audit logs, speakers, dan master data.
- File upload/storage.
- Paymenku integration.
- Webhook verification.
- CSV export.
- Audit/activity log.
- Health check.

## 25. Endpoint Yang Tidak Perlu Dibawa Ke Production

Endpoint berikut sebaiknya tidak dibawa ke production external API:

```text
GET  /api/debug/users
POST /api/debug/users/seed-test
```

Route `dev-preview` juga tidak perlu dimigrasikan sebagai API production karena hanya untuk preview/development UI.
