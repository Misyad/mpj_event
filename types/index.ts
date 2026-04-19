export type EventStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'FINISHED' | 'COMPLETED'
export type EventCategory = 'Pelatihan' | 'Seremonial' | 'Rapat'
export type RegistrationPath = 'NIAM' | 'UMUM'
export type PaymentStatus = 'Free' | 'Unpaid' | 'Pending_Approval' | 'Paid'
export type AttendanceStatus = 'Registered' | 'Attended' | 'Cancelled'

export interface Event {
  id: string
  title: string
  category: EventCategory
  poster_url: string
  description: string
  location_gmaps: string
  location_name: string
  start_date: string
  is_open_for_public: boolean
  is_paid: boolean
  price_niam: number
  price_public: number
  status: EventStatus
  bank_account: BankAccount
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
  registration_path: RegistrationPath
  payment_status: PaymentStatus
  unique_amount: number
  payment_proof_url: string | null
  attendance_status: AttendanceStatus
  qr_token: string
  crew?: Crew
  guest?: Guest
}
