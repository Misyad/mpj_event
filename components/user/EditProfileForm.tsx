'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function EditProfileForm({
  fullName,
  email,
  whatsapp,
  institution,
  niam,
}: {
  fullName: string
  email: string
  whatsapp: string
  institution: string
  niam: string
}) {
  const [nameValue, setNameValue] = useState(fullName)
  const [whatsappValue, setWhatsappValue] = useState(whatsapp)
  const [institutionValue, setInstitutionValue] = useState(institution)
  const [niamValue, setNiamValue] = useState(niam)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function saveProfile() {
    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      const response = await fetch('/api/public/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: nameValue,
          whatsapp: whatsappValue,
          institution: institutionValue,
          niam: niamValue,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gagal menyimpan profil')
      setSuccess('Profil berhasil disimpan.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan profil')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void saveProfile()
      }}
      className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm sm:p-6"
    >
      {error ? (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nama Lengkap</Label>
          <Input
            required
            value={nameValue}
            onChange={(event) => setNameValue(event.target.value)}
            className="h-12 rounded-2xl border-gray-200 px-4 text-base text-[#1B4332]"
            placeholder="Nama lengkap"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</Label>
          <Input
            value={email}
            readOnly
            className="h-12 rounded-2xl border-gray-200 bg-[#f4f7f5] px-4 text-base text-gray-500"
            placeholder="Email akun"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">WhatsApp</Label>
          <Input
            required
            value={whatsappValue}
            onChange={(event) => setWhatsappValue(event.target.value)}
            className="h-12 rounded-2xl border-gray-200 px-4 text-base text-[#1B4332]"
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Instansi</Label>
          <Input
            required
            value={institutionValue}
            onChange={(event) => setInstitutionValue(event.target.value)}
            className="h-12 rounded-2xl border-gray-200 px-4 text-base text-[#1B4332]"
            placeholder="Pesantren / instansi"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">NIAM</Label>
          <Input
            value={niamValue}
            onChange={(event) => setNiamValue(event.target.value)}
            className="h-12 rounded-2xl border-gray-200 px-4 text-base text-[#1B4332]"
            placeholder="Kosongkan jika belum punya"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          disabled={isSaving}
          className="h-12 rounded-full bg-[#1B4332] px-5 text-sm font-bold text-white hover:bg-[#14532d]"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Simpan Profil
        </Button>
      </div>
    </form>
  )
}
