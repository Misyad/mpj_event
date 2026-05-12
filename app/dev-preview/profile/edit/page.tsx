import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { EditProfileForm } from '@/components/user/EditProfileForm'

export default function DevProfileEditPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  const mockUser = {
    fullName: 'MPJ User',
    email: 'user@mpj-event.local',
    whatsapp: '6281234567890',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-center text-xs font-bold uppercase tracking-widest">
        Preview UI Only
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dev-preview/profile"
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
        fullName={mockUser.fullName}
        email={mockUser.email}
        whatsapp={mockUser.whatsapp}
      />
    </div>
  )
}
