'use client'

import { useMemo, useState } from 'react'
import { CalendarCheck, CheckCircle2, Clock3, Search, ShieldAlert, UserRound, UsersRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PublicAccountList, PublicAccountUser } from '@/lib/server/rbac'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'active' | 'suspended' | 'inactive'

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusClassName(status: string) {
  if (status === 'active') return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  if (status === 'suspended') return 'border-amber-100 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-100 text-slate-700'
}

function SummaryCard({ label, value, icon: Icon, className }: { label: string; value: string | number; icon: typeof UsersRound; className: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-[#1B4332]">{value}</p>
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', className)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export function PublicUsersTable({ initialData }: { initialData: PublicAccountList }) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const newestLabel = useMemo(() => {
    const newest = data.summary.newestUser
    if (!newest) return '-'
    return newest.email
  }, [data.summary.newestUser])

  async function refreshUsers(nextSearch = search, nextStatus = status) {
    setError('')
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const keyword = nextSearch.trim()
      if (keyword) params.set('search', keyword)
      if (nextStatus !== 'all') params.set('status', nextStatus)
      params.set('limit', '150')

      const response = await fetch(`/api/super-admin/users?${params.toString()}`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal mengambil akun pengguna')
      setData(payload.data as PublicAccountList)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Gagal mengambil akun pengguna')
    } finally {
      setLoading(false)
    }
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void refreshUsers()
  }

  function onStatusChange(value: StatusFilter | null) {
    const nextStatus = value ?? 'all'
    setStatus(nextStatus)
    void refreshUsers(search, nextStatus)
  }

  function renderIdentity(user: PublicAccountUser) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#1B4332]">
          <UserRound className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-extrabold text-[#1B4332]">{user.fullName}</p>
          <p className="truncate text-xs font-semibold text-gray-400">{user.email}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Akun" value={data.summary.total} icon={UsersRound} className="bg-emerald-50 text-emerald-700" />
        <SummaryCard label="Akun Aktif" value={data.summary.active} icon={CheckCircle2} className="bg-blue-50 text-blue-700" />
        <SummaryCard label="Suspended/Inactive" value={data.summary.suspended + data.summary.inactive} icon={ShieldAlert} className="bg-amber-50 text-amber-700" />
        <SummaryCard label="Akun Terbaru" value={newestLabel} icon={Clock3} className="bg-slate-100 text-slate-700" />
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-extrabold text-[#1B4332]">Akun Pengguna</h2>
            <p className="text-sm text-gray-500">Daftar akun login peserta dari tabel users dengan role user.</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <form onSubmit={onSearchSubmit} className="relative md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 rounded-xl pl-9"
                placeholder="Cari nama, email, WhatsApp, NIAM..."
              />
            </form>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-10 rounded-xl md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" className="h-10 rounded-xl" disabled={loading} onClick={() => refreshUsers()}>
              {loading ? 'Memuat...' : 'Refresh'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">NIAM</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Email Verified</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr key={user.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{renderIdentity(user)}</td>
                  <td className="px-4 py-3 text-gray-600">{user.whatsapp || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{user.niam || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="outline" className="rounded-full border-blue-100 bg-blue-50 text-blue-700">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn('rounded-full font-bold', statusClassName(user.status))}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.emailVerifiedAt)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.lastLoginAt)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      <CalendarCheck className="h-3.5 w-3.5" />
                      {user.totalEvents}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.items.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <UsersRound className="h-6 w-6" />
            </div>
            <p className="mt-3 font-extrabold text-[#1B4332]">Belum ada akun pengguna</p>
            <p className="mt-1 text-sm text-gray-500">Akun hasil register peserta akan tampil di sini.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
