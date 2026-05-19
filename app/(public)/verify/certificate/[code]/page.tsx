import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { Award, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import { getCertificateByVerificationCode } from '@/lib/server/events'
import { assertRateLimitKey } from '@/lib/server/rate-limit'

export const dynamic = 'force-dynamic'

export default async function CertificateVerificationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || headerStore.get('x-real-ip') || 'local'
  assertRateLimitKey(`verify-certificate:${ip}`, 40, 60_000)
  const result = await getCertificateByVerificationCode(decodeURIComponent(code)).catch(() => null)
  if (!result) notFound()

  const isValid = result.status === 'active'
  const isRevoked = result.status === 'revoked'

  return (
    <main className="min-h-screen bg-[#F4F7F5] px-4 py-10">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white bg-white shadow-[0_24px_80px_rgba(27,67,50,0.14)]">
        <div className={`${isValid ? 'bg-[#1B4332]' : isRevoked ? 'bg-red-700' : 'bg-slate-700'} px-6 py-8 text-center text-white`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/30">
            {isValid ? <ShieldCheck className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
          </div>
          <h1 className="mt-4 text-2xl font-black">{isValid ? 'Sertifikat Valid' : isRevoked ? 'Sertifikat Dicabut' : 'Sertifikat Tidak Aktif'}</h1>
          <p className="mt-2 text-sm text-white/75">Verifikasi resmi MPJ Event</p>
        </div>

        <div className="space-y-4 p-6">
          <InfoRow label="Nama Peserta" value={result.certificate.participantName} />
          <InfoRow label="Event" value={result.certificate.eventTitle || result.event.title} />
          <InfoRow label="Nomor Sertifikat" value={result.certificateNumber} mono />
          <InfoRow label="Verification Code" value={result.verificationCode} mono />
          <InfoRow label="Tanggal Terbit" value={result.issuedAt ? new Date(result.issuedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} />
          <InfoRow label="Issuer" value={result.certificate.signerName || 'MPJ Event'} />
          {!isValid ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {result.reason || 'Sertifikat ini tidak aktif.'}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              Data sertifikat cocok dengan catatan resmi MPJ Event.
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={`/certificate/${encodeURIComponent(result.verificationCode)}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 text-sm font-bold text-white">
              <Award className="h-4 w-4" />
              Buka Sertifikat
            </Link>
            {result.generatedFileUrl ? (
              <a href={result.generatedFileUrl} download className="inline-flex h-11 items-center justify-center rounded-xl border border-[#1B4332]/20 px-4 text-sm font-bold text-[#1B4332]">
                Download PDF
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`mt-1 text-sm font-extrabold text-[#1B4332] ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
