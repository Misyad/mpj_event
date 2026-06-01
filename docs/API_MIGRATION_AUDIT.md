# API Migration Audit

Tanggal audit: 2026-06-02

Target stabilisasi:
- `api-event` tetap source of truth untuk event runtime.
- `mpj-api-main` menjadi kandidat upstream auth, user, role, regional, pesantren, crew, dan NIAM.
- `app/api/*` legacy tidak dihapus, tetapi dependency baru harus lewat adapter.

## Adapter Baru

| Adapter | Fungsi | Status |
| --- | --- | --- |
| `lib/api-event/*` | Event runtime, registration, payment, finance event, attendance contract | Aktif |
| `lib/mpj-api/*` | Koneksi awal ke `mpj-api-main` untuk auth dan master data | Siap dipakai bertahap |
| `lib/legacy-api/*` | Wrapper eksplisit untuk endpoint legacy yang belum dimigrasikan | Siap dipakai untuk isolasi |

## Legacy Dependency Map

| Area | Legacy endpoint utama | Target | Status migrasi |
| --- | --- | --- | --- |
| Public event list/detail/register/ticket | `/api/events*`, `/api/events/[id]/register`, `/api/events/[id]/payment-proof` | `api-event` | Migrated untuk flow public utama |
| Admin event list/create/update/status/poster | `/api/admin/events*`, `/api/admin/uploads/poster` | `api-event` | Migrated untuk Admin Pusat list/create/update/status/poster |
| Event finance panel/recap | `/api/events/[id]/finance/*`, `/api/finance/events/*` | `api-event` | Migrated untuk load/save/void/recap; export masih legacy |
| Scanner attendance | `/api/tickets/check-in` | `api-event` attendance | Prepared; scanner existing sekarang lewat server action `api-event` |
| Approval logs | `/api/admin/events/{id}/approval-logs` | Belum ada endpoint Laravel setara | Keep legacy |
| Certificates | `/api/admin/events/{id}/certificates*` | Belum ada endpoint Laravel setara | Keep legacy |
| Event staff/panitia | `/api/admin/events/{id}/staff*` | Belum ada endpoint Laravel setara | Keep legacy |
| Speakers/narasumber | `/api/admin/speakers*` | `mpj-api-main` atau modul event berikutnya | Keep legacy |
| Master data pesantren/media/crew | `/api/admin/master-data/*`, `/api/institutions` | `mpj-api-main` public/admin master data | `/api/institutions` migrated untuk pesantren directory/search; media/unit masih legacy supplement dan fallback |
| Auth/public user/register/logout | `/api/auth/*`, `/api/public/me*` | `mpj-api-main` auth/profile | Candidate next migration; perlu mapping session cookie/JWT |
| RBAC super-admin | `/api/super-admin/*`, `/api/regionals*` | `mpj-api-main` auth/role/regional | Candidate next migration |
| Payment gateway config | `/api/paymenku/*`, `/api/*/payment-gateway*` | Belum diputuskan | Keep legacy |
| AI chat/audit logs/debug | `/api/ai/chat`, `/api/super-admin/audit-logs`, `/api/debug/*` | Internal Next.js | Keep legacy/internal |

## Rules Mulai Step Ini

- Komponen baru tidak boleh memanggil `fetch('/api/...')` langsung kecuali endpoint tersebut tercatat `Keep legacy/internal`.
- Integrasi ke `mpj-api-main` harus lewat `lib/mpj-api`.
- Default `mpj-api-main` adalah `https://mpj-api.demotesting.fun/api`; override hanya lewat `MPJ_API_BASE_URL` atau `NEXT_PUBLIC_MPJ_API_BASE_URL`.
- Integrasi ke Laravel `api-event` harus lewat `lib/api-event`.
- Jika endpoint target belum setara, fallback harus eksplisit dan terdokumentasi di file ini.
- `/api/institutions` sekarang memprioritaskan `mpj-api-main` via `lib/mpj-api`; legacy fallback hanya menjaga dropdown registrasi tetap tersedia saat upstream gagal, dan media/unit tetap legacy supplement sampai endpoint setara ada.
- Jangan merge schema event `api-event` ke `mpj-api-main` tanpa mapping event, registration, payment, ticket, dan attendance.

## Next Candidate Slice

1. Evaluasi auth bridge: Next session cookie saat ini vs JWT `mpj-api-main`.
2. Migrasikan speaker/narasumber jika model target di `mpj-api-main` sudah jelas.
3. Buat endpoint Laravel setara untuk approval logs/certificates/staff sebelum menghapus legacy.
4. Tambahkan endpoint `mpj-api-main` setara untuk media/unit agar supplement legacy `/api/institutions` bisa dihapus.
