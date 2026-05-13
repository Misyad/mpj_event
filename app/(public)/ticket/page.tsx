'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getEventById, getParticipantByToken } from '@/lib/dummy'
import { QRTicket } from '@/components/QRTicket'
import { normalizeEvent } from '@/lib/event-api'
import { AlertCircle, RefreshCw, Ticket } from 'lucide-react'
import type { Event, Participant } from '@/types'

const API_URL = '/api'

function TicketFallback({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  icon?: React.ReactNode
  title: string
  description: string
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f4f0] px-4 py-8">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/80 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#1B4332]">
          {icon ?? <Ticket className="h-7 w-7" />}
        </div>
        <p className="mt-5 text-xl font-extrabold text-[#1B4332]">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
        {primaryAction || secondaryAction ? (
          <div className="mt-6 flex flex-col gap-3">
            {primaryAction}
            {secondaryAction}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function TicketContent() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')
  const [data, setData] = useState<{ participant: Participant; event: Event } | null>(null)
  const [errorState, setErrorState] = useState<'invalid' | 'unavailable' | ''>('')
  const [isLoading, setIsLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) return

    async function loadTicket() {
      const tokenValue = token
      if (!tokenValue) return

      const dummyParticipant = getParticipantByToken(tokenValue)
      const dummyEvent = dummyParticipant ? getEventById(dummyParticipant.event_id) : null

      try {
        setIsLoading(true)
        setErrorState('')

        const verifyResponse = await fetch(`${API_URL}/tickets/verify`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ qr_token: tokenValue }),
        })
        const verifyPayload = await verifyResponse.json()

        if (!verifyResponse.ok || !verifyPayload.ok) {
          const message = String(verifyPayload.error || '')
          if (verifyResponse.status === 404 || message.toLowerCase().includes('not found')) {
            setErrorState('invalid')
            return
          }
          setErrorState('unavailable')
          return
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

        const message = loadError instanceof Error ? loadError.message.toLowerCase() : ''
        if (message.includes('not found') || message.includes('tidak ditemukan')) {
          setErrorState('invalid')
          return
        }
        setErrorState('unavailable')
      } finally {
        setIsLoading(false)
      }
    }

    loadTicket()
  }, [token])

  if (!token) {
    return (
      <TicketFallback
        title="Tiket tidak ditemukan"
        description="Kode tiket belum tersedia atau tautan tiket tidak lengkap."
        primaryAction={
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#1B4332] px-5 text-sm font-bold text-white transition hover:bg-[#14532d]"
          >
            Kembali ke Beranda
          </Link>
        }
      />
    )
  }

  if (isLoading) {
    return (
      <TicketFallback
        title="Memuat tiket"
        description="Mohon tunggu sebentar."
        icon={<RefreshCw className="h-7 w-7 animate-spin" />}
      />
    )
  }

  if (errorState === 'invalid') {
    return (
      <TicketFallback
        title="Tiket tidak ditemukan"
        description="Pastikan tautan tiket sudah benar atau hubungi panitia."
        primaryAction={
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#1B4332] px-5 text-sm font-bold text-white transition hover:bg-[#14532d]"
          >
            Kembali ke Beranda
          </Link>
        }
      />
    )
  }

  if (errorState === 'unavailable' || !data) {
    return (
      <TicketFallback
        title="Tiket belum bisa diverifikasi"
        description="Sistem sedang belum dapat memeriksa data tiket. Silakan coba kembali nanti."
        icon={<AlertCircle className="h-7 w-7" />}
        primaryAction={
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1B4332] px-5 text-sm font-bold text-white transition hover:bg-[#14532d]"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        }
        secondaryAction={
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#1B4332]/15 bg-white px-5 text-sm font-bold text-[#1B4332] transition hover:bg-[#f4f7f5]"
          >
            Kembali ke Beranda
          </Link>
        }
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
