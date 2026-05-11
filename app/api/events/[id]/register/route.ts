import { randomUUID } from 'crypto'
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
}

type EventRow = RowDataPacket & {
  id: string
  is_paid: 0 | 1
  max_participants: number | null
  current_participants: number
  status_pendaftaran: string | null
}

type ParticipantRow = RowDataPacket & {
  id: string
  event_id: string
  registration_path: string
  payment_status: string
  attendance_status: string
  qr_token: string
  full_name: string | null
  institution_name: string | null
  whatsapp: string | null
}

function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: eventId } = await context.params
    const payload = (await request.json()) as RegisterPayload
    const registrationPath = payload.registration_path === 'NIAM' ? 'NIAM' : 'UMUM'
    const fullName = getString(payload.full_name)

    if (!fullName) return jsonError('Nama lengkap wajib diisi')

    const result = await withDb(async (db) => {
      const connection = await db.getConnection()

      try {
        await connection.beginTransaction()

        const [eventRows] = await connection.query<EventRow[]>(
          `
            SELECT id, is_paid, max_participants, current_participants, status_pendaftaran
            FROM mpj_event_events
            WHERE id = :eventId
            FOR UPDATE
          `,
          { eventId },
        )
        const event = eventRows[0]
        if (!event) throw new Error('Event tidak ditemukan')
        if (event.status_pendaftaran === 'closed') throw new Error('Pendaftaran event sudah ditutup')
        if (event.status_pendaftaran === 'full') throw new Error('Kuota event sudah penuh')
        if (event.max_participants !== null && event.current_participants >= event.max_participants) {
          throw new Error('Kuota event sudah penuh')
        }

        if (registrationPath === 'NIAM') {
          const niam = getString(payload.niam)
          if (!niam) throw new Error('NIAM wajib diisi')

          const [duplicates] = await connection.query<RowDataPacket[]>(
            `
              SELECT id
              FROM mpj_event_participants
              WHERE event_id = :eventId
                AND JSON_UNQUOTE(JSON_EXTRACT(crew_json, '$.niam')) = :niam
              LIMIT 1
            `,
            { eventId, niam },
          )
          if (duplicates.length > 0) throw new Error('NIAM ini sudah terdaftar pada event ini')
        } else {
          const whatsapp = getString(payload.whatsapp)
          if (!whatsapp) throw new Error('Nomor WhatsApp wajib diisi')

          const [duplicates] = await connection.query<RowDataPacket[]>(
            `
              SELECT id
              FROM mpj_event_participants
              WHERE event_id = :eventId
                AND whatsapp = :whatsapp
              LIMIT 1
            `,
            { eventId, whatsapp },
          )
          if (duplicates.length > 0) throw new Error('Nomor WhatsApp ini sudah terdaftar pada event ini')
        }

        const participantId = randomUUID()
        const qrToken = `MPJ-${eventId}-${randomUUID()}`
        const crew =
          registrationPath === 'NIAM'
            ? {
                niam: getString(payload.niam),
                full_name: fullName,
                unit: getString(payload.unit),
              }
            : null
        const guest =
          registrationPath === 'UMUM'
            ? {
                full_name: fullName,
                institution_name: getString(payload.institution_name),
                whatsapp: getString(payload.whatsapp),
              }
            : null

        await connection.query<ResultSetHeader>(
          `
            INSERT INTO mpj_event_participants (
              id, event_id, registration_path, payment_status,
              attendance_status, qr_token, crew_json, guest_json,
              full_name, institution_name, whatsapp
            ) VALUES (
              :participantId, :eventId, :registrationPath, :paymentStatus,
              'Registered', :qrToken, :crewJson, :guestJson,
              :fullName, :institutionName, :whatsapp
            )
          `,
          {
            participantId,
            eventId,
            registrationPath,
            paymentStatus: event.is_paid ? 'Unpaid' : 'Free',
            qrToken,
            crewJson: crew ? JSON.stringify(crew) : null,
            guestJson: guest ? JSON.stringify(guest) : null,
            fullName,
            institutionName: registrationPath === 'UMUM' ? getString(payload.institution_name) : null,
            whatsapp: registrationPath === 'UMUM' ? getString(payload.whatsapp) : null,
          },
        )

        await connection.query<ResultSetHeader>(
          'UPDATE mpj_event_events SET current_participants = current_participants + 1 WHERE id = :eventId',
          { eventId },
        )

        const [participantRows] = await connection.query<ParticipantRow[]>(
          'SELECT * FROM mpj_event_participants WHERE id = :participantId LIMIT 1',
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
