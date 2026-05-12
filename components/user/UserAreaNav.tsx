'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  { segment: '', label: 'Profil' },
  { segment: '/events', label: 'Riwayat Event' },
  { segment: '/certificates', label: 'Sertifikat' },
]

export function UserAreaNav({ basePath = '/profile' }: { basePath?: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const href = `${basePath}${item.segment}`
        const active = item.segment === ''
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold transition',
              active
                ? 'bg-[#1B4332] text-white'
                : 'bg-white text-[#1B4332] ring-1 ring-black/5 hover:bg-[#f4f7f5]',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
