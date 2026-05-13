'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { SpeakerCategory } from '@/types'

const CATEGORIES: SpeakerCategory[] = ['Tech', 'Bisnis', 'Desain', 'Jurnalistik', 'Keagamaan', 'Lainnya']

interface FormData {
  nama_lengkap: string
  alamat: string
  keahlian: string[]
  keahlianInput: string
  no_telp: string
  portfolio_url: string
  kategori: SpeakerCategory | ''
  bio: string
}

const defaultForm: FormData = {
  nama_lengkap: '',
  alamat: '',
  keahlian: [],
  keahlianInput: '',
  no_telp: '',
  portfolio_url: '',
  kategori: '',
  bio: '',
}

export default function NewSpeakerPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addKeahlian() {
    const val = form.keahlianInput.trim()
    if (!val || form.keahlian.includes(val)) return
    update('keahlian', [...form.keahlian, val])
    update('keahlianInput', '')
  }

  function removeKeahlian(skill: string) {
    update('keahlian', form.keahlian.filter((item) => item !== skill))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form.kategori) {
      setError('Kategori narasumber wajib dipilih')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      const response = await fetch('/api/admin/speakers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: form.nama_lengkap,
          alamat: form.alamat,
          keahlian: form.keahlian,
          no_telp: form.no_telp,
          portfolio_url: form.portfolio_url,
          kategori: form.kategori,
          bio: form.bio,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal menyimpan narasumber')

      setSubmitted(true)
      setTimeout(() => router.push('/admin-pusat/narasumber'), 900)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan narasumber')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-700">OK</div>
        <div>
          <p className="font-extrabold text-[#1B4332] text-xl">Narasumber Ditambahkan</p>
          <p className="text-gray-400 text-sm mt-1">Mengarahkan ke daftar narasumber...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin-pusat/narasumber">
          <button type="button" className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-[#1B4332]">Tambah Narasumber</h1>
          <p className="text-sm text-gray-400 mt-0.5">Data pembicara / narasumber event</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Nama Lengkap <span className="text-red-400">*</span></Label>
          <Input
            required
            value={form.nama_lengkap}
            onChange={(event) => update('nama_lengkap', event.target.value)}
            placeholder="Dr. Ahmad Faruqi, M.Kom"
            className="rounded-xl text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Kategori <span className="text-red-400">*</span></Label>
            <Select value={form.kategori} onValueChange={(value) => update('kategori', value as SpeakerCategory)}>
              <SelectTrigger className="rounded-xl text-sm h-10"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">No. Telepon / WhatsApp</Label>
            <Input
              value={form.no_telp}
              onChange={(event) => update('no_telp', event.target.value)}
              placeholder="08111222333"
              className="rounded-xl text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Alamat</Label>
          <Input
            value={form.alamat}
            onChange={(event) => update('alamat', event.target.value)}
            placeholder="Jakarta Selatan, DKI Jakarta"
            className="rounded-xl text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Portfolio / Website</Label>
          <Input
            value={form.portfolio_url}
            onChange={(event) => update('portfolio_url', event.target.value)}
            placeholder="https://example.com"
            className="rounded-xl text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Bio Singkat</Label>
          <Textarea
            value={form.bio}
            onChange={(event) => update('bio', event.target.value)}
            placeholder="Deskripsi singkat latar belakang dan pengalaman narasumber..."
            className="rounded-xl text-sm min-h-[80px] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-600">Keahlian</Label>
          <div className="flex gap-2">
            <Input
              value={form.keahlianInput}
              onChange={(event) => update('keahlianInput', event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addKeahlian()
                }
              }}
              placeholder="Ketik keahlian lalu Enter atau klik +"
              className="rounded-xl text-sm flex-1"
            />
            <button
              type="button"
              onClick={addKeahlian}
              className="w-10 h-10 rounded-xl bg-[#1B4332] text-white flex items-center justify-center hover:bg-[#14532d] transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {form.keahlian.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.keahlian.map((skill) => (
                <span key={skill} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                  {skill}
                  <button type="button" onClick={() => removeKeahlian(skill)} className="text-gray-400 hover:text-red-500 transition-colors ml-0.5">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <p className="text-[10px] text-gray-400">Contoh: UI/UX Design, Figma, Jurnalistik</p>
        </div>
      </div>

      <div className="flex gap-3 pb-8">
        <Link href="/admin-pusat/narasumber" className="flex-1">
          <Button type="button" variant="outline" className="w-full rounded-xl">Batal</Button>
        </Link>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-[#1B4332] hover:bg-[#14532d] text-white rounded-xl font-semibold"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Narasumber'}
        </Button>
      </div>
    </form>
  )
}
