'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UserRegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Konfirmasi password belum sama.')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#edf3ef] px-4 py-6">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
          <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1B4332] text-[#C9A227]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-extrabold tracking-tight text-[#1B4332]">MPJ Event</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">Create Account</p>
                </div>
              </div>

              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <h1 className="text-3xl font-extrabold leading-tight text-[#1B4332]">Permintaan akun diterima</h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Alur pembuatan akun publik sedang disiapkan untuk terhubung ke MPJ Apps. Data formulir sudah tervalidasi
                di frontend dan halaman ini siap dihubungkan ke backend tanpa mengubah pola UI.
              </p>

              <div className="mt-5 rounded-2xl bg-[#f4f7f5] p-4 text-sm text-gray-600">
                <p className="font-semibold text-[#1B4332]">{fullName}</p>
                <p className="mt-1">{email}</p>
                <p>{whatsapp}</p>
              </div>

              <div className="mt-5 space-y-2">
                <Link
                  href="/auth/user-login"
                  className="flex h-14 w-full items-center justify-center rounded-full bg-[#1B4332] px-4 text-base font-extrabold text-white transition hover:bg-[#14532d]"
                >
                  Lanjut ke Login
                </Link>
                <Link
                  href="/"
                  className="flex h-14 w-full items-center justify-center rounded-full border border-[#1B4332]/15 bg-white px-4 text-base font-semibold text-[#1B4332] transition hover:bg-[#f4f7f5]"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
          <form onSubmit={handleSubmit}>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1B4332] text-[#C9A227]">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-extrabold tracking-tight text-[#1B4332]">MPJ Event</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">Create Account</p>
              </div>
            </div>

            <div className="max-w-xs">
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[#1B4332]">Buat akun peserta</h1>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                Siapkan akun Anda untuk daftar event lebih cepat, melihat tiket, dan menyimpan riwayat pendaftaran.
              </p>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

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
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">No. Telepon</Label>
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
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kata Sandi</Label>
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
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Konfirmasi Kata Sandi</Label>
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
                className="h-14 w-full rounded-full bg-[#1B4332] text-base font-extrabold text-white hover:bg-[#14532d]"
              >
                Daftar Akun
              </Button>
            </div>

            <div className="mt-5 text-center text-sm font-semibold text-gray-400">atau</div>

            <Link
              href="/auth/user-login"
              className="mt-5 flex h-14 w-full items-center justify-center rounded-full border border-[#1B4332]/15 bg-white px-4 text-base font-semibold text-[#1B4332] transition hover:bg-[#f4f7f5]"
            >
              Sudah punya akun
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}
