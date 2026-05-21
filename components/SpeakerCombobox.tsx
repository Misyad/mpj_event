'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronDown, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getSpeakerCategorySuggestions } from '@/lib/speaker-categories'
import type { Speaker } from '@/types'

interface SpeakerComboboxProps {
  value?: string
  onChange?: (speakerId: string | null) => void
  placeholder?: string
}

type SpeakerDraft = {
  nama_lengkap: string
  kategori: string
  no_telp: string
  alamat: string
  portfolio_url: string
  bio: string
  keahlian: string
}

const emptyDraft: SpeakerDraft = {
  nama_lengkap: '',
  kategori: '',
  no_telp: '',
  alamat: '',
  portfolio_url: '',
  bio: '',
  keahlian: '',
}

function speakerPayload(form: SpeakerDraft) {
  return {
    nama_lengkap: form.nama_lengkap.trim(),
    kategori: form.kategori.trim() || 'Lainnya',
    no_telp: form.no_telp.trim(),
    alamat: form.alamat.trim(),
    portfolio_url: form.portfolio_url.trim(),
    bio: form.bio.trim(),
    keahlian: form.keahlian.split(',').map((item) => item.trim()).filter(Boolean),
  }
}

export function SpeakerCombobox({ value, onChange, placeholder = 'Cari narasumber...' }: SpeakerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<SpeakerDraft>(emptyDraft)
  const [createError, setCreateError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    async function loadSpeakers() {
      try {
        const response = await fetch('/api/admin/speakers', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal memuat narasumber')
        if (active) setSpeakers(payload.data)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat narasumber')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadSpeakers()
    return () => {
      active = false
    }
  }, [])

  const selected = useMemo(
    () => (value ? speakers.find((speaker) => speaker.id === value) ?? null : null),
    [speakers, value],
  )

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return speakers
    return speakers.filter((speaker) =>
      speaker.nama_lengkap.toLowerCase().includes(keyword) ||
      speaker.keahlian.some((skill) => skill.toLowerCase().includes(keyword)) ||
      speaker.kategori.toLowerCase().includes(keyword)
    )
  }, [query, speakers])

  const categorySuggestions = useMemo(() => getSpeakerCategorySuggestions(speakers), [speakers])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectSpeaker(speaker: Speaker) {
    onChange?.(speaker.id)
    setOpen(false)
    setQuery('')
  }

  function clearSpeaker() {
    onChange?.(null)
    setQuery('')
  }

  function openCreateDialog() {
    setCreateForm({
      ...emptyDraft,
      nama_lengkap: query.trim(),
      kategori: categorySuggestions[0] ?? 'Lainnya',
    })
    setCreateError('')
    setCreateOpen(true)
  }

  async function createSpeaker() {
    const payload = speakerPayload(createForm)
    if (!payload.nama_lengkap) {
      setCreateError('Nama lengkap narasumber wajib diisi')
      return
    }

    try {
      setIsCreating(true)
      setCreateError('')
      const response = await fetch('/api/admin/speakers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Gagal menyimpan narasumber')
      const created = result.data as Speaker
      setSpeakers((current) => [created, ...current.filter((speaker) => speaker.id !== created.id)])
      onChange?.(created.id)
      setCreateOpen(false)
      setOpen(false)
      setQuery('')
    } catch (createErrorValue) {
      setCreateError(createErrorValue instanceof Error ? createErrorValue.message : 'Gagal menyimpan narasumber')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="w-full flex items-center gap-2 px-3 h-10 rounded-xl border border-input bg-background text-sm text-left hover:border-[#1B4332]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20"
        >
          {selected ? (
            <>
              <Image src={selected.foto_url} alt={selected.nama_lengkap} width={24} height={24} className="h-6 w-6 rounded-full object-cover shrink-0" />
              <span className="flex-1 font-medium text-[#1B4332] truncate">{selected.nama_lengkap}</span>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">{selected.kategori}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation()
                  clearSpeaker()
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    event.stopPropagation()
                    clearSpeaker()
                  }
                }}
                className="p-0.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="flex-1 text-gray-400">{placeholder}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>

        {open ? (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ketik nama atau keahlian..."
                  className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 rounded-lg border-0 outline-none focus:ring-1 focus:ring-[#1B4332]/20"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="py-8 text-center text-sm text-gray-400">Memuat narasumber...</div>
              ) : error ? (
                <div className="py-8 px-4 text-center text-sm text-red-500">{error}</div>
              ) : filtered.length === 0 ? (
                <div className="space-y-3 px-4 py-6 text-center">
                  <p className="text-sm text-gray-400">Narasumber tidak ditemukan</p>
                  <button
                    type="button"
                    onClick={openCreateDialog}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#14532d]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah narasumber baru
                  </button>
                </div>
              ) : filtered.map((speaker) => (
                <button
                  key={speaker.id}
                  type="button"
                  onClick={() => selectSpeaker(speaker)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1B4332]/5 transition-colors text-left ${
                    speaker.id === value ? 'bg-[#1B4332]/5' : ''
                  }`}
                >
                  <Image src={speaker.foto_url} alt={speaker.nama_lengkap} width={32} height={32} className="h-8 w-8 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1B4332] truncate">{speaker.nama_lengkap}</p>
                    <p className="text-[10px] text-gray-400 truncate">{speaker.keahlian.slice(0, 2).join(' - ') || speaker.kategori}</p>
                  </div>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">{speaker.kategori}</span>
                  {speaker.id === value ? <span className="text-emerald-500 text-xs">OK</span> : null}
                </button>
              ))}
            </div>
            {!isLoading && !error && filtered.length > 0 ? (
              <div className="border-t border-gray-100 p-2">
                <button
                  type="button"
                  onClick={openCreateDialog}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 transition hover:border-[#1B4332] hover:text-[#1B4332]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah narasumber baru
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Narasumber Baru</DialogTitle>
            <DialogDescription>Data akan masuk ke master narasumber dan langsung dipilih untuk event ini.</DialogDescription>
          </DialogHeader>
          {createError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{createError}</div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input value={createForm.nama_lengkap} onChange={(event) => setCreateForm((current) => ({ ...current, nama_lengkap: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Input
                list="speaker-combobox-category-options"
                value={createForm.kategori}
                onChange={(event) => setCreateForm((current) => ({ ...current, kategori: event.target.value }))}
                placeholder="Contoh: Public Speaking"
              />
              <datalist id="speaker-combobox-category-options">
                {categorySuggestions.map((category) => <option key={category} value={category} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>No. Telepon / WhatsApp</Label>
              <Input value={createForm.no_telp} onChange={(event) => setCreateForm((current) => ({ ...current, no_telp: event.target.value }))} placeholder="08111222333" />
            </div>
            <div className="space-y-1.5">
              <Label>Alamat</Label>
              <Input value={createForm.alamat} onChange={(event) => setCreateForm((current) => ({ ...current, alamat: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Portfolio / Website</Label>
              <Input value={createForm.portfolio_url} onChange={(event) => setCreateForm((current) => ({ ...current, portfolio_url: event.target.value }))} placeholder="https://example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Keahlian</Label>
              <Input value={createForm.keahlian} onChange={(event) => setCreateForm((current) => ({ ...current, keahlian: event.target.value }))} placeholder="Pisahkan dengan koma" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Bio Singkat</Label>
              <Textarea value={createForm.bio} onChange={(event) => setCreateForm((current) => ({ ...current, bio: event.target.value }))} className="min-h-24 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>Batal</Button>
            <Button type="button" className="bg-[#1B4332] text-white hover:bg-[#14532d]" onClick={createSpeaker} disabled={isCreating}>
              {isCreating ? 'Menyimpan...' : 'Simpan dan Pilih'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
