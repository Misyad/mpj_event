'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getParticipantByToken, getEventById } from '@/lib/dummy'
import { QRTicket } from '@/components/QRTicket'

function TicketContent() {
  const params = useSearchParams()
  const token = params.get('token')

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f4f0] px-6 text-center">
        <p className="text-2xl mb-3">🎫</p>
        <p className="font-bold text-[#1B4332]">Token tidak ditemukan</p>
        <p className="text-sm text-gray-400 mt-1">Link tiket tidak valid</p>
      </div>
    )
  }

  const participant = getParticipantByToken(token)
  if (!participant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f4f0] px-6 text-center">
        <p className="text-2xl mb-3">❌</p>
        <p className="font-bold text-[#1B4332]">Tiket tidak ditemukan</p>
        <p className="text-sm text-gray-400 mt-1">Token tidak valid atau sudah kadaluarsa</p>
      </div>
    )
  }

  const event = getEventById(participant.event_id)
  if (!event) return null

  return <QRTicket participant={participant} event={event} />
}

export default function TicketPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f0f4f0]">
        <p className="text-sm text-gray-400">Memuat tiket...</p>
      </div>
    }>
      <TicketContent />
    </Suspense>
  )
}
