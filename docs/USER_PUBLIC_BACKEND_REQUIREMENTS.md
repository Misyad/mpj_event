# USER_PUBLIC_BACKEND_REQUIREMENTS

## Tujuan Backend

Backend fase berikutnya perlu mendukung area user publik MPJ Event untuk:

1. mengambil profil user publik
2. memperbarui profil user publik
3. mengambil riwayat event milik user
4. mengambil riwayat sertifikat milik user

Frontend fase saat ini sudah memindahkan route user dari `/dashboard` ke `/profile` dan telah menyiapkan empty state, tetapi backend belum diimplementasikan.

## Data Minimal Akun User

Data minimal yang dibutuhkan untuk area user publik:

- `id`
- `full_name`
- `email`
- `whatsapp`
- `created_at`
- `updated_at`
- status verifikasi email jika pattern OTP/email verification dipakai

Catatan:

- `instansi` tidak masuk ke profil user pada fase ini
- `NIAM` tidak masuk ke profil user pada fase ini
- `instansi` dan `NIAM` tetap berada di flow event registration

## Endpoint yang Disarankan

Rekomendasi endpoint untuk tim backend. Endpoint ini **belum** diimplementasikan pada fase frontend sekarang:

- `GET /api/user/profile`
- `PATCH /api/user/profile`
- `GET /api/user/events`
- `GET /api/user/certificates`

## Response Shape yang Disarankan

Contoh profile:

```json
{
  "id": "user_id",
  "fullName": "Nama User",
  "email": "user@email.com",
  "whatsapp": "628xxxx"
}
```

Contoh riwayat event:

```json
{
  "items": [
    {
      "registrationId": "reg_id",
      "eventId": "event_id",
      "eventTitle": "Nama Event",
      "eventDate": "2026-05-13",
      "status": "VERIFIED",
      "ticketCode": "TICKET123"
    }
  ]
}
```

Contoh sertifikat:

```json
{
  "items": [
    {
      "certificateId": "cert_id",
      "eventTitle": "Nama Event",
      "certificateCode": "CERT123",
      "issuedAt": "2026-05-13",
      "certificateUrl": "/certificate/CERT123"
    }
  ]
}
```

## Aturan Akses

- semua endpoint user harus membutuhkan login role `user`
- user hanya boleh melihat dan mengubah data miliknya sendiri
- jangan expose data peserta lain
- jangan expose data admin

## Integrasi dengan Event Registration

- setelah user login, data `full_name`, `email`, dan `whatsapp` bisa dipakai untuk autofill event registration
- `NIAM` tetap opsional di form event registration
- harga anggota tetap ditentukan dari validasi `NIAM` saat daftar event/payment, bukan dari profil user

## Acceptance Criteria Backend Fase Berikutnya

- user bisa mengambil profilnya sendiri
- user bisa update `full_name` dan `whatsapp`
- email readonly atau hanya bisa diubah lewat flow verifikasi email terpisah
- user bisa melihat riwayat event miliknya
- user bisa melihat sertifikat miliknya
- semua data dibatasi berdasarkan authenticated user
