'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { dummyCrew } from '@/lib/dummy'
import {
  getInstitutionOptions,
  searchInstitutions,
  type InstitutionOption,
} from '@/lib/institution-options'
import { Event } from '@/types'
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  Search,
  ShieldCheck,
  Upload,
  UserCheck,
} from 'lucide-react'

type Step = 1 | 2 | 3
type ResolvedPath = 'NIAM' | 'UMUM'

interface FormData {
  niam: string
  fullName: string
  whatsapp: string
  institution: string
  institutionId: string | null
  customResponses: Record<string, string | string[]>
  proofFile: File | null
}

interface DemoUserProfile {
  crewId?: string
  niam?: string
  fullName?: string
  whatsapp?: string
  institution?: string
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

function findCrewByNiam(niam: string) {
  const normalized = normalizeNiam(niam)
  if (!normalized) return undefined
  return dummyCrew.find((crew) => crew.niam.toUpperCase() === normalized)
}

function getCurrentUser(demoAuth: string | null): DemoUserProfile | null {
  if (demoAuth === 'full') {
    return {
      crewId: 'cr1',
      niam: 'MPJ-001',
      fullName: 'Budi Santoso',
      whatsapp: '081234567890',
      institution: 'Regional Jakarta',
    }
  }

  if (demoAuth === 'partial') {
    return {
      crewId: 'cr3',
      niam: 'MPJ-045',
      fullName: 'Ahmad Fauzi',
      whatsapp: '081298765432',
      institution: '',
    }
  }

  return null
}

function getSuccessRedirectToken(path: ResolvedPath) {
  return path === 'NIAM' ? 'TOKEN-NIAM-001' : 'TOKEN-UMUM-002'
}

const inputClass =
  'w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332] shadow-sm'

const btnGold =
  'w-full bg-[#C9A227] text-white rounded-full py-4 font-bold text-sm tracking-wide shadow-md active:scale-95 transition-transform disabled:cursor-not-allowed disabled:opacity-60'

export function RegisterForm({ event }: { event: Event }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const demoAuth = searchParams.get('demoAuth')
  const currentUser = useMemo(() => getCurrentUser(demoAuth), [demoAuth])
  const institutionOptions = useMemo(() => getInstitutionOptions(), [])
  const institutionRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>(() => ({
    niam: currentUser?.niam ?? '',
    fullName: currentUser?.fullName ?? '',
    whatsapp: currentUser?.whatsapp ?? '',
    institution: currentUser?.institution ?? '',
    institutionId: null,
    customResponses: {},
    proofFile: null,
  }))
  const [uniqueCode] = useState(generateUniqueCode)
  const [submitted, setSubmitted] = useState(false)
  const [redirectToken, setRedirectToken] = useState<string | null>(null)
  const [editProfile, setEditProfile] = useState(false)
  const [institutionOpen, setInstitutionOpen] = useState(false)
  const [institutionQuery, setInstitutionQuery] = useState('')

  const matchedCrew = useMemo(() => findCrewByNiam(form.niam), [form.niam])
  const filteredInstitutions = useMemo(
    () => searchInstitutions(institutionQuery || form.institution),
    [form.institution, institutionQuery],
  )
  const canUseCustomInstitution = event.is_open_for_public && institutionQuery.trim().length > 0
  const resolvedPath: ResolvedPath = matchedCrew ? 'NIAM' : 'UMUM'
  const price = resolvedPath === 'NIAM' ? event.price_niam : event.price_public
  const totalAmount = event.is_paid ? price + uniqueCode : 0
  const isInternalOnly = !event.is_open_for_public
  const requiresValidNiam = isInternalOnly && resolvedPath !== 'NIAM'
  const hasRequiredProfileFields = Boolean(
    form.fullName.trim() && form.whatsapp.trim() && form.institution.trim(),
  )
  const isLoggedInProfileComplete = Boolean(
    currentUser &&
      matchedCrew &&
      form.fullName.trim() &&
      form.whatsapp.trim() &&
      form.institution.trim(),
  )
  const shouldShowConfirmation = Boolean(
    currentUser && isLoggedInProfileComplete && step === 1 && !editProfile,
  )

  useEffect(() => {
    if (!matchedCrew) return

    setForm((current) => {
      const next = { ...current }
      let changed = false

      if (!current.fullName.trim()) {
        next.fullName = matchedCrew.full_name
        changed = true
      }

      if (!current.institution.trim()) {
        next.institution = matchedCrew.pesantren || matchedCrew.unit
        changed = true
      }

      if (!current.institutionId) {
        const institutionName = matchedCrew.pesantren || matchedCrew.unit
        const matchedInstitution = institutionOptions.find(
          (option) => option.name.trim().toLowerCase() === institutionName.trim().toLowerCase(),
        )
        const nextId = matchedInstitution?.id ?? null

        if (current.institutionId !== nextId) {
          next.institutionId = nextId
          changed = true
        }
      }

      return changed ? next : current
    })
  }, [institutionOptions, matchedCrew])

  useEffect(() => {
    if (!form.institution.trim()) return

    const matchedInstitution = institutionOptions.find(
      (option) => option.name.trim().toLowerCase() === form.institution.trim().toLowerCase(),
    )

    setForm((current) => {
      const nextId = matchedInstitution?.id ?? null
      if (current.institutionId === nextId) return current
      return {
        ...current,
        institutionId: nextId,
      }
    })
  }, [form.institution, institutionOptions])

  useEffect(() => {
    function handleClickOutside(eventValue: MouseEvent) {
      if (institutionRef.current && !institutionRef.current.contains(eventValue.target as Node)) {
        setInstitutionOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!submitted || event.is_paid || !redirectToken) return

    const timeoutId = window.setTimeout(() => {
      router.push(`/ticket?token=${encodeURIComponent(redirectToken)}`)
    }, 800)

    return () => window.clearTimeout(timeoutId)
  }, [event.is_paid, redirectToken, router, submitted])

  function handleCustomResponse(id: string, value: string | string[]) {
    setForm((current) => ({
      ...current,
      customResponses: { ...current.customResponses, [id]: value },
    }))
  }

  function handleCheckboxToggle(id: string, option: string) {
    const current = (form.customResponses[id] as string[]) || []
    if (current.includes(option)) {
      handleCustomResponse(
        id,
        current.filter((item) => item !== option),
      )
      return
    }

    handleCustomResponse(id, [...current, option])
  }

  function validateCustomFields() {
    if (!event.custom_fields) return true

    for (const field of event.custom_fields) {
      if (!field.is_required) continue
      const response = form.customResponses[field.id]
      if (!response || (Array.isArray(response) && response.length === 0)) {
        return false
      }
    }

    return true
  }

  function canContinueToPayment() {
    return hasRequiredProfileFields && validateCustomFields() && !requiresValidNiam
  }

  function handleContinueToPayment() {
    if (!canContinueToPayment()) return
    setStep(2)
  }

  function handlePaymentSubmit() {
    setSubmitted(true)
    if (!event.is_paid) {
      setRedirectToken(getSuccessRedirectToken(resolvedPath))
    }
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

  const steps = ['Data Diri', 'Pembayaran', 'Selesai']

  if (submitted && !event.is_paid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f4f0] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#e8f0ec] flex items-center justify-center mb-5">
          <CheckCircle className="w-10 h-10 text-[#1B4332]" />
        </div>
        <h2 className="text-xl font-extrabold text-[#1B4332]">Pendaftaran Berhasil!</h2>
        <p className="text-sm text-gray-500 mt-2">Mengalihkan ke E-Tiket kamu...</p>
      </div>
    )
  }

  if (submitted && event.is_paid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f4f0] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-5">
          <BadgeCheck className="w-10 h-10 text-[#C9A227]" />
        </div>
        <h2 className="text-xl font-extrabold text-[#1B4332]">Bukti Transfer Terkirim</h2>
        <p className="text-sm text-gray-500 mt-2 mb-8 leading-relaxed">
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
    <div className="flex flex-col min-h-screen bg-[#f0f4f0]">
      <div className="bg-white px-4 pt-4 pb-3 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => (step === 1 ? router.back() : setStep((current) => (current - 1) as Step))}
            className="w-9 h-9 rounded-full bg-[#e8f0ec] flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-[#1B4332]" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">Daftar Event</p>
            <p className="text-sm font-bold text-[#1B4332] truncate">{event.title}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {steps.map((label, index) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full mb-1.5 transition-colors ${
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

      <div className="flex-1 px-4 py-6 space-y-4">
        {step === 1 && (
          <>
            <p className="text-lg font-extrabold text-[#1B4332]">
              {shouldShowConfirmation ? 'Konfirmasi Data' : 'Data Diri'}
            </p>

            {currentUser && !shouldShowConfirmation && (
              <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-4 text-sm text-gray-600 shadow-sm">
                Sebagian data akun Anda sudah kami isi. Lengkapi data yang masih kosong untuk melanjutkan pendaftaran.
              </div>
            )}

            {shouldShowConfirmation ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#e8f0ec] flex items-center justify-center shrink-0">
                      <UserCheck className="w-6 h-6 text-[#1B4332]" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-[#1B4332]">Data akun ditemukan</p>
                      <p className="text-sm text-gray-500">
                        Pendaftaran akan diproses sebagai anggota MPJ berdasarkan data akun Anda.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <SummaryRow label="NIAM / Nomor Anggota" value={normalizeNiam(form.niam)} />
                    <SummaryRow label="Nama Lengkap" value={form.fullName} />
                    <SummaryRow label="Nomor WhatsApp" value={form.whatsapp} />
                    <SummaryRow label="Asal Pesantren / Instansi" value={form.institution} />
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>Data sudah lengkap. Anda bisa langsung melanjutkan ke pembayaran atau konfirmasi pendaftaran.</p>
                  </div>
                </div>

                <button className={btnGold} onClick={() => setStep(2)}>
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
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">NIAM / Nomor Anggota</label>
                    <input
                      type="text"
                      placeholder="Contoh: MPJ-001"
                      value={form.niam}
                      onChange={(eventValue) =>
                        setForm((current) => ({ ...current, niam: eventValue.target.value }))
                      }
                      className={inputClass}
                    />
                    <p className="text-xs text-gray-400">
                      Isi jika Anda anggota MPJ. Kosongkan jika belum memiliki NIAM.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={form.fullName}
                      onChange={(eventValue) =>
                        setForm((current) => ({ ...current, fullName: eventValue.target.value }))
                      }
                      className={inputClass}
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
                              institutionId: null,
                            }))
                          }}
                          className={`${inputClass} pl-11`}
                        />
                      </div>

                      {institutionOpen && (
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
                      )}
                    </div>
                    <p className="text-xs text-gray-400">Ketik nama pesantren atau instansi Anda.</p>
                  </div>
                </div>

                {matchedCrew && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Data anggota terdeteksi. Harga anggota diterapkan.
                  </div>
                )}

                {requiresValidNiam && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    Event ini khusus anggota MPJ. Masukkan NIAM yang valid untuk melanjutkan pendaftaran.
                  </div>
                )}

                {event.custom_fields && event.custom_fields.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <p className="text-sm font-extrabold text-[#1B4332]">Pertanyaan Tambahan</p>
                    {event.custom_fields.map((field) => (
                      <div
                        key={field.id}
                        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2"
                      >
                        <label className="text-xs font-semibold text-gray-700">
                          {field.label} {field.is_required && <span className="text-red-500">*</span>}
                        </label>

                        {field.type === 'short_text' && (
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="Ketik jawaban..."
                            value={(form.customResponses[field.id] as string) || ''}
                            onChange={(eventValue) => handleCustomResponse(field.id, eventValue.target.value)}
                          />
                        )}

                        {field.type === 'long_text' && (
                          <textarea
                            className={`${inputClass} min-h-[100px] resize-none`}
                            placeholder="Ketik jawaban..."
                            value={(form.customResponses[field.id] as string) || ''}
                            onChange={(eventValue) => handleCustomResponse(field.id, eventValue.target.value)}
                          />
                        )}

                        {field.type === 'dropdown' && (
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
                        )}

                        {field.type === 'radio' && (
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
                        )}

                        {field.type === 'checkbox' && (
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
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button className={btnGold} onClick={handleContinueToPayment} disabled={!canContinueToPayment()}>
                  {event.is_paid ? 'Lanjut ke Pembayaran ->' : 'Lanjut ke Konfirmasi ->'}
                </button>
              </>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-lg font-extrabold text-[#1B4332]">
              {event.is_paid ? 'Invoice Pembayaran' : 'Konfirmasi Pendaftaran'}
            </p>

            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <SummaryRow label="Event" value={event.title} />
              <SummaryRow
                label="Tipe Peserta"
                value={resolvedPath === 'NIAM' ? 'Anggota MPJ' : 'Peserta Umum'}
              />
              <SummaryRow label="Nama" value={form.fullName} />
              <SummaryRow label="WhatsApp" value={form.whatsapp} />
              <SummaryRow label="Asal Pesantren / Instansi" value={form.institution} />
              {resolvedPath === 'NIAM' && <SummaryRow label="NIAM" value={normalizeNiam(form.niam)} />}

              {event.is_paid && (
                <>
                  <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Harga tiket</span>
                      <span className="font-semibold text-gray-700">{formatRupiah(price)}</span>
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
              )}
            </div>

            {event.is_paid && (
              <>
                <div className="rounded-2xl bg-[#1B4332] p-5 space-y-1">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#C9A227]">Transfer ke</p>
                  <p className="text-base font-bold text-white">{event.bank_account.bank_name}</p>
                  <p className="text-2xl font-extrabold tracking-wider text-white">
                    {event.bank_account.account_number}
                  </p>
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

                <button className={btnGold} onClick={handlePaymentSubmit} disabled={!form.proofFile}>
                  Kirim Bukti Transfer
                </button>
              </>
            )}

            {!event.is_paid && (
              <button className={btnGold} onClick={handlePaymentSubmit}>
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
