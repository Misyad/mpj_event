# Status Project MPJ Event

Tanggal: 2026-05-13  
Branch: `merge/rou-event-into-main`  
Commit terakhir saat dokumen dibuat: `769e1bb feat: connect speakers to backend`

## Ringkasan

MPJ Event adalah aplikasi event dan ticketing berbasis Next.js App Router untuk mengelola event, peserta, pembayaran, narasumber, tiket QR, sertifikat, area admin pusat, area regional, dan area profil pengguna publik.

Stack utama:

- Next.js `16.2.4`
- React `19.2.4`
- TypeScript
- Tailwind CSS 4
- MySQL via `mysql2`
- Docker Compose untuk deploy
- Adminer untuk akses database
- AI chatbot read-only dengan provider OpenAI atau Ollama lokal

## Modul Yang Sudah Berjalan Dengan Backend

### 1. Event

Status: sudah backend-backed.

Fitur utama:

- List event admin dari `/api/admin/events`.
- Detail event dari `/api/admin/events/[id]`.
- Create/update event melalui service `lib/server/events.ts`.
- Regional event sudah scoped berdasarkan `regionId`.
- Public event dan register event mengambil data dari API/server.
- Ringkasan peserta pada halaman kelola event sudah memakai `registeredCount` atau `current_participants`, bukan dummy.

File penting:

- `lib/server/events.ts`
- `app/api/admin/events/route.ts`
- `app/api/admin/events/[id]/route.ts`
- `app/api/regional/events/route.ts`
- `app/admin/events/page.tsx`
- `app/admin/events/new/page.tsx`

### 2. Peserta

Status: sudah backend-backed.

Fitur utama:

- Data peserta admin dari `/api/admin/participants`.
- Data peserta regional dari `/api/regional/participants`.
- Peserta event detail dari `/api/admin/events/[id]`.
- Registrasi publik membuat participant dan payment record di backend.
- Konfirmasi pembayaran mengaktifkan status peserta dan QR.

File penting:

- `app/api/admin/participants/route.ts`
- `app/api/regional/participants/route.ts`
- `app/api/events/[id]/register/route.ts`
- `app/api/events/payment-verified/route.ts`
- `lib/server/events.ts`

### 3. Payment

Status: sudah backend-backed.

Fitur utama:

- Payment core tersimpan di database.
- Mendukung manual payment dan gateway Paymenku.
- Kredensial Paymenku dipisah antara Admin Pusat dan Admin Regional.
- Admin Pusat hanya melihat status/masked credential regional.
- Admin Regional mengelola credential regional sendiri.

File penting:

- `lib/server/events.ts`
- `lib/server/paymenku.ts`
- `lib/server/payment-gateway-credentials.ts`
- `app/api/super-admin/payment-gateways/route.ts`
- `app/api/regional/payment-gateway/route.ts`
- `app/api/paymenku/webhook/route.ts`

### 4. Narasumber

Status: sudah backend-backed.

Pembaruan terakhir:

- Menambahkan service database `lib/server/speakers.ts`.
- Menambahkan API admin `/api/admin/speakers`.
- Menambahkan API admin `/api/admin/speakers/[id]`.
- Halaman daftar narasumber tidak lagi memakai `dummySpeakers`.
- Form tambah narasumber menyimpan data ke database.
- `SpeakerCombobox` pada form event mengambil data narasumber dari backend.
- Halaman kelola event menampilkan nama narasumber dari backend.

File penting:

- `lib/server/speakers.ts`
- `app/api/admin/speakers/route.ts`
- `app/api/admin/speakers/[id]/route.ts`
- `app/admin/narasumber/page.tsx`
- `app/admin/narasumber/new/page.tsx`
- `components/SpeakerCombobox.tsx`

## Auth Dan Role

Auth sudah database-backed dengan struktur:

- `users`
- `roles`
- `user_roles`
- `permissions`
- `role_permissions`
- `admin_sessions`
- `admin_login_history`

Role internal:

- `super-admin`
- `regional-admin`
- `user`

Nama product-facing untuk super admin adalah Admin Pusat. Route modern yang dipakai adalah `/admin-pusat`, sementara route lama tetap dijaga kompatibel.

## Akun Default Development

Akun ini di-seed melalui `lib/server/rbac.ts` saat schema RBAC dipastikan tersedia.

| Role | Email | Password |
| --- | --- | --- |
| Admin Pusat | `superadmin@mpj.local` | `Admin123!` |
| Admin Regional Jawa Timur | `regional.jatim@mpj.local` | `Admin123!` |
| User/Peserta | `user@mpj.local` | `Admin123!` |

## AI Chatbot

Status: sudah ada floating read-only assistant.

Provider yang didukung:

- OpenAI API jika `OPENAI_API_KEY` tersedia.
- Ollama lokal jika env diarahkan ke provider lokal.

Catatan:

- Jika memakai OpenAI, layanan membutuhkan API key dan biasanya berbayar sesuai pemakaian.
- Jika memakai Ollama, model berjalan di server sendiri. Model yang pernah direncanakan: `llama3.2:3b`.
- Chatbot saat ini read-only dan belum menyimpan histori chat.

## Deploy Dan Infrastruktur

Target server yang digunakan:

- SSH host: `192.168.1.100`
- User: `root`
- Container LXC: `103`
- App container: `mpj-event-app`
- API container: `mpj-event-api`
- MySQL container: `mysql_server`
- Adminer: `http://192.168.1.100:8081`

Adminer:

- System: `MySQL`
- Server: `mysql_server`
- User: `root`
- Password: `Admin123!`
- Database: `app_db`

Jenkins mengambil branch:

- `origin/merge/rou-event-into-main`

## Validasi Terakhir

Validasi lokal terakhir berhasil:

```bash
cmd /c npx tsc --noEmit --pretty false
cmd /c npm run build
```

Hasil:

- TypeScript check sukses.
- Next.js production build sukses.
- Commit sudah dipush ke `origin/merge/rou-event-into-main`.

## Catatan Lanjutan

Prioritas lanjutan yang masih masuk akal:

1. Jalankan Jenkins build setelah commit `769e1bb`.
2. Smoke test login semua role.
3. Smoke test API narasumber dengan akun Admin Pusat.
4. Smoke test create event dengan narasumber dari DB.
5. Smoke test registrasi peserta dan payment verification.
6. Tambahkan UI edit/delete narasumber jika dibutuhkan, karena API backend sudah mendukung update dan delete.

