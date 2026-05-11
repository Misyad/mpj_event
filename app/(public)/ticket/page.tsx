'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getEventById, getParticipantByToken } from '@/lib/dummy'
import { QRTicket } from '@/components/QRTicket'
import { normalizeEvent } from '@/lib/event-api'
import type { Event, Participant } from '@/types'

const API_URL = ''

function TicketFallback({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f4f0] px-6 text-center">
      <p className="text-2xl mb-3">Tiket</p>
      <p className="font-bold text-[#1B4332]">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
    </div>
  )
}

function TicketContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const [data, setData] = useState<{ participant: Participant; event: Event } | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) return

    async function loadTicket() {
      const dummyParticipant = getParticipantByToken(token)
      const dummyEvent = dummyParticipant ? getEventById(dummyParticipant.event_id) : null

      try {
        setIsLoading(true)
        setError('')

        const verifyResponse = await fetch(`${API_URL}/tickets/verify`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ qr_token: token }),
        })
        const verifyPayload = await verifyResponse.json()

        if (!verifyResponse.ok || !verifyPayload.ok) {
          throw new Error(verifyPayload.error || 'Tiket tidak ditemukan')
        }

        setData({
          participant: verifyPayload.data,
          event: normalizeEvent(verifyPayload.event),
        })
      } catch (loadError) {
        if (dummyParticipant && dummyEvent) {
          setData({
            participant: dummyParticipant,
            event: dummyEvent,
          })
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Tiket tidak ditemukan')
      } finally {
        setIsLoading(false)
      }
    }

    loadTicket()
  }, [token])

  if (!token) {
    return <TicketFallback title="Token tidak ditemukan" description="Link tiket tidak valid." />
  }

  if (isLoading) {
    return <TicketFallback title="Memuat tiket..." description="Mohon tunggu sebentar." />
  }

  if (error || !data) {
    return (
      <TicketFallback
        title="Tiket tidak ditemukan"
        description={error || 'Token tidak valid atau sudah kadaluarsa.'}
      />
    )
  }

  return <QRTicket participant={data.participant} event={data.event} />
}

export default function TicketPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#f0f4f0]">
          <p className="text-sm text-gray-400">Memuat tiket...</p>
        </div>
      }
    >
      <TicketContent />
    </Suspense>
  )
}
