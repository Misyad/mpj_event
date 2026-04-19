import { Event, Participant } from '@/types'

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
    bank_account: {
      bank_name: 'BCA',
      account_number: '1234567890',
      account_name: 'MPJ Indonesia',
    },
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
    bank_account: {
      bank_name: 'Mandiri',
      account_number: '5566778899',
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
      photo_url: 'https://placehold.co/100x100/cccccc/333333?text=BS',
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
]

export function getEventById(id: string): Event | undefined {
  return dummyEvents.find((e) => e.id === id)
}

export function getParticipantByToken(token: string): Participant | undefined {
  return dummyParticipants.find((p) => p.qr_token === token)
}
