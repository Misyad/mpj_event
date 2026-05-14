'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Pencil, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Speaker, SpeakerCategory } from '@/types'

const CATEGORY_COLORS: Record<SpeakerCategory, string> = {
  Tech: 'bg-blue-100 text-blue-700',
  Bisnis: 'bg-amber-100 text-amber-700',
  Desain: 'bg-purple-100 text-purple-700',
  Jurnalistik: 'bg-emerald-100 text-emerald-700',
  Keagamaan: 'bg-teal-100 text-teal-700',
  Lainnya: 'bg-gray-100 text-gray-600',
}

const CATEGORIES: SpeakerCategory[] = ['Tech', 'Bisnis', 'Desain', 'Jurnalistik', 'Keagamaan', 'Lainnya']

type SpeakerForm = {
  nama_lengkap: string
  alamat: string
  kategori: SpeakerCategory
  no_telp: string
  portfolio_url: string
  foto_url: string
  bio: string
  keahlian: string
}

function toSpeakerForm(speaker: Speaker): SpeakerForm {
  return {
    nama_lengkap: speaker.nama_lengkap,
    alamat: speaker.alamat,
    kategori: speaker.kategori,
    no_telp: speaker.no_telp,
    portfolio_url: speaker.portfolio_url,
    foto_url: speaker.foto_url,
    bio: speaker.bio,
    keahlian: speaker.keahlian.join(', '),
  }
}

function toSpeakerPayload(form: SpeakerForm) {
  return {
    ...form,
    keahlian: form.keahlian.split(',').map((item) => item.trim()).filter(Boolean),
  }
}

export default function NarasumberPage() {
  const [search, setSearch] = useState('')
  const [kategoriFilter, setKategoriFilter] = useState<string>('ALL')
  const [keahlianFilter, setKeahlianFilter] = useState('ALL')
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null)
  const [editForm, setEditForm] = useState<SpeakerForm | null>(null)
  const [deletingSpeaker, setDeletingSpeaker] = useState<Speaker | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSpeakers() {
      try {
        setIsLoading(true)
        setError('')
        const response = await fetch('/api/admin/speakers', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal memuat data narasumber')
        if (active) setSpeakers(payload.data)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data narasumber')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadSpeakers()

    return () => {
      active = false
    }
  }, [])

  const allKeahlian = useMemo(
    () => Array.from(new Set(speakers.flatMap((speaker) => speaker.keahlian))).sort(),
    [speakers],
  )

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return speakers.filter((speaker) => {
      const matchSearch =
        !keyword ||
        speaker.nama_lengkap.toLowerCase().includes(keyword) ||
        speaker.alamat.toLowerCase().includes(keyword)
      const matchKat = kategoriFilter === 'ALL' || speaker.kategori === kategoriFilter
      const matchKeahlian = keahlianFilter === 'ALL' || speaker.keahlian.includes(keahlianFilter)
      return matchSearch && matchKat && matchKeahlian
    })
  }, [kategoriFilter, keahlianFilter, search, speakers])

  const completeContactCount = speakers.filter((speaker) => speaker.no_telp && speaker.portfolio_url).length
  const activeCategoryCount = new Set(speakers.map((speaker) => speaker.kategori)).size

  function startEdit(speaker: Speaker) {
    setEditingSpeaker(speaker)
    setEditForm(toSpeakerForm(speaker))
  }

  async function saveEdit() {
    if (!editingSpeaker || !editForm) return
    try {
      setIsSaving(true)
      setError('')
      const response = await fetch(`/api/admin/speakers/${editingSpeaker.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(toSpeakerPayload(editForm)),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal menyimpan narasumber')
      setSpeakers((current) => current.map((speaker) => (speaker.id === editingSpeaker.id ? payload.data : speaker)))
      setEditingSpeaker(null)
      setEditForm(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan narasumber')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteSpeaker() {
    if (!deletingSpeaker) return
    try {
      setIsSaving(true)
      setError('')
      const response = await fetch(`/api/admin/speakers/${deletingSpeaker.id}`, { method: 'DELETE' })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal menghapus narasumber')
      setSpeakers((current) => current.filter((speaker) => speaker.id !== deletingSpeaker.id))
      setDeletingSpeaker(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus narasumber')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-5 md:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1B4332]">Narasumber</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola daftar pembicara dan narasumber event</p>
        </div>
        <Link href="/admin-pusat/narasumber/new">
          <Button className="bg-[#1B4332] hover:bg-[#14532d] text-white gap-1.5 h-9 text-sm rounded-xl">
            <Plus className="w-4 h-4" /> Tambah
          </Button>
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: speakers.length, color: 'text-[#1B4332]' },
          { label: 'Kategori Aktif', value: activeCategoryCount, color: 'text-emerald-600' },
          { label: 'Kontak Lengkap', value: completeContactCount, color: 'text-amber-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau lokasi..."
            className="pl-9 h-9 rounded-xl border-gray-200 text-sm"
          />
        </div>
        <Select value={kategoriFilter} onValueChange={(value) => value !== null && setKategoriFilter(value)}>
          <SelectTrigger className="h-9 w-full sm:w-44 rounded-xl border-gray-200 text-sm">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Kategori</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={keahlianFilter} onValueChange={(value) => value !== null && setKeahlianFilter(value)}>
          <SelectTrigger className="h-9 w-full sm:w-48 rounded-xl border-gray-200 text-sm">
            <SelectValue placeholder="Filter Keahlian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Keahlian</SelectItem>
            {allKeahlian.map((skill) => (
              <SelectItem key={skill} value={skill}>{skill}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400 text-sm">
          Memuat data narasumber...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400 text-sm">
          Tidak ada narasumber ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((speaker) => (
            <div key={speaker.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <Image
                  src={speaker.foto_url}
                  alt={speaker.nama_lengkap}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-xl object-cover bg-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1B4332] text-sm line-clamp-1">{speaker.nama_lengkap}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{speaker.alamat || 'Alamat belum diisi'}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${CATEGORY_COLORS[speaker.kategori]}`}>
                    {speaker.kategori}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{speaker.bio || 'Bio belum diisi.'}</p>

              <div className="flex flex-wrap gap-1.5">
                {speaker.keahlian.length > 0 ? (
                  speaker.keahlian.map((skill) => (
                    <span key={skill} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{skill}</span>
                  ))
                ) : (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Keahlian belum diisi</span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                {speaker.no_telp ? (
                  <a href={`tel:${speaker.no_telp}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1B4332] transition-colors">
                    <Phone className="w-3.5 h-3.5" /> {speaker.no_telp}
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Phone className="w-3.5 h-3.5" /> Belum ada nomor
                  </span>
                )}
                <div className="flex-1" />
                {speaker.portfolio_url ? (
                  <a
                    href={speaker.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => startEdit(speaker)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:border-[#1B4332] hover:text-[#1B4332]"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingSpeaker(speaker)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(editingSpeaker)} onOpenChange={(open) => {
        if (!open) {
          setEditingSpeaker(null)
          setEditForm(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Narasumber</DialogTitle>
            <DialogDescription>Perbarui data pembicara yang dipakai di event.</DialogDescription>
          </DialogHeader>
          {editForm ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nama Lengkap</Label>
                <Input value={editForm.nama_lengkap} onChange={(event) => setEditForm((current) => current ? { ...current, nama_lengkap: event.target.value } : current)} />
              </div>
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={editForm.kategori} onValueChange={(value) => setEditForm((current) => current ? { ...current, kategori: value as SpeakerCategory } : current)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Alamat</Label>
                <Input value={editForm.alamat} onChange={(event) => setEditForm((current) => current ? { ...current, alamat: event.target.value } : current)} />
              </div>
              <div className="space-y-1.5">
                <Label>No. Telepon</Label>
                <Input value={editForm.no_telp} onChange={(event) => setEditForm((current) => current ? { ...current, no_telp: event.target.value } : current)} />
              </div>
              <div className="space-y-1.5">
                <Label>Portfolio URL</Label>
                <Input value={editForm.portfolio_url} onChange={(event) => setEditForm((current) => current ? { ...current, portfolio_url: event.target.value } : current)} />
              </div>
              <div className="space-y-1.5">
                <Label>Foto URL</Label>
                <Input value={editForm.foto_url} onChange={(event) => setEditForm((current) => current ? { ...current, foto_url: event.target.value } : current)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Keahlian</Label>
                <Input value={editForm.keahlian} onChange={(event) => setEditForm((current) => current ? { ...current, keahlian: event.target.value } : current)} placeholder="Pisahkan dengan koma" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Bio</Label>
                <Textarea value={editForm.bio} onChange={(event) => setEditForm((current) => current ? { ...current, bio: event.target.value } : current)} />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingSpeaker(null)} disabled={isSaving}>Batal</Button>
            <Button type="button" className="bg-[#1B4332] text-white" onClick={saveEdit} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingSpeaker)} onOpenChange={(open) => {
        if (!open) setDeletingSpeaker(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Narasumber?</DialogTitle>
            <DialogDescription>
              Data {deletingSpeaker?.nama_lengkap ?? 'narasumber'} akan dihapus dari daftar narasumber.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingSpeaker(null)} disabled={isSaving}>Batal</Button>
            <Button type="button" className="bg-red-600 text-white hover:bg-red-700" onClick={deleteSpeaker} disabled={isSaving}>
              {isSaving ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
