'use client'

import { useState } from 'react'
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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
      }}
      className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm sm:p-6"
    >
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
            value={email}
            readOnly
            className="h-12 rounded-2xl border-gray-200 bg-[#f4f7f5] px-4 text-base text-gray-500"
            placeholder="Email akun"
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
          disabled
          className="h-12 rounded-full bg-[#1B4332] px-5 text-sm font-bold text-white hover:bg-[#14532d]"
        >
          Segera Tersedia
        </Button>
      </div>
    </form>
  )
}
