'use client'

import Link from 'next/link'
import { Award, Printer } from 'lucide-react'
import type { CertificateTemplateFieldKey, CertificateTemplateLayout, Event, Participant } from '@/types'
import { Button } from '@/components/ui/button'
import { CertificateCanvas } from '@/components/certificates/CertificateCanvas'
import { DEFAULT_CERTIFICATE_LAYOUT, normalizeCertificateLayout } from '@/components/certificates/certificate-template-layout'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getParticipantName(participant: Participant) {
  return participant.fullName ?? participant.full_name ?? participant.crew?.full_name ?? participant.guest?.full_name ?? '-'
}

function certificateData(participant: Participant, event: Event, certificateNumber: string): Record<CertificateTemplateFieldKey, string> {
  const ticketCode = participant.ticketCode || participant.qr_token
  const appUrl = typeof window === 'undefined' ? '' : window.location.origin
  return {
    certificate_number: certificateNumber,
    participant_name: getParticipantName(participant),
    event_name: event.title,
    role: 'Panitia Event',
    signer_name: 'Ketua Panitia',
    date: formatDate(event.start_date),
    qr_code: `${appUrl}/certificate/${encodeURIComponent(ticketCode)}`,
  }
}

export function EventCertificate({
  participant,
  event,
  certificateNumber,
  verificationCode,
  generatedFileUrl,
  templateUrl,
  layout,
}: {
  participant: Participant
  event: Event
  certificateNumber: string
  verificationCode?: string | null
  generatedFileUrl?: string | null
  templateUrl?: string | null
  layout?: CertificateTemplateLayout
}) {
  const normalizedLayout = normalizeCertificateLayout(layout ?? event.certificateLayout ?? DEFAULT_CERTIFICATE_LAYOUT)
  const data = certificateData(participant, event, certificateNumber)

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-3 print:hidden">
        <Link href={`/ticket/${encodeURIComponent(participant.ticketCode || participant.qr_token)}`} className="text-sm font-semibold text-[#1B4332] hover:underline">
          Kembali ke tiket
        </Link>
        <Button type="button" onClick={() => window.print()} className="rounded-lg bg-[#1B4332] text-white hover:bg-[#14532d]">
          <Printer className="h-4 w-4" />
          Cetak / PDF
        </Button>
        {generatedFileUrl ? (
          <a href={generatedFileUrl} download className="inline-flex h-10 items-center justify-center rounded-lg border border-[#1B4332]/20 px-4 text-sm font-bold text-[#1B4332]">
            Download PDF
          </a>
        ) : null}
      </div>

      <section className="mx-auto max-w-6xl overflow-auto rounded-2xl bg-white p-4 shadow-sm print:overflow-visible print:rounded-none print:p-0 print:shadow-none">
        <div className="print:hidden">
          <CertificateCanvas templateUrl={templateUrl} layout={normalizedLayout} data={data} scale={0.9} />
        </div>
        <div className="hidden print:block">
          <CertificateCanvas templateUrl={templateUrl} layout={normalizedLayout} data={data} />
        </div>
      </section>
      {verificationCode ? (
        <div className="mx-auto mt-4 max-w-6xl rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800 print:hidden">
          Verification Code: <span className="font-mono font-bold">{verificationCode}</span>
        </div>
      ) : null}
    </main>
  )
}

export function CertificateUnavailable({ reason }: { reason: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-center">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Award className="mx-auto h-10 w-10 text-slate-300" />
        <h1 className="mt-4 text-lg font-extrabold text-[#1B4332]">Sertifikat belum tersedia</h1>
        <p className="mt-2 text-sm text-slate-500">{reason}</p>
        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-[#1B4332] hover:underline">
          Kembali ke beranda
        </Link>
      </div>
    </main>
  )
}
