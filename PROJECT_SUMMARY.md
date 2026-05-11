# Snapshot Fitur Event

Dokumen ini merangkum logika inti dari fitur **Event & Ticketing**.

## 🚀 Komponen Utama Event
1. **Event Card**: Menampilkan poster (4:5), judul, kategori, dan status (Live/Selesai).
2. **Registration Engine**: Menangani perbedaan alur antara anggota ber-NIAM dan peserta umum.
3. **Payment Gate (Manual)**: Validasi bukti transfer dengan sistem kode unik 3 digit.
4. **QR Attendance**: Sistem absensi real-time berbasis web.

## 🛠️ Logika Kode (Event)

### Struktur Data Event (`lib/dummy.ts`)
```typescript
{
  id: '1',
  title: 'Workshop UI/UX',
  is_open_for_public: true,
  price_niam: 25000,
  price_public: 100000,
  status: 'APPROVED', // APPROVED | PENDING | FINISHED
}
```

### Jalur Registrasi (`components/RegisterForm.tsx`)
```typescript
// Pseudo-logic pendaftaran
if (path === 'NIAM') {
  validateNiam(input); // Cek ke database
} else {
  collectPublicData(); // Nama, WA, KTP
}
```

### Scanner QR (`app/(public)/scan/page.tsx`)
- Menggunakan `Html5QrcodeScanner`.
- Endpoint validasi: Memeriksa `qr_token` dan mengubah `attendance_status` menjadi `Attended`.

## 📂 File Relevan
- `/app/(public)/events`: Listing & Detail.
- `/app/(public)/scan`: Scanner Lapangan.
- `/components/RegisterForm.tsx`: Logika Pendaftaran.

---
*Snapshot difokuskan pada fungsionalitas Event.*
