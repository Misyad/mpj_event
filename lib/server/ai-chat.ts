import OpenAI from 'openai'
import type { NextRequest } from 'next/server'
import type { Event, EventScope, Participant } from '@/types'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { hasPermission } from '@/lib/auth/permissions'
import { getSessionFromRequest, type AdminSession } from '@/lib/server/rbac'
import {
  getAdminParticipantsFromDb,
  getEventsFromDb,
  getParticipantByTicketCode,
} from '@/lib/server/events'

export type AiChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type AiChatContext = {
  pathname?: string
}

type AiContext = {
  session: AdminSession | null
  events: Event[]
  participants: Array<Participant & { event?: { title?: string; status?: string; regionId?: string | null } }>
  ticketMatches: Array<{ code: string; participant: Participant | null; event?: Event | null }>
}

const MAX_MESSAGES = 12
const MAX_MESSAGE_LENGTH = 1200

function compact(value: string | undefined | null) {
  return (value ?? '').trim().replace(/\s+/g, ' ')
}

export function normalizeAiMessages(value: unknown): AiChatMessage[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const candidate = item as { role?: unknown; content?: unknown }
      const role = candidate.role === 'assistant' ? 'assistant' : candidate.role === 'user' ? 'user' : null
      const content = typeof candidate.content === 'string' ? compact(candidate.content).slice(0, MAX_MESSAGE_LENGTH) : ''
      return role && content ? { role, content } : null
    })
    .filter((item): item is AiChatMessage => Boolean(item))
    .slice(-MAX_MESSAGES)
}

function latestUserText(messages: AiChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'user')?.content ?? ''
}

function extractTicketLikeCodes(text: string) {
  const matches = text.match(/\b[A-Z0-9][A-Z0-9_-]{5,80}\b/gi) ?? []
  return Array.from(new Set(matches.map((match) => match.trim()))).slice(0, 3)
}

function formatDate(value: string | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatEvent(event: Event) {
  const quota = event.quota ?? event.max_participants
  const registered = event.registeredCount ?? event.current_participants ?? 0
  return [
    `- ${event.title}`,
    `status: ${event.status}`,
    `tanggal: ${formatDate(event.start_date || event.dateStart)}`,
    `lokasi: ${event.location_name || event.location || '-'}`,
    `scope: ${event.scope ?? 'pusat'}`,
    `publik: ${event.isPublic ? 'ya' : 'tidak'}`,
    `pendaftaran: ${event.status_pendaftaran ?? '-'}`,
    `kuota: ${quota ? `${registered}/${quota}` : `${registered}/tanpa batas`}`,
    `berbayar: ${event.is_paid || event.isPaidEvent ? 'ya' : 'tidak'}`,
  ].join('; ')
}

function formatParticipant(participant: Participant & { event?: { title?: string; status?: string; regionId?: string | null } }) {
  return [
    `- ${participant.fullName || participant.full_name || 'Peserta'}`,
    `event: ${participant.event?.title ?? participant.event_id}`,
    `path: ${participant.registration_path}`,
    `payment: ${participant.payment_status}`,
    `attendance: ${participant.attendance_status}`,
    `ticket: ${participant.ticketCode ?? '-'}`,
  ].join('; ')
}

function canReadEvents(session: AdminSession | null) {
  return Boolean(session && hasPermission(session.permissions, 'events.read'))
}

function canReadParticipants(session: AdminSession | null) {
  return Boolean(session && hasPermission(session.permissions, 'participants.read'))
}

function visibleAdminScope(session: AdminSession | null): { scope?: EventScope; regionId?: string | null } {
  if (!session) return {}
  if (session.role === AUTH_ROLES.regionalAdmin) return { scope: 'regional', regionId: session.regionalId }
  return {}
}

async function getAiContext(request: NextRequest, messages: AiChatMessage[]): Promise<AiContext> {
  const session = await getSessionFromRequest(request)
  const userText = latestUserText(messages)
  const adminScope = visibleAdminScope(session)
  const codes = extractTicketLikeCodes(userText)

  const [events, participants, ticketMatches] = await Promise.all([
    getEventsFromDb({ publicOnly: !canReadEvents(session) }).then((items) => {
      if (session?.role === AUTH_ROLES.regionalAdmin) {
        return items.filter((event) => event.scope === 'regional' && event.regionId === session.regionalId)
      }
      return items
    }).catch(() => [] as Event[]),
    canReadParticipants(session)
      ? getAdminParticipantsFromDb(adminScope).then((items) => items.slice(0, 25)).catch(() => [])
      : Promise.resolve([]),
    Promise.all(
      codes.map(async (code) => {
        const participant = await getParticipantByTicketCode(code).catch(() => null)
        return { code, participant }
      }),
    ),
  ])

  return {
    session,
    events,
    participants,
    ticketMatches,
  }
}

function buildOperationalContext(context: AiContext) {
  const sessionLabel = context.session
    ? `${context.session.role}${context.session.regionalId ? ` (${context.session.regionalId})` : ''}`
    : 'public'

  const visibleEvents = context.events.slice(0, 12)
  const publicEvents = visibleEvents.filter((event) => event.isPublished && event.isPublic).slice(0, 8)

  return [
    `Akses pengguna: ${sessionLabel}.`,
    '',
    'Event terlihat:',
    visibleEvents.length ? visibleEvents.map(formatEvent).join('\n') : '- Tidak ada event yang bisa dibaca.',
    '',
    'Event publik aktif/terbit:',
    publicEvents.length ? publicEvents.map(formatEvent).join('\n') : '- Tidak ada event publik aktif di konteks saat ini.',
    '',
    'Peserta yang bisa dibaca admin:',
    context.participants.length ? context.participants.map(formatParticipant).join('\n') : '- Tidak ada data peserta admin dalam konteks atau pengguna bukan admin.',
    '',
    'Pencarian tiket dari pesan pengguna:',
    context.ticketMatches.length
      ? context.ticketMatches.map((match) => (
          match.participant
            ? `- ${match.code}: payment ${match.participant.payment_status}, attendance ${match.participant.attendance_status}, ticket ${match.participant.ticketCode ?? '-'}`
            : `- ${match.code}: tidak ditemukan`
        )).join('\n')
      : '- Tidak ada kode tiket/QR yang terdeteksi.',
  ].join('\n')
}

export function buildAiInstructions(operationalContext: string, context: AiChatContext = {}) {
  return `
Kamu adalah Asisten MPJ Event untuk aplikasi event, ticketing, pembayaran, dan absensi QR MPJ Indonesia.
Jawab dalam Bahasa Indonesia yang ringkas, jelas, dan operasional.

Aturan wajib:
- Gunakan hanya konteks aplikasi dan data yang diberikan di bawah ini.
- Jangan mengarang data event, peserta, pembayaran, tiket, atau sertifikat.
- V1 chatbot bersifat read-only. Tolak dengan sopan semua permintaan mengubah data, seperti membuat event, menghapus event, konfirmasi peserta, verifikasi pembayaran, mengganti credential payment gateway, atau check-in manual.
- Untuk aksi perubahan data, arahkan user ke menu aplikasi yang sesuai.
- Jangan tampilkan secret, API key, credential payment gateway, token, atau data sensitif.
- Jika data tidak ada di konteks, katakan belum bisa memastikan dan sebutkan data apa yang diperlukan.
- Untuk user publik, jangan bocorkan daftar peserta atau detail admin.
- Jika user bertanya status tiket, jawab hanya status event/payment/attendance yang tersedia dari kode tiket/QR yang mereka berikan.

Konteks halaman: ${context.pathname || '-'}

Konteks operasional:
${operationalContext}
`.trim()
}

export async function createAiTextStream(request: NextRequest, messages: AiChatMessage[], context: AiChatContext = {}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY belum dikonfigurasi di server')
  }

  const operationalContext = buildOperationalContext(await getAiContext(request, messages))
  const client = new OpenAI({ apiKey })
  const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini'
  const encoder = new TextEncoder()

  const stream = await client.responses.create({
    model,
    instructions: buildAiInstructions(operationalContext, context),
    input: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    stream: true,
  })

  type OpenAIStreamEvent = {
    type?: string
    delta?: string
    error?: { message?: string }
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream as AsyncIterable<OpenAIStreamEvent>) {
          if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
            controller.enqueue(encoder.encode(event.delta))
          }
          if (event.type === 'error') {
            throw new Error(event.error?.message || 'OpenAI stream error')
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'AI response failed'
        controller.enqueue(encoder.encode(`\n\nMaaf, asisten AI gagal memproses jawaban: ${message}`))
      } finally {
        controller.close()
      }
    },
  })
}
