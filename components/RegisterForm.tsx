'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Event } from '@/types'
import { ArrowLeft, User, Users, Upload, CheckCircle, BadgeCheck } from 'lucide-react'

type Path = 'NIAM' | 'UMUM' | null
type Step = 1 | 2 | 3

interface FormData {
  path: Path
  niam: string
  crewName: string
  crewUnit: string
  guestName: string
  guestWhatsapp: string
  guestInstitution: string
  proofFile: File | null
}

function generateUniqueCode() {
  return Math.floor(Math.random() * 900) + 100
}

function formatRupiah(amount: number) {
  return 'Rp ' + amount.toLocaleString('id-ID')
}

const inputClass =
  'w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332] shadow-sm'

const btnGold =
  'w-full bg-[#C9A227] text-white rounded-full py-4 font-bold text-sm tracking-wide shadow-md active:scale-95 transition-transform'

export function RegisterForm({ event }: { event: Event }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>({
    path: null, niam: '', crewName: '', crewUnit: '',
    guestName: '', guestWhatsapp: '', guestInstitution: '', proofFile: null,
  })
  const [uniqueCode] = useState(generateUniqueCode)
  const [submitted, setSubmitted] = useState(false)

  const price = form.path === 'NIAM' ? event.price_niam : event.price_public
  const totalAmount = event.is_paid ? price + uniqueCode : 0

  function handleNIAMValidate() {
    if (form.niam.trim().length >= 3) {
      setForm((f) => ({ ...f, crewName: 'Budi Santoso', crewUnit: 'Regional Jakarta' }))
    }
  }

  function handlePaymentSubmit() {
    setSubmitted(true)
    if (!event.is_paid) setTimeout(() => router.push('/ticket/TOKEN-DEMO-001'), 800)
  }

  const steps = ['Pilih Jalur', 'Data Diri', 'Pembayaran']

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
          Menunggu verifikasi panitia.<br />Tiket dikirim setelah pembayaran dikonfirmasi.
        </p>
        <Link href="/" className="text-sm font-bold text-[#1B4332] underline underline-offset-4">
          Kembali ke Beranda
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f4f0]">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => step === 1 ? router.back() : setStep((s) => (s - 1) as Step)}
            className="w-9 h-9 rounded-full bg-[#e8f0ec] flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-[#1B4332]" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">Daftar Event</p>
            <p className="text-sm font-bold text-[#1B4332] truncate">{event.title}</p>
          </div>
        </div>

        {/* Step bar */}
        <div className="flex gap-2">
          {steps.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1.5 rounded-full mb-1.5 transition-colors ${i + 1 <= step ? 'bg-[#1B4332]' : 'bg-gray-200'}`} />
              <p className={`text-[10px] font-semibold ${i + 1 === step ? 'text-[#1B4332]' : 'text-gray-400'}`}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-4">

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <p className="text-lg font-extrabold text-[#1B4332]">Pilih Jalur Pendaftaran</p>

            <button
              onClick={() => { setForm((f) => ({ ...f, path: 'NIAM' })); setStep(2) }}
              className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 text-left active:scale-95 transition-transform border-2 border-transparent hover:border-[#1B4332]"
            >
              <div className="w-12 h-12 rounded-xl bg-[#e8f0ec] flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-[#1B4332]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#1B4332]">Jalur NIAM</p>
                <p className="text-xs text-gray-500 mt-0.5">Untuk anggota MPJ ber-NIAM</p>
                {event.is_paid && (
                  <p className="text-sm font-extrabold text-[#C9A227] mt-1">{formatRupiah(event.price_niam)}</p>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-[#f0f4f0] flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-[#1B4332] rotate-180" />
              </div>
            </button>

            {event.is_open_for_public && (
              <button
                onClick={() => { setForm((f) => ({ ...f, path: 'UMUM' })); setStep(2) }}
                className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 text-left active:scale-95 transition-transform border-2 border-transparent hover:border-[#1B4332]"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-[#C9A227]" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#1B4332]">Jalur Umum</p>
                  <p className="text-xs text-gray-500 mt-0.5">Untuk masyarakat umum</p>
                  {event.is_paid && (
                    <p className="text-sm font-extrabold text-[#C9A227] mt-1">{formatRupiah(event.price_public)}</p>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#f0f4f0] flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4 text-[#1B4332] rotate-180" />
                </div>
              </button>
            )}
          </>
        )}

        {/* STEP 2 - NIAM */}
        {step === 2 && form.path === 'NIAM' && (
          <>
            <p className="text-lg font-extrabold text-[#1B4332]">Masukkan NIAM Kamu</p>
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <input
                type="text"
                placeholder="Contoh: MPJ-001"
                value={form.niam}
                onChange={(e) => setForm((f) => ({ ...f, niam: e.target.value, crewName: '', crewUnit: '' }))}
                className={inputClass}
              />
              {form.crewName && (
                <div className="bg-[#e8f0ec] rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#1B4332] shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[#1B4332]">{form.crewName}</p>
                    <p className="text-xs text-gray-500">{form.crewUnit}</p>
                  </div>
                </div>
              )}
            </div>
            <button
              className={btnGold}
              onClick={form.crewName ? () => setStep(3) : handleNIAMValidate}
              disabled={!form.niam.trim()}
            >
              {form.crewName ? 'Lanjut ke Pembayaran →' : 'Validasi NIAM'}
            </button>
          </>
        )}

        {/* STEP 2 - UMUM */}
        {step === 2 && form.path === 'UMUM' && (
          <>
            <p className="text-lg font-extrabold text-[#1B4332]">Data Diri</p>
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <input type="text" placeholder="Nama Lengkap" value={form.guestName}
                onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))} className={inputClass} />
              <input type="tel" placeholder="No. WhatsApp (08xx)" value={form.guestWhatsapp}
                onChange={(e) => setForm((f) => ({ ...f, guestWhatsapp: e.target.value }))} className={inputClass} />
              <input type="text" placeholder="Asal Instansi / Universitas" value={form.guestInstitution}
                onChange={(e) => setForm((f) => ({ ...f, guestInstitution: e.target.value }))} className={inputClass} />
            </div>
            <button
              className={btnGold}
              onClick={() => { if (form.guestName && form.guestWhatsapp && form.guestInstitution) setStep(3) }}
              disabled={!form.guestName || !form.guestWhatsapp || !form.guestInstitution}
            >
              Lanjut ke Pembayaran →
            </button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <p className="text-lg font-extrabold text-[#1B4332]">
              {event.is_paid ? 'Invoice Pembayaran' : 'Konfirmasi Pendaftaran'}
            </p>

            {/* Ringkasan */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              {[
                { label: 'Event', value: event.title },
                { label: 'Jalur', value: form.path },
                { label: 'Nama', value: form.path === 'NIAM' ? form.crewName : form.guestName },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-400 shrink-0">{label}</span>
                  <span className="font-semibold text-[#1B4332] text-right line-clamp-2">{value}</span>
                </div>
              ))}
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
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="font-bold text-[#1B4332]">Total Transfer</span>
                    <span className="font-extrabold text-[#C9A227] text-lg">{formatRupiah(totalAmount)}</span>
                  </div>
                </>
              )}
            </div>

            {event.is_paid && (
              <>
                {/* Rekening */}
                <div className="bg-[#1B4332] rounded-2xl p-5 space-y-1">
                  <p className="text-xs font-bold text-[#C9A227] uppercase tracking-widest mb-2">Transfer ke</p>
                  <p className="text-white font-bold text-base">{event.bank_account.bank_name}</p>
                  <p className="text-white font-extrabold text-2xl tracking-wider">
                    {event.bank_account.account_number}
                  </p>
                  <p className="text-gray-300 text-sm">a/n {event.bank_account.account_name}</p>
                  <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
                    <p className="text-[#C9A227] text-xs font-semibold">
                      ⚠ Transfer tepat {formatRupiah(totalAmount)} termasuk kode unik
                    </p>
                  </div>
                </div>

                {/* Upload */}
                <div>
                  <p className="text-sm font-bold text-[#1B4332] mb-2">Upload Bukti Transfer</p>
                  <label className="flex flex-col items-center justify-center w-full h-36 bg-white border-2 border-dashed border-[#1B4332]/30 rounded-2xl cursor-pointer active:bg-[#e8f0ec] transition-colors shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-[#e8f0ec] flex items-center justify-center mb-2">
                      <Upload className="w-5 h-5 text-[#1B4332]" />
                    </div>
                    <p className="text-sm font-semibold text-[#1B4332]">
                      {form.proofFile ? form.proofFile.name : 'Tap untuk upload foto'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, max 2MB</p>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => setForm((f) => ({ ...f, proofFile: e.target.files?.[0] ?? null }))} />
                  </label>
                </div>

                <button className={btnGold} onClick={handlePaymentSubmit} disabled={!form.proofFile}>
                  Kirim Bukti Transfer →
                </button>
              </>
            )}

            {!event.is_paid && (
              <button className={btnGold} onClick={handlePaymentSubmit}>
                Konfirmasi Pendaftaran →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
