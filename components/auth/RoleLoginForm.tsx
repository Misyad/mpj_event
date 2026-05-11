'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, Loader2, LockKeyhole, Mail } from 'lucide-react'
import type { AuthRole } from '@/lib/auth/roles'
import { getAuthRoleConfig } from '@/lib/auth/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function RoleLoginForm({ role }: { role: AuthRole }) {
  const config = getAuthRoleConfig(role)
  const router = useRouter()
  const Icon = config?.icon
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!config) return
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          role: config.role,
          email,
          password,
          remember,
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Login gagal')
      }

      router.replace(payload.redirectTo || config.dashboardPath)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login gagal')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!config || !Icon) return null

  return (
    <div className="min-h-screen bg-[#edf3ef] px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <Link href="/" className="mb-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#1B4332]">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1B4332] text-[#C9A227]">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-[#1B4332]">{config.title}</h1>
                {config.badge ? (
                  <span className="rounded-full bg-[#C9A227]/15 px-2 py-0.5 text-[10px] font-bold text-[#8a6a12]">
                    {config.badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{config.description}</p>
            </div>
          </div>

          {error ? (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-600">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 rounded-2xl pl-9"
                  placeholder="nama@mpj.id"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs font-bold text-gray-600">Password</Label>
                <button type="button" className="text-xs font-semibold text-[#1B4332] hover:underline">
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 rounded-2xl pl-9"
                  placeholder="Masukkan password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3">
              <div>
                <p className="text-sm font-semibold text-[#1B4332]">Remember me</p>
                <p className="text-xs text-gray-400">Simpan sesi role ini di perangkat</p>
              </div>
              <Switch checked={remember} onCheckedChange={setRemember} />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-2xl bg-[#1B4332] text-white hover:bg-[#14532d]"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Masuk ke {config.shortTitle}
            </Button>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-gray-200 p-3">
            <p className="text-xs font-bold text-gray-500">Akses role</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {config.permissions.map((permission) => (
                <span key={permission} className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">
                  {permission}
                </span>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
