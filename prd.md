Dokumen Final: Modul Event & Ticketing (MPJ Apps)
**Versi:** 2026.1 (Terintegrasi dengan NIAM & Sistem Keuangan Kode Unik) | Backend: Laravel (Custom)
**Stack Frontend:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
**Status Data:** Sementara menggunakan dummy data (`lib/dummy.ts`). Nanti diganti Axios ke Laravel REST API tanpa perlu ubah komponen.

---

## 1. Konsep Utama Modul

Aplikasi publik berbasis web (seperti game.sarga.co) untuk menampilkan, mendaftarkan, dan mengelola kehadiran peserta event MPJ. Terdapat dua jalur pendaftaran (Anggota ber-NIAM & Umum) yang dilengkapi sistem pricing dinamis dan pembayaran tiket via kode unik. Modul ini juga berfungsi sebagai *Lead Generation* (rekrutmen anggota baru).

> **Catatan:** Admin Dashboard (pembuatan event, SDM panitia, LPJ, approval, takeover) sudah ditangani oleh sistem backend yang ada. Dokumen ini hanya mencakup sisi **publik & operasional lapangan**.

---

## 2. Struktur Database

### A. Tabel events (Data Induk)
 * id: UUID (PK)
 * title: String
 * category: Enum (Pelatihan, Seremonial, Rapat)
 * poster_url: String (rasio 4:5, max 100KB WebP/JPG)
 * description: Text
 * location_gmaps: String
 * start_date: Timestamp
 * is_open_for_public: Boolean (Aktifkan Jalur Umum)
 * is_paid: Boolean (Aktifkan Gateway Pembayaran)
 * price_niam: Integer (Harga khusus pemilik NIAM - *Bisa Rp 0*)
 * price_public: Integer (Harga untuk jalur umum)
 * status: Enum (DRAFT, PENDING, APPROVED, FINISHED, COMPLETED)
 * bank_account_id: FK ke rekening tujuan

### B. Tabel event_participants (Junction Table & Transaksi)
 * id: UUID (PK)
 * event_id: FK ke tabel events
 * crew_id: FK ke tabel crews (*Nullable* - untuk Jalur NIAM)
 * guest_id: FK ke tabel event_guests (*Nullable* - untuk Jalur Umum)
 * registration_path: Enum (NIAM, UMUM)
 * payment_status: Enum (Free, Unpaid, Pending_Approval, Paid)
 * unique_amount: Integer (Nominal transfer + 3 digit kode unik. Misal: 50.012)
 * payment_proof_url: String (Link Bukti Transfer)
 * attendance_status: Enum (Registered, Attended, Cancelled)
 * qr_token: String (Token unik untuk tiket/scan)

### C. Tabel event_guests (Temporary Data Calon Anggota)
 * id: UUID (PK)
 * full_name: String
 * institution_name: String
 * whatsapp: String
 * id_card_url: String

---

## 3. Halaman & Alur UI/UX

### Halaman 1: Event Listing (Home)
Tampilan utama seperti game.sarga.co — card-based, image-first.

**Komponen:**
 * Header: Logo MPJ + tombol Login (untuk panitia/scan)
 * Grid kartu event, setiap kartu menampilkan:
   * Poster event (rasio 4:5)
   * Nama event
   * Tanggal & lokasi
   * Badge status: `LIVE` / `UPCOMING` / `SELESAI`
   * Badge kategori: Pelatihan / Seremonial / Rapat
 * Filter: Semua / Upcoming / Selesai
 * State kosong: Pesan "Belum ada event" jika tidak ada data

**Aturan tampil:**
 * Hanya event berstatus `APPROVED` atau `FINISHED`/`COMPLETED` yang tampil
 * Event berstatus `DRAFT` / `PENDING` tidak tampil ke publik

---

### Halaman 2: Detail Event
Klik kartu event → masuk halaman detail.

**Komponen:**
 * Poster besar (full-width)
 * Nama, kategori, tanggal, jam, lokasi (dengan link Google Maps)
 * Deskripsi event
 * Info harga: Jalur NIAM & Jalur Umum (jika berbayar)
 * Tombol **"Daftar Sekarang"** (hanya muncul jika status `APPROVED`)
 * Jika status `FINISHED`/`COMPLETED`: tombol daftar tersembunyi, tampilkan label "Pendaftaran Ditutup"

---

### Halaman 3: Registrasi Peserta

**Langkah 1 — Pilih Jalur:**
 * Tombol: "Jalur NIAM (Anggota)" atau "Jalur Umum"
 * Jalur Umum hanya muncul jika `is_open_for_public = true`

**Langkah 2 — Input Data:**
 * **Jalur NIAM:** Input NIAM → sistem validasi ke backend → tampilkan ringkasan profil (nama, foto, unit)
 * **Jalur Umum:** Form manual (Nama Lengkap, No. WhatsApp, Asal Instansi, Upload KTP/Identitas)

**Langkah 3 — Konfirmasi & Invoice:**
 * Tampilkan ringkasan pendaftaran
 * Jika event **gratis**: langsung submit → status `Registered` → redirect ke halaman E-Tiket
 * Jika event **berbayar**:
   * Tampilkan invoice dengan kode unik (Contoh: Rp 100.**012**)
   * Info rekening tujuan
   * Tombol "Saya Sudah Transfer" → form upload bukti transfer
   * Setelah upload: status menjadi `Pending_Approval`, tampilkan halaman menunggu verifikasi

---

### Halaman 4: E-Tiket
Diakses setelah status `Paid` atau `Free`.

**Komponen:**
 * QR Code besar (dari `qr_token`)
 * Nama peserta, nama event, tanggal
 * Status tiket: `VALID` / `SUDAH DIGUNAKAN`
 * **Peserta NIAM:** Info bahwa E-ID Card NIAM mereka juga berlaku sebagai tiket
 * **Peserta Umum:** QR Code ini adalah satu-satunya tiket masuk
 * Tombol simpan / screenshot guide

---

### Halaman 5: Scan Absensi (Panitia — Mobile-First)
Halaman khusus panitia, diakses via login. Didesain untuk layar HP.

**Flow:**
 1. Panitia login → pilih event yang sedang berlangsung
 2. Kamera aktif otomatis (Web-Based QR Scanner)
 3. Peserta tunjukkan QR dari E-Tiket atau E-ID Card NIAM
 4. Scan sukses → tampilkan konfirmasi: nama peserta + foto (jika NIAM) + badge **HADIR**
 5. Scan gagal/sudah dipakai → tampilkan pesan error merah

**Validasi:**
 * Satu QR hanya bisa discan 1x per event (cegah absen ganda)
 * Sistem catat timestamp kehadiran

---

## 4. Fitur Pasca-Event (Conversion Funnel)

 1. 24 jam setelah acara selesai, sistem (backend) mengekstrak data `event_guests` berstatus `Attended`
 2. Admin Pusat dapat broadcast WhatsApp/Email ke tamu tersebut:
    > *"Terima kasih partisipasinya! Gabung menjadi anggota resmi MPJ untuk mendapatkan harga khusus di event selanjutnya."*
 3. Disertakan link pendaftaran anggota institusi

---

## 5. Data & Integrasi API

### Fase Development (Sekarang)
Seluruh data menggunakan **dummy data statis** di `lib/dummy.ts`. Shape data mengikuti struktur response API Laravel asli agar nanti migrasi mudah.

### Fase Production (Setelah Backend Siap)
Ganti source data di setiap page dengan Axios call ke Laravel REST API. Tidak perlu ubah komponen UI.

```
lib/dummy.ts  →  lib/api.ts (Axios + Sanctum token)
```

---

## 6. Ketentuan Teknis Frontend

 * **Image:** Poster ditampilkan dalam rasio 4:5, lazy-loaded
 * **QR Scanner:** html5-qrcode (web-based, akses kamera browser)
 * **Image Compression:** client-side sebelum upload (max 100KB)
 * **Auth Panitia:** Token-based via Laravel Sanctum (hanya untuk halaman Scan)
 * **API:** REST API dari Laravel backend
 * **Layout:** Mobile-only. Max-width ~430px, layout vertikal. Tidak perlu tampilan desktop.
