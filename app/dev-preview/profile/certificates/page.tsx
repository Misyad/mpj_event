import Link from 'next/link'
import { ArrowLeft, FileBadge2, Download, ExternalLink } from 'lucide-react'
import { notFound } from 'next/navigation'
import { UserEmptyState } from '@/components/user/UserEmptyState'

export default function DevCertificatesPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  // Mock certificates for preview
  const mockCertificates = [
    {
      id: '1',
      title: 'Sertifikat Pelatihan Kader Digital',
      event: 'Pelatihan Kader Digital MPJ',
      date: '25 Mei 2024',
    },
  ]

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
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1B4332]">Sertifikat</h1>
          <p className="text-sm text-gray-500">Kumpulan sertifikat dari event yang telah Anda selesaikan.</p>
        </div>
      </div>

      {mockCertificates.length === 0 ? (
        <UserEmptyState
          icon={<FileBadge2 className="h-7 w-7" />}
          title="Belum ada sertifikat"
          description="Selesaikan event yang Anda ikuti untuk mendapatkan sertifikat resmi dari MPJ Indonesia."
        />
      ) : (
        <div className="space-y-4">
          {mockCertificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-[1.75rem] border border-white/80 p-5 shadow-sm space-y-4">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#1B4332] shrink-0">
                  <FileBadge2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-[#1B4332] leading-tight">{cert.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{cert.event}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">{cert.date}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#1B4332] text-white text-sm font-bold transition hover:bg-[#14532d]">
                  Download
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4f7f5] text-[#1B4332] transition hover:bg-[#e8f0ec]">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
