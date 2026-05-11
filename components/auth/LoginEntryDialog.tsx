'use client'

import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RoleLoginSelector } from '@/components/auth/RoleLoginSelector'

export function LoginEntryDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1B4332] px-4 py-1.5 text-sm font-semibold text-[#1B4332] transition-colors hover:bg-[#1B4332] hover:text-white"
      >
        <LogIn className="h-3.5 w-3.5" />
        Masuk
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-1.5rem)] rounded-3xl bg-[#f7faf8] p-5 sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-extrabold text-[#1B4332]">Pilih akses masuk</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Masuk sesuai role agar sistem membuka dashboard dan izin akses yang tepat.
          </DialogDescription>
        </DialogHeader>
        <RoleLoginSelector onSelect={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
