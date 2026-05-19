import { notFound } from 'next/navigation'
import { CertificateUnavailable, EventCertificate } from '@/components/EventCertificate'
import { getCertificateByVerificationCode } from '@/lib/server/events'

export const dynamic = 'force-dynamic'

export default async function CertificateCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const certificate = await getCertificateByVerificationCode(decodeURIComponent(code)).catch(() => null)
  if (!certificate) notFound()

  if (!certificate.eligible) {
    return <CertificateUnavailable reason={certificate.reason ?? 'Sertifikat belum tersedia.'} />
  }

  return (
    <EventCertificate
      participant={certificate.participant}
      event={certificate.event}
      certificateNumber={certificate.certificateNumber}
      verificationCode={certificate.verificationCode}
      generatedFileUrl={certificate.generatedFileUrl}
      templateUrl={certificate.templateUrl}
      layout={certificate.layout}
    />
  )
}
