import { notFound } from 'next/navigation'
import { QRTicket } from '@/components/QRTicket'
import { getEventFromDb, getParticipantByTicketCode } from '@/lib/server/events'

export const dynamic = 'force-dynamic'

export default async function TicketCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const participant = await getParticipantByTicketCode(code).catch(() => null)
  if (!participant) notFound()

  const event = await getEventFromDb(participant.event_id).catch(() => null)
  if (!event) notFound()

  return <QRTicket participant={participant} event={event} />
}
