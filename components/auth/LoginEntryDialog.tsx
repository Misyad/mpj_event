'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { CircleUserRound } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RoleLoginForm } from '@/components/auth/RoleLoginForm'

export function LoginEntryDialog() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const nextPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B4332] text-white shadow-sm transition hover:bg-[#14532d]"
        aria-label="Akun"
      >
        <CircleUserRound className="h-5 w-5" />
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-1.5rem)] rounded-3xl bg-[#f7faf8] p-5 sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-extrabold text-[#1B4332]">Masuk MPJ Event</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Isi email dan password. Dashboard akan mengikuti role akun di database.
          </DialogDescription>
        </DialogHeader>
        <RoleLoginForm embedded nextPath={nextPath} onAuthenticated={() => setOpen(false)} onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
