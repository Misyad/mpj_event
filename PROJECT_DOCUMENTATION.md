# Dokumentasi Fitur: MPJ Event System

## Ringkasan Fitur Event
Fitur utama dari aplikasi ini adalah pengelolaan siklus hidup event, mulai dari publikasi, pendaftaran peserta, hingga absensi di lokasi acara menggunakan teknologi QR Code.

## 1. Siklus Hidup Event (Event Status)
Setiap event memiliki status yang menentukan perilakunya di sisi publik:
- **DRAFT / PENDING**: Event sedang dipersiapkan dan tidak muncul di halaman utama publik.
- **APPROVED (LIVE)**: Event aktif, muncul di listing, dan tombol "Daftar Sekarang" tersedia.
- **FINISHED / COMPLETED**: Event telah selesai. Muncul di listing (opsional sebagai riwayat), namun pendaftaran ditutup.

## 2. Alur Pendaftaran (Registration Flow)
Sistem mendukung dua jalur pendaftaran yang berbeda:

### A. Jalur NIAM (Anggota Internal)
- **Input**: Peserta memasukkan Nomor Induk Anggota (NIAM).
- **Validasi**: Sistem memeriksa NIAM ke database (dummy/API).
- **Hasil**: Menampilkan data profil (Nama, Foto, Unit). Peserta mendapatkan harga khusus (seringkali lebih murah atau gratis).

### B. Jalur Umum (Public)
- **Formulir**: Nama Lengkap, No. WhatsApp, Asal Instansi.
- **Upload**: Mengunggah foto identitas (KTP/Lainnya).
- **Harga**: Menggunakan tarif publik yang ditentukan admin.

## 3. Sistem Pembayaran & Tiket
- **Invoice**: Jika event berbayar, sistem menghasilkan nominal unik (contoh: Rp 50.012).
- **Verifikasi**: Peserta mengunggah bukti transfer. Status berubah menjadi `Pending_Approval`.
- **E-Tiket**: Setelah disetujui, peserta mendapatkan akses ke halaman Tiket yang berisi **QR Code** unik.

## 4. Operasional Lapangan (QR Scanner)
- **Akses Panitia**: Panitia masuk ke halaman `/scan`.
- **Scan**: Menggunakan kamera smartphone untuk memindai QR Code peserta.
- **Feedback**:
  - **Hijau**: Berhasil (Hadir). Menampilkan nama dan foto peserta.
  - **Merah**: Gagal (Sudah discan sebelumnya atau tiket tidak valid).

## 5. Kustomisasi Formulir (Custom Fields)
Setiap event dapat memiliki pertanyaan tambahan yang bersifat dinamis (mirip Google Forms):
- **Tipe Field**: Text (Short/Long), Radio Button, Dropdown, Checkbox.
- **Validasi**: Mendukung penentuan field wajib (`is_required`).
- **Penyimpanan**: Jawaban disimpan dalam junction table peserta untuk keperluan statistik panitia.

## 6. Dashboard Admin (Master Event)
Admin memiliki kontrol penuh terhadap manajemen event:
- **Statistik Cepat**: Melihat total pendaftar, pembayaran tertunda, dan kuota tersedia.
- **Approval Pembayaran**: Memverifikasi bukti transfer untuk mengubah status tiket menjadi `Paid`.
- **Manajemen Peserta**: Ekspor data pendaftar dan pemantauan kehadiran (real-time dari scanner).
- **Manajemen Konten**: Mengatur deskripsi, poster, harga, dan narasumber.

## Struktur File Utama (Event-Centric)
- `app/(public)/events/page.tsx`: Listing event publik.
- `app/(public)/events/[id]/page.tsx`: Detail event & info harga.
- `app/(public)/events/[id]/register/page.tsx`: Form pendaftaran dual-path.
- `app/(public)/scan/page.tsx`: Antarmuka scanner QR untuk panitia.
- `app/admin/events/page.tsx`: Dashboard manajemen event oleh admin.
- `components/RegisterForm.tsx`: Komponen logika pendaftaran.
- `lib/dummy.ts`: Sumber data event dan peserta.
- `types/index.ts`: Definisi interface `Event`, `Participant`, dan `CustomField`.

---
*Dokumentasi ini difokuskan khusus pada fungsionalitas Event & Ticketing.*
