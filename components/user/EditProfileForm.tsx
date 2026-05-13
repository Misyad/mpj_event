'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function EditProfileForm({
  fullName,
  email,
  whatsapp,
}: {
  fullName: string
  email: string
  whatsapp: string
}) {
  const [nameValue, setNameValue] = useState(fullName)
  const [whatsappValue, setWhatsappValue] = useState(whatsapp)
  const [message, setMessage] = useState('')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setMessage('Perubahan profil akan dihubungkan ke backend pada fase berikutnya.')
      }}
      className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        Halaman ini frontend-ready. Penyimpanan perubahan profil belum diaktifkan karena endpoint backend user profile belum tersedia.
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nama Lengkap</Label>
          <Input
            value={nameValue}
            onChange={(event) => setNameValue(event.target.value)}
            className="h-12 rounded-2xl border-gray-200 px-4 text-base text-[#1B4332]"
            placeholder="Nama lengkap"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</Label>
          <Input
            value={email || '-'}
            readOnly
            className="h-12 rounded-2xl border-gray-200 bg-[#f4f7f5] px-4 text-base text-gray-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">WhatsApp</Label>
          <Input
            value={whatsappValue}
            onChange={(event) => setWhatsappValue(event.target.value)}
            className="h-12 rounded-2xl border-gray-200 px-4 text-base text-[#1B4332]"
            placeholder="08xxxxxxxxxx"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          className="h-12 rounded-full bg-[#1B4332] px-5 text-sm font-bold text-white hover:bg-[#14532d]"
        >
          Simpan Perubahan
        </Button>
      </div>

      {message ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </div>
      ) : null}
    </form>
  )
}
