'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Pencil, Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Regional = {
  id: string
  name: string
  code: string
  status: string
}

function codeFromName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function RegionalManagementClient({ regionals }: { regionals: Regional[] }) {
  const [rows, setRows] = useState(regionals)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [codeTouched, setCodeTouched] = useState(false)
  const [form, setForm] = useState({ name: '', code: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', code: '' })

  const editingRegional = rows.find((regional) => regional.id === editingId) ?? null

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rows
    return rows.filter((regional) => [regional.name, regional.code, regional.status].some((value) => value.toLowerCase().includes(keyword)))
  }, [rows, search])

  async function refreshRows() {
    const response = await fetch('/api/regionals', { cache: 'no-store' })
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
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'Aksi gagal')
    await refreshRows()
    return payload
  }

  async function createRegional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      setIsSaving(true)
      await runAction('/api/regionals', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setForm({ name: '', code: '' })
      setCodeTouched(false)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Gagal membuat regional')
    } finally {
      setIsSaving(false)
    }
  }

  function startEdit(regional: Regional) {
    setEditingId(regional.id)
    setEditForm({ name: regional.name, code: regional.code })
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingRegional) return
    try {
      await runAction(`/api/regionals/${editingRegional.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      })
      setEditingId(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal mengubah regional')
    }
  }

  async function toggleStatus(regional: Regional) {
    try {
      await runAction(`/api/regionals/${regional.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: regional.status === 'active' ? 'inactive' : 'active' }),
      })
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Gagal mengubah status regional')
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          {error}
        </div>
      ) : null}

      <form onSubmit={createRegional} className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_140px]">
        <Input
          value={form.name}
          onChange={(event) => {
            const name = event.target.value
            setForm((current) => ({ ...current, name, code: codeTouched ? current.code : codeFromName(name) }))
          }}
          required
          className="h-10 rounded-xl"
          placeholder="Nama regional"
        />
        <Input
          value={form.code}
          onChange={(event) => {
            setCodeTouched(true)
            setForm((current) => ({ ...current, code: event.target.value }))
          }}
          required
          className="h-10 rounded-xl"
          placeholder="kode-regional"
        />
        <Button disabled={isSaving} className="h-10 rounded-xl bg-[#1B4332] text-white">
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </form>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-extrabold text-[#1B4332]">Daftar Regional</h2>
            <p className="text-sm text-gray-500">Regional nonaktif tidak muncul di dropdown Admin Regional.</p>
          </div>
          <div className="relative md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 rounded-xl pl-9" placeholder="Cari regional..." />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3">Nama Regional</th>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((regional) => (
                <tr key={regional.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold text-[#1B4332]">{regional.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{regional.code}</td>
                  <td className="px-4 py-3">
                    <Badge className={regional.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
                      {regional.status === 'active' ? 'active' : 'inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" type="button" onClick={() => startEdit(regional)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" type="button" onClick={() => toggleStatus(regional)}>
                        {regional.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm font-semibold text-gray-400">Belum ada regional.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {editingRegional ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h3 className="font-extrabold text-[#1B4332]">Edit Regional</h3>
            <p className="text-sm text-gray-500">Status diubah melalui tombol aktif/nonaktif agar tidak ada hard delete.</p>
          </div>
          <form onSubmit={saveEdit} className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <Input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} required className="h-10 rounded-xl" />
            <Input value={editForm.code} onChange={(event) => setEditForm((current) => ({ ...current, code: event.target.value }))} required className="h-10 rounded-xl" />
            <div className="flex gap-2">
              <Button type="submit" className="h-10 rounded-xl bg-[#1B4332] text-white">Simpan</Button>
              <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setEditingId(null)}>Batal</Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
