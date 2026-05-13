'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Activity, KeyRound, LogOut, Pencil, Search, ShieldOff, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Regional = {
  id: string
  name: string
  code: string
}

type AdminRegional = {
  id: string
  fullName: string
  email: string
  status: string
  lastLoginAt: string | null
  regionalId: string | null
  regionalName: string | null
  activeSessions: number
  totalPeserta: number
}

type ActivityRow = {
  action: string
  entityType: string | null
  entityId: string | null
  createdAt: string
}

export function AdminRegionalTable({ admins, regionals }: { admins: AdminRegional[]; regionals: Regional[] }) {
  const [rows, setRows] = useState(admins)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ fullName: '', regionalId: '', status: 'active' })
  const [activity, setActivity] = useState<{ adminName: string; rows: ActivityRow[] } | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: 'Admin123!', regionalId: regionals[0]?.id ?? '' })
  const editingAdmin = rows.find((admin) => admin.id === editingId) ?? null

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rows
    return rows.filter((admin) =>
      [admin.fullName, admin.email, admin.regionalName ?? '', admin.status].some((value) => value.toLowerCase().includes(keyword)),
    )
  }, [rows, search])

  async function refreshRows() {
    const response = await fetch('/api/super-admin/admins', { cache: 'no-store' })
    const payload = await response.json()
    if (response.ok && payload.ok) setRows(payload.data)
  }

  async function runAction(path: string, init: RequestInit = {}) {
    setError('')
    const response = await fetch(path, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    })
    const payload = await response.json()
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || 'Aksi gagal')
    }
    await refreshRows()
    return payload
  }

  async function createAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      setIsCreating(true)
      await runAction('/api/super-admin/admins', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setForm({ fullName: '', email: '', password: 'Admin123!', regionalId: regionals[0]?.id ?? '' })
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Gagal membuat admin regional')
    } finally {
      setIsCreating(false)
    }
  }

  async function suspendAdmin(id: string) {
    try {
      await runAction(`/api/super-admin/admins/${id}/suspend`, { method: 'POST' })
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Gagal suspend admin')
    }
  }

  async function resetPassword(id: string) {
    try {
      const payload = await runAction(`/api/super-admin/admins/${id}/reset-password`, { method: 'POST' })
      setError(`Reset token sementara: ${payload.data.resetToken}`)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Gagal reset password')
    }
  }

  async function forceLogout(id: string) {
    try {
      await runAction(`/api/super-admin/admins/${id}/force-logout`, { method: 'POST' })
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Gagal force logout')
    }
  }

  function startEdit(admin: AdminRegional) {
    setEditingId(admin.id)
    setEditForm({
      fullName: admin.fullName,
      regionalId: admin.regionalId ?? regionals[0]?.id ?? '',
      status: admin.status,
    })
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingAdmin) return
    try {
      await runAction(`/api/super-admin/admins/${editingAdmin.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      })
      setEditingId(null)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Gagal update admin')
    }
  }

  async function viewActivity(admin: AdminRegional) {
    try {
      setError('')
      const response = await fetch(`/api/super-admin/admins/${admin.id}/activity`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal mengambil activity')
      setActivity({ adminName: admin.fullName, rows: payload.data })
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Gagal mengambil activity')
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          {error}
        </div>
      ) : null}

      <form onSubmit={createAdmin} className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:grid-cols-[1fr_1fr_180px_140px]">
        <Input
          value={form.fullName}
          onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
          required
          className="h-10 rounded-xl"
          placeholder="Nama admin regional"
        />
        <Input
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
          type="email"
          className="h-10 rounded-xl"
          placeholder="email@mpj.id"
        />
        <Select value={form.regionalId} onValueChange={(value) => setForm((current) => ({ ...current, regionalId: value ?? '' }))}>
          <SelectTrigger className="h-10 rounded-xl">
            <SelectValue placeholder="Regional" />
          </SelectTrigger>
          <SelectContent>
            {regionals.map((regional) => (
              <SelectItem key={regional.id} value={regional.id}>{regional.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button disabled={isCreating} className="h-10 rounded-xl bg-[#1B4332] text-white">
          <UserPlus className="h-4 w-4" />
          Tambah
        </Button>
      </form>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-extrabold text-[#1B4332]">Admin Regional</h2>
            <p className="text-sm text-gray-500">Kelola akun, regional scope, session, dan activity admin.</p>
          </div>
          <div className="relative md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 rounded-xl pl-9" placeholder="Cari admin..." />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3">Nama Admin</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Regional</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Total Peserta</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((admin) => (
                <tr key={admin.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold text-[#1B4332]">{admin.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                  <td className="px-4 py-3">{admin.regionalName ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{admin.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString('id-ID') : '-'}</td>
                  <td className="px-4 py-3">{admin.totalPeserta}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button size="icon-sm" variant="outline" title="Edit" onClick={() => startEdit(admin)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon-sm" variant="outline" title="Suspend" onClick={() => suspendAdmin(admin.id)}><ShieldOff className="h-3.5 w-3.5" /></Button>
                      <Button size="icon-sm" variant="outline" title="Reset Password" onClick={() => resetPassword(admin.id)}><KeyRound className="h-3.5 w-3.5" /></Button>
                      <Button size="icon-sm" variant="outline" title="View Activity" onClick={() => viewActivity(admin)}><Activity className="h-3.5 w-3.5" /></Button>
                      <Button size="icon-sm" variant="outline" title="Force Logout" onClick={() => forceLogout(admin.id)}><LogOut className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingAdmin ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h3 className="font-extrabold text-[#1B4332]">Edit Admin Regional</h3>
            <p className="text-sm text-gray-500">{editingAdmin.email}</p>
          </div>
          <form onSubmit={saveEdit} className="grid gap-3 md:grid-cols-[1fr_220px_160px_auto]">
            <Input value={editForm.fullName} onChange={(event) => setEditForm((current) => ({ ...current, fullName: event.target.value }))} className="h-10 rounded-xl" />
            <Select value={editForm.regionalId} onValueChange={(value) => setEditForm((current) => ({ ...current, regionalId: value ?? '' }))}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Regional" />
              </SelectTrigger>
              <SelectContent>
                {regionals.map((regional) => (
                  <SelectItem key={regional.id} value={regional.id}>{regional.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={editForm.status} onValueChange={(value) => setEditForm((current) => ({ ...current, status: value ?? 'active' }))}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="suspended">suspended</SelectItem>
                <SelectItem value="inactive">inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button type="submit" className="h-10 rounded-xl bg-[#1B4332] text-white">Simpan</Button>
              <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setEditingId(null)}>Batal</Button>
            </div>
          </form>
        </div>
      ) : null}

      {activity ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-[#1B4332]">Activity Admin</h3>
              <p className="text-sm text-gray-500">{activity.adminName}</p>
            </div>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setActivity(null)}>Tutup</Button>
          </div>
          <div className="divide-y divide-gray-100">
            {activity.rows.map((row, index) => (
              <div key={`${row.action}-${row.createdAt}-${index}`} className="flex flex-col gap-1 py-3 text-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-[#1B4332]">{row.action}</p>
                  <p className="text-gray-500">{row.entityType ?? '-'} {row.entityId ?? ''}</p>
                </div>
                <p className="text-xs font-semibold text-gray-400">{new Date(row.createdAt).toLocaleString('id-ID')}</p>
              </div>
            ))}
            {activity.rows.length === 0 ? <p className="py-4 text-sm font-semibold text-gray-500">Belum ada activity.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
