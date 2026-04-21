import { Event, Participant, Pesantren, MediaUnit, CrewMember, StaffMember, PaymentRecord, AdminStats, Speaker } from '@/types'

export const dummyEvents: Event[] = [
  {
    id: '1',
    title: 'Workshop UI/UX Design 2026',
    category: 'Pelatihan',
    poster_url: 'https://picsum.photos/seed/workshop-mpj/800/450',
    description:
      'Workshop intensif selama satu hari penuh membahas prinsip dasar UI/UX Design, tools Figma, dan studi kasus nyata dari produk digital Indonesia. Cocok untuk pemula hingga menengah.',
    location_gmaps: 'https://maps.google.com/?q=Jakarta+Pusat',
    location_name: 'Gedung MPJ, Jakarta Pusat',
    start_date: '2026-05-10T09:00:00',
    is_open_for_public: true,
    is_paid: true,
    price_niam: 25000,
    price_public: 100000,
    status: 'APPROVED',
    bank_account: { bank_name: 'BCA', account_number: '1234567890', account_name: 'MPJ Indonesia' },
    max_participants: 50,
    current_participants: 42,
    status_pendaftaran: 'open',
    registration_deadline: '2026-05-05T23:59:59',
    speaker_id: 'spk1',
  },
  {
    id: '2',
    title: 'Rapat Koordinasi Nasional',
    category: 'Rapat',
    poster_url: 'https://picsum.photos/seed/rakornas-mpj/800/450',
    description:
      'Rapat koordinasi seluruh pengurus MPJ tingkat nasional untuk membahas program kerja, evaluasi, dan rencana strategis tahun 2026.',
    location_gmaps: 'https://maps.google.com/?q=Bandung',
    location_name: 'Hotel Grand Preanger, Bandung',
    start_date: '2026-06-01T08:00:00',
    is_open_for_public: false,
    is_paid: false,
    price_niam: 0,
    price_public: 0,
    status: 'APPROVED',
    bank_account: {
      bank_name: 'BNI',
      account_number: '0987654321',
      account_name: 'MPJ Pusat',
    },
  },
  {
    id: '3',
    title: 'Pelantikan Pengurus Regional Jawa Barat',
    category: 'Seremonial',
    poster_url: 'https://picsum.photos/seed/pelantikan-mpj/800/450',
    description:
      'Pelantikan resmi pengurus MPJ Regional Jawa Barat periode 2026-2028. Acara dihadiri oleh perwakilan Pusat dan seluruh anggota aktif Regional Jawa Barat.',
    location_gmaps: 'https://maps.google.com/?q=Bandung+Kota',
    location_name: 'Aula Serbaguna, Bandung',
    start_date: '2026-04-20T10:00:00',
    is_open_for_public: true,
    is_paid: false,
    price_niam: 0,
    price_public: 0,
    status: 'FINISHED',
    bank_account: {
      bank_name: 'BCA',
      account_number: '1122334455',
      account_name: 'MPJ Jabar',
    },
  },
  {
    id: '4',
    title: 'Pelatihan Public Speaking',
    category: 'Pelatihan',
    poster_url: 'https://picsum.photos/seed/speaking-mpj/800/450',
    description:
      'Pelatihan public speaking intensif 2 hari bersama trainer berpengalaman. Peserta akan belajar teknik berbicara di depan umum, mengelola rasa gugup, dan menyampaikan pesan secara efektif.',
    location_gmaps: 'https://maps.google.com/?q=Surabaya',
    location_name: 'Gedung MPJ Surabaya',
    start_date: '2026-07-15T08:00:00',
    is_open_for_public: true,
    is_paid: true,
    price_niam: 50000,
    price_public: 150000,
    status: 'APPROVED',
    bank_account: { bank_name: 'Mandiri', account_number: '5566778899', account_name: 'MPJ Jawa Timur' },
    max_participants: 30,
    current_participants: 29,
    status_pendaftaran: 'open',
    registration_deadline: '2026-07-10T23:59:59',
    speaker_id: 'spk2',
  },
  {
    id: '5',
    title: 'Seminar Literasi Digital untuk Santri',
    category: 'Pelatihan',
    poster_url: 'https://picsum.photos/seed/literasi-mpj/800/450',
    description:
      'Seminar literasi digital untuk santri pesantren anggota MPJ, membahas penggunaan media sosial yang bijak, penangkalan hoaks, dan strategi branding pesantren di era digital.',
    location_gmaps: 'https://maps.google.com/?q=Yogyakarta',
    location_name: 'Pesantren Al-Furqon, Yogyakarta',
    start_date: '2026-08-20T08:00:00',
    is_open_for_public: true,
    is_paid: true,
    price_niam: 0,
    price_public: 75000,
    status: 'PENDING',
    bank_account: {
      bank_name: 'BSI',
      account_number: '7788990011',
      account_name: 'MPJ DIY',
    },
  },
  {
    id: '6',
    title: 'Muktamar MPJ Nasional 2026',
    category: 'Seremonial',
    poster_url: 'https://picsum.photos/seed/muktamar-mpj/800/450',
    description:
      'Muktamar nasional MPJ yang membahas laporan pertanggungjawaban pengurus, pemilihan pengurus baru, dan penetapan program kerja nasional periode mendatang.',
    location_gmaps: 'https://maps.google.com/?q=Solo',
    location_name: 'Balai Kota Surakarta, Solo',
    start_date: '2026-09-10T09:00:00',
    is_open_for_public: false,
    is_paid: false,
    price_niam: 0,
    price_public: 0,
    status: 'PENDING',
    bank_account: {
      bank_name: 'BCA',
      account_number: '9900112233',
      account_name: 'MPJ Pusat',
    },
  },
  {
    id: '7',
    title: 'Training Jurnalistik Tingkat Dasar',
    category: 'Pelatihan',
    poster_url: 'https://picsum.photos/seed/jurnalistik-mpj/800/450',
    description:
      'Training jurnalistik tingkat dasar untuk anggota baru MPJ. Materi mencakup teknik wawancara, penulisan berita, fotografi jurnalistik, dan etika pers.',
    location_gmaps: 'https://maps.google.com/?q=Malang',
    location_name: 'Gedung Pers Malang',
    start_date: '2026-03-05T08:00:00',
    is_open_for_public: true,
    is_paid: true,
    price_niam: 30000,
    price_public: 120000,
    status: 'COMPLETED',
    bank_account: {
      bank_name: 'BNI',
      account_number: '3344556677',
      account_name: 'MPJ Jawa Timur',
    },
  },
]

export const dummyParticipants: Participant[] = [
  {
    id: 'p1',
    event_id: '1',
    registration_path: 'NIAM',
    payment_status: 'Paid',
    unique_amount: 25012,
    payment_proof_url: null,
    attendance_status: 'Registered',
    qr_token: 'TOKEN-NIAM-001',
    crew: {
      niam: 'MPJ-001',
      full_name: 'Budi Santoso',
      unit: 'Regional Jakarta',
      photo_url: 'https://avatar.iran.liara.run/public/boy?username=budi',
    },
  },
  {
    id: 'p2',
    event_id: '1',
    registration_path: 'UMUM',
    payment_status: 'Paid',
    unique_amount: 100034,
    payment_proof_url: null,
    attendance_status: 'Registered',
    qr_token: 'TOKEN-UMUM-002',
    guest: {
      id: 'g1',
      full_name: 'Siti Rahayu',
      institution_name: 'Universitas Indonesia',
      whatsapp: '081234567890',
    },
  },
  {
    id: 'p3',
    event_id: '1',
    registration_path: 'NIAM',
    payment_status: 'Pending_Approval',
    unique_amount: 25089,
    payment_proof_url: 'https://picsum.photos/seed/bukti/400/300',
    attendance_status: 'Registered',
    qr_token: 'TOKEN-NIAM-003',
    crew: {
      niam: 'MPJ-045',
      full_name: 'Ahmad Fauzi',
      unit: 'Regional Bandung',
      photo_url: 'https://avatar.iran.liara.run/public/boy?username=ahmad',
    },
  },
  {
    id: 'p4',
    event_id: '1',
    registration_path: 'UMUM',
    payment_status: 'Unpaid',
    unique_amount: 100056,
    payment_proof_url: null,
    attendance_status: 'Registered',
    qr_token: 'TOKEN-UMUM-004',
    guest: {
      id: 'g2',
      full_name: 'Rizky Pratama',
      institution_name: 'ITB',
      whatsapp: '089876543210',
    },
  },
  {
    id: 'p5',
    event_id: '3',
    registration_path: 'NIAM',
    payment_status: 'Free',
    unique_amount: 0,
    payment_proof_url: null,
    attendance_status: 'Attended',
    qr_token: 'TOKEN-NIAM-005',
    crew: {
      niam: 'MPJ-012',
      full_name: 'Dewi Kusuma',
      unit: 'Regional Bandung',
      photo_url: 'https://avatar.iran.liara.run/public/girl?username=dewi',
    },
  },
]

export const dummyStaff: StaffMember[] = [
  { id: 's1', event_id: '1', niam: 'MPJ-088', full_name: 'Hendra Wijaya', role: 'Ketua Panitia', unit: 'Regional Jakarta' },
  { id: 's2', event_id: '1', niam: 'MPJ-091', full_name: 'Laila Fitri', role: 'Sekretaris', unit: 'Regional Jakarta' },
  { id: 's3', event_id: '1', niam: 'MPJ-102', full_name: 'Guntur Saputra', role: 'Bendahara', unit: 'Regional Jawa Barat' },
  { id: 's4', event_id: '1', niam: 'MPJ-115', full_name: 'Nadia Putri', role: 'Koordinator Acara', unit: 'Regional Jakarta' },
]

export const dummyPayments: PaymentRecord[] = [
  { id: 'pay1', event_id: '1', participant_id: 'p1', participant_name: 'Budi Santoso', path: 'NIAM', amount: 25012, status: 'Paid', submitted_at: '2026-04-15T10:30:00', verified_at: '2026-04-16T09:00:00' },
  { id: 'pay2', event_id: '1', participant_id: 'p2', participant_name: 'Siti Rahayu', path: 'UMUM', amount: 100034, status: 'Paid', submitted_at: '2026-04-14T14:00:00', verified_at: '2026-04-15T11:00:00' },
  { id: 'pay3', event_id: '1', participant_id: 'p3', participant_name: 'Ahmad Fauzi', path: 'NIAM', amount: 25089, status: 'Pending_Approval', submitted_at: '2026-04-17T08:00:00', verified_at: null },
  { id: 'pay4', event_id: '1', participant_id: 'p4', participant_name: 'Rizky Pratama', path: 'UMUM', amount: 100056, status: 'Unpaid', submitted_at: null, verified_at: null },
]

export const dummyPesantren: Pesantren[] = [
  { id: 'psn1', name: 'Pesantren Al-Hikmah', founder: 'KH. Ahmad Fauzi', region: 'Jawa Barat', kabupaten: 'Bandung', total_santri: 1200, status: 'Aktif' },
  { id: 'psn2', name: 'Pesantren Darul Ulum', founder: 'KH. Mochammad Syarif', region: 'Jawa Timur', kabupaten: 'Jombang', total_santri: 3500, status: 'Aktif' },
  { id: 'psn3', name: 'Pesantren Al-Furqon', founder: 'KH. Hasan Basri', region: 'DIY', kabupaten: 'Sleman', total_santri: 800, status: 'Aktif' },
  { id: 'psn4', name: 'Pesantren Sunan Ampel', founder: 'KH. Ridwan Kamil', region: 'Jawa Tengah', kabupaten: 'Kudus', total_santri: 2100, status: 'Aktif' },
  { id: 'psn5', name: 'Pesantren Nurul Huda', founder: 'KH. Zainul Abidin', region: 'Banten', kabupaten: 'Serang', total_santri: 650, status: 'Non-Aktif' },
]

export const dummyMedia: MediaUnit[] = [
  { id: 'med1', name: 'MPJ TV Jakarta', type: 'Televisi', region: 'DKI Jakarta', pic: 'Ahmad Yusuf', status: 'Aktif' },
  { id: 'med2', name: 'Santri News', type: 'Portal Berita', region: 'Jawa Barat', pic: 'Fatimah Azzahra', status: 'Aktif' },
  { id: 'med3', name: 'Radio Pesantren FM', type: 'Radio', region: 'Jawa Timur', pic: 'Rizal Hakim', status: 'Aktif' },
  { id: 'med4', name: 'Pesantren Digital', type: 'Majalah Digital', region: 'DIY', pic: 'Sari Dewi', status: 'Non-Aktif' },
  { id: 'med5', name: 'MPJ Podcast', type: 'Podcast', region: 'DKI Jakarta', pic: 'Bayu Setiawan', status: 'Aktif' },
]

export const dummyCrew: CrewMember[] = [
  { id: 'cr1', niam: 'MPJ-001', full_name: 'Budi Santoso', unit: 'Regional Jakarta', role: 'Fotografer', pesantren: 'Pesantren Al-Hikmah', joined_at: '2023-03-01' },
  { id: 'cr2', niam: 'MPJ-012', full_name: 'Dewi Kusuma', unit: 'Regional Bandung', role: 'Reporter', pesantren: 'Pesantren Al-Hikmah', joined_at: '2023-05-12' },
  { id: 'cr3', niam: 'MPJ-045', full_name: 'Ahmad Fauzi', unit: 'Regional Bandung', role: 'Videografer', pesantren: 'Pesantren Darul Ulum', joined_at: '2023-08-20' },
  { id: 'cr4', niam: 'MPJ-088', full_name: 'Hendra Wijaya', unit: 'Regional Jakarta', role: 'Editor', pesantren: 'Pesantren Sunan Ampel', joined_at: '2024-01-15' },
  { id: 'cr5', niam: 'MPJ-091', full_name: 'Laila Fitri', unit: 'Regional Jakarta', role: 'Jurnalis', pesantren: 'Pesantren Al-Furqon', joined_at: '2024-02-20' },
  { id: 'cr6', niam: 'MPJ-102', full_name: 'Guntur Saputra', unit: 'Regional Jawa Barat', role: 'Desainer Grafis', pesantren: 'Pesantren Nurul Huda', joined_at: '2024-04-01' },
]

export const dummyAdminStats: AdminStats = {
  total_events: 7,
  pending_approval: 2,
  total_participants: 5,
  total_pesantren: 5,
  events_this_month: 2,
}

export const dummySpeakers: Speaker[] = [
  {
    id: 'spk1',
    nama_lengkap: 'Dr. Ahmad Faruqi, M.Kom',
    alamat: 'Jakarta Selatan, DKI Jakarta',
    keahlian: ['UI/UX Design', 'Figma', 'Design Thinking'],
    no_telp: '08111222333',
    portfolio_url: 'https://dribbble.com/ahmadf',
    kategori: 'Desain',
    foto_url: 'https://avatar.iran.liara.run/public/boy?username=ahmadfq',
    bio: 'UI/UX Designer berpengalaman 10 tahun dengan portofolio di 30+ produk digital Indonesia.',
    whatsapp_notif_sent: true,
  },
  {
    id: 'spk2',
    nama_lengkap: 'Hj. Siti Maryam, S.Pd',
    alamat: 'Surabaya, Jawa Timur',
    keahlian: ['Public Speaking', 'Komunikasi', 'Leadership'],
    no_telp: '08222333444',
    portfolio_url: 'https://sitimaryam.com',
    kategori: 'Bisnis',
    foto_url: 'https://avatar.iran.liara.run/public/girl?username=sitimym',
    bio: 'Trainer public speaking bersertifikat nasional dengan 500+ sesi pelatihan.',
    whatsapp_notif_sent: false,
  },
  {
    id: 'spk3',
    nama_lengkap: 'Ustaz Ridwan Al-Hafidz',
    alamat: 'Yogyakarta, DIY',
    keahlian: ['Literasi Digital', 'Media Islam', 'Dakwah Digital'],
    no_telp: '08333444555',
    portfolio_url: '',
    kategori: 'Keagamaan',
    foto_url: 'https://avatar.iran.liara.run/public/boy?username=ridwan99',
    bio: 'Pengajar pesantren dan konsultan media Islam. Aktif di 20+ pesantren nasional.',
    whatsapp_notif_sent: false,
  },
  {
    id: 'spk4',
    nama_lengkap: 'Bagas Saputra, S.Kom',
    alamat: 'Bandung, Jawa Barat',
    keahlian: ['Web Development', 'Next.js', 'Mobile Dev'],
    no_telp: '08444555666',
    portfolio_url: 'https://github.com/bagasspt',
    kategori: 'Tech',
    foto_url: 'https://avatar.iran.liara.run/public/boy?username=bagass',
    bio: 'Full-stack developer dan kontributor open-source dengan 5 tahun pengalaman.',
    whatsapp_notif_sent: true,
  },
  {
    id: 'spk5',
    nama_lengkap: 'Nadia Rachma, M.I.Kom',
    alamat: 'Malang, Jawa Timur',
    keahlian: ['Jurnalistik', 'Penulisan Berita', 'Fotografi'],
    no_telp: '08555666777',
    portfolio_url: 'https://nadiarachma.id',
    kategori: 'Jurnalistik',
    foto_url: 'https://avatar.iran.liara.run/public/girl?username=nadiarc',
    bio: 'Jurnalis senior dan pengajar jurnalistik di 3 universitas di Jawa Timur.',
    whatsapp_notif_sent: false,
  },
]

export function getEventById(id: string): Event | undefined {
  return dummyEvents.find((e) => e.id === id)
}

export function getSpeakerById(id: string): Speaker | undefined {
  return dummySpeakers.find((s) => s.id === id)
}

export function getParticipantByToken(token: string): Participant | undefined {
  return dummyParticipants.find((p) => p.qr_token === token)
}

export function getParticipantsByEvent(event_id: string): Participant[] {
  return dummyParticipants.filter((p) => p.event_id === event_id)
}

export function getPaymentsByEvent(event_id: string): PaymentRecord[] {
  return dummyPayments.filter((p) => p.event_id === event_id)
}

export function getStaffByEvent(event_id: string): StaffMember[] {
  return dummyStaff.filter((s) => s.event_id === event_id)
}
