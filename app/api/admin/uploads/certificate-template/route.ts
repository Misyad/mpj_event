import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { getEventFromDb } from '@/lib/server/events'
import { requireAdminPermission } from '@/lib/server/rbac'
import { getStorageAdapter } from '@/lib/server/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

function detectFileType(buffer: Buffer) {
  if (buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return 'image/png'
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg'
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf'
  return null
}

function uploadError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal upload template sertifikat'
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' || message.includes('Regional') ? 403 : 400
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminPermission(request, 'events.update')
    const formData = await request.formData()
    const file = formData.get('file')
    const eventId = String(formData.get('eventId') || '')
    if (!eventId) throw new Error('Event wajib dipilih')
    const event = await getEventFromDb(eventId)
    if (!event) throw new Error('Event tidak ditemukan')
    if (session.role === AUTH_ROLES.regionalAdmin && (event.scope !== 'regional' || event.regionId !== session.regionalId)) {
      throw new Error('Regional scope tidak valid')
    }
    if (!file || typeof file === 'string') throw new Error('File template wajib diupload')
    const extension = ALLOWED_TYPES[file.type]
    if (!extension) throw new Error('Format template harus JPG, PNG, WebP, atau PDF')
    if (file.size > MAX_SIZE_BYTES) throw new Error('Ukuran template maksimal 2MB')

    const buffer = Buffer.from(await file.arrayBuffer())
    const detectedType = detectFileType(buffer)
    if (!detectedType || detectedType !== file.type) throw new Error('Signature file template tidak valid')
    if (detectedType === 'application/pdf' && buffer.includes(Buffer.from('/JavaScript'))) {
      throw new Error('PDF template mengandung konten yang tidak diizinkan')
    }

    const storage = getStorageAdapter()
    const filename = `certificate-template-${Date.now()}-${randomUUID()}.${extension}`
    const stored = await storage.putObject(`certificate-templates/${filename}`, buffer, detectedType)
    return NextResponse.json({ ok: true, url: stored.url, name: file.name }, { status: 201 })
  } catch (error) {
    return uploadError(error)
  }
}
