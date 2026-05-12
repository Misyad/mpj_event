'use client'

import Link from 'next/link'
import { Award, CalendarDays, MapPin, Printer } from 'lucide-react'
import type { Event, Participant } from '@/types'
import { Button } from '@/components/ui/button'

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

export function EventCertificate({
  participant,
  event,
  certificateNumber,
}: {
  participant: Participant
  event: Event
  certificateNumber: string
}) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between gap-3 print:hidden">
        <Link href={`/ticket/${encodeURIComponent(participant.ticketCode || participant.qr_token)}`} className="text-sm font-semibold text-[#1B4332] hover:underline">
          Kembali ke tiket
        </Link>
        <Button type="button" onClick={() => window.print()} className="rounded-lg bg-[#1B4332] text-white hover:bg-[#14532d]">
          <Printer className="h-4 w-4" />
          Cetak / PDF
        </Button>
      </div>

      <section className="mx-auto flex min-h-[680px] max-w-5xl flex-col justify-between border-[10px] border-[#1B4332] bg-white p-8 shadow-sm print:min-h-screen print:max-w-none print:border-[8px] print:shadow-none md:p-12">
        <div className="border border-[#C9A227] p-6 md:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#C9A227]">MPJ Event</p>
              <h1 className="mt-3 text-3xl font-extrabold uppercase tracking-wide text-[#1B4332] md:text-5xl">
                Sertifikat
              </h1>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Kehadiran Peserta</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#C9A227] text-[#1B4332]">
              <Award className="h-8 w-8" />
            </div>
          </div>

          <div className="my-12 space-y-5 text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Diberikan kepada</p>
            <p className="border-b border-slate-200 pb-4 text-3xl font-extrabold text-[#1B4332] md:text-5xl">
              {getParticipantName(participant)}
            </p>
            <p className="mx-auto max-w-2xl text-base leading-8 text-slate-600">
              Atas kehadiran dan partisipasi pada kegiatan <span className="font-bold text-slate-900">{event.title}</span>.
            </p>
          </div>

          <div className="grid gap-4 border-y border-slate-200 py-5 text-sm md:grid-cols-2">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-[#C9A227]" />
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">Tanggal Event</p>
                <p className="mt-1 font-semibold text-slate-800">{formatDate(event.start_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-[#C9A227]" />
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">Lokasi</p>
                <p className="mt-1 font-semibold text-slate-800">{event.location_name}</p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-[1fr_220px] md:items-end">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Nomor Sertifikat</p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-700">{certificateNumber}</p>
              <p className="mt-3 text-xs text-slate-400">Diverifikasi dari data ticketing dan absensi QR MPJ Event.</p>
            </div>
            <div className="text-center">
              <div className="mb-2 border-b border-slate-300 pb-12" />
              <p className="text-sm font-bold text-[#1B4332]">Panitia Event</p>
            </div>
          </div>
        </div>
      </section>
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
