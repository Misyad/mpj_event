import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Eye } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { UserAreaNav } from '@/components/user/UserAreaNav'

export default function UserDashboardPreviewLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#eef3ef]">
      <div className="border-b border-[#dfe8e1] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-6 w-6" />
            <div>
              <p className="text-lg font-extrabold tracking-tight text-[#1B4332]">MPJ Event</p>
              <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#eef3ef] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B4332] ring-1 ring-black/5">
                <Eye className="h-3 w-3" />
                Preview UI Only
              </div>
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
          <UserAreaNav basePath="/dev-preview/user-dashboard" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {children}
      </div>
    </main>
  )
}
