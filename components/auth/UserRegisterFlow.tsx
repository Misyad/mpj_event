'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type RegisterStep = 'form' | 'otp' | 'success'

type RegisterResponse = {
  ok?: boolean
  error?: string
  canResendAt?: string
}

type VerifyResponse = {
  ok?: boolean
  error?: string
  redirectTo?: string
}

const OTP_ENABLED = process.env.NEXT_PUBLIC_USER_REGISTER_OTP_ENABLED === 'true'

function formatCountdown(value: number) {
  const safe = Math.max(0, value)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function UserRegisterFlow({ nextPath }: { nextPath?: string }) {
  const router = useRouter()
  const [step, setStep] = useState<RegisterStep>('form')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [redirectTo, setRedirectTo] = useState('/')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const requestPayload = useMemo(
    () => ({ fullName, email, whatsapp, password }),
    [email, fullName, password, whatsapp],
  )
  const loginHref = nextPath ? `/auth/user-login?next=${encodeURIComponent(nextPath)}` : '/auth/user-login'

  useEffect(() => {
    if (!OTP_ENABLED || resendCooldown <= 0) return
    const timer = window.setTimeout(() => setResendCooldown((current) => current - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendCooldown])

  useEffect(() => {
    if (step !== 'success') return
    const timer = window.setTimeout(() => {
      router.replace(redirectTo || loginHref)
      router.refresh()
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [loginHref, redirectTo, router, step])

  async function requestOtp(mode: 'submit' | 'resend') {
    if (password !== confirmPassword) {
      setError('Konfirmasi password belum sama.')
      return
    }

    setError('')
    setInfo('')

    if (!OTP_ENABLED) {
      setRedirectTo(loginHref)
      setStep('success')
      return
    }

    if (mode === 'submit') setIsRequestingOtp(true)
    if (mode === 'resend') setIsResendingOtp(true)

    try {
      const response = await fetch('/api/auth/user-register/request-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestPayload),
      })
      const payload = (await response.json()) as RegisterResponse

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Pengiriman OTP gagal')
      }

      setStep('otp')
      setOtp('')
      setInfo('Kode OTP sudah dikirim ke email Anda')
      setResendCooldown(payload.canResendAt ? Math.max(0, Math.ceil((new Date(payload.canResendAt).getTime() - Date.now()) / 1000)) : 30)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Pengiriman OTP gagal')
    } finally {
      if (mode === 'submit') setIsRequestingOtp(false)
      if (mode === 'resend') setIsResendingOtp(false)
    }
  }

  async function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setInfo('')
    setIsVerifyingOtp(true)

    try {
      const response = await fetch('/api/auth/user-register/verify-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          next: nextPath,
        }),
      })
      const payload = (await response.json()) as VerifyResponse
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Verifikasi OTP gagal')
      }

      setRedirectTo(payload.redirectTo || '/')
      setStep('success')
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Verifikasi OTP gagal')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#edf3ef] px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <Link
          href="/"
          className="mb-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#1B4332]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center justify-center">
            <BrandMark className="h-10 w-10" />
          </div>

          {/* Stepper removed for simplicity */}

          {error ? (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          {info ? (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              {info}
            </div>
          ) : null}

          {step === 'form' ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void requestOtp('submit')
              }}
            >
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[#1B4332]">Daftar Akun MPJ Event</h1>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Buat akun untuk mendaftar event dan melihat riwayat kegiatan Anda.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nama Lengkap</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      required
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="h-14 rounded-2xl border-gray-200 bg-white pl-11 text-base text-[#1B4332] placeholder:text-gray-400"
                      placeholder="Nama lengkap"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-14 rounded-2xl border-gray-200 bg-white pl-11 text-base text-[#1B4332] placeholder:text-gray-400"
                      placeholder="nama@mpj.id"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">WhatsApp</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(event) => setWhatsapp(event.target.value)}
                      className="h-14 rounded-2xl border-gray-200 bg-white pl-11 text-base text-[#1B4332] placeholder:text-gray-400"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-14 rounded-2xl border-gray-200 bg-white pl-11 text-base text-[#1B4332] placeholder:text-gray-400"
                      placeholder="Minimal 8 karakter"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Konfirmasi Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="h-14 rounded-2xl border-gray-200 bg-white pl-11 text-base text-[#1B4332] placeholder:text-gray-400"
                      placeholder="Ulangi kata sandi"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isRequestingOtp}
                  className="h-14 w-full rounded-full bg-[#1B4332] text-base font-extrabold text-white hover:bg-[#14532d]"
                >
                  {isRequestingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Daftar
                </Button>
              </div>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-500">Sudah punya akun? </span>
                <Link href={loginHref} className="font-semibold text-[#1B4332] hover:underline">
                  Masuk
                </Link>
              </div>
            </form>
          ) : null}

          {OTP_ENABLED && step === 'otp' ? (
            <form onSubmit={verifyOtp}>
              <div className="mb-5">
                <h1 className="text-3xl font-extrabold leading-tight text-[#1B4332]">Verifikasi OTP Email</h1>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  Masukkan kode OTP yang kami kirim ke <span className="font-semibold text-[#1B4332]">{email}</span>.
                </p>
              </div>

              <div className="mb-5 rounded-2xl bg-[#f4f7f5] p-4 text-sm text-gray-600">
                <p className="font-semibold text-[#1B4332]">{fullName}</p>
                <p className="mt-1">{email}</p>
                <p>{whatsapp}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kode OTP</Label>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-14 rounded-2xl border-gray-200 bg-white text-center text-2xl font-extrabold tracking-[0.4em] text-[#1B4332] placeholder:tracking-normal"
                  placeholder="000000"
                />
              </div>

              <Button
                type="submit"
                disabled={isVerifyingOtp || otp.length !== 6}
                className="mt-6 h-14 w-full rounded-full bg-[#1B4332] text-base font-extrabold text-white hover:bg-[#14532d]"
              >
                {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Verifikasi & Masuk
              </Button>

              <button
                type="button"
                disabled={isResendingOtp || resendCooldown > 0}
                onClick={() => void requestOtp('resend')}
                className="mt-4 w-full text-sm font-semibold text-[#1B4332] disabled:text-gray-400"
              >
                {isResendingOtp ? 'Mengirim ulang OTP...' : resendCooldown > 0 ? `Kirim ulang OTP dalam ${formatCountdown(resendCooldown)}` : 'Kirim ulang OTP'}
              </button>
            </form>
          ) : null}

          {step === 'success' ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f0ec] text-[#1B4332]">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h1 className="text-2xl font-extrabold leading-tight text-[#1B4332]">
                Data akun berhasil diterima.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Silakan lanjut login untuk melihat dan mendaftar event MPJ.
              </p>
              <div className="mt-8">
                <Link
                  href={loginHref}
                  className="flex h-14 w-full items-center justify-center rounded-full bg-[#1B4332] px-4 text-base font-extrabold text-white transition hover:bg-[#14532d]"
                >
                  Lanjut ke Login
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
