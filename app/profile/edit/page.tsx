import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getCurrentAdminSession } from '@/lib/server/rbac'
import { EditProfileForm } from '@/components/user/EditProfileForm'

export default async function EditProfilePage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.user)

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
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1B4332]">Edit Profil</h1>
          <p className="text-sm text-gray-500 text-pretty">Perbarui informasi profil publik Anda.</p>
        </div>
      </div>

      <EditProfileForm
        fullName={session?.fullName ?? ''}
        email={session?.email ?? ''}
        whatsapp={session?.whatsapp ?? ''}
      />
    </div>
  )
}
