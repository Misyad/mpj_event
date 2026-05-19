import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Download, FileBadge2 } from 'lucide-react'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getCurrentAdminSession } from '@/lib/server/rbac'
import { getUserCertificatesFromDb, type UserEventHistoryItem } from '@/lib/server/events'
import { UserEmptyState } from '@/components/user/UserEmptyState'

export default async function UserCertificatesPage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.user)
  if (!session) redirect('/auth/user-login?next=%2Fprofile%2Fcertificates')
  const items = await getUserCertificatesFromDb(session.userId)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1B4332] shadow-sm transition hover:bg-[#f4f7f5]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1B4332]">Sertifikat</h1>
          <p className="text-sm text-gray-500">Kumpulan sertifikat dari event yang telah Anda selesaikan.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <UserEmptyState
          icon={<FileBadge2 className="h-7 w-7" />}
          title="Belum ada sertifikat"
          description="Sertifikat event akan muncul setelah tersedia."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => <CertificateCard key={item.participant.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

function CertificateCard({ item }: { item: UserEventHistoryItem }) {
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#1B4332]">
          <FileBadge2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-extrabold text-[#1B4332]">{item.event.title}</p>
          <p className="mt-1 text-xs font-medium text-gray-500">{item.certificateNumber}</p>
          <Link
            href={`/certificate/${encodeURIComponent(item.participant.ticketCode || item.participant.qr_token)}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1B4332] px-4 py-2 text-xs font-bold text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Buka Sertifikat
          </Link>
        </div>
      </div>
    </div>
  )
}
