import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getEventById } from '@/lib/dummy'
import { getEventFromDb } from '@/lib/server/events'
import { BadgeStatus } from '@/components/BadgeStatus'
import { QuotaBadge } from '@/components/QuotaBadge'
import { CountdownTimer } from '@/components/CountdownTimer'
import { AlertCircle, ArrowLeft, Calendar, MapPin, RefreshCw, Wallet } from 'lucide-react'

export async function getEventForDetail(identifier: string) {
  let dbUnavailable = false
  const event = await getEventFromDb(identifier).catch(() => {
    dbUnavailable = true
    return null
  })

  return {
    event: event ?? getEventById(identifier) ?? null,
    dbUnavailable,
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
}

export async function EventDetailView({ identifier }: { identifier: string }) {
  const { event, dbUnavailable } = await getEventForDetail(identifier)
  if (!event && dbUnavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f0] px-4 py-8">
        <div className="w-full max-w-sm rounded-[2rem] border border-white/80 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#1B4332]">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-extrabold text-[#1B4332]">Detail event belum bisa dimuat</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Sistem sedang belum dapat memeriksa data event. Silakan coba kembali nanti.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/events/${encodeURIComponent(identifier)}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1B4332] px-5 text-sm font-bold text-white transition hover:bg-[#14532d]"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#1B4332]/15 bg-white px-5 text-sm font-bold text-[#1B4332] transition hover:bg-[#f4f7f5]"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }
  if (!event) notFound()

  const isOpen = event.status === 'APPROVED' || event.status === 'approved'

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Back */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
      </div>

      {/* Poster */}
      <div className="relative w-full aspect-video">
        <Image src={event.poster_url} alt={event.title} fill className="object-cover" priority sizes="430px" />
      </div>

      {/* Content */}
      <div className="px-4 py-5 space-y-4">
        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          <BadgeStatus status={event.status} variant="public" />
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f0ec] text-[#1B4332]">
            {event.category}
          </span>
          {event.is_paid
            ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Berbayar</span>
            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">Gratis</span>
          }
        </div>

        {/* Title */}
        <h1 className="text-xl font-extrabold text-[#1B4332] leading-snug">{event.title}</h1>

        {/* Quota badge */}
        {event.max_participants && (
          <QuotaBadge
            maxParticipants={event.max_participants}
            currentParticipants={event.current_participants}
            status={event.status_pendaftaran}
          />
        )}

        {/* Countdown timer */}
        {event.registration_deadline && isOpen && (
          <CountdownTimer deadline={event.registration_deadline} />
        )}

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-[#e8f0ec] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-[#1B4332]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{formatDate(event.start_date)}</p>
              <p className="text-xs text-gray-400">{formatTime(event.start_date)}</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-[#e8f0ec] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-[#1B4332]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{event.location_name}</p>
              <a href={event.location_gmaps} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#C9A227] font-medium underline">
                Lihat di Google Maps -&gt;
              </a>
            </div>
          </div>
        </div>

        {/* Harga */}
        {event.is_paid && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#e8f0ec] flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-[#1B4332]" />
              </div>
              <p className="text-sm font-bold text-[#1B4332]">Harga Tiket</p>
            </div>
            <div className="space-y-2 pl-10">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">HTM Event</span>
                <span className="font-bold text-[#1B4332]">Rp {event.price_public.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Deskripsi */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <h2 className="text-sm font-bold text-[#1B4332]">Tentang Event</h2>
          <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{event.description}</p>
        </div>
      </div>

      {/* CTA Sticky */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-107.5 bg-white border-t border-gray-100 px-4 py-4">
        {isOpen ? (
          <Link href={`/events/${event.id}/register`}
            className="block w-full bg-[#C9A227] text-white text-center py-3.5 rounded-full font-bold text-sm tracking-wide shadow-md">
            Daftar Sekarang -&gt;
          </Link>
        ) : (
          <div className="w-full bg-gray-100 text-gray-400 text-center py-3.5 rounded-full font-bold text-sm">
            Pendaftaran Ditutup
          </div>
        )}
      </div>
    </div>
  )
}

export function EventNotFoundState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f4f0] px-4 py-8">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/80 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#1B4332]">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-xl font-extrabold text-[#1B4332]">Event tidak ditemukan</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Event mungkin belum dipublikasikan atau tautan tidak sesuai.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1B4332] px-5 text-sm font-bold text-white transition hover:bg-[#14532d]"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
