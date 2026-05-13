import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TicketCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  redirect(`/ticket?token=${encodeURIComponent(code)}`)
}
