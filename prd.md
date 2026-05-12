Dokumen Final: Modul Event & Ticketing (MPJ Apps)
**Versi:** 2026.2 (UX Register Disederhanakan + Auto-Detect NIAM) | Backend: Laravel (Custom)
**Stack Frontend:** Next.js 16.2.4 (App Router) + Tailwind CSS v4 + shadcn/ui
**Status Data:** Sementara menggunakan dummy data (`lib/dummy.ts`). Nanti diganti ke Laravel REST API / MPJ Apps API tanpa perlu ubah arsitektur UI utama.

---

## 1. Konsep Utama Modul

Aplikasi publik berbasis web untuk menampilkan event, menerima pendaftaran, mengelola pembayaran tiket, dan mendukung absensi QR saat acara berlangsung.

Konsep jalur **NIAM** dan **UMUM** tetap dipertahankan di level data dan backend, tetapi **tidak lagi menjadi pilihan manual di awal flow publik**. Jalur peserta sekarang ditentukan otomatis oleh sistem:

- jika user memiliki **NIAM valid**, pendaftaran diproses sebagai **NIAM**
- jika NIAM kosong / tidak valid / tidak ditemukan, pendaftaran diproses sebagai **UMUM**

> **Catatan:** Admin Dashboard (pembuatan event, SDM panitia, LPJ, approval, takeover) tetap ditangani di sistem backend/admin. Dokumen ini fokus pada sisi **publik & operasional lapangan**.

---

## 2. Struktur Database

### A. Tabel events (Data Induk)
 * id: UUID (PK)
 * title: String
 * category: Enum (Pelatihan, Seremonial, Rapat)
 * poster_url: String
 * description: Text
 * location_gmaps: String
 * start_date: Timestamp
 * is_open_for_public: Boolean
 * is_paid: Boolean
 * price_niam: Integer (Harga anggota / pemilik NIAM)
 * price_public: Integer (Harga umum / non-anggota)
 * status: Enum (DRAFT, PENDING, APPROVED, FINISHED, COMPLETED)
 * bank_account_id: FK ke rekening tujuan

### B. Tabel event_participants (Junction Table & Transaksi)
 * id: UUID (PK)
 * event_id: FK ke tabel events
 * crew_id: FK ke tabel crews (*Nullable* - untuk peserta NIAM)
 * guest_id: FK ke tabel event_guests (*Nullable* - untuk peserta UMUM)
 * registration_path: Enum (NIAM, UMUM)
 * payment_status: Enum (Free, Unpaid, Pending_Approval, Paid)
 * unique_amount: Integer
 * payment_proof_url: String
 * attendance_status: Enum (Registered, Attended, Cancelled)
 * qr_token: String

### C. Tabel event_guests
 * id: UUID (PK)
 * full_name: String
 * institution_name: String
 * whatsapp: String
 * id_card_url: String

> **Catatan penting:** Struktur database tetap mempertahankan `registration_path`, `crew_id`, dan `guest_id` karena backend masih perlu membedakan anggota dan non-anggota, walaupun UI publik sudah disederhanakan.

---

## 3. Halaman & Alur UI/UX

### Halaman 1: Event Listing (Home)
Tampilan utama berbasis card, mobile-first.

**Komponen:**
 * Header: Logo MPJ + tombol Login
 * Daftar event aktif dan event selesai
 * Kartu event menampilkan:
   * Poster
   * Nama event
   * Lokasi
   * Tanggal
   * Badge status publik: `Published` / `Selesai`

**Aturan tampil:**
 * Hanya event `APPROVED`, `FINISHED`, dan `COMPLETED` yang tampil ke publik
 * Event `DRAFT` / `PENDING` tidak tampil

---

### Halaman 2: Detail Event
Klik kartu event membuka halaman detail.

**Komponen:**
 * Poster besar
 * Nama event
 * Badge status dan kategori
 * Jadwal + lokasi + link Google Maps
 * Deskripsi event
 * Jika event berbayar: tampil satu informasi harga publik dengan label **HTM Event**
 * Tombol **Daftar Sekarang** jika status `APPROVED`
 * Jika status `FINISHED` / `COMPLETED`: tampil label pendaftaran ditutup

**Catatan pricing publik:**
 * Harga anggota (`price_niam`) tetap dipertahankan di sistem
 * Namun di halaman detail publik yang ditampilkan hanya harga umum / publik (`price_public`) dengan redaksi **HTM Event**

---

### Halaman 3: Registrasi Peserta

Flow pendaftaran publik disederhanakan dan tidak lagi menampilkan pilihan:
- Jalur NIAM
- Jalur Umum

Sebagai gantinya, sistem menggunakan **auto-detect NIAM** dan data profil user/login.

#### Progress Step
 1. **Data Diri**
 2. **Pembayaran**
 3. **Selesai**

#### Kondisi User

##### A. User sudah login dan data lengkap
 * Sistem mengambil data profil yang tersedia
 * Auto-fill:
   * NIAM / Nomor Anggota
   * Nama Lengkap
   * Nomor WhatsApp
   * Asal Pesantren / Instansi
 * Jika data lengkap dan NIAM valid:
   * tampil ringkasan / konfirmasi data singkat
   * user tidak perlu isi form ulang
   * internal `registration_path = NIAM`
   * harga memakai `price_niam`

##### B. User sudah login tapi data belum lengkap
 * Sistem menampilkan form data diri
 * Field yang tersedia sudah terisi sebagian
 * User hanya melengkapi data yang kosong

##### C. User belum login
 * Langsung masuk ke form data diri manual

#### Field Data Diri
 * **NIAM / Nomor Anggota**
   * opsional
   * helper text:
     *Isi jika Anda anggota MPJ. Kosongkan jika belum memiliki NIAM.*
 * **Nama Lengkap**
 * **Nomor WhatsApp**
 * **Asal Pesantren / Instansi**

#### Perilaku NIAM
 * Jika NIAM valid / ditemukan:
   * internal `registration_path = NIAM`
   * harga memakai `price_niam`
   * boleh tampil microcopy positif seperti:
     - `Data anggota terdeteksi`
     - `Harga anggota diterapkan`
 * Jika NIAM kosong:
   * internal `registration_path = UMUM`
   * harga memakai `price_public`
   * tidak perlu pesan tambahan
 * Jika NIAM diisi tetapi tidak valid / tidak ditemukan:
   * internal `registration_path = UMUM`
   * harga memakai `price_public`
   * tidak tampil warning/error merah
   * flow tetap lanjut normal

#### Field Asal Pesantren / Instansi
Field ini tidak lagi berupa input teks bebas biasa. UX-nya menggunakan **searchable autocomplete / combobox floating**:

 * User mengetik nama pesantren/instansi
 * Suggestion muncul floating di bawah input
 * Dropdown tidak mendorong layout ke bawah
 * User klik satu opsi, nilai langsung mengisi input
 * Sumber data sementara berasal dari master data dummy frontend:
   * pesantren
   * media/unit
   * data turunan organisasi yang relevan

**Empty state:**
 * Jika data tidak ditemukan, tampil pesan halus:
   *`Data belum tersedia. Pastikan penulisan sudah benar.`*
 * Untuk event publik, boleh ada aksi:
   *`Gunakan sebagai instansi baru`*
 * Tidak ada error merah

**Auto-fill instansi:**
 * Jika user login punya data instansi, field ini otomatis terisi
 * Jika NIAM valid dan data anggota punya unit/pesantren, field ini ikut otomatis terisi

---

### Halaman 4: Konfirmasi & Pembayaran

Setelah data valid:

#### Jika event gratis (`is_paid = false`)
 * Submit pendaftaran
 * Tampilkan state sukses
 * Redirect ke halaman tiket menggunakan query:

```text
/ticket?token=...
```

#### Jika event berbayar (`is_paid = true`)
 * Tampilkan invoice
 * Tampilkan harga tiket sesuai hasil auto-detect:
   * `price_niam` jika NIAM valid
   * `price_public` jika umum
 * Tampilkan kode unik
 * Tampilkan rekening tujuan
 * User upload bukti transfer
 * Setelah upload:
   * status menjadi `Pending_Approval`
   * tampil state **Menunggu Verifikasi Panitia**
   * user **tidak langsung** diarahkan ke tiket aktif sebelum status `Paid`

---

### Halaman 5: E-Tiket
Diakses setelah status `Free` atau `Paid`.

**Akses route:**

```text
/ticket?token=...
```

**Komponen:**
 * QR Code dari `qr_token`
 * Nama peserta
 * Informasi event
 * Status tiket
 * Info tambahan untuk peserta NIAM bila relevan

**Fallback UX:**
 * Jika token kosong: tampil pesan token tidak ditemukan
 * Jika token tidak valid: tampil pesan tiket tidak ditemukan
 * Tidak menggunakan route `/ticket/[token]`

---

### Halaman 6: Scan Absensi (Panitia)
Halaman mobile-first untuk panitia.

**Flow:**
 1. Panitia login
 2. Kamera aktif
 3. Scan QR peserta
 4. Jika sukses: tampil nama + status hadir
 5. Jika gagal / sudah digunakan: tampil pesan gagal

---

## 4. Data & Integrasi API

### Fase Development (Sekarang)
Seluruh data masih menggunakan **dummy data statis**.

Beberapa adapter frontend-only sudah disiapkan agar nanti mudah diganti ke API nyata:

 * `getCurrentUser()` untuk simulasi session/login publik
 * `getInstitutionOptions()` untuk master data instansi
 * `searchInstitutions(query)` untuk autocomplete instansi

Adapter tersebut hanya untuk pengembangan frontend dan nanti dapat diganti ke source data MPJ Apps / Laravel tanpa mengubah alur UI utama.

### Fase Production (Setelah Backend Siap)
Source data akan dipindah ke backend / API:

 * event listing
 * detail event
 * validasi NIAM
 * profile login user
 * master pesantren / instansi
 * registrasi peserta
 * pembayaran
 * verifikasi tiket

---

## 5. Ketentuan Teknis Frontend

 * Mobile-first, max-width sekitar 430px
 * QR scanner berbasis web
 * Ticket route tetap memakai query `token`
 * Detail event publik hanya menampilkan `HTM Event`
 * Harga final peserta tetap ditentukan di step pembayaran / invoice
 * Logic backend/database tidak berubah meskipun UX register disederhanakan
