import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { getEventFromDb } from '@/lib/server/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}

function sanitizeOriginalName(value: string) {
  const cleaned = value.replace(/[^\w.\- ]+/g, '').trim()
  return cleaned.slice(0, 160) || 'bukti-transfer'
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const event = await getEventFromDb(id)
    if (!event) return jsonError('Event tidak ditemukan', 404)
    if (!event.isPaidEvent || event.payment_method === 'gateway') {
      return jsonError('Bukti transfer hanya untuk pembayaran manual', 400)
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') return jsonError('File bukti transfer wajib diupload')

    const extension = ALLOWED_TYPES[file.type]
    if (!extension) return jsonError('Format bukti transfer harus JPG, PNG, WebP, atau PDF')
    if (file.size > MAX_SIZE_BYTES) return jsonError('Ukuran bukti transfer maksimal 2MB')

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs')
    const filename = `payment-proof-${Date.now()}-${randomUUID()}.${extension}`
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)

    return NextResponse.json(
      {
        ok: true,
        data: {
          url: `/uploads/payment-proofs/${filename}`,
          name: sanitizeOriginalName(file.name),
          mimeType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal upload bukti transfer'
    return jsonError(message)
  }
}
