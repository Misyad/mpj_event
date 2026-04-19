'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import Link from 'next/link'
import { Event, Participant } from '@/types'
import { Calendar, MapPin, CheckCircle, XCircle } from 'lucide-react'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function QRTicket({ participant, event }: { participant: Participant; event: Event }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isValid = participant.attendance_status === 'Registered'
  const isAttended = participant.attendance_status === 'Attended'
  const name =
    participant.registration_path === 'NIAM'
      ? participant.crew?.full_name
      : participant.guest?.full_name

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, participant.qr_token, {
        width: 220,
        margin: 2,
        color: { dark: '#111827', light: '#ffffff' },
      })
    }
  }, [participant.qr_token])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-5 text-center">
        <p className="text-xs text-gray-400 mb-1">E-Tiket Resmi</p>
        <h1 className="text-base font-bold leading-snug">{event.title}</h1>
      </div>

      {/* Ticket Card */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Status bar */}
        <div
          className={`w-full py-2 text-center text-xs font-bold uppercase tracking-wider ${
            isValid
              ? 'bg-green-500 text-white'
              : isAttended
              ? 'bg-gray-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {isValid ? 'VALID — BELUM DIGUNAKAN' : isAttended ? 'SUDAH DIGUNAKAN' : 'TIDAK VALID'}
        </div>

        {/* Ticket body */}
        <div className="px-5 py-6 flex flex-col items-center space-y-4">
          {/* QR Code */}
          <div className="relative">
            <canvas ref={canvasRef} className={`rounded-xl ${!isValid ? 'opacity-40' : ''}`} />
            {!isValid && (
              <div className="absolute inset-0 flex items-center justify-center">
                {isAttended ? (
                  <CheckCircle className="w-16 h-16 text-gray-500" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-500" />
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 font-mono">{participant.qr_token}</p>

          {/* Divider dashed */}
          <div className="w-full border-t-2 border-dashed border-gray-200" />

          {/* Info peserta */}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nama</span>
              <span className="font-semibold text-gray-900">{name ?? '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Jalur</span>
              <span className="font-semibold text-gray-900">{participant.registration_path}</span>
            </div>
            {participant.registration_path === 'NIAM' && participant.crew && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">NIAM</span>
                <span className="font-semibold text-gray-900">{participant.crew.niam}</span>
              </div>
            )}
          </div>

          {/* Divider dashed */}
          <div className="w-full border-t-2 border-dashed border-gray-200" />

          {/* Info event */}
          <div className="w-full space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span className="text-gray-700">{formatDate(event.start_date)}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span className="text-gray-700">{event.location_name}</span>
            </div>
          </div>

          {participant.registration_path === 'NIAM' && (
            <p className="text-xs text-center text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
              E-ID Card NIAM kamu juga berlaku sebagai tiket masuk
            </p>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        <Link href="/" className="block text-center text-sm text-gray-500 underline py-4">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
