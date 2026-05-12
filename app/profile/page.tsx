import Link from 'next/link'
import { ArrowLeft, CalendarDays, ChevronRight, FileBadge2, PencilLine, UserRound } from 'lucide-react'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getCurrentAdminSession } from '@/lib/server/rbac'

function fallback(value: string | null | undefined) {
  return value?.trim() ? value : '-'
}

export default async function ProfilePage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.user)

  const menuItems = [
    {
      href: '/profile/edit',
      title: 'Edit Profil',
      icon: PencilLine,
    },
    {
      href: '/profile/events',
      title: 'Riwayat Event',
      icon: CalendarDays,
    },
    {
      href: '/profile/certificates',
      title: 'Riwayat Sertifikat',
      icon: FileBadge2,
    },
  ]

  // Mock stats for UI display
  const stats = {
    totalEvents: 0,
    certificates: 0,
  }

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 bg-[#f4f7f5]/90 px-4 backdrop-blur-md">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#1B4332] transition hover:bg-black/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-extrabold text-[#1B4332]">Profil</h1>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Profile Info */}
        <section className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1B4332] text-white shrink-0 shadow-inner">
              <UserRound className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="truncate text-base font-extrabold text-[#1B4332]">{fallback(session?.fullName)}</h2>
              <p className="truncate text-xs font-medium text-gray-500 mt-0.5">{fallback(session?.whatsapp)}</p>
              <p className="truncate text-xs font-medium text-gray-500">{fallback(session?.email)}</p>
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="flex items-center justify-center rounded-full border border-[#1B4332]/20 bg-white px-4 py-2 text-xs font-bold text-[#1B4332] shadow-sm transition hover:bg-[#e8f0ec] shrink-0"
          >
            Edit
          </Link>
        </section>

        <hr className="border-t border-black/5" />

        {/* History Stats */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#1B4332]">Riwayat Event</h3>
            <Link href="/profile/events" className="text-xs font-bold text-[#1B4332] hover:text-[#2d6a4f] transition">
              Lihat Semua
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-4 rounded-3xl bg-white p-5 border border-black/5 shadow-sm">
            <div className="text-center relative">
              <p className="text-2xl font-black text-[#1B4332]">{stats.totalEvents}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Event</p>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-black/5" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-[#1B4332]">{stats.certificates}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Sertifikat</p>
            </div>
          </div>
        </section>

        <hr className="border-t border-black/5" />

        {/* Menu Items */}
        <section className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 rounded-3xl bg-white p-4 border border-black/5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#1B4332] shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="flex-1 text-sm font-bold text-[#1B4332]">{item.title}</span>
                <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#1B4332]" />
              </Link>
            )
          })}
        </section>
      </div>
    </div>
  )
}
