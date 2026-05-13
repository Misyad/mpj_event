import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { UserAreaNav } from '@/components/user/UserAreaNav'

export default function UserDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#eef3ef]">
      <div className="border-b border-[#dfe8e1] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-6 w-6" />
            <div>
              <p className="text-lg font-extrabold tracking-tight text-[#1B4332]">MPJ Event</p>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Area User</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#1B4332]/15 bg-white px-3 py-2 text-sm font-semibold text-[#1B4332] transition hover:bg-[#f4f7f5]"
          >
            <ArrowLeft className="h-4 w-4" />
            Beranda Event
          </Link>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-4 sm:px-6">
          <UserAreaNav />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {children}
      </div>
    </main>
  )
}
