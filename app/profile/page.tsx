import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, BadgeCheck, CalendarDays, ChevronRight, FileBadge2, PencilLine, UserRound } from 'lucide-react'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getCurrentAdminSession, getPublicUserProfile } from '@/lib/server/rbac'
import { getEventsFromDb, getUserEventHistoryFromDb } from '@/lib/server/events'
import { ProfileActionCenter } from '@/components/user/ProfileActionCenter'

async function getPublicEventsSafe() {
  try {
    return await getEventsFromDb({ publicOnly: true })
  } catch {
    return []
  }
}

export default async function ProfilePage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.user)
  if (!session) redirect('/auth/user-login?next=%2Fprofile')
  const [profile, eventHistory] = await Promise.all([
    getPublicUserProfile(session.userId),
    getUserEventHistoryFromDb(session.userId),
  ])
  const publicEvents = await getPublicEventsSafe()
  const certificateCount = eventHistory.filter((item) => item.certificateEligible).length
  const profileComplete = Boolean(profile?.fullName && profile.whatsapp && profile.institution)

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
              <h2 className="truncate text-base font-extrabold text-[#1B4332]">{profile?.fullName || session.fullName || 'Akun MPJ Event'}</h2>
              {profile?.whatsapp ? (
                <p className="truncate text-xs font-medium text-gray-500 mt-0.5">{profile.whatsapp}</p>
              ) : null}
              {(profile?.email || session.email) ? (
                <p className="truncate text-xs font-medium text-gray-500">{profile?.email || session.email}</p>
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#1B4332]">
                  {profileComplete ? 'Profil siap untuk daftar event.' : 'Profil belum lengkap.'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {profileComplete
                    ? 'Data akun akan dipakai otomatis saat mendaftar event.'
                    : 'Lengkapi WhatsApp dan instansi agar pendaftaran event memakai data akun.'}
                </p>
              </div>
              {profileComplete ? (
                <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <Link href="/profile/edit" className="shrink-0 text-xs font-bold text-[#1B4332] underline underline-offset-4">
                  Lengkapi
                </Link>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <SummaryTile label="Event" value={eventHistory.length} />
              <SummaryTile label="Sertifikat" value={certificateCount} />
            </div>
          </div>
        </section>

        <hr className="border-t border-black/5" />

        <ProfileActionCenter profile={profile} eventHistory={eventHistory} publicEvents={publicEvents} />

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

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#f4f7f5] px-4 py-3">
      <p className="text-2xl font-extrabold text-[#1B4332]">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-gray-500">{label}</p>
    </div>
  )
}
