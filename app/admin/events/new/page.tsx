'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Calendar, CreditCard, MapPin, Plus, Trash2, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PosterUploader } from '@/components/PosterUploader'
import { SpeakerCombobox } from '@/components/SpeakerCombobox'
import { EventCategory, CustomField, CustomFieldType, EventClass } from '@/types'

type EventType = 'Sistem Kelas' | 'Non-Kelas'
type PaymentMethod = 'manual' | 'gateway'

interface Speaker {
  id: string
  name: string
  topic: string
  kelas: string
}

interface FormData {
  name: string
  description: string
  category: EventCategory | ''
  eventType: EventType | ''
  date: string
  time: string
  location: string
  locationLink: string
  posterFile: File | null
  posterPreview: string
  gdriveLpj: string
  isOpenForPublic: boolean
  isPaid: boolean
  priceNiam: string
  pricePublic: string
  maxParticipants: string
  registrationDeadline: string
  paymentMethod: PaymentMethod
  bankName: string
  bankNumber: string
  bankAccountName: string
  midtransServerKey: string
  midtransClientKey: string
  midtransSandbox: boolean
  speakerId: string | null
  speakers: Speaker[]
  customFields: CustomField[]
  classes: EventClass[]
}

const defaultForm: FormData = {
  name: '', description: '', category: '', eventType: '',
  date: '', time: '', location: '', locationLink: '',
  posterFile: null, posterPreview: '', gdriveLpj: '',
  isOpenForPublic: true, isPaid: false,
  priceNiam: '0', pricePublic: '0',
  maxParticipants: '', registrationDeadline: '',
  paymentMethod: 'manual', bankName: '', bankNumber: '', bankAccountName: '',
  midtransServerKey: '', midtransClientKey: '', midtransSandbox: true,
  speakerId: null, speakers: [], customFields: [], classes: [],
}

function SectionHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-[#1B4332]/10 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="font-bold text-[#1B4332] text-sm">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

export default function NewEventPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function update(key: keyof FormData, value: FormData[typeof key]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function addSpeaker() {
    update('speakers', [...form.speakers, { id: Date.now().toString(), name: '', topic: '', kelas: '' }])
  }

  function removeSpeaker(id: string) {
    update('speakers', form.speakers.filter(s => s.id !== id))
  }

  function updateSpeaker(id: string, field: keyof Speaker, value: string) {
    update('speakers', form.speakers.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  function addCustomField() {
    const newField: CustomField = {
      id: Date.now().toString(),
      label: '',
      type: 'short_text',
      options: [],
      is_required: false,
      order: form.customFields.length
    }
    update('customFields', [...form.customFields, newField])
  }

  function removeCustomField(id: string) {
    update('customFields', form.customFields.filter(f => f.id !== id))
  }

  function updateCustomField(id: string, field: keyof CustomField, value: CustomField[keyof CustomField]) {
    update('customFields', form.customFields.map(f => f.id === id ? { ...f, [field]: value } : f))
  }

  function handleOptionsChange(id: string, value: string) {
    const options = value.split(',').map(s => s.trim()).filter(Boolean)
    updateCustomField(id, 'options', options)
  }

  function addClass() {
    update('classes', [...form.classes, { id: Date.now().toString(), name: '', quota: null, order: form.classes.length }])
  }

  function removeClass(id: string) {
    update('classes', form.classes.filter((eventClass) => eventClass.id !== id))
  }

  function updateClass(id: string, field: keyof EventClass, value: EventClass[keyof EventClass]) {
    update('classes', form.classes.map((eventClass) => eventClass.id === id ? { ...eventClass, [field]: value } : eventClass))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')

    if (!form.category) {
      setSubmitError('Kategori event wajib dipilih.')
      return
    }

    if (!form.date) {
      setSubmitError('Tanggal event wajib diisi.')
      return
    }

    setIsSubmitting(true)

    try {
      const customFields = form.customFields
        .map((field, index) => ({
          ...field,
          label: field.label.trim(),
          options: field.options.map((option) => option.trim()).filter(Boolean),
          order: index,
        }))
        .filter((field) => field.label)
      const invalidChoiceField = customFields.find((field) => ['radio', 'dropdown', 'checkbox'].includes(field.type) && field.options.length === 0)
      if (invalidChoiceField) {
        throw new Error(`Opsi wajib diisi untuk pertanyaan "${invalidChoiceField.label}"`)
      }
      const classes = form.eventType === 'Sistem Kelas'
        ? form.classes
            .map((eventClass, index) => ({
              ...eventClass,
              name: eventClass.name.trim(),
              quota: eventClass.quota === undefined || eventClass.quota === null ? null : Number(eventClass.quota),
              order: index,
            }))
            .filter((eventClass) => eventClass.name)
        : []
      if (form.eventType === 'Sistem Kelas' && classes.length === 0) {
        throw new Error('Minimal satu kelas wajib dibuat untuk event Sistem Kelas')
      }
      const invalidClass = classes.find((eventClass) => eventClass.quota !== null && (!Number.isInteger(eventClass.quota) || eventClass.quota < 1))
      if (invalidClass) {
        throw new Error(`Kuota kelas "${invalidClass.name}" harus berupa angka positif`)
      }

      const startDate = new Date(`${form.date}T${form.time || '00:00'}`)
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: form.name,
          slug: form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
          category: form.category,
          poster_url: form.posterPreview || 'https://picsum.photos/seed/mpj-event-new/800/450',
          posterUrl: form.posterPreview || 'https://picsum.photos/seed/mpj-event-new/800/450',
          description: form.description,
          location_gmaps: form.locationLink,
          locationMapsUrl: form.locationLink,
          location_name: form.location,
          location: form.location,
          locationType: 'offline',
          start_date: startDate.toISOString(),
          dateStart: startDate.toISOString(),
          is_open_for_public: form.isOpenForPublic,
          allowPublic: form.isOpenForPublic,
          is_paid: form.isPaid,
          isPaidEvent: form.isPaid,
          price_niam: Number(form.priceNiam || 0),
          priceNiam: Number(form.priceNiam || 0),
          price_public: Number(form.pricePublic || 0),
          priceUmum: Number(form.pricePublic || 0),
          max_participants: form.maxParticipants ? Number(form.maxParticipants) : null,
          quota: form.maxParticipants ? Number(form.maxParticipants) : null,
          status: 'draft',
          scope: 'pusat',
          isPublished: false,
          isPublic: true,
          status_pendaftaran: 'open',
          registrationDeadline: form.registrationDeadline || null,
          custom_fields: customFields,
          classes,
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Gagal membuat event')
      }

      setIsSubmitting(false)
      setSubmitted(true)
      setTimeout(() => router.push('/admin-pusat/events'), 1500)
    } catch (error) {
      setIsSubmitting(false)
      setSubmitError(error instanceof Error ? error.message : 'Gagal membuat event')
    }
  }

  if (submitted) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <p className="font-extrabold text-[#1B4332] text-xl">Event Berhasil Dibuat!</p>
          <p className="text-gray-400 text-sm mt-1">Status: DRAFT · Mengarahkan ke daftar event...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin-pusat/events">
          <button type="button" className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-[#1B4332]">Buat Event Baru</h1>
          <p className="text-sm text-gray-400 mt-0.5">Event akan tersimpan sebagai DRAFT terlebih dahulu</p>
        </div>
      </div>

      {submitError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {submitError}
        </div>
      ) : null}

      {/* ── Seksi 1: Info Dasar ──────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <SectionHeader icon={<Calendar className="w-4 h-4 text-[#1B4332]" />} title="Info Dasar" desc="Informasi utama event" />

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Nama Event <span className="text-red-400">*</span></Label>
          <Input required value={form.name} onChange={e => update('name', e.target.value)}
            placeholder="Contoh: Workshop Jurnalistik 2026" className="rounded-xl text-sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Kategori <span className="text-red-400">*</span></Label>
            <Select value={form.category} onValueChange={v => v !== null && update('category', v as EventCategory)}>
              <SelectTrigger className="rounded-xl text-sm h-10"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {(['Pelatihan', 'Seremonial', 'Rapat'] as EventCategory[]).map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Tipe Event <span className="text-red-400">*</span></Label>
            <Select value={form.eventType} onValueChange={v => v !== null && update('eventType', v as EventType)}>
              <SelectTrigger className="rounded-xl text-sm h-10"><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Non-Kelas">Non-Kelas (Umum / Seminar)</SelectItem>
                <SelectItem value="Sistem Kelas">Sistem Kelas (Dengan Pembagian Kelas)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Tanggal <span className="text-red-400">*</span></Label>
            <Input required type="date" value={form.date} onChange={e => update('date', e.target.value)} className="rounded-xl text-sm h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Jam Mulai</Label>
            <Input type="time" value={form.time} onChange={e => update('time', e.target.value)} className="rounded-xl text-sm h-10" />
          </div>
        </div>

        {form.eventType === 'Sistem Kelas' && (
          <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#1B4332]">Daftar Kelas</p>
                <p className="text-xs text-gray-500 mt-0.5">Peserta wajib memilih salah satu kelas saat registrasi.</p>
              </div>
              <Button type="button" onClick={addClass} variant="outline" size="sm" className="rounded-xl bg-white">
                <Plus className="w-4 h-4 mr-1" /> Tambah Kelas
              </Button>
            </div>

            {form.classes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-white p-5 text-center text-sm text-gray-500">
                Belum ada kelas. Tambahkan minimal satu kelas.
              </div>
            ) : (
              <div className="space-y-3">
                {form.classes.map((eventClass, index) => (
                  <div key={eventClass.id} className="grid gap-3 rounded-xl border border-gray-100 bg-white p-3 sm:grid-cols-[1fr_140px_auto]">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Nama Kelas #{index + 1}</Label>
                      <Input
                        value={eventClass.name}
                        onChange={e => updateClass(eventClass.id, 'name', e.target.value)}
                        placeholder="Contoh: Kelas A - Desain"
                        className="rounded-lg text-sm h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Kuota</Label>
                      <Input
                        type="number"
                        min="1"
                        value={eventClass.quota ?? ''}
                        onChange={e => updateClass(eventClass.id, 'quota', e.target.value ? Number(e.target.value) : null)}
                        placeholder="Opsional"
                        className="rounded-lg text-sm h-9"
                      />
                    </div>
                    <button type="button" onClick={() => removeClass(eventClass.id)} className="self-end rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Poster upload */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Poster Event</Label>
          <PosterUploader
            onFileSelect={(file, previewUrl) => {
              update('posterFile', file)
              update('posterPreview', previewUrl)
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Deskripsi Event</Label>
          <Textarea value={form.description} onChange={e => update('description', e.target.value)}
            placeholder="Tuliskan deskripsi singkat tentang event ini..." className="rounded-xl text-sm min-h-[100px] resize-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Maks. Peserta</Label>
            <Input type="number" min="1" value={form.maxParticipants}
              onChange={e => update('maxParticipants', e.target.value)}
              placeholder="Kosongkan jika tidak terbatas" className="rounded-xl text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Batas Pendaftaran</Label>
            <Input type="datetime-local" value={form.registrationDeadline}
              onChange={e => update('registrationDeadline', e.target.value)}
              className="rounded-xl text-sm h-10" />
          </div>
        </div>
      </div>

      {/* ── Seksi 2: Lokasi ─────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <SectionHeader icon={<MapPin className="w-4 h-4 text-[#1B4332]" />} title="Lokasi" desc="Tempat pelaksanaan event" />

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Nama Lokasi <span className="text-red-400">*</span></Label>
          <Input required value={form.location} onChange={e => update('location', e.target.value)}
            placeholder="Contoh: Gedung MPJ, Jakarta Pusat" className="rounded-xl text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Link Google Maps</Label>
          <Input value={form.locationLink} onChange={e => update('locationLink', e.target.value)}
            placeholder="https://maps.google.com/..." className="rounded-xl text-sm" />
        </div>
      </div>

      {/* ── Seksi 3: Peserta ────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
        <SectionHeader icon={<User className="w-4 h-4 text-[#1B4332]" />} title="Pengaturan Peserta" desc="Siapa yang bisa mendaftar & pertanyaan tambahan" />

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-[#1B4332]">Buka Jalur Umum</p>
            <p className="text-xs text-gray-400 mt-0.5">Izinkan peserta non-anggota (tanpa NIAM) mendaftar</p>
          </div>
          <Switch checked={form.isOpenForPublic} onCheckedChange={v => update('isOpenForPublic', v)} />
        </div>

        {/* Custom Form Builder */}
        <div className="border-t border-gray-100 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1B4332]">Pertanyaan Tambahan Pendaftaran</p>
              <p className="text-xs text-gray-400 mt-0.5">Kumpulkan info spesifik seperti ukuran baju, riwayat medis, dll</p>
            </div>
            <Button type="button" onClick={addCustomField} variant="outline" size="sm" className="rounded-xl border-[#1B4332]/20 text-[#1B4332] hover:bg-[#1B4332]/5">
              <Plus className="w-4 h-4 mr-1" /> Tambah Field
            </Button>
          </div>

          <div className="space-y-3">
            {form.customFields.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Belum ada pertanyaan tambahan.
              </div>
            ) : (
              form.customFields.map((field) => (
                <div key={field.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm relative group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">Pertanyaan</Label>
                          <Input value={field.label} onChange={e => updateCustomField(field.id, 'label', e.target.value)}
                            placeholder="Contoh: Ukuran Kaos" className="rounded-lg text-sm h-9" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">Tipe Jawaban</Label>
                          <Select value={field.type} onValueChange={v => v !== null && updateCustomField(field.id, 'type', v as CustomFieldType)}>
                            <SelectTrigger className="rounded-lg text-sm h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="short_text">Jawaban Pendek</SelectItem>
                              <SelectItem value="long_text">Paragraf</SelectItem>
                              <SelectItem value="radio">Pilihan Ganda (Satu)</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                              <SelectItem value="checkbox">Kotak Centang (Banyak)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {['radio', 'dropdown', 'checkbox'].includes(field.type) && (
                        <div className="space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <Label className="text-xs text-gray-500">Opsi Pilihan (Pisahkan dengan koma)</Label>
                          <Input 
                            value={field.options.join(', ')} 
                            onChange={e => handleOptionsChange(field.id, e.target.value)}
                            placeholder="S, M, L, XL, XXL" className="rounded-lg text-sm h-9 bg-white" />
                          <p className="text-[10px] text-gray-400">Pastikan gunakan koma. Contoh: S, M, L</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={field.is_required} 
                            onCheckedChange={v => updateCustomField(field.id, 'is_required', v)} 
                            id={`req-${field.id}`}
                          />
                          <Label htmlFor={`req-${field.id}`} className="text-xs cursor-pointer select-none text-gray-600">Wajib Diisi</Label>
                        </div>
                      </div>
                    </div>

                    <button type="button" onClick={() => removeCustomField(field.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Seksi 4: Pembayaran ──────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <SectionHeader icon={<CreditCard className="w-4 h-4 text-[#1B4332]" />} title="Pembayaran" desc="Konfigurasi biaya & metode bayar" />

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-[#1B4332]">Event Berbayar</p>
            <p className="text-xs text-gray-400 mt-0.5">Aktifkan jika peserta perlu membayar tiket</p>
          </div>
          <Switch checked={form.isPaid} onCheckedChange={v => update('isPaid', v)} />
        </div>

        {form.isPaid && (
          <div className="space-y-4">
            {/* Harga */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Harga Anggota (NIAM)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                  <Input type="number" min="0" value={form.priceNiam} onChange={e => update('priceNiam', e.target.value)}
                    placeholder="0" className="rounded-xl text-sm pl-9" />
                </div>
                <p className="text-[10px] text-gray-400">Bisa Rp 0 (gratis untuk anggota)</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Harga Umum</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                  <Input type="number" min="0" value={form.pricePublic} onChange={e => update('pricePublic', e.target.value)}
                    placeholder="0" className="rounded-xl text-sm pl-9" />
                </div>
              </div>
            </div>

            {/* Metode Pembayaran */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-600">Metode Pembayaran</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'manual', label: 'Transfer Manual', desc: 'Kode unik 3 digit' },
                  { value: 'gateway', label: 'Midtrans Snap', desc: 'QRIS, VA, dll' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => update('paymentMethod', opt.value as PaymentMethod)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${form.paymentMethod === opt.value ? 'border-[#1B4332] bg-[#1B4332]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className={`text-xs font-bold ${form.paymentMethod === opt.value ? 'text-[#1B4332]' : 'text-gray-700'}`}>{opt.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Account (for manual) */}
            {form.paymentMethod === 'manual' && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rekening Tujuan</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Nama Bank</Label>
                    <Input value={form.bankName} onChange={e => update('bankName', e.target.value)}
                      placeholder="BCA, BNI, BSI..." className="rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">No. Rekening</Label>
                    <Input value={form.bankNumber} onChange={e => update('bankNumber', e.target.value)}
                      placeholder="1234567890" className="rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Atas Nama</Label>
                    <Input value={form.bankAccountName} onChange={e => update('bankAccountName', e.target.value)}
                      placeholder="MPJ Indonesia" className="rounded-xl text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Midtrans Config (for gateway) */}
            {form.paymentMethod === 'gateway' && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Konfigurasi Midtrans</p>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Mode Sandbox</p>
                    <p className="text-[10px] text-gray-400">Aktifkan untuk testing, matikan untuk production</p>
                  </div>
                  <Switch checked={form.midtransSandbox} onCheckedChange={v => update('midtransSandbox', v)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Server Key</Label>
                  <Input type="password" value={form.midtransServerKey} onChange={e => update('midtransServerKey', e.target.value)}
                    placeholder="SB-Mid-server-..." className="rounded-xl text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Client Key</Label>
                  <Input value={form.midtransClientKey} onChange={e => update('midtransClientKey', e.target.value)}
                    placeholder="SB-Mid-client-..." className="rounded-xl text-sm font-mono" />
                </div>
                <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2">
                  ⚠️ Server Key akan dienkripsi sebelum disimpan ke database. Jangan bagikan ke siapapun.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Seksi 5: Narasumber ──────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <SectionHeader icon={<Building2 className="w-4 h-4 text-[#1B4332]" />} title="Narasumber" desc="Pilih narasumber utama event" />

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Narasumber Utama</Label>
          <SpeakerCombobox
            value={form.speakerId ?? undefined}
            onChange={id => update('speakerId', id)}
            placeholder="Cari nama atau keahlian narasumber..."
          />
          <p className="text-[10px] text-gray-400">Pilih dari daftar narasumber terdaftar</p>
        </div>

        <div className="space-y-3">
          {form.speakers.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-xl">
              Belum ada narasumber. Klik tombol di bawah untuk menambahkan.
            </div>
          ) : (
            form.speakers.map((speaker, idx) => (
              <div key={speaker.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500">Narasumber #{idx + 1}</p>
                  <button type="button" onClick={() => removeSpeaker(speaker.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Nama</Label>
                    <Input value={speaker.name} onChange={e => updateSpeaker(speaker.id, 'name', e.target.value)}
                      placeholder="Dr. Ahmad Fauzi" className="rounded-xl text-sm h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Topik / Materi</Label>
                    <Input value={speaker.topic} onChange={e => updateSpeaker(speaker.id, 'topic', e.target.value)}
                      placeholder="Jurnalistik Digital" className="rounded-xl text-sm h-9" />
                  </div>
                  {form.eventType === 'Sistem Kelas' && (
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Kelas</Label>
                      <Input value={speaker.kelas} onChange={e => updateSpeaker(speaker.id, 'kelas', e.target.value)}
                        placeholder="Kelas A" className="rounded-xl text-sm h-9" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          <button type="button" onClick={addSpeaker}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#1B4332] hover:text-[#1B4332] transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Narasumber
          </button>
        </div>
      </div>

      {/* ── Submit ───────────────────────────── */}
      <div className="flex gap-3 pb-8">
        <Link href="/admin-pusat/events" className="flex-1">
          <Button type="button" variant="outline" className="w-full rounded-xl">Batal</Button>
        </Link>
        <Button type="submit" disabled={isSubmitting}
          className="flex-1 bg-[#1B4332] hover:bg-[#14532d] text-white rounded-xl font-semibold">
          {isSubmitting ? 'Menyimpan...' : '💾 Simpan sebagai Draft'}
        </Button>
      </div>
    </form>
  )
}
