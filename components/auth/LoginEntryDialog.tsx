'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { CircleUserRound, UserRound } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RoleLoginForm } from '@/components/auth/RoleLoginForm'
import { LogoutButton } from '@/components/auth/LogoutButton'

type PublicUserSummary = {
  fullName: string | null
  email: string | null
}

export function LoginEntryDialog({ user }: { user?: PublicUserSummary | null }) {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const nextPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

  if (user) {
    const displayName = user.fullName || 'Akun MPJ Event'

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B4332] text-white shadow-sm transition hover:bg-[#14532d]"
          aria-label="Menu akun"
          aria-expanded={menuOpen}
        >
          <CircleUserRound className="h-5 w-5" />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-12 z-30 w-64 rounded-3xl border border-black/5 bg-white p-3 text-left shadow-xl">
            <div className="flex items-center gap-3 rounded-2xl bg-[#f4f7f5] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B4332] text-white">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-[#1B4332]">{displayName}</p>
                {user.email ? <p className="truncate text-xs font-medium text-gray-500">{user.email}</p> : null}
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 items-center rounded-2xl px-3 text-sm font-bold text-[#1B4332] transition hover:bg-[#f4f7f5]"
              >
                Profil
              </Link>
              <LogoutButton
                nextPath="/"
                className="h-10 w-full rounded-2xl px-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
              />
            </div>
          </div>
        ) : null}
      </div>
    )
  }

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
