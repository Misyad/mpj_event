'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import type { AuthRole } from '@/lib/auth/roles'
import { AUTH_ROLE_CONFIGS, getAuthRoleConfig } from '@/lib/auth/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type LoginResponse = {
  ok?: boolean
  error?: string
  role?: AuthRole
  redirectTo?: string
  requiresRoleSelection?: boolean
  roles?: AuthRole[]
}

export function RoleLoginForm({
  role,
  nextPath,
  embedded = false,
  onAuthenticated,
}: {
  role?: AuthRole
  nextPath?: string
  embedded?: boolean
  onAuthenticated?: () => void
}) {
  const lockedConfig = role ? getAuthRoleConfig(role) : null
  const HeaderIcon = lockedConfig?.icon ?? LockKeyhole
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [availableRoles, setAvailableRoles] = useState<AuthRole[] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submitLogin(selectedRole?: AuthRole) {
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole ?? role,
          email,
          password,
          remember,
          next: nextPath,
        }),
      })
      const payload = (await response.json()) as LoginResponse

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Login gagal')
      }

      if (payload.requiresRoleSelection && payload.roles?.length) {
        setAvailableRoles(payload.roles)
        return
      }

      onAuthenticated?.()
      router.replace(payload.redirectTo || getAuthRoleConfig(payload.role ?? role ?? 'user')?.dashboardPath || '/')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login gagal')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitLogin()
  }

  const form = (
    <form onSubmit={handleSubmit} className={cn('rounded-3xl border border-white/80 bg-white p-5 shadow-sm', embedded && 'rounded-2xl border-gray-100 p-0 shadow-none')}>
      {!embedded ? (
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1B4332] text-[#C9A227]">
            <HeaderIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1B4332]">{lockedConfig?.title ?? 'Masuk MPJ Event'}</h1>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Masukkan email dan password. Role dashboard akan mengikuti data akun di database.
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {availableRoles ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-extrabold text-[#1B4332]">Pilih role untuk sesi ini</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Akun ini memiliki beberapa role. Pilih dashboard yang ingin dibuka.
            </p>
          </div>

          {AUTH_ROLE_CONFIGS.filter((config) => availableRoles.includes(config.role)).map((config) => {
            const Icon = config.icon

            return (
              <button
                key={config.role}
                type="button"
                disabled={isSubmitting}
                onClick={() => submitLogin(config.role)}
                className={cn(
                  'group flex w-full min-h-24 gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60',
                  config.accentClassName,
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 ring-1 ring-black/5">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-extrabold">{config.title}</p>
                    {config.badge ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold">
                        <ShieldCheck className="h-3 w-3" />
                        {config.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{config.description}</p>
                </div>
                <div className="flex items-center">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin opacity-60" /> : <ArrowRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />}
                </div>
              </button>
            )
          })}

          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => {
              setAvailableRoles(null)
              setPassword('')
            }}
            className="h-10 w-full rounded-2xl"
          >
            Ganti akun
          </Button>
        </div>
      ) : (
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
              <p className="text-xs text-gray-400">Simpan sesi akun ini di perangkat</p>
            </div>
            <Switch checked={remember} onCheckedChange={setRemember} />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-2xl bg-[#1B4332] text-white hover:bg-[#14532d]"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Masuk
          </Button>
        </div>
      )}
    </form>
  )

  if (embedded) return form

  return (
    <div className="min-h-screen bg-[#edf3ef] px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <Link href="/" className="mb-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#1B4332]">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        {form}
      </div>
    </div>
  )
}
