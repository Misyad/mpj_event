import { randomInt, randomUUID } from 'crypto'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { NextRequest, NextResponse } from 'next/server'
import { withDb } from '@/lib/server/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

type RegisterPayload = {
  registration_path?: 'NIAM' | 'UMUM'
  full_name?: string
  niam?: string
  unit?: string
  institution_name?: string
  whatsapp?: string
  payment_proof_name?: string
  custom_responses?: Record<string, string | string[]>
}

type EventRow = RowDataPacket & {
  id: string
  status: string
  status_pendaftaran: string
  registration_deadline: Date | string | null
  is_open_for_public: 0 | 1
  is_paid: 0 | 1
  price_niam: number
  price_public: number
  max_participants: number | null
  current_participants: number
}

type CrewRow = RowDataPacket & {
  id: string
  full_name: string
  unit: string | null
}

type GuestRow = RowDataPacket & {
  id: string
}

type CustomFieldRow = RowDataPacket & {
  id: string
  label: string
  is_required: 0 | 1
}

type ParticipantRow = RowDataPacket & {
  id: string
  qr_token: string
  payment_status: string
  unique_amount: number
}

function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function assertOpenForRegistration(event: EventRow) {
  if (event.status !== 'APPROVED' && event.status !== 'LIVE') {
    throw new Error('Pendaftaran event belum dibuka')
  }

  if (event.status_pendaftaran === 'closed') {
    throw new Error('Pendaftaran event sudah ditutup')
  }

  if (event.status_pendaftaran === 'full') {
    throw new Error('Kuota event sudah penuh')
  }

  if (event.registration_deadline && new Date(event.registration_deadline).getTime() < Date.now()) {
    throw new Error('Batas waktu pendaftaran sudah berakhir')
  }

  if (event.max_participants && event.current_participants >= event.max_participants) {
    throw new Error('Kuota event sudah penuh')
  }
}

function getBaseAmount(event: EventRow, path: 'NIAM' | 'UMUM') {
  if (!event.is_paid) return 0
  return path === 'NIAM' ? Number(event.price_niam ?? 0) : Number(event.price_public ?? 0)
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: eventId } = await context.params
    const payload = (await request.json()) as RegisterPayload
    const path = payload.registration_path

    if (path !== 'NIAM' && path !== 'UMUM') {
      return jsonError('Jalur pendaftaran tidak valid')
    }

    const result = await withDb(async (db) => {
      const connection = await db.getConnection()

      try {
        await connection.beginTransaction()

        const [eventRows] = await connection.query<EventRow[]>(
          `
            SELECT id, status, status_pendaftaran, registration_deadline, is_open_for_public,
              is_paid, price_niam, price_public, max_participants, current_participants
            FROM events
            WHERE id = :eventId
            FOR UPDATE
          `,
          { eventId },
        )
        const event = eventRows[0]
        if (!event) throw new Error('Event tidak ditemukan')

        assertOpenForRegistration(event)

        if (path === 'UMUM' && !event.is_open_for_public) {
          throw new Error('Event ini tidak membuka jalur umum')
        }

        const [fieldRows] = await connection.query<CustomFieldRow[]>(
          'SELECT id, label, is_required FROM event_custom_fields WHERE event_id = :eventId',
          { eventId },
        )
        const responses = payload.custom_responses ?? {}
        for (const field of fieldRows) {
          const response = responses[field.id]
          if (field.is_required && (!response || (Array.isArray(response) && response.length === 0))) {
            throw new Error(`Pertanyaan wajib belum diisi: ${field.label}`)
          }
        }

        let crewId: string | null = null
        let guestId: string | null = null
        let participantName = getString(payload.full_name)

        if (path === 'NIAM') {
          const niam = getString(payload.niam)
          if (!niam) throw new Error('NIAM wajib diisi')

          const [crewRows] = await connection.query<CrewRow[]>(
            'SELECT id, full_name, unit FROM crew_members WHERE niam = :niam LIMIT 1',
            { niam },
          )
          const crew = crewRows[0]
          if (!crew) throw new Error('NIAM tidak ditemukan')

          crewId = crew.id
          participantName = crew.full_name

          const [duplicateRows] = await connection.query<RowDataPacket[]>(
            'SELECT id FROM event_participants WHERE event_id = :eventId AND crew_id = :crewId LIMIT 1',
            { eventId, crewId },
          )
          if (duplicateRows.length > 0) throw new Error('NIAM ini sudah terdaftar pada event ini')
        } else {
          const fullName = getString(payload.full_name)
          const whatsapp = getString(payload.whatsapp)
          const institutionName = getString(payload.institution_name)

          if (!fullName) throw new Error('Nama lengkap wajib diisi')
          if (!whatsapp) throw new Error('Nomor WhatsApp wajib diisi')
          if (!institutionName) throw new Error('Asal instansi wajib diisi')

          const [existingGuests] = await connection.query<GuestRow[]>(
            'SELECT id FROM event_guests WHERE whatsapp = :whatsapp LIMIT 1',
            { whatsapp },
          )

          if (existingGuests[0]) {
            guestId = existingGuests[0].id
            await connection.query(
              `
                UPDATE event_guests
                SET full_name = :fullName, institution_name = :institutionName
                WHERE id = :guestId
              `,
              { fullName, institutionName, guestId },
            )
          } else {
            guestId = randomUUID()
            await connection.query<ResultSetHeader>(
              `
                INSERT INTO event_guests (id, full_name, institution_name, whatsapp)
                VALUES (:guestId, :fullName, :institutionName, :whatsapp)
              `,
              { guestId, fullName, institutionName, whatsapp },
            )
          }

          participantName = fullName

          const [duplicateRows] = await connection.query<RowDataPacket[]>(
            'SELECT id FROM event_participants WHERE event_id = :eventId AND guest_id = :guestId LIMIT 1',
            { eventId, guestId },
          )
          if (duplicateRows.length > 0) throw new Error('Nomor WhatsApp ini sudah terdaftar pada event ini')
        }

        const participantId = randomUUID()
        const qrToken = `MPJ-${eventId.slice(0, 8)}-${randomUUID()}`
        const baseAmount = getBaseAmount(event, path)
        const uniqueAmount = event.is_paid ? baseAmount + randomInt(100, 1000) : 0
        const paymentStatus = event.is_paid ? 'Pending_Approval' : 'Free'
        const proofPath = event.is_paid ? getString(payload.payment_proof_name) || null : null

        await connection.query<ResultSetHeader>(
          `
            INSERT INTO event_participants (
              id, event_id, crew_id, guest_id, registration_path, payment_status,
              unique_amount, payment_proof_path, attendance_status, qr_token
            )
            VALUES (
              :participantId, :eventId, :crewId, :guestId, :path, :paymentStatus,
              :uniqueAmount, :proofPath, 'Registered', :qrToken
            )
          `,
          {
            participantId,
            eventId,
            crewId,
            guestId,
            path,
            paymentStatus,
            uniqueAmount,
            proofPath,
            qrToken,
          },
        )

        if (event.is_paid) {
          await connection.query<ResultSetHeader>(
            `
              INSERT INTO payments (participant_id, amount, status, proof_path, submitted_at)
              VALUES (:participantId, :uniqueAmount, 'Pending_Approval', :proofPath, NOW())
            `,
            { participantId, uniqueAmount, proofPath },
          )
        }

        for (const field of fieldRows) {
          const response = responses[field.id]
          if (!response) continue

          await connection.query<ResultSetHeader>(
            `
              INSERT INTO participant_responses (participant_id, field_id, response_value)
              VALUES (:participantId, :fieldId, CAST(:responseValue AS JSON))
            `,
            {
              participantId,
              fieldId: field.id,
              responseValue: JSON.stringify(response),
            },
          )
        }

        await connection.query<ResultSetHeader>(
          `
            INSERT INTO audit_logs (action, entity_type, entity_id, metadata, ip_address, user_agent)
            VALUES ('participant.registered', 'event_participant', :participantId, CAST(:metadata AS JSON), :ipAddress, :userAgent)
          `,
          {
            participantId,
            metadata: JSON.stringify({
              event_id: eventId,
              registration_path: path,
              payment_status: paymentStatus,
              participant_name: participantName,
            }),
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
            userAgent: request.headers.get('user-agent') ?? null,
          },
        )

        const [participantRows] = await connection.query<ParticipantRow[]>(
          'SELECT id, qr_token, payment_status, unique_amount FROM event_participants WHERE id = :participantId',
          { participantId },
        )

        await connection.commit()
        return participantRows[0]
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    })

    return NextResponse.json({ ok: true, data: result }, { status: 201 })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Pendaftaran gagal')
  }
}
