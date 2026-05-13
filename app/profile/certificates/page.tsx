import Link from 'next/link'
import { ArrowLeft, FileBadge2 } from 'lucide-react'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getCurrentAdminSession } from '@/lib/server/rbac'
import { UserEmptyState } from '@/components/user/UserEmptyState'

export default async function UserCertificatesPage() {
  await getCurrentAdminSession(AUTH_ROLES.user)

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

      <UserEmptyState
        icon={<FileBadge2 className="h-7 w-7" />}
        title="Belum ada sertifikat"
        description="Selesaikan event yang Anda ikuti untuk mendapatkan sertifikat resmi dari MPJ Indonesia."
      />
    </div>
  )
}
