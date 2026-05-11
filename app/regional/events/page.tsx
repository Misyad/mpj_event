import { redirect } from 'next/navigation'
import { CalendarDays, MapPin, UsersRound } from 'lucide-react'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getEventsFromDb } from '@/lib/server/events'
import { getCurrentAdminSession } from '@/lib/server/rbac'

export default async function RegionalEventsPage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.regionalAdmin)
  if (!session?.regionalId) redirect('/auth/regional-admin-login')

  const events = (await getEventsFromDb()).filter((event) => event.regionId === session.regionalId)

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Regional Scope</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1B4332]">Event Regional</h1>
          <p className="mt-1 text-sm text-gray-500">Data event otomatis difilter berdasarkan regional admin yang sedang login.</p>
        </div>

        <div className="grid gap-3">
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{event.status}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">{event.category}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-extrabold text-[#1B4332]">{event.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">{event.description}</p>
                </div>
                <div className="grid gap-2 text-sm text-gray-600 md:min-w-64">
                  <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-700" />{event.dateStart ? new Date(event.dateStart).toLocaleString('id-ID') : '-'}</span>
                  <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-700" />{event.location || '-'}</span>
                  <span className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-emerald-700" />{event.registeredCount ?? 0}/{event.quota ?? '-'}</span>
                </div>
              </div>
            </article>
          ))}
          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm font-semibold text-gray-500">
              Belum ada event untuk regional ini.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
