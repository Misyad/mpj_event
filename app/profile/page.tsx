import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, CalendarDays, ChevronRight, FileBadge2, PencilLine, UserRound } from 'lucide-react'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getCurrentAdminSession } from '@/lib/server/rbac'

export default async function ProfilePage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.user)
  if (!session) redirect('/auth/user-login?next=%2Fprofile')

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

  return (
    <div className="flex flex-col pb-8">
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
        <section className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1B4332] text-white shrink-0 shadow-inner">
              <UserRound className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="truncate text-base font-extrabold text-[#1B4332]">{session.fullName || 'Akun MPJ Event'}</h2>
              {session.whatsapp ? (
                <p className="truncate text-xs font-medium text-gray-500 mt-0.5">{session.whatsapp}</p>
              ) : null}
              {session.email ? (
                <p className="truncate text-xs font-medium text-gray-500">{session.email}</p>
              ) : null}
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

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#1B4332]">Akun Anda</h3>
            <Link href="/profile/events" className="text-xs font-bold text-[#1B4332] hover:text-[#2d6a4f] transition">
              Buka Riwayat
            </Link>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#1B4332]">Profil user sudah siap untuk dipakai di frontend.</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Riwayat event, sertifikat, dan sinkronisasi profil akan muncul otomatis setelah layanan data user tersedia.
            </p>
          </div>
        </section>

        <hr className="border-t border-black/5" />

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
