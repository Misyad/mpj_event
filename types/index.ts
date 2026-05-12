export type EventStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'LIVE'
  | 'FINISHED'
  | 'COMPLETED'
  | 'draft'
  | 'pending'
  | 'approved'
  | 'registration_closed'
  | 'finished'
export type EventCategory = 'Pelatihan' | 'Seremonial' | 'Rapat'
export type RegistrationPath = 'NIAM' | 'UMUM'
export type PaymentStatus = 'Free' | 'Unpaid' | 'Pending_Approval' | 'Paid'
export type AttendanceStatus = 'Registered' | 'Confirmed' | 'Attended' | 'Cancelled' | 'registered' | 'confirmed' | 'attended' | 'cancelled'
export type RegistrationStatus = 'open' | 'closed' | 'full'
export type SpeakerCategory = 'Tech' | 'Bisnis' | 'Desain' | 'Jurnalistik' | 'Keagamaan' | 'Lainnya'
export type EventScope = 'pusat' | 'regional'
export type LocationType = 'offline' | 'online'

export type CustomFieldType = 'short_text' | 'long_text' | 'radio' | 'dropdown' | 'checkbox'

export interface CustomField {
  id: string
  event_id?: string
  label: string
  type: CustomFieldType
  options: string[] // Kosong jika bukan multiple choice
  is_required: boolean
  order: number
}

export interface CustomResponse {
  field_id: string
  value: string | string[]
}

export interface EventClass {
  id: string
  event_id?: string
  name: string
  quota?: number | null
  registeredCount?: number
  order?: number
}

export interface Event {
  id: string
  title: string
  slug?: string
  category: EventCategory
  poster_url: string
  posterUrl?: string
  description: string
  location_gmaps: string
  locationMapsUrl?: string
  location_name: string
  location?: string
  locationType?: LocationType
  meetingUrl?: string
  start_date: string
  dateStart?: string
  dateEnd?: string
  is_open_for_public: boolean
  allowPublic?: boolean
  is_paid: boolean
  isPaidEvent?: boolean
  price_niam: number
  priceNiam?: number
  price_public: number
  priceUmum?: number
  status: EventStatus
  scope?: EventScope
  regionId?: string | null
  isPublished?: boolean
  isPublic?: boolean
  bank_account: BankAccount
  // New fields
  max_participants?: number
  quota?: number
  current_participants?: number
  registeredCount?: number
  attendedCount?: number
  status_pendaftaran?: RegistrationStatus
  registration_deadline?: string
  registrationDeadline?: string
  speaker_id?: string
  custom_fields?: CustomField[]
  classes?: EventClass[]
}

export interface BankAccount {
  bank_name: string
  account_number: string
  account_name: string
}

export interface Crew {
  niam: string
  full_name: string
  unit: string
  photo_url: string
}

export interface Guest {
  id: string
  full_name: string
  institution_name: string
  whatsapp: string
}

export interface Participant {
  id: string
  event_id: string
  eventId?: string
  registration_path: RegistrationPath
  type?: 'niam' | 'umum'
  payment_status: PaymentStatus
  unique_amount: number
  payment_proof_url: string | null
  attendance_status: AttendanceStatus
  status?: AttendanceStatus
  qr_token: string
  ticketCode?: string
  paymentId?: string | null
  classId?: string | null
  full_name?: string
  fullName?: string
  email?: string | null
  institution_name?: string
  institution?: string
  whatsapp?: string
  checked_in_at?: string | null
  attendedAt?: string | null
  crew?: Crew
  guest?: Guest
  customAnswers?: Record<string, unknown>
}

export interface StaffMember {
  id: string
  event_id: string
  niam: string
  full_name: string
  role: string
  unit: string
}

export interface PaymentRecord {
  id: string
  event_id: string
  participant_id: string
  participant_name: string
  path: RegistrationPath
  amount: number
  status: PaymentStatus
  submitted_at: string | null
  verified_at: string | null
}

export interface Pesantren {
  id: string
  name: string
  founder: string
  region: string
  kabupaten: string
  total_santri: number
  status: 'Aktif' | 'Non-Aktif'
}

export interface MediaUnit {
  id: string
  name: string
  type: string
  region: string
  pic: string
  status: 'Aktif' | 'Non-Aktif'
}

export interface CrewMember {
  id: string
  niam: string
  full_name: string
  unit: string
  role: string
  pesantren: string
  joined_at: string
}

export interface AdminStats {
  total_events: number
  pending_approval: number
  total_participants: number
  total_pesantren: number
  events_this_month: number
}

export interface Speaker {
  id: string
  nama_lengkap: string
  alamat: string
  keahlian: string[]
  no_telp: string
  portfolio_url: string
  kategori: SpeakerCategory
  foto_url: string
  bio: string
  whatsapp_notif_sent?: boolean
}
