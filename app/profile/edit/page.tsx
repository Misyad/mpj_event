import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getCurrentAdminSession } from '@/lib/server/rbac'
import { EditProfileForm } from '@/components/user/EditProfileForm'

export default async function EditProfilePage() {
  const session = await getCurrentAdminSession(AUTH_ROLES.user)
  if (!session) redirect('/auth/user-login?next=%2Fprofile%2Fedit')

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

      <div className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-bold text-[#1B4332]">Pembaruan profil belum dikirim ke backend.</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Form ini sudah disiapkan untuk peninjauan data. Penyimpanan perubahan akan aktif setelah layanan profil user tersedia.
        </p>
      </div>

      <EditProfileForm
        fullName={session.fullName ?? ''}
        email={session.email ?? ''}
        whatsapp={session.whatsapp ?? ''}
      />
    </div>
  )
}
