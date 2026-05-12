'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  Loader2,
  Search,
  ShieldCheck,
  Upload,
  UserCheck,
  UserRound,
  XCircle,
} from 'lucide-react'
import {
  getInstitutionOptions,
  searchInstitutions,
  type InstitutionOption,
} from '@/lib/institution-options'
import type { Event } from '@/types'

type Step = 1 | 2

type RegistrationContext = {
  isLoggedIn: boolean
  userId: string | null
  fullName: string | null
  email: string | null
}

type MemberLookup = {
  id: string
  niam: string
  fullName: string
  unit: string
  photoUrl: string | null
}

type FormData = {
  niam: string
  fullName: string
  whatsapp: string
  institution: string
  institutionId: string | null
  selectedClassId: string
  customResponses: Record<string, string | string[]>
  proofFile: File | null
}

function generateUniqueCode() {
  return Math.floor(Math.random() * 900) + 100
}

function formatRupiah(amount: number) {
  return 'Rp ' + amount.toLocaleString('id-ID')
}

function normalizeNiam(value: string) {
  return value.trim().toUpperCase()
}

function resolveInstitutionId(options: InstitutionOption[], name: string) {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return null
  return options.find((option) => option.name.trim().toLowerCase() === normalized)?.id ?? null
}

const inputClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]'

const btnGold =
  'inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#C9A227] py-4 text-sm font-bold tracking-wide text-white shadow-md transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60'

export function RegisterForm({
  event,
  registrationContext = { isLoggedIn: false, userId: null, fullName: null, email: null },
}: {
  event: Event
  registrationContext?: RegistrationContext
}) {
  const router = useRouter()
  const institutionRef = useRef<HTMLDivElement>(null)
  const institutionOptions = useMemo(() => getInstitutionOptions(), [])

  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>({
    niam: '',
    fullName: registrationContext.fullName ?? '',
    whatsapp: '',
    institution: '',
    institutionId: null,
    selectedClassId: '',
    customResponses: {},
    proofFile: null,
  })
  const [uniqueCode] = useState(generateUniqueCode)
  const [member, setMember] = useState<MemberLookup | null>(null)
  const [memberChecked, setMemberChecked] = useState(false)
  const [isCheckingMember, setIsCheckingMember] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [editProfile, setEditProfile] = useState(false)
  const [institutionOpen, setInstitutionOpen] = useState(false)
  const [institutionQuery, setInstitutionQuery] = useState('')

  const isNiamRegistration = Boolean(member)
  const finalName = member?.fullName ?? form.fullName.trim()
  const finalInstitution = member?.unit ?? form.institution.trim()
  const finalPrice = event.is_paid ? (isNiamRegistration ? event.price_niam : event.price_public) : 0
  const totalAmount = event.is_paid ? finalPrice + uniqueCode : 0
  const selectedClass = event.classes?.find((eventClass) => eventClass.id === form.selectedClassId)
  const hasClasses = Boolean(event.classes?.length)
  const requiresValidNiam = !event.is_open_for_public && !isNiamRegistration
  const filteredInstitutions = useMemo(
    () => searchInstitutions(institutionQuery || form.institution),
    [form.institution, institutionQuery],
  )
  const canUseCustomInstitution = event.is_open_for_public && institutionQuery.trim().length > 0

  const customFieldsValid = useMemo(() => {
    if (!event.custom_fields) return true
    return event.custom_fields.every((field) => {
      if (!field.is_required) return true
      const response = form.customResponses[field.id]
      return Boolean(response) && (!Array.isArray(response) || response.length > 0)
    })
  }, [event.custom_fields, form.customResponses])

  const hasRequiredProfileFields = Boolean(finalName) && (
    isNiamRegistration || (Boolean(form.whatsapp.trim()) && Boolean(finalInstitution))
  )

  const canContinueToPayment =
    hasRequiredProfileFields &&
    (!hasClasses || Boolean(form.selectedClassId)) &&
    customFieldsValid &&
    !requiresValidNiam

  const shouldShowConfirmation = registrationContext.isLoggedIn && canContinueToPayment && !editProfile

  useEffect(() => {
    function handleClickOutside(eventValue: MouseEvent) {
      if (institutionRef.current && !institutionRef.current.contains(eventValue.target as Node)) {
        setInstitutionOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function validateNiam() {
    const value = form.niam.trim()
    if (!value) {
      setMember(null)
      setMemberChecked(false)
      return
    }

    setIsCheckingMember(true)
    setSubmitError('')

    try {
      const response = await fetch(`/api/members/niam?value=${encodeURIComponent(value)}`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Validasi NIAM gagal')

      const nextMember = payload.valid ? (payload.data as MemberLookup) : null
      setMember(nextMember)
      setMemberChecked(true)
      if (nextMember) {
        setForm((current) => ({
          ...current,
          fullName: current.fullName.trim() || nextMember.fullName,
          institution: current.institution.trim() || nextMember.unit,
          institutionId: resolveInstitutionId(institutionOptions, current.institution.trim() || nextMember.unit),
        }))
      }
    } catch (error) {
      setMember(null)
      setMemberChecked(true)
      setSubmitError(error instanceof Error ? error.message : 'Validasi NIAM gagal')
    } finally {
      setIsCheckingMember(false)
    }
  }

  function handleCustomResponse(id: string, value: string | string[]) {
    setForm((current) => ({
      ...current,
      customResponses: { ...current.customResponses, [id]: value },
    }))
  }

  function handleCheckboxToggle(id: string, option: string) {
    const current = (form.customResponses[id] as string[]) || []
    handleCustomResponse(
      id,
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    )
  }

  function selectInstitution(option: InstitutionOption) {
    setForm((current) => ({
      ...current,
      institution: option.name,
      institutionId: option.id,
    }))
    setInstitutionQuery('')
    setInstitutionOpen(false)
  }

  function useCustomInstitution() {
    const value = institutionQuery.trim()
    if (!value) return

    setForm((current) => ({
      ...current,
      institution: value,
      institutionId: null,
    }))
    setInstitutionOpen(false)
  }

  async function submitRegistration() {
    setSubmitError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          niam: member?.niam,
          full_name: finalName,
          email: registrationContext.email,
          unit: member?.unit,
          institution_name: finalInstitution,
          whatsapp: form.whatsapp.trim(),
          final_amount: totalAmount,
          class_id: form.selectedClassId,
          payment_proof_name: form.proofFile?.name,
          custom_responses: form.customResponses,
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Pendaftaran gagal')

      setSubmitted(true)
      if (!payload.requiresPayment) {
        window.setTimeout(() => {
          router.push(`/ticket/${encodeURIComponent(payload.ticketCode || payload.data.ticketCode || payload.data.qr_token)}`)
        }, 800)
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Pendaftaran gagal')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted && !event.is_paid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f4f0] px-6 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f0ec]">
          <CheckCircle className="h-10 w-10 text-[#1B4332]" />
        </div>
        <h2 className="text-xl font-extrabold text-[#1B4332]">Pendaftaran Berhasil!</h2>
        <p className="mt-2 text-sm text-gray-500">Mengalihkan ke E-Tiket kamu...</p>
      </div>
    )
  }

  if (submitted && event.is_paid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f4f0] px-6 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
          <BadgeCheck className="h-10 w-10 text-[#C9A227]" />
        </div>
        <h2 className="text-xl font-extrabold text-[#1B4332]">Bukti Transfer Terkirim</h2>
        <p className="mb-8 mt-2 text-sm leading-relaxed text-gray-500">
          Menunggu verifikasi panitia.
          <br />
          Tiket dikirim setelah pembayaran dikonfirmasi.
        </p>
        <Link href="/" className="text-sm font-bold text-[#1B4332] underline underline-offset-4">
          Kembali ke Beranda
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f4f0]">
      <div className="bg-white px-4 pb-3 pt-4 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (step === 1 ? router.back() : setStep(1))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0ec]"
          >
            <ArrowLeft className="h-4 w-4 text-[#1B4332]" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-400">Daftar Event</p>
            <p className="truncate text-sm font-bold text-[#1B4332]">{event.title}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {['Data Diri', event.is_paid ? 'Pembayaran' : 'Konfirmasi'].map((label, index) => (
            <div key={label} className="flex-1">
              <div
                className={`mb-1.5 h-1.5 rounded-full transition-colors ${
                  index + 1 <= step ? 'bg-[#1B4332]' : 'bg-gray-200'
                }`}
              />
              <p className={`text-[10px] font-semibold ${index + 1 === step ? 'text-[#1B4332]' : 'text-gray-400'}`}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 px-4 py-6">
        {submitError ? (
          <div className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {submitError}
          </div>
        ) : null}

        {step === 1 ? (
          <>
            {registrationContext.isLoggedIn && !shouldShowConfirmation ? (
              <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f0ec]">
                    <UserRound className="h-5 w-5 text-[#1B4332]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Login terdeteksi</p>
                    <p className="truncate text-sm font-bold text-[#1B4332]">{registrationContext.fullName ?? 'Peserta'}</p>
                    <p className="truncate text-xs text-gray-400">{registrationContext.email ?? '-'}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {shouldShowConfirmation ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f0ec]">
                      <UserCheck className="h-6 w-6 text-[#1B4332]" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-[#1B4332]">Data siap dipakai</p>
                      <p className="text-sm text-gray-500">
                        Pendaftaran sudah diringkas. Periksa data sebentar lalu lanjut ke tahap berikutnya.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <SummaryRow label="Tipe Peserta" value={isNiamRegistration ? 'Anggota MPJ' : 'Peserta Umum'} />
                    {isNiamRegistration ? <SummaryRow label="NIAM" value={normalizeNiam(form.niam)} /> : null}
                    <SummaryRow label="Nama Lengkap" value={finalName} />
                    <SummaryRow label="Nomor WhatsApp" value={form.whatsapp || '-'} />
                    <SummaryRow label="Asal Pesantren / Instansi" value={finalInstitution} />
                    {selectedClass ? <SummaryRow label="Kelas" value={selectedClass.name} /> : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      {event.is_paid
                        ? 'Data sudah lengkap. Anda bisa langsung melanjutkan ke pembayaran.'
                        : 'Data sudah lengkap. Anda bisa langsung melanjutkan ke konfirmasi pendaftaran.'}
                    </p>
                  </div>
                </div>

                <button type="button" className={btnGold} onClick={() => setStep(2)}>
                  {event.is_paid ? 'Lanjut ke Pembayaran ->' : 'Lanjut ke Konfirmasi ->'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditProfile(true)}
                  className="w-full rounded-full border border-[#1B4332]/15 bg-white py-4 text-sm font-bold text-[#1B4332]"
                >
                  Ubah Data
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-lg font-extrabold text-[#1B4332]">Data Diri</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Isi sesingkat mungkin. NIAM opsional, tapi jika valid maka data anggota dan harga khusus dipakai otomatis.
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">NIAM / Nomor Anggota</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Contoh: MPJ-001"
                          value={form.niam}
                          onChange={(eventValue) => {
                            setForm((current) => ({ ...current, niam: eventValue.target.value }))
                            setMember(null)
                            setMemberChecked(false)
                          }}
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={validateNiam}
                          disabled={isCheckingMember || !form.niam.trim()}
                          className="rounded-2xl bg-[#1B4332] px-4 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {isCheckingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cek'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">Kosongkan jika mendaftar sebagai peserta umum.</p>
                    </div>

                    {member ? (
                      <div className="flex items-start gap-3 rounded-2xl bg-[#e8f0ec] p-4">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" />
                        <div>
                          <p className="text-sm font-bold text-[#1B4332]">{member.fullName}</p>
                          <p className="text-xs text-gray-500">
                            {member.niam} - {member.unit || 'Unit belum tercatat'}
                          </p>
                        </div>
                      </div>
                    ) : memberChecked ? (
                      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div>
                          <p className="text-sm font-bold text-amber-700">NIAM tidak ditemukan</p>
                          <p className="text-xs text-amber-700/75">
                            Anda tetap bisa lanjut dengan jalur umum selama event ini membukanya.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Nama Lengkap</label>
                      <input
                        type="text"
                        placeholder="Nama lengkap"
                        value={member?.fullName ?? form.fullName}
                        onChange={(eventValue) =>
                          setForm((current) => ({ ...current, fullName: eventValue.target.value }))
                        }
                        disabled={isNiamRegistration}
                        className={`${inputClass} ${isNiamRegistration ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Nomor WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        value={form.whatsapp}
                        onChange={(eventValue) =>
                          setForm((current) => ({ ...current, whatsapp: eventValue.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Asal Pesantren / Instansi</label>
                      {isNiamRegistration ? (
                        <input
                          type="text"
                          value={member?.unit ?? form.institution}
                          readOnly
                          className={`${inputClass} cursor-not-allowed bg-gray-50 text-gray-500`}
                        />
                      ) : (
                        <div ref={institutionRef} className="relative">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Cari pesantren atau instansi..."
                              value={institutionOpen ? institutionQuery : form.institution}
                              onFocus={() => {
                                setInstitutionOpen(true)
                                setInstitutionQuery(form.institution)
                              }}
                              onChange={(eventValue) => {
                                const value = eventValue.target.value
                                setInstitutionOpen(true)
                                setInstitutionQuery(value)
                                setForm((current) => ({
                                  ...current,
                                  institution: value,
                                  institutionId: resolveInstitutionId(institutionOptions, value),
                                }))
                              }}
                              className={`${inputClass} pl-11`}
                            />
                          </div>

                          {institutionOpen ? (
                            <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                              <div className="max-h-64 overflow-y-auto">
                                {filteredInstitutions.length > 0 ? (
                                  filteredInstitutions.map((option) => (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() => selectInstitution(option)}
                                      className={`w-full px-3 py-2.5 text-left transition-colors hover:bg-[#1B4332]/5 ${
                                        option.id === form.institutionId ? 'bg-[#1B4332]/5' : ''
                                      }`}
                                    >
                                      <p className="truncate text-sm font-semibold text-[#1B4332]">{option.name}</p>
                                      {option.subtitle ? (
                                        <p className="mt-0.5 truncate text-[11px] text-gray-400">{option.subtitle}</p>
                                      ) : null}
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-3">
                                    <p className="text-sm text-gray-400">Data belum tersedia. Pastikan penulisan sudah benar.</p>
                                    {canUseCustomInstitution ? (
                                      <button
                                        type="button"
                                        onClick={useCustomInstitution}
                                        className="mt-3 w-full rounded-xl border border-[#1B4332]/10 bg-[#1B4332]/5 px-3 py-2 text-sm font-semibold text-[#1B4332]"
                                      >
                                        Gunakan sebagai instansi baru
                                      </button>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {requiresValidNiam ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    Event ini khusus anggota MPJ. Masukkan NIAM yang valid untuk melanjutkan pendaftaran.
                  </div>
                ) : null}

                {hasClasses ? (
                  <div className="space-y-3">
                    <p className="text-sm font-extrabold text-[#1B4332]">
                      Pilih Kelas <span className="text-red-500">*</span>
                    </p>
                    {event.classes?.map((eventClass) => {
                      const full =
                        eventClass.quota !== null &&
                        eventClass.quota !== undefined &&
                        (eventClass.registeredCount ?? 0) >= eventClass.quota

                      return (
                        <button
                          key={eventClass.id}
                          type="button"
                          disabled={full}
                          onClick={() => setForm((current) => ({ ...current, selectedClassId: eventClass.id }))}
                          className={`w-full rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition-all ${
                            form.selectedClassId === eventClass.id
                              ? 'border-[#1B4332]'
                              : 'border-transparent hover:border-[#1B4332]/30'
                          } ${full ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-[#1B4332]">{eventClass.name}</p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                {eventClass.quota
                                  ? `${eventClass.registeredCount ?? 0}/${eventClass.quota} peserta`
                                  : 'Kuota tidak dibatasi'}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                full ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {full ? 'Penuh' : 'Tersedia'}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                {event.custom_fields?.length ? (
                  <div className="space-y-4 pt-2">
                    <p className="text-sm font-extrabold text-[#1B4332]">Pertanyaan Tambahan</p>
                    {event.custom_fields.map((field) => (
                      <div key={field.id} className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <label className="text-xs font-semibold text-gray-700">
                          {field.label} {field.is_required ? <span className="text-red-500">*</span> : null}
                        </label>

                        {field.type === 'short_text' ? (
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="Ketik jawaban..."
                            value={(form.customResponses[field.id] as string) || ''}
                            onChange={(eventValue) => handleCustomResponse(field.id, eventValue.target.value)}
                          />
                        ) : null}

                        {field.type === 'long_text' ? (
                          <textarea
                            className={`${inputClass} min-h-[100px] resize-none`}
                            placeholder="Ketik jawaban..."
                            value={(form.customResponses[field.id] as string) || ''}
                            onChange={(eventValue) => handleCustomResponse(field.id, eventValue.target.value)}
                          />
                        ) : null}

                        {field.type === 'dropdown' ? (
                          <select
                            className={inputClass}
                            value={(form.customResponses[field.id] as string) || ''}
                            onChange={(eventValue) => handleCustomResponse(field.id, eventValue.target.value)}
                          >
                            <option value="" disabled>
                              Pilih Opsi
                            </option>
                            {field.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : null}

                        {field.type === 'radio' ? (
                          <div className="mt-2 space-y-2">
                            {field.options.map((option) => (
                              <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="radio"
                                  name={`radio-${field.id}`}
                                  value={option}
                                  checked={form.customResponses[field.id] === option}
                                  onChange={(eventValue) => handleCustomResponse(field.id, eventValue.target.value)}
                                  className="h-4 w-4 border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        ) : null}

                        {field.type === 'checkbox' ? (
                          <div className="mt-2 space-y-2">
                            {field.options.map((option) => {
                              const checked = ((form.customResponses[field.id] as string[]) || []).includes(option)
                              return (
                                <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleCheckboxToggle(field.id, option)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
                                  />
                                  {option}
                                </label>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Jalur</span>
                    <span className="font-bold text-[#1B4332]">{isNiamRegistration ? 'NIAM' : 'Umum'}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Harga final</span>
                    <span className="font-extrabold text-[#C9A227]">
                      {event.is_paid ? formatRupiah(finalPrice) : 'Gratis'}
                    </span>
                  </div>
                </div>

                <button type="button" className={btnGold} disabled={!canContinueToPayment} onClick={() => setStep(2)}>
                  {event.is_paid ? 'Lanjut ke Pembayaran ->' : 'Lanjut ke Konfirmasi ->'}
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-lg font-extrabold text-[#1B4332]">
              {event.is_paid ? 'Invoice Pembayaran' : 'Konfirmasi Pendaftaran'}
            </p>

            <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
              <SummaryRow label="Event" value={event.title} />
              <SummaryRow label="Tipe Peserta" value={isNiamRegistration ? 'Anggota MPJ' : 'Peserta Umum'} />
              {isNiamRegistration ? <SummaryRow label="NIAM" value={normalizeNiam(form.niam)} /> : null}
              <SummaryRow label="Nama" value={finalName} />
              <SummaryRow label="WhatsApp" value={form.whatsapp || '-'} />
              <SummaryRow label="Asal Pesantren / Instansi" value={finalInstitution} />
              {selectedClass ? <SummaryRow label="Kelas" value={selectedClass.name} /> : null}

              {event.is_paid ? (
                <>
                  <div className="space-y-2 border-t border-dashed border-gray-200 pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Harga tiket</span>
                      <span className="font-semibold text-gray-700">{formatRupiah(finalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Kode unik</span>
                      <span className="font-semibold text-gray-700">+{uniqueCode}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <span className="font-bold text-[#1B4332]">Total Transfer</span>
                    <span className="text-lg font-extrabold text-[#C9A227]">{formatRupiah(totalAmount)}</span>
                  </div>
                </>
              ) : null}
            </div>

            {event.is_paid ? (
              <>
                <div className="space-y-1 rounded-2xl bg-[#1B4332] p-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#C9A227]">Transfer ke</p>
                  <p className="text-base font-bold text-white">{event.bank_account.bank_name}</p>
                  <p className="text-2xl font-extrabold tracking-wider text-white">{event.bank_account.account_number}</p>
                  <p className="text-sm text-gray-300">a/n {event.bank_account.account_name}</p>
                  <div className="mt-3 rounded-xl bg-white/10 px-3 py-2">
                    <p className="text-xs font-semibold text-[#C9A227]">
                      Transfer tepat {formatRupiah(totalAmount)} termasuk kode unik
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-bold text-[#1B4332]">Upload Bukti Transfer</p>
                  <label className="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#1B4332]/30 bg-white shadow-sm transition-colors active:bg-[#e8f0ec]">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0ec]">
                      <Upload className="h-5 w-5 text-[#1B4332]" />
                    </div>
                    <p className="text-sm font-semibold text-[#1B4332]">
                      {form.proofFile ? form.proofFile.name : 'Tap untuk upload foto'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">JPG, PNG, max 2MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(eventValue) =>
                        setForm((current) => ({ ...current, proofFile: eventValue.target.files?.[0] ?? null }))
                      }
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className={btnGold}
                  onClick={submitRegistration}
                  disabled={isSubmitting || !form.proofFile}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Kirim Bukti Transfer
                </button>
              </>
            ) : (
              <button type="button" className={btnGold} onClick={submitRegistration} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Konfirmasi Pendaftaran
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="shrink-0 text-gray-400">{label}</span>
      <span className="line-clamp-2 text-right font-semibold text-[#1B4332]">{value}</span>
    </div>
  )
}
