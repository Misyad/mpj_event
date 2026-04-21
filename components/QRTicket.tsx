'use client'

import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'
import { Event, Participant } from '@/types'
import { Calendar, CheckCircle, MapPin, XCircle } from 'lucide-react'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function QRTicket({ participant, event }: { participant: Participant; event: Event }) {
  const isValid   = participant.attendance_status === 'Registered'
  const isUsed    = participant.attendance_status === 'Attended'
  const isCancelled = participant.attendance_status === 'Cancelled'

  const name = participant.registration_path === 'NIAM'
    ? participant.crew?.full_name
    : participant.guest?.full_name

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f4f0]">
      {/* Header */}
      <div className="bg-[#1B4332] text-white px-5 py-5 text-center">
        <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">E-Tiket Resmi MPJ</p>
        <h1 className="text-base font-extrabold leading-snug">{event.title}</h1>
      </div>

      {/* Ticket card */}
      <div className="mx-4 mt-4 bg-white rounded-3xl shadow-sm overflow-hidden">
        {/* Status stripe */}
        <div className={`w-full py-2.5 text-center text-xs font-bold uppercase tracking-widest ${
          isValid ? 'bg-emerald-500 text-white'
          : isUsed ? 'bg-gray-400 text-white'
          : 'bg-red-500 text-white'
        }`}>
          {isValid ? '✅ VALID — BELUM DIGUNAKAN' : isUsed ? '✔ SUDAH DIGUNAKAN' : '❌ TIDAK VALID'}
        </div>

        <div className="px-5 py-6 flex flex-col items-center gap-5">
          {/* QR Code */}
          <div className="relative">
            <div className={`p-3 rounded-2xl border-4 ${isValid ? 'border-emerald-200' : 'border-gray-200'} bg-white`}>
              <QRCodeSVG
                value={participant.qr_token}
                size={196}
                level="M"
                bgColor="#ffffff"
                fgColor={isValid ? '#111827' : '#9ca3af'}
                includeMargin={false}
              />
            </div>
            {!isValid && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60">
                {isUsed
                  ? <CheckCircle className="w-16 h-16 text-gray-400" />
                  : <XCircle className="w-16 h-16 text-red-400" />
                }
              </div>
            )}
          </div>

          <p className="text-[10px] text-gray-300 font-mono text-center">{participant.qr_token}</p>

          {/* Dashed divider */}
          <div className="w-full border-t-2 border-dashed border-gray-100" />

          {/* Participant info */}
          <div className="w-full space-y-3">
            <Row label="Nama" value={name ?? '-'} />
            <Row label="Jalur" value={participant.registration_path === 'NIAM' ? '🟢 Anggota NIAM' : '🔵 Jalur Umum'} />
            {participant.registration_path === 'NIAM' && participant.crew && (
              <Row label="No. NIAM" value={participant.crew.niam} />
            )}
          </div>

          {/* Dashed divider */}
          <div className="w-full border-t-2 border-dashed border-gray-100" />

          {/* Event info */}
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

          {/* NIAM note */}
          {participant.registration_path === 'NIAM' && (
            <p className="text-xs text-center text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 leading-relaxed">
              💙 E-ID Card NIAM kamu juga berlaku sebagai tiket masuk di lokasi
            </p>
          )}
        </div>
      </div>

      {/* Screenshot guide */}
      <div className="mx-4 mt-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
        <p className="text-xs font-bold text-amber-700 mb-1">📸 Cara Simpan Tiket</p>
        <ol className="text-xs text-amber-600 space-y-0.5 list-decimal list-inside">
          <li>Screenshot halaman ini</li>
          <li>Simpan ke galeri / album "Tiket Event"</li>
          <li>Tunjukkan QR Code saat check-in di lokasi</li>
        </ol>
      </div>

      <div className="px-4 mt-4 pb-8">
        <Link href="/" className="block text-center text-sm text-gray-400 hover:text-[#1B4332] underline py-4 transition-colors">
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  )
}
